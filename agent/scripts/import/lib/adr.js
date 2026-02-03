import fs from "fs/promises";
import path from "path";
import { resolveVaultPath, paths } from "../../lib/vaultPaths.js";

function padNumber(num) {
  return String(num).padStart(4, "0");
}

function slugToTitle(slug) {
  const words = slug.split("-").filter(Boolean);
  if (words.length === 0) return "Untitled";
  return words
    .map((w, idx) => (idx === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractSlugFromFilename(filename) {
  const m = /^ARCH-DRAFT-\d{4}-\d{2}-\d{2}-(.+)\.md$/.exec(filename);
  return m ? m[1] : "draft";
}

export async function nextAdrNumber(decisionsDir) {
  const entries = await fs.readdir(decisionsDir, { withFileTypes: true });
  let max = 0;
  for (const e of entries) {
    if (!e.isFile()) continue;
    const m = /^ADR-(\d{4})-/.exec(e.name);
    if (m) {
      const num = Number(m[1]);
      if (num > max) max = num;
    }
  }
  return max + 1;
}

export async function createAdrFromTemplate({ draftRelPath }) {
  const decisionsDir = resolveVaultPath("architecture/decisions");
  const adrTemplatePath = resolveVaultPath("architecture/decisions/ADR-TEMPLATE.md");
  const template = await fs.readFile(adrTemplatePath, "utf8");

  const slug = extractSlugFromFilename(path.basename(draftRelPath));
  const title = slugToTitle(slug);

  const nextNum = await nextAdrNumber(decisionsDir);
  const adrId = `ADR-${padNumber(nextNum)}`;
  const adrFilename = `${adrId}-${slug}.md`;
  const adrRelPath = `vault/architecture/decisions/${adrFilename}`;
  const adrAbsPath = resolveVaultPath(`architecture/decisions/${adrFilename}`);

  try {
    await fs.stat(adrAbsPath);
    return { created: false, adrRelPath, adrId, title };
  } catch {
    // continue
  }

  const lines = template.split(/\r?\n/);
  const output = [];
  let inReferences = false;
  let inContext = false;
  let contextInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.startsWith("# ADR-XXXX")) {
      output.push(`# ${adrId} — ${title}`);
      continue;
    }
    if (line.trim() === "## Context") {
      inContext = true;
      output.push(line);
      output.push(`- Generated from draft: ${draftRelPath}`);
      contextInserted = true;
      continue;
    }
    if (line.trim().startsWith("## ") && line.trim() !== "## Context") {
      inContext = false;
    }
    if (line.trim() === "## References") {
      inReferences = true;
      output.push(line);
      output.push("- `vault/planning/now.md`");
      output.push("- `vault/architecture/ARCHITECTURE.md`");
      output.push("- `vault/architecture/DECISIONS.md`");
      continue;
    }
    if (inReferences) {
      if (line.startsWith("## ")) {
        inReferences = false;
        output.push(line);
      }
      continue;
    }
    output.push(line);
  }

  if (!contextInserted) {
    output.unshift("## Context", `- Generated from draft: ${draftRelPath}`, "");
  }

  await fs.writeFile(adrAbsPath, output.join("\n"), "utf8");
  return { created: true, adrRelPath, adrId, title };
}
