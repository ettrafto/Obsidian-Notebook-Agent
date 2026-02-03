const REQUIRED_KEYS = [
  "Source",
  "Date",
  "Intended destination",
  "Affected components",
  "Confidence",
  "Requires ADR",
];

const DESTINATIONS = new Set(["ARCHITECTURE", "ADR", "CONTRACT", "EXPLAINER"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const REQUIRES_ADR = new Set(["yes", "no"]);

function parseHeaderBlock(lines) {
  const header = {};
  let separatorIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      separatorIndex = i;
      break;
    }
    const m = /^- ([^:]+):\s*(.*)$/.exec(line);
    if (m) header[m[1].trim()] = m[2].trim();
  }
  return { header, separatorIndex };
}

export function parseDraft(text) {
  const lines = text.split(/\r?\n/);
  const { header, separatorIndex } = parseHeaderBlock(lines);
  const body =
    separatorIndex >= 0 ? lines.slice(separatorIndex + 1).join("\n").trim() : "";
  return { header, body, separatorIndex };
}

export function validateDraftMeta(meta) {
  const errors = [];

  for (const key of REQUIRED_KEYS) {
    if (!meta.header[key]) errors.push(`Missing header field: ${key}`);
  }

  if (meta.header.Source && meta.header.Source !== "ChatGPT") {
    errors.push("Source must be ChatGPT");
  }
  if (meta.header.Date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.header.Date)) {
    errors.push("Date must be YYYY-MM-DD");
  }
  if (
    meta.header["Intended destination"] &&
    !DESTINATIONS.has(meta.header["Intended destination"])
  ) {
    errors.push("Intended destination must be ARCHITECTURE | ADR | CONTRACT | EXPLAINER");
  }
  if (meta.header.Confidence && !CONFIDENCE.has(meta.header.Confidence)) {
    errors.push("Confidence must be high | medium | low");
  }
  if (meta.header["Requires ADR"] && !REQUIRES_ADR.has(meta.header["Requires ADR"])) {
    errors.push("Requires ADR must be yes | no");
  }
  if (meta.separatorIndex === -1) {
    errors.push("Missing header separator '---'");
  }

  return { ok: errors.length === 0, errors };
}
