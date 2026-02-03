import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const app = express();
app.use(express.json({ limit: "1mb" }));

const VERSION = "0.1.0";

const VAULT_ROOT = process.env.ATLAS_VAULT_ROOT; // absolute path to folder containing `vault/`
const PORT = Number(process.env.ATLAS_PORT || 3737);
const MAX_BYTES = Number(process.env.ATLAS_MAX_BYTES || 250000);
const MAX_RESULTS = Number(process.env.ATLAS_MAX_RESULTS || 10);

if (!VAULT_ROOT) {
  console.error("ATLAS_VAULT_ROOT is required");
  process.exit(1);
}

const VAULT_DIR = path.join(VAULT_ROOT, "vault");
const VAULT_DIR_NORM = path.normalize(VAULT_DIR + path.sep);
const ROOT_DIR_NORM = path.normalize(VAULT_ROOT + path.sep);

function err(code, message, details = {}) {
  return { error: { code, message, details } };
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function normalizeRepoPath(relPath) {
  const joined = path.join(VAULT_ROOT, relPath);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(ROOT_DIR_NORM)) {
    throw new Error("Path escapes repo root");
  }
  return normalized;
}

function normalizeVaultPath(relPath) {
  if (!relPath.startsWith("vault/")) {
    throw new Error("Path must start with vault/");
  }
  const joined = path.join(VAULT_ROOT, relPath);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(VAULT_DIR_NORM)) {
    throw new Error("Path escapes vault root");
  }
  return normalized;
}

async function readTextFileSafe(absPath) {
  const st = await fs.stat(absPath);
  if (!st.isFile()) throw new Error("Not a file");
  if (st.size > MAX_BYTES) throw new Error(`File too large (> ${MAX_BYTES} bytes)`);
  return await fs.readFile(absPath, "utf8");
}

function headingToAnchor(h) {
  return (
    "#" +
    h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
  );
}

function extractWikiLinks(md) {
  const out = new Set();
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.add(m[1].trim());
  }
  return [...out];
}

function extractMarkdownLinks(md) {
  const out = new Set();
  const re = /\[[^\]]+\]\((vault\/[^)#\s]+)(?:#[^)]+)?\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.add(m[1].trim());
  }
  return [...out];
}

function toVaultMdPath(linkLike) {
  let p = linkLike.trim();
  if (!p.startsWith("vault/")) p = "vault/" + p;
  if (!p.endsWith(".md")) p = p + ".md";
  return p;
}

async function listMarkdownFiles(dirAbs) {
  const results = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        results.push(p);
      }
    }
  }
  await walk(dirAbs);
  return results;
}

function findNearestHeading(lines, lineIdx) {
  for (let i = lineIdx; i >= 0; i--) {
    const m = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (m) return m[2].trim();
  }
  return null;
}

function excerptAround(lines, lineIdx, radius = 1) {
  const start = Math.max(0, lineIdx - radius);
  const end = Math.min(lines.length, lineIdx + radius + 1);
  return lines.slice(start, end).join("\n");
}

function clampInt(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

// -------------------- routes --------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: VERSION });
});

app.post("/context/current", async (req, res) => {
  try {
    const maxSourcesRaw = req.body?.max_sources;
    const maxSources =
      maxSourcesRaw === undefined ? MAX_RESULTS : clampInt(maxSourcesRaw, 1, 50);
    if (maxSources === null) {
      return res.status(400).json(err("BAD_REQUEST", "max_sources must be an integer 1-50"));
    }

    const include = req.body?.include;
    if (include !== undefined && !Array.isArray(include)) {
      return res.status(400).json(err("BAD_REQUEST", "include must be an array of paths"));
    }

    const nowRel = "vault/planning/now.md";
    const nowAbs = normalizeVaultPath(nowRel);
    let now;
    try {
      now = await readTextFileSafe(nowAbs);
    } catch {
      return res.status(404).json(err("NOT_FOUND", "vault/planning/now.md is required"));
    }

    const wikiLinks = extractWikiLinks(now).map(toVaultMdPath);
    const mdLinks = extractMarkdownLinks(now).map(toVaultMdPath);
    const includeLinks = (include || []).map(toVaultMdPath);

    const linkNames = Array.from(new Set([...wikiLinks, ...mdLinks, ...includeLinks]))
      .filter((p) => p.startsWith("vault/") && p.endsWith(".md"))
      .slice(0, Math.min(maxSources, MAX_RESULTS));

    const spine = [
      "vault/architecture/ARCHITECTURE.md",
      "vault/contracts/VAULT_CONTRACT.md",
      "vault/contracts/API_CONTRACT.md",
      "vault/contracts/GIT_CONTRACT.md",
      "vault/architecture/DECISIONS.md",
    ];

    const candidates = Array.from(new Set([nowRel, ...spine, ...linkNames]));
    const sources = [];

    for (const rel of candidates) {
      try {
        const abs = normalizeVaultPath(rel);
        const content = await readTextFileSafe(abs);
        sources.push({
          path: rel,
          bytes: Buffer.byteLength(content, "utf8"),
          sha256: sha256(content),
          content,
        });
      } catch {
        // ignore missing files; we don’t fabricate
      }
    }

    res.json({
      generated_at: new Date().toISOString(),
      sources,
    });
  } catch (e) {
    res.status(500).json(err("INTERNAL", "Failed to build current context", {}));
  }
});

app.post("/find", async (req, res) => {
  try {
    const term = (req.body?.term || "").toString().trim();
    if (!term) return res.status(400).json(err("BAD_REQUEST", "term is required"));

    const maxResultsRaw = req.body?.max_results;
    const maxResults =
      maxResultsRaw === undefined ? MAX_RESULTS : clampInt(maxResultsRaw, 1, 50);
    if (maxResults === null) {
      return res.status(400).json(err("BAD_REQUEST", "max_results must be an integer 1-50"));
    }

    const files = await listMarkdownFiles(VAULT_DIR);

    const agentDir = path.join(VAULT_ROOT, "agent");
    try {
      const stat = await fs.stat(agentDir);
      if (stat.isDirectory()) {
        const agentFiles = await listMarkdownFiles(agentDir);
        files.push(...agentFiles);
      }
    } catch {
      // ignore missing agent directory
    }

    const rootFiles = [];
    for (const name of ["docker-compose.yml", "docker-compose.yaml"]) {
      const p = path.join(VAULT_ROOT, name);
      try {
        const st = await fs.stat(p);
        if (st.isFile()) rootFiles.push(p);
      } catch {
        // ignore
      }
    }
    for (const ext of ["yml", "yaml", "json"]) {
      try {
        const entries = await fs.readdir(VAULT_ROOT, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile() && e.name.toLowerCase().endsWith(`.${ext}`)) {
            rootFiles.push(path.join(VAULT_ROOT, e.name));
          }
        }
      } catch {
        // ignore
      }
    }

    const candidates = Array.from(new Set([...files, ...rootFiles]));
    const results = [];
    const termLower = term.toLowerCase();

    for (const f of candidates) {
      let rel;
      try {
        rel = path.relative(VAULT_ROOT, f).replace(/\\/g, "/");
      } catch {
        continue;
      }

      let content;
      try {
        const abs = normalizeRepoPath(rel);
        content = await readTextFileSafe(abs);
      } catch {
        continue;
      }

      const lines = content.split(/\r?\n/);
      const filenameHit = path.basename(rel).toLowerCase().includes(termLower);
      let match = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        const hm = /^(#{1,6})\s+(.+)$/.exec(line);
        if (hm && hm[2].toLowerCase().includes(termLower)) {
          const heading = hm[2].trim();
          match = {
            score: filenameHit ? 3 : 2,
            path: rel,
            anchor: headingToAnchor(heading),
            quote: excerptAround(lines, i, 1),
          };
          break;
        }
        if (lineLower.includes(termLower)) {
          const heading = findNearestHeading(lines, i);
          match = {
            score: filenameHit ? 3 : 1,
            path: rel,
            anchor: heading ? headingToAnchor(heading) : null,
            quote: excerptAround(lines, i, 1),
          };
          break;
        }
      }

      if (!match && filenameHit) {
        match = { score: 3, path: rel, anchor: null, quote: null };
      }

      if (match) results.push(match);
    }

    results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
    const top = results.slice(0, Math.min(maxResults, MAX_RESULTS)).map(({ score, ...r }) => r);

    const outRel = "vault/system/search-notes.md";
    const outAbs = normalizeVaultPath(outRel);

    const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
    const header =
      "# Search Notes (Generated)\n\n_This file is overwritten on each search._\n\n" +
      `## ${ts} — find: ${term}\n### Results\n`;
    const body =
      top.length === 0
        ? "\n- No matches found.\n"
        : top
            .map(
              (r, idx) =>
                `\n${idx + 1}) **${r.path}** — nearest heading: \`${r.anchor || "n/a"}\`\n` +
                (r.quote ? `\n> ${r.quote.replace(/\n/g, "\n> ")}\n` : "\n> (no excerpt)\n")
            )
            .join("");

    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await fs.writeFile(outAbs, header + body, "utf8");

    res.json({ term, results: top });
  } catch (e) {
    res.status(500).json(err("INTERNAL", "Find failed", {}));
  }
});

app.post("/query", async (req, res) => {
  try {
    const question = (req.body?.question || "").toString().trim();
    if (!question) return res.status(400).json(err("BAD_REQUEST", "question is required"));

    const archRel = "vault/architecture/ARCHITECTURE.md";
    const decRel = "vault/architecture/DECISIONS.md";
    const archAbs = normalizeVaultPath(archRel);
    const decAbs = normalizeVaultPath(decRel);

    const arch = await readTextFileSafe(archAbs);
    const dec = await readTextFileSafe(decAbs);

    const q = question.toLowerCase();

    if (q.includes("component") || q.includes("responsibilit")) {
      const lines = arch.split(/\r?\n/);
      const startIdx = lines.findIndex((l) => l.trim().toLowerCase() === "## components");
      if (startIdx === -1) {
        return res.json({
          answer: "Not found: Components section missing in ARCHITECTURE.md",
          citations: [{ path: archRel, anchor: "#architecture", quote: "# Architecture" }],
        });
      }
      let endIdx = lines.length;
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i])) {
          endIdx = i;
          break;
        }
      }
      const excerpt = lines.slice(startIdx, Math.min(endIdx, startIdx + 120)).join("\n");
      return res.json({
        answer:
          "Components and responsibilities are defined in ARCHITECTURE.md under the Components section.",
        citations: [{ path: archRel, anchor: "#components", quote: excerpt.slice(0, 1200) }],
      });
    }

    if (q.includes("where is") || q.includes("defined")) {
      const m = question.match(/\"([^\"]+)\"/);
      const term = (m?.[1] || question.replace(/where is/i, "").replace(/defined/i, "")).trim();
      const haystacks = [
        { rel: archRel, text: arch },
        { rel: decRel, text: dec },
      ];

      for (const h of haystacks) {
        const lines = h.text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(term.toLowerCase())) {
            const heading = findNearestHeading(lines, i);
            return res.json({
              answer: `Found '${term}' in ${h.rel}${heading ? ` under '${heading}'.` : "."}`,
              citations: [
                {
                  path: h.rel,
                  anchor: heading ? headingToAnchor(heading) : "#",
                  quote: excerptAround(lines, i, 1),
                },
              ],
            });
          }
        }
      }

      return res.json({
        answer: `Not found: '${term}'. Try searching headings with /find.`,
        citations: [
          { path: archRel, anchor: "#architecture", quote: "# Architecture" },
          { path: decRel, anchor: "#decisions-adr-lite", quote: "# Decisions (ADR-lite)" },
        ],
      });
    }

    res.json({
      answer:
        "Unsupported query intent. Allowed: components/responsibilities, or where-is/defined lookups.",
      citations: [{ path: decRel, anchor: "#decisions-adr-lite", quote: "# Decisions (ADR-lite)" }],
    });
  } catch (e) {
    res.status(500).json(err("INTERNAL", "Query failed", {}));
  }
});

app.use((_req, res) => {
  res.status(404).json(err("NOT_FOUND", "Route not found", {}));
});

app.listen(PORT, () => {
  console.log(`Atlas bridge listening on http://localhost:${PORT}`);
  console.log(`Vault root: ${VAULT_ROOT}`);
});
