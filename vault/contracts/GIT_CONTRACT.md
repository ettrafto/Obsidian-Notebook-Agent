# Git Contract

## Purpose
Protect the vault with safe, reviewable changes and easy rollback.

## Repo Layout
- Vault root is the git repo (in-place).
- All agent changes occur on a working branch.

## Branch Naming
- Standard: `agent/YYYY-MM-DD/<short-slug>`

## Change Policy
- Agent MUST NOT push to `main` directly.
- Agent changes should be squashed on merge.
- Prefer small PR-sized commits per tool.

## Review + Rollback
- Review checklist:
  - Contracts and planning files updated if impacted
  - No unexpected file edits
  - Tests or smoke checks noted when applicable
- Rollback:
  - Use `git revert` for committed changes
  - Use `git reset --hard` only with explicit human approval
- If contract check fails:
  - Fix violations or document exception before merge
# Git Contract

## Purpose
Protect the vault with safe, reviewable changes and easy rollback.

## Repo Layout
- Vault root is the git repo (in-place).
- All agent changes occur on a working branch.

## Branch Naming
- Standard: `agent/YYYY-MM-DD/<short-slug>`

## Change Policy
- Agent MUST NOT push to `main` directly.
- Agent changes should be squashed on merge.
- Prefer small PR-sized commits per tool.

## Review + Rollback
- Review checklist:
  - Contracts and planning files updated if impacted
  - No unexpected file edits
  - Tests or smoke checks noted when applicable
- Rollback:
  - Use `git revert` for committed changes
  - Use `git reset --hard` only with explicit human approval
- If contract check fails:
  - Fix violations or document exception before merge
