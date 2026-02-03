import fs from "fs/promises";
import path from "path";
import { readText, appendText, writeText, listMarkdownFilesUnderVault } from "./lib/fs.js";
import { extractTasks, extractProgressMentions } from "./lib/md.js";
import { getVaultRoot, paths, resolveVaultPath } from "./lib/vaultPaths.js";

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function todayDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseSectionLines(md, heading) {
  const lines = md.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trim().toLowerCase() === heading.toLowerCase());
  if (idx === -1) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    out.push(lines[i]);
  }
  return out;
}

function parseRequiredFiles(md) {
  const lines = parseSectionLines(md, "## Required Files");
  const files = [];
  for (const line of lines) {
    const m = /`(vault\/[^`]+)`/.exec(line);
    if (m) files.push(m[1]);
  }
  return files;
}

function parseAllowedDirs(md) {
  const lines = parseSectionLines(md, "## Allowed Directories");
  const dirs = [];
  for (const line of lines) {
    const m = /^\s*-\s+vault\/([^/\s]+)\//.exec(line);
    if (m) dirs.push(m[1]);
  }
  return dirs;
}

function parseEndpointNames(md) {
  const endpoints = new Set();
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const m = /^\|\s*(\/[^|\s]+)\s*\|/.exec(line);
    if (m) endpoints.add(m[1]);
  }
  return [...endpoints];
}

function parseComponents(md) {
  const lines = md.split(/\r?\n/);
  const components = [];
  let inComponents = false;
  for (const line of lines) {
    if (line.trim().toLowerCase() === "## components") {
      inComponents = true;
      continue;
    }
    if (inComponents && line.startsWith("## ")) break;
    const m = /^###\s+(.+)$/.exec(line);
    if (inComponents && m) components.push(m[1].trim());
  }
  return components;
}

function hasLinksOrTags(content) {
  const hasWiki = /\[\[.+?\]\]/.test(content);
  const hasTag = /\s#\w+/.test(content);
  return hasWiki || hasTag;
}

async function ensureWeeklyHeader() {
  try {
    await fs.stat(paths.weeklyReport());
  } catch {
    await writeText(paths.weeklyReport(), "# Weekly Report (Append-only)\n\n");
  }
}

async function ensureMaintenanceHeader() {
  try {
    await fs.stat(paths.maintenance());
  } catch {
    await writeText(paths.maintenance(), "# Maintenance Log (Append-only)\n\n");
  }
}

async function run() {
  await ensureWeeklyHeader();
  await ensureMaintenanceHeader();

  const findings = {
    required: [],
    orphan: [],
    stale: [],
    drift: [],
  };

  let contract = "";
  try {
    contract = await readText(paths.vaultContract());
  } catch {
    contract = "";
  }

  const requiredFiles = parseRequiredFiles(contract);
  const allowedDirs = parseAllowedDirs(contract);
  const requiredFallback = [
    "vault/architecture/ARCHITECTURE.md",
    "vault/architecture/DECISIONS.md",
    "vault/planning/masterplan.md",
    "vault/planning/progress.md",
    "vault/planning/now.md",
    "vault/contracts/VAULT_CONTRACT.md",
    "vault/contracts/API_CONTRACT.md",
    "vault/contracts/GIT_CONTRACT.md",
  ];
  const allowedFallback = [
    "architecture",
    "planning",
    "devlog",
    "contracts",
    "system",
    "inbox",
    "projects",
    "tasks",
    "explainers",
  ];
  const required = requiredFiles.length ? requiredFiles : requiredFallback;
  const allowed = allowedDirs.length ? allowedDirs : allowedFallback;

  let requiredMissing = false;
  for (const rel of required) {
    try {
      await fs.stat(resolveVaultPath(rel));
      findings.required.push(`- [PASS] ${rel} — present`);
    } catch {
      requiredMissing = true;
      findings.required.push(`- [FAIL] ${rel} — missing`);
    }
  }

  // Orphan notes
  const vaultRoot = getVaultRoot();
  const allMd = await listMarkdownFilesUnderVault();
  const orphans = [];
  for (const abs of allMd) {
    const rel = path.relative(vaultRoot, abs).replace(/\\/g, "/");
    if (rel.startsWith("system/") || rel.startsWith("contracts/")) continue;
    let content = "";
    try {
      content = await readText(abs);
    } catch {
      continue;
    }
    if (!hasLinksOrTags(content)) {
      orphans.push(`vault/${rel}`);
    }
  }
  const orphanList = orphans.slice(0, 10);
  if (orphanList.length === 0) {
    findings.orphan.push("- [PASS] none");
  } else {
    findings.orphan.push(
      "- [WARN] timestamp unavailable; reporting all orphans"
    );
    for (const o of orphanList) {
      findings.orphan.push(`- [WARN] ${o} — add link or tag`);
    }
  }

  // Stale tasks
  let masterplan = "";
  let progress = "";
  try {
    masterplan = await readText(paths.masterplan());
  } catch {
    masterplan = "";
  }
  try {
    progress = await readText(paths.progress());
  } catch {
    progress = "";
  }
  const tasks = masterplan ? extractTasks(masterplan) : [];
  const mentions = progress ? extractProgressMentions(progress) : {};
  const stale = [];
  const today = new Date();
  for (const t of tasks) {
    if (t.checked) continue;
    const last = mentions[t.id];
    if (!last) {
      stale.push(t);
      continue;
    }
    const lastDate = new Date(`${last}T00:00:00`);
    const ageDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    if (ageDays > 14) stale.push(t);
  }
  const staleTop = stale.slice(0, 10);
  if (staleTop.length === 0) {
    findings.stale.push("- [PASS] none");
  } else {
    for (const t of staleTop) {
      findings.stale.push(`- [WARN] (${t.id}) ${t.text}`);
    }
  }

  // Architecture drift warnings
  let apiContract = "";
  let arch = "";
  let decisions = "";
  try {
    apiContract = await readText(paths.apiContract());
  } catch {
    apiContract = "";
  }
  try {
    arch = await readText(paths.architecture());
  } catch {
    arch = "";
  }

  const apiEndpoints = parseEndpointNames(apiContract);
  const archEndpoints = parseEndpointNames(arch);
  const missingEndpoints = apiEndpoints.filter((e) => !archEndpoints.includes(e));
  for (const e of missingEndpoints) {
    findings.drift.push(
      `- [WARN] API endpoint ${e} not found in ARCHITECTURE interfaces table`
    );
  }

  const components = parseComponents(arch).map((c) => c.toLowerCase());
  const explainerDir = path.join(vaultRoot, "explainers");
  const explainerFiles = [];
  try {
    const entries = await fs.readdir(explainerDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        explainerFiles.push(path.join(explainerDir, e.name));
      }
    }
  } catch {
    // no explainers
  }
  const componentWords = ["Agent", "Vault", "Tunnel", "Git", "Cursor"];
  for (const file of explainerFiles) {
    const content = await readText(file);
    for (const word of componentWords) {
      if (content.includes(word) && !components.includes(word.toLowerCase())) {
        findings.drift.push(
          `- [WARN] Explainers reference component '${word}' not listed in ARCHITECTURE Components`
        );
      }
    }
  }
  if (findings.drift.length === 0) {
    findings.drift.push("- [PASS] none");
  }

  const hasWarn =
    orphanList.length > 0 || staleTop.length > 0 || missingEndpoints.length > 0;
  const status = requiredMissing ? "FAIL" : hasWarn ? "WARN" : "PASS";

  const summary = [
    `- Required files: ${requiredMissing ? "missing" : "ok"}`,
    `- Orphan notes: ${orphanList.length}`,
    `- Stale tasks: ${staleTop.length}`,
  ];

  const weeklyLines = [
    `\n## ${todayDate()} — Weekly Maintenance`,
    `Status: ${status}`,
    "",
    "### Summary",
    ...summary,
    "",
    "### Checks",
    "#### Required Files",
    ...findings.required,
    "",
    "#### Orphan Notes (created this week)",
    "Definition:",
    "- A note created/modified this week with:",
    "  - no `[[links]]` AND no `#tags`",
    "Exclude:",
    "- vault/system/",
    "- vault/contracts/",
    "",
    "List:",
    ...findings.orphan,
    "",
    "#### Stale Tasks (14+ days)",
    "Definition:",
    "- A task ID in masterplan.md not mentioned in progress.md within last 14 days",
    "- If date parsing is not possible, “stale” = never mentioned in progress.md",
    "",
    "List:",
    ...findings.stale,
    "",
    "#### Unmerged Agent Branches",
    "- [TODO] Git inspection not implemented (deterministic runner)",
    "- Manual commands: `git branch --all | findstr /r \"^  agent/\"` and `git branch --merged main`",
    "",
    "#### Architecture Drift Warnings",
    ...findings.drift,
    "",
    "### Suggested Actions (ranked)",
    "1) Address missing required files or contract violations",
    "2) Triage orphan notes and add links/tags",
    "3) Review stale tasks and update progress log",
    "",
    "### Notes",
    `- Generated: ${nowStamp()}`,
    "",
  ];
  await appendText(paths.weeklyReport(), weeklyLines.join("\n"));

  const maintenanceEntry = [
    `\n## ${nowStamp()} — Weekly maintenance`,
    `Status: ${status}`,
    "Findings:",
    `- [${status}] Weekly report appended`,
    "Suggested Fixes:",
    "- See weekly report for details",
    "",
  ];
  await appendText(paths.maintenance(), maintenanceEntry.join("\n"));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
