# Architecture

## System Overview
```mermaid
flowchart LR
  Cursor[Cursor] --> Agent[Agent]
  Agent --> Vault[Vault]
  Agent --> Git[Git]
  Tunnel[ Tunnel (TODO) ] -.-> Agent
```

## Components
### Agent
- Responsibilities
  - Accepts commands and writes notes into the vault
  - Logs actions to `/logs/agent.log`
- Inputs/Outputs
  - Inputs: HTTP requests (`/command`, `/note/*`, `/query`)
  - Outputs: Markdown files under `vault/`, log lines in `/logs/agent.log`
- Seams
  - HTTP API surface (FastAPI)
  - File I/O boundary at `/vault`

### Vault
- Responsibilities
  - Stores notes, projects, and system logs as Markdown
- Inputs/Outputs
  - Inputs: file writes/appends from the Agent
  - Outputs: Markdown files read by the Agent and human
- Seams
  - Folder boundaries (`/inbox`, `/projects`, `/system`, `/architecture`)

### Tunnel
- Responsibilities
  - (TODO) External access path to the Agent
- Inputs/Outputs
  - Inputs: (TODO)
  - Outputs: (TODO)
- Seams
  - Network edge between external clients and the Agent (TODO)

### Git
- Responsibilities
  - Records vault changes and agent edits for review
- Inputs/Outputs
  - Inputs: local file changes
  - Outputs: commits and branches
- Seams
  - Branch naming and merge policy (see `vault/system/git-policy.md`)

### Cursor
- Responsibilities
  - Human editing and review environment
  - Agent execution environment for local changes
- Inputs/Outputs
  - Inputs: repository files and agent outputs
  - Outputs: edits and review feedback
- Seams
  - Human-in-the-loop review before merges

## Data Flow
- capture → triage → plan → implement → review
  - capture
    - Files: `vault/inbox/inbox.md`
    - Done: capture entries appended with timestamp
  - triage
    - Files: `vault/inbox/inbox.md`, `vault/projects/_index.md` (and project notes)
    - Done: inbox items moved to projects/notes/tasks
  - plan
    - Files: project notes under `vault/projects/`
    - Done: plan is written with next actions
  - implement
    - Files: relevant notes and system logs, plus repo files
    - Done: changes applied and documented
  - review
    - Files: git diff/PR, `vault/system/agent-runs.md`
    - Done: human review and merge

## Interfaces
### HTTP Endpoints
| Endpoint | Method | Purpose | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `/health` | GET | Health check | None | `{ ok, vault }` | Existing |
| `/note/write` | POST | Write a note | `{ path, content, overwrite }` | `{ written }` | Existing |
| `/note/append` | POST | Append to a note | `{ path, content }` | `{ appended }` | Existing |
| `/command` | POST | Execute command | `{ text }` | `{ ok, logged_to }` or `{ ok, captured_to }` | Existing |
| `/query` | POST | Read-only architecture answers | `{ question }` | `{ answer, citations }` | New |

### File Conventions
- Agent writes to: `vault/system/agent-runs.md`, `vault/inbox/inbox.md`
- Agent reads from: `vault/architecture/ARCHITECTURE.md`, `vault/architecture/DECISIONS.md`
- Project index: `vault/projects/_index.md`

### Git Conventions
- Branch naming: `agent/YYYY-MM-DD`
- Merge target: `main` via human review and squash

## Working Agreements
- Source of truth: `vault/architecture/ARCHITECTURE.md` and `vault/architecture/DECISIONS.md` win for architecture/decision disputes
- Update this doc when components, interfaces, or workflows change
- Drift detection: compare code and docs regularly (see Tool 8, not implemented here)
