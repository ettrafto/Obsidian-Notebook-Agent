# Cursor Bridge Playbook

## Purpose
Define safe, repeatable Cursor usage to prevent drift, enforce contracts, and keep changes auditable.

## Core Rules (Non-Negotiable)
- Cursor MUST follow `vault/contracts/VAULT_CONTRACT.md`
- Cursor MUST respect `vault/contracts/API_CONTRACT.md` and `vault/contracts/GIT_CONTRACT.md`
- Cursor MUST NOT invent architecture or endpoints
- Cursor MUST cite or mark assumptions in docs
- Cursor MUST keep changes minimal and scoped

## Allowed Change Types
- Implementing a feature defined in `vault/planning/masterplan.md`
- Adding or updating documentation
- Refactoring with no behavior change
- Bug fixes with clear reproduction

## Disallowed Change Types
- Introducing new top-level directories
- Changing contracts without ADR
- Editing append-only logs retroactively
- Making speculative architectural changes

## Workflow (Mandatory)
1) Identify task ID(s)
2) Create or select agent branch
3) Apply changes
4) Run contract check (Tool 4)
5) Update devlog (Tool 3)
6) Prepare for review / merge

## Rollback Procedure
1) Identify the change set to undo
2) Prefer `git revert` for committed changes
3) Abandon an agent branch if work is invalid or out of scope
4) Use `git reset --hard` only with explicit human approval

## When to Stop
- Missing spec or acceptance criteria
- Conflicting contracts or unclear authority
- Unclear ownership for a file or decision
- Unexpected drift warnings
