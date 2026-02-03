import fs from "fs/promises";
import path from "path";

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
const COMPONENTS = new Set(["Agent", "Vault", "Tunnel", "Git", "Cursor"]);

function fail(errors) {
  console.log("FAIL");
  for (const err of errors) console.log(`- ${err}`);
  process.exit(1);
}

function pass() {
  console.log("PASS");
  process.exit(0);
}

function parseHeader(lines) {
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

function validateFilename(filePath) {
  const base = path.basename(filePath);
  const re = /^ARCH-DRAFT-\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/;
  return re.test(base);
}

function validateDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateComponents(value) {
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return false;
  return parts.every((p) => COMPONENTS.has(p));
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) fail(["Missing path argument"]);

  const errors = [];
  if (!validateFilename(filePath)) {
    errors.push("Filename does not match ARCH-DRAFT-YYYY-MM-DD-<slug>.md");
  }

  let content = "";
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    errors.push("Unable to read file");
    return fail(errors);
  }

  const lines = content.split(/\r?\n/);
  const { header, separatorIndex } = parseHeader(lines);
  if (separatorIndex === -1) {
    errors.push("Missing header separator '---'");
  }

  for (const key of REQUIRED_KEYS) {
    if (!header[key]) errors.push(`Missing header field: ${key}`);
  }

  if (header.Source && header.Source !== "ChatGPT") {
    errors.push("Source must be ChatGPT");
  }
  if (header.Date && !validateDate(header.Date)) {
    errors.push("Date must be YYYY-MM-DD");
  }
  if (header["Intended destination"] && !DESTINATIONS.has(header["Intended destination"])) {
    errors.push("Intended destination must be ARCHITECTURE | ADR | CONTRACT | EXPLAINER");
  }
  if (header.Confidence && !CONFIDENCE.has(header.Confidence)) {
    errors.push("Confidence must be high | medium | low");
  }
  if (header["Requires ADR"] && !REQUIRES_ADR.has(header["Requires ADR"])) {
    errors.push("Requires ADR must be yes | no");
  }
  if (header["Affected components"] && !validateComponents(header["Affected components"])) {
    errors.push("Affected components must be Agent | Vault | Tunnel | Git | Cursor");
  }

  if (errors.length) {
    fail(errors);
  } else {
    pass();
  }
}

run();
