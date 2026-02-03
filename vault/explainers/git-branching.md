# Git Branching

## What this is in our system
- The workflow for isolating agent changes before review
- Branch naming and merge rules from `vault/contracts/GIT_CONTRACT.md`
- Supports safe rollback and human approval

## Why it exists
- Prevents direct changes to `main`
- Keeps work reviewable and reversible
- Encourages small, tool-scoped commits

## How it works (current)
- Create a new branch using the standard naming convention
- Make changes on the agent branch only
- Human reviews and squash merges to `main`
- Roll back via `git revert` if needed

## Interfaces & Files
- `vault/contracts/GIT_CONTRACT.md`
- `vault/architecture/ARCHITECTURE.md`
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`

## Common failures
- Dirty working tree → changes not staged → commit or stash before branching
- Merging to main directly → policy violation → reset and open a PR
- Conflicts during merge → unreviewed edits → rebase or resolve with review
- Rollback confusion → wrong command → use `git revert` for commits

## Decisions
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`
- `vault/architecture/DECISIONS.md`

## TODO
- Document branch creation helper or script (TODO)
