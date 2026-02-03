import fs from "fs/promises";
import path from "path";
import { parseDraft, validateDraftMeta } from "./lib/parseDraft.js";
import { createAdrFromTemplate } from "./lib/adr.js";
import { updateDecisionsLedger } from "./lib/decisionsLedger.js";
import { resolveVaultPath, getRepoRoot, paths } from "../lib/vaultPaths.js";
import { appendText, writeText } from "../lib/fs.js";

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function ensureInsideInbox(absPath) {
  const inboxAbs = resolveVaultPath("inbox");
  const inboxNorm = path.normalize(inboxAbs + path.sep);
  const targetNorm = path.normalize(absPath);
  if (!targetNorm.startsWith(inboxNorm)) {
    throw new Error("Draft path must be under vault/inbox/");
  }
}

function filenameMatches(filePath) {
  const base = path.basename(filePath);
  return /^ARCH-DRAFT-\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(base);
}

function parseMeta(header) {
  return {
    source: header.Source,
    date: header.Date,
    intendedDestination: header["Intended destination"],
    affectedComponents: header["Affected components"]
      ? header["Affected components"].split(",").map((p) => p.trim()).filter(Boolean)
      : [],
    confidence: header.Confidence,
    requiresAdr: header["Requires ADR"] === "yes",
  };
}

async function ensureMaintenanceHeader() {
  try {
    await fs.stat(paths.maintenance());
  } catch {
    await writeText(paths.maintenance(), "# Maintenance Log (Append-only)\n\n");
  }
}

async function appendMaintenanceEntry({
  status,
  draftRel,
  destination,
  requiresAdr,
  adrRelPath,
  notes,
  nextSteps,
}) {
  await ensureMaintenanceHeader();
  const lines = [
    `\n## ${nowStamp()} — Draft Import`,
    `Status: ${status}`,
    `Draft: ${draftRel}`,
    `Destination: ${destination}`,
    `Requires ADR: ${requiresAdr ? "yes" : "no"}`,
    `ADR: ${adrRelPath || "None"}`,
    "Notes:",
    ...notes.map((n) => `- ${n}`),
    "Next:",
    ...nextSteps.map((n) => `- ${n}`),
    "",
  ];
  await appendText(paths.maintenance(), lines.join("\n"));
}

async function run() {
  const input = process.argv[2];
  if (!input) {
    console.log("FAIL");
    console.log("- Missing draft path argument");
    process.exit(1);
  }

  let absPath;
  try {
    absPath = path.resolve(getRepoRoot(), input);
    ensureInsideInbox(absPath);
  } catch (e) {
    await appendMaintenanceEntry({
      status: "FAIL",
      draftRel: input,
      destination: "UNKNOWN",
      requiresAdr: false,
      adrRelPath: null,
      notes: ["Invalid draft path (must be under vault/inbox/)"],
      nextSteps: ["Fix draft path and re-run import"],
    });
    console.log("FAIL");
    console.log("- Draft path must be under vault/inbox/");
    process.exit(1);
  }

  if (!filenameMatches(absPath)) {
    await appendMaintenanceEntry({
      status: "FAIL",
      draftRel: input,
      destination: "UNKNOWN",
      requiresAdr: false,
      adrRelPath: null,
      notes: ["Filename does not match ARCH-DRAFT-YYYY-MM-DD-<slug>.md"],
      nextSteps: ["Rename draft to required format"],
    });
    console.log("FAIL");
    console.log("- Filename does not match ARCH-DRAFT-YYYY-MM-DD-<slug>.md");
    process.exit(1);
  }

  let content = "";
  try {
    content = await fs.readFile(absPath, "utf8");
  } catch {
    console.log("FAIL");
    console.log("- Unable to read draft");
    process.exit(2);
  }

  const parsed = parseDraft(content);
  const validation = validateDraftMeta(parsed);
  if (!validation.ok) {
    await appendMaintenanceEntry({
      status: "FAIL",
      draftRel: input,
      destination: "UNKNOWN",
      requiresAdr: false,
      adrRelPath: null,
      notes: validation.errors,
      nextSteps: ["Fix draft header fields and re-run import"],
    });
    console.log("FAIL");
    for (const err of validation.errors) console.log(`- ${err}`);
    process.exit(1);
  }

  const meta = parseMeta(parsed.header);
  const draftRel = path.relative(getRepoRoot(), absPath).replace(/\\/g, "/");

  let status = "PASS";
  let notes = [];
  let adrRelPath = null;
  let changed = false;

  if (meta.requiresAdr) {
    const adrResult = await createAdrFromTemplate({ draftRelPath: draftRel });
    adrRelPath = adrResult.adrRelPath;
    if (adrResult.created) {
      changed = true;
      notes.push(`ADR created: ${adrRelPath}`);
    } else {
      notes.push(`ADR already exists: ${adrRelPath}`);
    }

    const ledgerResult = await updateDecisionsLedger({
      adrRelPath,
      adrId: adrResult.adrId,
      title: adrResult.title,
      date: meta.date,
    });
    if (ledgerResult.changed) {
      changed = true;
      notes.push("DECISIONS.md updated");
    }
  }

  if (!changed && meta.requiresAdr) status = "WARN";

  await appendMaintenanceEntry({
    status,
    draftRel,
    destination: meta.intendedDestination,
    requiresAdr: meta.requiresAdr,
    adrRelPath,
    notes: notes.length ? notes : ["Draft processed"],
    nextSteps: [
      `Manual merge into destination: ${meta.intendedDestination}`,
      "Update devlog with merge note",
    ],
  });

  console.log(status);
  console.log(`- destination: ${meta.intendedDestination}`);
  console.log(`- ADR created: ${meta.requiresAdr ? (adrRelPath ? "yes" : "no") : "no"}`);
  console.log("- next step: manual merge into destination");
  process.exit(status === "FAIL" ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
