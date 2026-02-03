# Decisions (ADR-lite)

## Decision Ledger
| Date (YYYY-MM-DD) | Decision | Context | Alternatives | Consequences |
|---|---|---|---|---|
| 2026-02-03 | Clean-slate vault with minimal folders and heavy tags/links | Initial repo is a blank vault with only required folders (assumption) | More nested structure or external DB | Faster capture; relies on consistent tagging |
| 2026-02-03 | Tasks managed in Obsidian via Markdown checkboxes | Existing notes are Markdown-first (assumption) | External task manager | Keeps tasks close to notes; requires manual discipline |
| 2026-02-03 | Accuracy-first answers with exact citations | Agent is expected to be auditable (assumption) | Fast summaries without quotes | Slower responses, higher trust |
| 2026-02-03 | Weekly proactive maintenance | Maintenance templates exist in repo (assumption) | Ad-hoc only | Regular cleanup cadence |
| 2026-02-03 | Git-based auto-apply with rollback, no secrets handling | Repo is the system of record (assumption) | Direct edits without git | Safer changes; requires git hygiene |
| 2026-02-03 | Local-first now, possible remote later | Tunnel is listed as future (assumption) | Remote-first now | Simpler setup; plan for future exposure |
