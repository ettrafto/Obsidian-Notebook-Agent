import fs from "fs/promises";
import path from "path";
import { getVaultRoot, resolveVaultPath, resolveRepoPath } from "./vaultPaths.js";

export async function readText(absPath) {
  return await fs.readFile(absPath, "utf8");
}

export async function writeText(absPath, content) {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf8");
}

export async function appendText(absPath, content) {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.appendFile(absPath, content, "utf8");
}

export async function listMarkdownFilesUnderVault() {
  const root = getVaultRoot();
  const results = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        results.push(p);
      }
    }
  }
  await walk(root);
  return results;
}

export function safeVaultPath(relPath) {
  return resolveVaultPath(relPath);
}

export function safeRepoPath(relPath) {
  return resolveRepoPath(relPath);
}
