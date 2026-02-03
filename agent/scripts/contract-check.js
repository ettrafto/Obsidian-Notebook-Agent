import fs from "fs/promises";
import path from "path";
import { readText, appendText, writeText } from "./lib/fs.js";
import { extractTasks } from "./lib/md.js";
import { getVaultRoot, paths, resolveVaultPath } from "./lib/vaultPaths.js";

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
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

function parseAllowedDirs(md) {
  const lines = parseSectionLines(md, "## Allowed Directories");
  const dirs = [];
  for (const line of lines) {
    const m = /^\s*-\s+vault\/([^/\s]+)\//.exec(line);
    if (m) dirs.push(m[1]);
  }
  return dirs;
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

async function ensureMaintenanceHeader() {
  try {
    await fs.stat(paths.maintenance());
  } catch {
    const header = "# Maintenance Log (Append-only)\n\n";
    await writeText(paths.maintenance(), header);
  }
}

async function run() {
  await ensureMaintenanceHeader();
  const findings = [];
  const suggested = [];
  let failed = false;

  let contract = "";
  try {
    contract = await readText(paths.vaultContract());
  } catch {
    contract = "";
  }

  const allowedDirs = parseAllowedDirs(contract);
  const requiredFiles = parseRequiredFiles(contract);

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

  const allowed = allowedDirs.length ? allowedDirs : allowedFallback;
  const required = requiredFiles.length ? requiredFiles : requiredFallback;

  const vaultRoot = getVaultRoot();
  const entries = await fs.readdir(vaultRoot, { withFileTypes: true });
  const actualDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const unknown = actualDirs.filter((d) => !allowed.includes(d));
  if (unknown.length) {
    failed = true;
    findings.push(`[FAIL] Unknown top-level directories: ${unknown.join(", ")}`);
    suggested.push("Update VAULT_CONTRACT.md or remove unknown directories");
  } else {
    findings.push("[PASS] Top-level vault directories match allowed list");
  }

  for (const rel of required) {
    try {
      await fs.stat(resolveVaultPath(rel));
      findings.push(`[PASS] Required file exists: ${rel}`);
    } catch {
      failed = true;
      findings.push(`[FAIL] Missing required file: ${rel}`);
      suggested.push(`Create ${rel}`);
    }
  }

  try {
    await fs.stat(paths.now());
    findings.push("[PASS] now.md exists");
  } catch {
    failed = true;
    findings.push("[FAIL] now.md missing");
    suggested.push("Create vault/planning/now.md");
  }

  let masterplan = "";
  try {
    masterplan = await readText(paths.masterplan());
  } catch {
    masterplan = "";
  }
  const taskLines = masterplan.match(/^- \[[ xX]\] \([A-Z0-9-]+\) /gm) || [];
  if (taskLines.length >= 5) {
    findings.push("[PASS] masterplan.md has at least 5 valid task lines");
  } else {
    failed = true;
    findings.push("[FAIL] masterplan.md has fewer than 5 valid task lines");
    suggested.push("Add more tasks with IDs to masterplan.md");
  }

  const currentMonth = new Date();
  const yyyyMm = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  try {
    await fs.stat(paths.devlogForMonth(yyyyMm));
    findings.push(`[PASS] Devlog exists for ${yyyyMm}`);
  } catch {
    findings.push(`[WARN] Devlog missing for ${yyyyMm}`);
    suggested.push(`Create vault/devlog/${yyyyMm}.md`);
  }

  const status = failed ? "FAIL" : "PASS";
  const reportLines = [
    `\n## ${nowStamp()} — Contract Check`,
    `Status: ${status}`,
    "Findings:",
    ...findings.map((f) => `- ${f}`),
    "Suggested Fixes:",
    ...(suggested.length ? suggested.map((s) => `- ${s}`) : ["- None"]),
    "",
  ];
  await appendText(paths.maintenance(), reportLines.join("\n"));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
