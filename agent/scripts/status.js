import { readText, writeText } from "./lib/fs.js";
import { extractTasks, extractProgressMentions } from "./lib/md.js";
import { paths } from "./lib/vaultPaths.js";

function formatTaskLine(task) {
  const tagStr = task.tags.length ? ` ${task.tags.join(" ")}` : "";
  return `- [ ] (${task.id}) ${task.text}${tagStr}`;
}

function buildNowContent({
  objective,
  activeTasks,
  nextTasks,
  blockers,
  references,
}) {
  const lines = [
    "# Now",
    "",
    "## Current Objective",
    objective,
    "",
    "## Active Tasks (max 5)",
    ...(activeTasks.length ? activeTasks : ["- None"]),
    "",
    "## Next Tasks (max 5)",
    ...(nextTasks.length ? nextTasks : ["- None"]),
    "",
    "## Blockers",
    ...(blockers.length ? blockers : ["- None"]),
    "",
    "## References",
    ...references,
    "",
  ];
  return lines.join("\n");
}

async function run() {
  let masterplan = "";
  let progress = "";
  const blockers = [];

  try {
    masterplan = await readText(paths.masterplan());
  } catch {
    blockers.push("- Missing required file: vault/planning/masterplan.md");
  }

  try {
    progress = await readText(paths.progress());
  } catch {
    blockers.push("- Missing required file: vault/planning/progress.md");
  }

  const tasks = masterplan ? extractTasks(masterplan) : [];
  const mentions = progress ? extractProgressMentions(progress) : {};

  const unchecked = tasks.filter((t) => !t.checked);
  const firstUnchecked = unchecked.find((t) => t.phase);
  const currentPhase = firstUnchecked?.phase || "Unknown Phase";
  const phaseTasks = unchecked.filter((t) => t.phase === currentPhase);

  const nonBlockers = phaseTasks.filter((t) => !t.tags.includes("#blocker"));
  const blockerTasks = phaseTasks.filter((t) => t.tags.includes("#blocker"));

  const active = nonBlockers.slice(0, 5);
  const remaining = phaseTasks.filter(
    (t) => !active.some((a) => a.id === t.id)
  );
  const nextCandidates = remaining.filter((t) => !t.tags.includes("#blocker"));
  const nextFallback = remaining.length ? remaining : blockerTasks;
  const next = (nextCandidates.length ? nextCandidates : nextFallback).slice(0, 5);

  const objective =
    active.length > 0
      ? `Complete Phase ${currentPhase} tasks, starting with ${active[0].id}.`
      : "Maintain system state and resolve blockers.";

  const blockerLines = [
    ...blockerTasks.map((t) => `- (${t.id}) ${t.text}`),
    ...blockers,
  ];

  const references = [
    "- `vault/architecture/ARCHITECTURE.md`",
    "- `vault/contracts/VAULT_CONTRACT.md`",
    "- `vault/architecture/DECISIONS.md`",
  ];

  const content = buildNowContent({
    objective,
    activeTasks: active.map(formatTaskLine),
    nextTasks: next.map(formatTaskLine),
    blockers: blockerLines,
    references,
  });

  await writeText(paths.now(), content);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
