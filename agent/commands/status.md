# Command Spec: status / advance

## Command: status
- Reads: `vault/planning/masterplan.md`, `vault/planning/progress.md`
- Regenerates: `vault/planning/now.md`
- Selection rules:
  - Choose unfinished tasks from the earliest active phase
  - Prioritize tasks without `#blocker`
  - Place any `#blocker` tasks into the Blockers section
- Current Objective:
  - One sentence derived from the current phase theme and top task

## Command: advance <task-id>
- Marks the matching checkbox in `vault/planning/masterplan.md` as complete
- Appends to `vault/planning/progress.md` under today’s date:
  - Summary: "Completed <task-id>"
  - Tasks touched: <task-id>
  - Next: next logical task (if clear)
