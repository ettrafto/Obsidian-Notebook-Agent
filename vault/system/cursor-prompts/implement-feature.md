# Implement Feature

## Goal
Implement a feature defined in `vault/planning/masterplan.md` with a specific task ID.

## Context
- Repo: Atlas Obsidian vault
- Contracts: `vault/contracts/VAULT_CONTRACT.md`, `vault/contracts/API_CONTRACT.md`, `vault/contracts/GIT_CONTRACT.md`

## Constraints
- MUST reference a masterplan task ID (P?-###)
- MUST keep changes minimal and scoped
- MUST NOT change contracts unless an ADR exists
- MUST update `vault/devlog/YYYY-MM.md` (append-only)

## Files in Scope
- List expected files (paths) here

## Acceptance Criteria
- Task ID implemented with required behavior
- Contracts remain satisfied
- Devlog updated with a factual entry

## Rollback Plan
- Revert commit(s) with `git revert`
- If incomplete, abandon agent branch
