# Vault Contract

## Purpose
Define the allowed vault structure and agent write boundaries to keep changes safe and auditable.

## Allowed Directories
Top-level vault directories allowed:
- vault/architecture/
- vault/planning/
- vault/devlog/
- vault/contracts/
- vault/system/
- vault/inbox/
- vault/projects/
- vault/tasks/
- vault/explainers/ (TODO)

The agent MUST NOT create new top-level directories without adding them here.

## Naming Conventions
- File names: lowercase and hyphenated where reasonable
- Decision files: `architecture/decisions/ADR-0001-*.md`
- Devlog monthly files: `devlog/YYYY-MM.md`
- Dates: `YYYY-MM-DD`

## Link + Tag Expectations
Notes SHOULD include at least 1 link or tag unless they are in `system/` or `contracts/`.

## Task Definition (authoritative)
Task line format:
`- [ ] (TASK-ID) Task description #optional-tags`

Rules:
- Task IDs are unique and case-sensitive
- Phase task IDs: `P0-###`, `P1-###`, `P2-###`, `P3-###`, `P4-###`
- Backlog task IDs: `T-###`
- Allowed tags: `#blocker`, `#needs-design`, `#needs-testing`, `#stale`
- Task lines must live in:
  - `vault/planning/masterplan.md`
  - `vault/tasks/tasks.md`

## Agent Write Policy
Agent is allowed to write/overwrite:
- `vault/planning/now.md` (overwrite allowed)
- `vault/planning/progress.md` (append only)
- `vault/devlog/YYYY-MM.md` (append only)
- `vault/system/weekly-report.md` (append only — future)
- `vault/system/maintenance.md` (append only)

Everything else requires explicit command.

## Required Files
Required for system health:
- `vault/architecture/ARCHITECTURE.md`
- `vault/architecture/DECISIONS.md`
- `vault/planning/masterplan.md`
- `vault/planning/progress.md`
- `vault/planning/now.md`
- `vault/contracts/VAULT_CONTRACT.md`
- `vault/contracts/API_CONTRACT.md`
- `vault/contracts/GIT_CONTRACT.md`
