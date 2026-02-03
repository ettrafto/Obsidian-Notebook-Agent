export function makeAnchor(heading) {
  return (
    "#" +
    heading
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
  );
}

export function extractHeadings(md) {
  const headings = [];
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      headings.push({ level, text, anchor: makeAnchor(text) });
    }
  }
  return headings;
}

export function extractWikiLinks(md) {
  const out = new Set();
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    out.add(m[1].trim());
  }
  return [...out];
}

export function extractTasks(masterplanMd) {
  const lines = masterplanMd.split(/\r?\n/);
  const tasks = [];
  let currentPhase = null;
  for (const line of lines) {
    const phaseMatch = /^##\s+Phase\s+(.+)$/.exec(line);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      continue;
    }
    const taskMatch = /^- \[([ xX])\] \(([^)]+)\) (.+)$/.exec(line);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === "x";
      const id = taskMatch[2].trim();
      const rest = taskMatch[3].trim();
      const parts = rest.split(/\s+/);
      const tags = [];
      while (parts.length && parts[parts.length - 1].startsWith("#")) {
        tags.unshift(parts.pop());
      }
      const text = parts.join(" ").trim();
      tasks.push({ id, text, checked, tags, phase: currentPhase });
    }
  }
  return tasks;
}

export function extractProgressMentions(progressMd) {
  const lines = progressMd.split(/\r?\n/);
  const mentions = {};
  let currentDate = null;
  let hasValidDate = false;
  for (const line of lines) {
    const dateMatch = /^##\s+(\d{4}-\d{2}-\d{2})/.exec(line.trim());
    if (dateMatch) {
      currentDate = dateMatch[1];
      hasValidDate = true;
      continue;
    }
    const ids = line.match(/\(([A-Z0-9-]+)\)/g);
    if (ids) {
      for (const raw of ids) {
        const id = raw.replace(/[()]/g, "");
        mentions[id] = currentDate || null;
      }
    }
  }
  if (!hasValidDate) {
    for (const id of Object.keys(mentions)) {
      mentions[id] = null;
    }
  }
  return mentions;
}
