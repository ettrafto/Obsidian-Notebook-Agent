import fs from "fs/promises";
import { resolveVaultPath } from "../../lib/vaultPaths.js";

function findSectionIndex(lines, heading) {
  return lines.findIndex((l) => l.trim().toLowerCase() === heading.toLowerCase());
}

export async function updateDecisionsLedger({ adrRelPath, adrId, title, date }) {
  const decisionsPath = resolveVaultPath("architecture/DECISIONS.md");
  const text = await fs.readFile(decisionsPath, "utf8");
  const lines = text.split(/\r?\n/);

  let changed = false;

  // Ensure ADR Index exists
  let adrIndexIdx = findSectionIndex(lines, "## ADR Index");
  if (adrIndexIdx === -1) {
    lines.push("", "## ADR Index");
    adrIndexIdx = lines.length - 1;
    changed = true;
  }

  const adrIndexLine = `- ${adrId} — \`${adrRelPath}\``;
  const hasAdrIndex = lines.some((l) => l.includes(adrRelPath));
  if (!hasAdrIndex) {
    lines.splice(adrIndexIdx + 1, 0, adrIndexLine);
    changed = true;
  }

  // Append ledger row if table detected
  const headerIdx = lines.findIndex((l) => l.trim().startsWith("| Date"));
  const sepIdx = headerIdx >= 0 ? headerIdx + 1 : -1;
  if (headerIdx >= 0 && sepIdx < lines.length && lines[sepIdx].includes("|---")) {
    const adrRowExists = lines.some((l) => l.includes(adrRelPath) || l.includes(adrId));
    if (!adrRowExists) {
      const row = `| ${date} | ${adrId} — ${title} | Imported from inbox draft | See ADR | See ADR (\`${adrRelPath}\`) |`;
      lines.splice(sepIdx + 1, 0, row);
      changed = true;
    }
  }

  if (changed) {
    await fs.writeFile(decisionsPath, lines.join("\n"), "utf8");
  }

  return { changed };
}
