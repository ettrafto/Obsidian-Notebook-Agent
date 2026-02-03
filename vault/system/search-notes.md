# Search Notes (Generated)

_This file is overwritten on each search._

## 2026-02-03 22:32 — find: capture
### Results

1) **agent/SMOKE_TESTS.md** — nearest heading: `#expected-oktruevaultvault`

> ```sh
> curl -s -X POST http://localhost:8000/command -H "Content-Type: application/json" -d "{\"text\":\"capture: buy milk\"}"
> # Expected: {"ok":true,"captured_to":"inbox/inbox.md"}

2) **vault/architecture/ARCHITECTURE.md** — nearest heading: `#data-flow`

> ## Data Flow
> - capture → triage → plan → implement → review
>   - capture

3) **vault/architecture/DECISIONS.md** — nearest heading: `#decision-ledger`

> |---|---|---|---|---|
> | 2026-02-03 | Clean-slate vault with minimal folders and heavy tags/links | Initial repo is a blank vault with only required folders (assumption) | More nested structure or external DB | Faster capture; relies on consistent tagging |
> | 2026-02-03 | Tasks managed in Obsidian via Markdown checkboxes | Existing notes are Markdown-first (assumption) | External task manager | Keeps tasks close to notes; requires manual discipline |

4) **vault/inbox/inbox.md** — nearest heading: `#inbox-log`

> 
> Captures appended by the agent and by quick-entry commands.
> 

5) **vault/planning/masterplan.md** — nearest heading: `#phase-0--foundations`

> - [x] (P0-003) Establish planning system (Tool 2)
> - [ ] (P0-004) Define capture and triage workflow details #needs-design
> - [ ] (P0-005) Clarify tunnel approach and exposure risk (open question) #needs-design

6) **vault/planning/now.md** — nearest heading: `#active-tasks-max-5`

> - [ ] (P0-002) Document architecture and decisions (Tool 1)
> - [ ] (P0-004) Define capture and triage workflow details
> 

7) **vault/system/agent-commands.md** — nearest heading: `#agent-commands-v0`

> 
> - "capture: <text>"
> - "triage inbox"

8) **vault/system/inbox.md** — nearest heading: `#system-inbox`

> 
> This file is for agent/system-generated captures if needed.
> Prefer `/inbox/inbox.md` for daily capture.

9) **vault/system/index.md** — nearest heading: `#directory-listing-top-level`

> - `vault/explainers/` — short system explainers
> - `vault/inbox/` — captures and triage
> - `vault/planning/` — master plan, progress, now

10) **vault/tasks/tasks.md** — nearest heading: `#backlog-optional`

> - [ ] (T-005) Add template for project kickoff notes
> - [ ] (T-006) Define retention rules for inbox captures #needs-design
> - [ ] (T-007) Add manual QA checklist for weekly maintenance #needs-testing
