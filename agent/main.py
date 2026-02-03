from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
import re

VAULT_PATH = Path("/vault").resolve()
LOG_PATH = Path("/logs/agent.log").resolve()

app = FastAPI(title="Atlas Agent MVP", version="0.1.0")


def _ensure_inside_vault(p: Path) -> Path:
    p = (VAULT_PATH / p).resolve()
    if not str(p).startswith(str(VAULT_PATH)):
        raise HTTPException(status_code=400, detail="Path escapes vault")
    return p


def _log(msg: str):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().isoformat()
    LOG_PATH.write_text((LOG_PATH.read_text() if LOG_PATH.exists() else "") + f"[{timestamp}] {msg}\n")


class WriteNote(BaseModel):
    path: str  # e.g. "inbox/test.md"
    content: str
    overwrite: bool = False


class AppendNote(BaseModel):
    path: str
    content: str


class Command(BaseModel):
    text: str  # e.g. "run weekly maintenance" (MVP logs + writes a report)

class Query(BaseModel):
    question: str


def _anchor_for_heading(heading: str) -> str:
    slug = heading.strip().lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    return f"#{slug}"


def _extract_section(text: str, heading: str) -> str:
    lines = text.splitlines()
    start_idx = None
    for i, line in enumerate(lines):
        if line.strip().lower() == heading.lower():
            start_idx = i + 1
            break
    if start_idx is None:
        return ""
    out = []
    for line in lines[start_idx:]:
        if line.startswith("#"):
            break
        out.append(line)
    return "\n".join(out).strip()


def _headings(text: str):
    headings = []
    for line in text.splitlines():
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            title = line.strip("#").strip()
            headings.append((level, title))
    return headings


def _excerpt_under_heading(text: str, heading: str) -> str:
    lines = text.splitlines()
    start_idx = None
    for i, line in enumerate(lines):
        if line.strip().lower() == heading.lower():
            start_idx = i + 1
            break
    if start_idx is None:
        return ""
    excerpt_lines = []
    for line in lines[start_idx:]:
        if line.startswith("#"):
            break
        if line.strip():
            excerpt_lines.append(line.strip())
        if len(excerpt_lines) >= 3:
            break
    return " ".join(excerpt_lines).strip()

def _append_maintenance(entry: str):
    maintenance_path = _ensure_inside_vault(Path("system/maintenance.md"))
    maintenance_path.parent.mkdir(parents=True, exist_ok=True)
    if maintenance_path.exists():
        existing = maintenance_path.read_text(encoding="utf-8")
    else:
        existing = "# Maintenance Log\n\n"
    maintenance_path.write_text(existing + entry, encoding="utf-8")


def _contract_check_report() -> str:
    findings = []
    suggested = []
    has_fail = False

    allowed_dirs = {
        "architecture",
        "planning",
        "devlog",
        "contracts",
        "system",
        "inbox",
        "projects",
        "tasks",
        "explainers",
    }

    actual_dirs = [p.name for p in VAULT_PATH.iterdir() if p.is_dir()]
    unknown_dirs = sorted([d for d in actual_dirs if d not in allowed_dirs])
    if unknown_dirs:
        has_fail = True
        findings.append(f"[FAIL] Unknown top-level directories: {', '.join(unknown_dirs)}")
        suggested.append("Update VAULT_CONTRACT.md or remove unknown directories")
    else:
        findings.append("[PASS] Top-level vault directories match allowed list")

    required_files = [
        "architecture/ARCHITECTURE.md",
        "architecture/DECISIONS.md",
        "planning/masterplan.md",
        "planning/progress.md",
        "planning/now.md",
        "contracts/VAULT_CONTRACT.md",
        "contracts/API_CONTRACT.md",
        "contracts/GIT_CONTRACT.md",
    ]
    for rel in required_files:
        p = _ensure_inside_vault(Path(rel))
        if p.exists():
            findings.append(f"[PASS] Required file exists: vault/{rel}")
        else:
            has_fail = True
            findings.append(f"[FAIL] Missing required file: vault/{rel}")
            suggested.append(f"Create vault/{rel}")

    now_path = _ensure_inside_vault(Path("planning/now.md"))
    if now_path.exists():
        findings.append("[PASS] now.md exists")
    else:
        has_fail = True
        findings.append("[FAIL] now.md missing")
        suggested.append("Create vault/planning/now.md")

    masterplan_path = _ensure_inside_vault(Path("planning/masterplan.md"))
    if masterplan_path.exists():
        masterplan_text = masterplan_path.read_text(encoding="utf-8")
        matches = re.findall(r"^- \[[ xX]\] \([A-Z0-9-]+\) ", masterplan_text, flags=re.M)
        if len(matches) >= 5:
            findings.append("[PASS] masterplan.md has at least 5 valid task lines")
        else:
            has_fail = True
            findings.append("[FAIL] masterplan.md has fewer than 5 valid task lines")
            suggested.append("Add more tasks with IDs to masterplan.md")
    else:
        has_fail = True
        findings.append("[FAIL] masterplan.md missing")
        suggested.append("Create vault/planning/masterplan.md")

    current_month = datetime.now().strftime("%Y-%m")
    devlog_path = _ensure_inside_vault(Path(f"devlog/{current_month}.md"))
    if devlog_path.exists():
        findings.append(f"[PASS] Devlog exists for {current_month}")
    else:
        has_fail = True
        findings.append(f"[FAIL] Devlog missing for {current_month}")
        suggested.append(f"Create vault/devlog/{current_month}.md")

    status = "FAIL" if has_fail else "PASS"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_lines = [
        f"\n## {now} — Contract Check",
        f"Status: {status}",
        "Findings:",
    ]
    report_lines.extend([f"- {item}" for item in findings])
    report_lines.append("Suggested Fixes:")
    if suggested:
        report_lines.extend([f"- {item}" for item in suggested])
    else:
        report_lines.append("- None")
    return "\n".join(report_lines) + "\n"


@app.get("/health")
def health():
    return {"ok": True, "vault": str(VAULT_PATH)}


@app.post("/note/write")
def note_write(req: WriteNote):
    p = _ensure_inside_vault(Path(req.path))
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists() and not req.overwrite:
        raise HTTPException(status_code=409, detail="File exists (set overwrite=true)")
    p.write_text(req.content, encoding="utf-8")
    _log(f"WRITE {req.path} ({len(req.content)} bytes)")
    return {"written": req.path}


@app.post("/note/append")
def note_append(req: AppendNote):
    p = _ensure_inside_vault(Path(req.path))
    p.parent.mkdir(parents=True, exist_ok=True)
    existing = p.read_text(encoding="utf-8") if p.exists() else ""
    p.write_text(existing + req.content, encoding="utf-8")
    _log(f"APPEND {req.path} (+{len(req.content)} bytes)")
    return {"appended": req.path}


@app.post("/command")
def command(req: Command):
    # MVP behavior: write a simple report note + log.
    text = req.text or ""
    stripped = text.lstrip()
    if stripped.lower() == "contract check":
        report = _contract_check_report()
        _append_maintenance(report)
        _log("CONTRACT_CHECK " + ("FAIL" if "Status: FAIL" in report else "PASS"))
        return {"ok": True, "logged_to": "system/maintenance.md"}
    if stripped.lower().startswith("capture:"):
        payload = stripped[len("capture:"):].strip()
        if not payload:
            raise HTTPException(status_code=400, detail="Capture payload is required")
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        inbox_path = _ensure_inside_vault(Path("inbox/inbox.md"))
        inbox_path.parent.mkdir(parents=True, exist_ok=True)
        entry = f"\n- [{now}] {payload}\n"
        existing = inbox_path.read_text(encoding="utf-8") if inbox_path.exists() else "# Inbox Log\n"
        inbox_path.write_text(existing + entry, encoding="utf-8")
        _log(f"CAPTURE {payload}")
        return {"ok": True, "captured_to": "inbox/inbox.md"}

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_path = _ensure_inside_vault(Path("system/agent-runs.md"))
    report_path.parent.mkdir(parents=True, exist_ok=True)

    entry = f"\n- [{now}] {text}\n"
    existing = report_path.read_text(encoding="utf-8") if report_path.exists() else "# Agent Runs\n"
    report_path.write_text(existing + entry, encoding="utf-8")
    _log(f"COMMAND {text}")
    return {"ok": True, "logged_to": "system/agent-runs.md"}


@app.post("/query")
def query(req: Query):
    question = (req.question or "").strip()
    arch_path = _ensure_inside_vault(Path("architecture/ARCHITECTURE.md"))
    decisions_path = _ensure_inside_vault(Path("architecture/DECISIONS.md"))

    arch_text = arch_path.read_text(encoding="utf-8") if arch_path.exists() else ""
    decisions_text = decisions_path.read_text(encoding="utf-8") if decisions_path.exists() else ""

    q_lower = question.lower()
    if "components" in q_lower or "responsibilities" in q_lower:
        section = _extract_section(arch_text, "## Components")
        excerpt = _excerpt_under_heading(arch_text, "## Components")
        return {
            "answer": section or "Not found",
            "citations": [
                {
                    "path": "vault/architecture/ARCHITECTURE.md",
                    "anchor": _anchor_for_heading("Components"),
                    "quote": excerpt or "## Components",
                }
            ] if section else []
        }

    if "where is" in q_lower or "defined" in q_lower:
        if "where is" in q_lower:
            idx = q_lower.find("where is")
            target = question[idx + len("where is"):].strip().strip("?")
        else:
            target = question
            for token in ["defined", "where is"]:
                target = re.sub(token, "", target, flags=re.IGNORECASE)
            target = target.strip().strip("?")
        target_lower = target.lower()
        for text, path in [(arch_text, "vault/architecture/ARCHITECTURE.md"),
                           (decisions_text, "vault/architecture/DECISIONS.md")]:
            for level, heading in _headings(text):
                if target_lower and target_lower in heading.lower():
                    heading_line = f"{'#' * level} {heading}"
                    excerpt = _excerpt_under_heading(text, heading_line)
                    return {
                        "answer": f"{heading} is defined in {path}.",
                        "citations": [
                            {
                                "path": path,
                                "anchor": _anchor_for_heading(heading),
                                "quote": excerpt or heading,
                            }
                        ]
                    }

        headings = [h for _, h in _headings(arch_text)] + [h for _, h in _headings(decisions_text)]
        return {
            "answer": "Not found. Closest headings: " + ", ".join(headings[:5]),
            "citations": []
        }

    return {"answer": "Not found", "citations": []}
