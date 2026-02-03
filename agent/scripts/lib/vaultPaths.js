import path from "path";
import fs from "fs";

const repoRoot = path.resolve(process.cwd());
const vaultRoot = path.join(repoRoot, "vault");

function assertWithinRoot(absPath, rootAbs, label) {
  const normalized = path.normalize(absPath);
  const rootNorm = path.normalize(rootAbs + path.sep);
  if (!normalized.startsWith(rootNorm)) {
    throw new Error(`Path escapes ${label}`);
  }
  return normalized;
}

export function getRepoRoot() {
  return repoRoot;
}

export function getVaultRoot() {
  if (!fs.existsSync(vaultRoot)) {
    throw new Error("vault directory not found");
  }
  return vaultRoot;
}

export function resolveRepoPath(relPath) {
  const abs = path.join(repoRoot, relPath);
  return assertWithinRoot(abs, repoRoot, "repo root");
}

export function resolveVaultPath(relPath) {
  const rel = relPath.startsWith("vault/") ? relPath : `vault/${relPath}`;
  const abs = path.join(repoRoot, rel);
  return assertWithinRoot(abs, vaultRoot, "vault root");
}

export const paths = {
  masterplan: () => resolveVaultPath("planning/masterplan.md"),
  progress: () => resolveVaultPath("planning/progress.md"),
  now: () => resolveVaultPath("planning/now.md"),
  maintenance: () => resolveVaultPath("system/maintenance.md"),
  weeklyReport: () => resolveVaultPath("system/weekly-report.md"),
  vaultContract: () => resolveVaultPath("contracts/VAULT_CONTRACT.md"),
  apiContract: () => resolveVaultPath("contracts/API_CONTRACT.md"),
  architecture: () => resolveVaultPath("architecture/ARCHITECTURE.md"),
  decisions: () => resolveVaultPath("architecture/DECISIONS.md"),
  devlogForMonth: (yyyyMm) => resolveVaultPath(`devlog/${yyyyMm}.md`),
};
