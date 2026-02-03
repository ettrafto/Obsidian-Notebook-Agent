# Command Spec: tasks

## Command: tasks
- Reads:
  - `vault/planning/masterplan.md`
  - `vault/tasks/tasks.md` (optional backlog)
  - `vault/planning/progress.md` (for staleness)
- Writes:
  - `vault/tasks/tasks-summary.md`

## Behavior
- Parse open tasks from masterplan and backlog.
- Group open tasks by tag:
  - Blockers
  - Needs Design
  - Needs Testing
  - Other Open Tasks
- Determine stale tasks:
  - If `progress.md` exists, a task is stale if not mentioned in the last 14 days.
  - If date parsing fails, stale means never mentioned.
- Blockers appear at the top of the summary.

## Output Format (`vault/tasks/tasks-summary.md`)
# Tasks Summary

## Blockers
- [ ] (ID) Task ...

## Needs Design
- [ ] ...

## Needs Testing
- [ ] ...

## Other Open Tasks
- [ ] ...

## Stale (14+ days)
- [ ] ...

## Notes
- Generated: YYYY-MM-DD HH:MM
