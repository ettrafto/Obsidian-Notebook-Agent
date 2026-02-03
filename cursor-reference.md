1) Technical Spec: Atlas Local Bridge (Read-Only)
Purpose

Expose a read-only HTTP interface over your Obsidian vault so ChatGPT/Cursor can pull context and do deterministic lookups without copy/paste.

Non-goals

No writing to the vault

No task advancement

No ADR creation

No “AI answers”

No auth/keys/secrets handling (local-only boundary)

No executing shell commands

Runtime Assumptions

Runs locally on your machine or server LAN

Vault path is known via environment variable

Vault mounted read-only if feasible (recommended)

Repo Placement (recommended)

Create a small service folder (choose one):

atlas-bridge/ at repo root, or

agent/bridge/

Environment

ATLAS_VAULT_ROOT (required): absolute path to vault root folder that contains vault/

ATLAS_PORT (optional): default 3737

ATLAS_MAX_BYTES (optional): default 250000 (cap per file read)

ATLAS_MAX_RESULTS (optional): default 10

Endpoints (v1)
GET /health

Returns: { "ok": true, "version": "0.1.0" }

POST /context/current

Goal: return a bounded “context bundle” without manual copy/paste.

Reads

vault/planning/now.md (required)

vault/architecture/ARCHITECTURE.md (optional but expected)

vault/contracts/*.md (optional but expected)

Any vault links found inside now.md (optional; only resolve up to a cap)

Behavior

Read now.md

Extract wiki links [[...]] and markdown links (vault/...)

Resolve only links under vault/ and only .md

Read those referenced files (up to ATLAS_MAX_RESULTS files)

Return structured object with raw text + light metadata (no summarization)

Response must include

sources[] with { path, bytes, sha256, content }

POST /find

Goal: deterministic “Where is X implemented?” lookup.

Search scope

vault/**/*.md

optionally agent/** (spec/docs), and root docker-compose.yml / *.yml / *.json if present

Ranking

filename match

heading match (#, ##, ###)

substring match

Result format

top N results (default 10)

each includes path, anchor, quote (exact excerpt, short)

Also writes a generated file:

vault/system/search-notes.md (overwrite each time is simplest)

POST /query

Goal: extremely limited Q&A grounded in architecture docs only.

Allowed intents:

“components and responsibilities”

“where is X defined”

Reads

vault/architecture/ARCHITECTURE.md

vault/architecture/DECISIONS.md

Deterministic extraction

If question contains “components” or “responsibilities”: return Components section summary by parsing headings only.

If “where is/defined”: do heading search and excerpt return.

If not found: "Not found" + suggest closest headings.

Error Standard (must)

Always return JSON:

{
  "error": {
    "code": "BAD_REQUEST | NOT_FOUND | INTERNAL",
    "message": "Human readable",
    "details": {}
  }
}

Security / Hardening checklist

Path traversal protection (no .. escaping)

Only read from allowed roots

File size caps

Disable stack traces in responses (prod mode)

CORS: allow only localhost (or disable entirely if not needed)

2) Express Skeleton (Minimal, Deterministic)

This is a working starting point (not “complete”), designed so Cursor can fill the internals safely.

// atlas-bridge/server.js
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

function err(code, message, details = {}) {
  return { error: { code, message, details } };
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function normalizeVaultPath(relPath) {
  // Only allow paths under `vault/`
  const joined = path.join(VAULT_ROOT, relPath);
  const normalized = path.normalize(joined);

  // Hard boundary: must start with VAULT_ROOT
  const rootNorm = path.normalize(VAULT_ROOT + path.sep);
  if (!normalized.startsWith(rootNorm)) {
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

// very small helper to produce an anchor from a heading
function headingToAnchor(h) {
  // Obsidian-ish: lowercase, spaces -> -, strip non alphanum/-.
  return (
    "#" +
    h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\\-]/g, "")
  );
}

function extractWikiLinks(md) {
  // [[path/to/note]] or [[path|alias]]; return left side
  const out = new Set();
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.add(m[1].trim());
  }
  return [...out];
}

function toVaultMdPath(linkLike) {
  // normalize: allow "vault/..." or relative within vault (e.g. "planning/now")
  // add .md if missing
  let p = linkLike.trim();

  // If user used bare "planning/now" treat as under vault/
  if (!p.startsWith("vault/")) p = "vault/" + p;

  if (!p.endsWith(".md")) p = p + ".md";
  return p;
}

async function listMarkdownFiles(dirAbs) {
  // Deterministic traversal, small and safe
  const results = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    // deterministic order
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
    const m = /^(#{1,6})\\s+(.+)$/.exec(lines[i]);
    if (m) return m[2].trim();
  }
  return null;
}

function excerptAround(lines, lineIdx, radius = 1) {
  const start = Math.max(0, lineIdx - radius);
  const end = Math.min(lines.length, lineIdx + radius + 1);
  return lines.slice(start, end).join("\\n");
}

// -------------------- routes --------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: VERSION });
});

app.post("/context/current", async (_req, res) => {
  try {
    const nowRel = "vault/planning/now.md";
    const nowAbs = normalizeVaultPath(nowRel);
    const now = await readTextFileSafe(nowAbs);

    const linkNames = extractWikiLinks(now)
      .map(toVaultMdPath)
      .filter((p) => p.startsWith("vault/") && p.endsWith(".md"))
      .slice(0, MAX_RESULTS);

    // Always include these “spine” files if they exist
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
    res.status(500).json(err("INTERNAL", "Failed to build current context", { message: String(e) }));
  }
});

app.post("/find", async (req, res) => {
  try {
    const term = (req.body?.term || "").toString().trim();
    if (!term) return res.status(400).json(err("BAD_REQUEST", "term is required"));

    // scope: vault markdown
    const files = await listMarkdownFiles(VAULT_DIR);

    const results = [];
    const termLower = term.toLowerCase();

    // filename matches first
    for (const f of files) {
      const rel = path.relative(VAULT_ROOT, f).replace(/\\\\/g, "/");
      if (path.basename(rel).toLowerCase().includes(termLower)) {
        results.push({ score: 3, path: rel, anchor: null, quote: null });
      }
    }

    // content/heading matches
    for (const f of files) {
      if (results.length >= MAX_RESULTS) break;
      const rel = path.relative(VAULT_ROOT, f).replace(/\\\\/g, "/");
      const content = await readTextFileSafe(f);
      const lines = content.split(/\\r?\\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // heading match
        const hm = /^(#{1,6})\\s+(.+)$/.exec(line);
        if (hm && hm[2].toLowerCase().includes(termLower)) {
          const heading = hm[2].trim();
          results.push({
            score: 2,
            path: rel,
            anchor: headingToAnchor(heading),
            quote: excerptAround(lines, i, 1),
          });
          break;
        }

        // substring match
        if (line.toLowerCase().includes(termLower)) {
          const heading = findNearestHeading(lines, i);
          results.push({
            score: 1,
            path: rel,
            anchor: heading ? headingToAnchor(heading) : null,
            quote: excerptAround(lines, i, 1),
          });
          break;
        }
      }
    }

    // sort + cap
    results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
    const top = results.slice(0, MAX_RESULTS).map(({ score, ...r }) => r);

    // write search-notes.md (overwrite each time)
    const outRel = "vault/system/search-notes.md";
    const outAbs = normalizeVaultPath(outRel);

    const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
    const header = `# Search Notes (Generated)\n\n_This file is overwritten on each search._\n\n## ${ts} — find: ${term}\n### Results\n`;
    const body =
      top.length === 0
        ? `\n- No matches found.\n`
        : top
            .map(
              (r, idx) =>
                `\n${idx + 1}) **${r.path}** — nearest heading: \`${r.anchor || "n/a"}\`\n` +
                (r.quote ? `\n> ${r.quote.replace(/\\n/g, "\\n> ")}\n` : `\n> (no excerpt)\n`)
            )
            .join("");

    await fs.mkdir(path.dirname(outAbs), { recursive: true });
    await fs.writeFile(outAbs, header + body, "utf8");

    res.json({ term, results: top });
  } catch (e) {
    res.status(500).json(err("INTERNAL", "Find failed", { message: String(e) }));
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

    // Intent 1: components/responsibilities
    if (q.includes("component") || q.includes("responsibilit")) {
      // very deterministic: extract lines under "## Components" until next "## "
      const lines = arch.split(/\\r?\\n/);
      const startIdx = lines.findIndex((l) => l.trim().toLowerCase() === "## components");
      if (startIdx === -1) {
        return res.json({
          answer: "Not found: Components section missing in ARCHITECTURE.md",
          citations: [{ path: archRel, anchor: "#architecture", quote: "# Architecture" }],
        });
      }
      let endIdx = lines.length;
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (/^##\\s+/.test(lines[i])) {
          endIdx = i;
          break;
        }
      }
      const excerpt = lines.slice(startIdx, Math.min(endIdx, startIdx + 120)).join("\\n");
      return res.json({
        answer:
          "Components and responsibilities are defined in ARCHITECTURE.md under the Components section.",
        citations: [{ path: archRel, anchor: "#components", quote: excerpt.slice(0, 1200) }],
      });
    }

    // Intent 2: where is X defined
    if (q.includes("where is") || q.includes("defined")) {
      // naive term extraction: grab quoted substring or last word-ish; keep deterministic
      const m = question.match(/\"([^\"]+)\"/);
      const term = (m?.[1] || question.replace(/where is/i, "").replace(/defined/i, "")).trim();
      const haystacks = [
        { rel: archRel, text: arch },
        { rel: decRel, text: dec },
      ];

      for (const h of haystacks) {
        const lines = h.text.split(/\\r?\\n/);
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

    // Default: refuse to guess
    res.json({
      answer:
        "Unsupported query intent. Allowed: components/responsibilities, or where-is/defined lookups.",
      citations: [{ path: decRel, anchor: "#decisions-adr-lite", quote: "# Decisions (ADR-lite)" }],
    });
  } catch (e) {
    res.status(500).json(err("INTERNAL", "Query failed", { message: String(e) }));
  }
});

app.listen(PORT, () => {
  console.log(`Atlas bridge listening on http://localhost:${PORT}`);
  console.log(`Vault root: ${VAULT_ROOT}`);
});

Minimal package.json for this skeleton
{
  "name": "atlas-bridge",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "dependencies": {
    "express": "^4.19.2"
  }
}

Run commands
cd atlas-bridge
npm i
ATLAS_VAULT_ROOT="/absolute/path/to/your/vault-root" ATLAS_PORT=3737 node server.js

3) JSON Schemas (Draft-2020-12)

These are reference schemas you can keep in agent/contracts/ or similar (or just paste into your contracts). They enforce shape without forcing implementation details.

Common: Citation Schema
{
  "$id": "https://atlas.local/schemas/citation.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Citation",
  "type": "object",
  "required": ["path", "anchor", "quote"],
  "properties": {
    "path": { "type": "string", "minLength": 1 },
    "anchor": { "type": "string", "minLength": 1 },
    "quote": { "type": "string", "minLength": 1, "maxLength": 5000 }
  },
  "additionalProperties": false
}

/context/current Request Schema
{
  "$id": "https://atlas.local/schemas/context-current-request.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ContextCurrentRequest",
  "type": "object",
  "properties": {
    "include": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional additional vault-relative paths to include (e.g. vault/explainers/git-branching.md)."
    },
    "max_sources": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50
    }
  },
  "additionalProperties": false
}

/context/current Response Schema
{
  "$id": "https://atlas.local/schemas/context-current-response.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ContextCurrentResponse",
  "type": "object",
  "required": ["generated_at", "sources"],
  "properties": {
    "generated_at": { "type": "string", "format": "date-time" },
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["path", "bytes", "sha256", "content"],
        "properties": {
          "path": { "type": "string" },
          "bytes": { "type": "integer", "minimum": 0 },
          "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
          "content": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}

/find Request Schema
{
  "$id": "https://atlas.local/schemas/find-request.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FindRequest",
  "type": "object",
  "required": ["term"],
  "properties": {
    "term": { "type": "string", "minLength": 1 },
    "max_results": { "type": "integer", "minimum": 1, "maximum": 50 }
  },
  "additionalProperties": false
}

/find Response Schema
{
  "$id": "https://atlas.local/schemas/find-response.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FindResponse",
  "type": "object",
  "required": ["term", "results"],
  "properties": {
    "term": { "type": "string" },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path"],
        "properties": {
          "path": { "type": "string" },
          "anchor": { "type": ["string", "null"] },
          "quote": { "type": ["string", "null"] }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}

/query Request Schema
{
  "$id": "https://atlas.local/schemas/query-request.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QueryRequest",
  "type": "object",
  "required": ["question"],
  "properties": {
    "question": { "type": "string", "minLength": 1 }
  },
  "additionalProperties": false
}

/query Response Schema
{
  "$id": "https://atlas.local/schemas/query-response.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "QueryResponse",
  "type": "object",
  "required": ["answer", "citations"],
  "properties": {
    "answer": { "type": "string" },
    "citations": {
      "type": "array",
      "items": { "$ref": "https://atlas.local/schemas/citation.json" }
    }
  },
  "additionalProperties": false
}