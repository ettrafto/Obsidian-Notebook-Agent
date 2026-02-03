# Agent Permissions

## What this is in our system
- The rules that constrain what the agent can read/write
- Defined by `vault/contracts/VAULT_CONTRACT.md`
- Enforced by keeping writes deterministic and auditable

## Why it exists
- Prevents accidental vault corruption
- Keeps human review and rollback possible
- Aligns with accuracy-first behavior and citations

## How it works (current)
- Agent writes only to explicitly allowed files
- Append-only rules apply to logs and progress
- Read-only endpoints return citations from vault sources

## Interfaces & Files
- `vault/contracts/VAULT_CONTRACT.md`
- `vault/contracts/API_CONTRACT.md`
- `vault/architecture/ARCHITECTURE.md`
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`

## Common failures
- Unexpected edits → agent wrote outside policy → Revert and update policy
- Missing citations → endpoint violated API contract → Fix response format
- Overwrites of append-only files → logic bug → restore and enforce append

## Decisions
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`
- `vault/architecture/DECISIONS.md`

## TODO
- Add automated contract checks to prevent policy drift
