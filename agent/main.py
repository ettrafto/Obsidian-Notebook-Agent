from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime

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
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_path = _ensure_inside_vault(Path("system/agent-runs.md"))
    report_path.parent.mkdir(parents=True, exist_ok=True)

    entry = f"\n- [{now}] {req.text}\n"
    existing = report_path.read_text(encoding="utf-8") if report_path.exists() else "# Agent Runs\n"
    report_path.write_text(existing + entry, encoding="utf-8")
    _log(f"COMMAND {req.text}")
    return {"ok": True, "logged_to": "system/agent-runs.md"}
