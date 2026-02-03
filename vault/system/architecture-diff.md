# Architecture Diff (Spec)

## Purpose
Describe a minimal approach to detect architecture drift over time.

## What “drift” means
- An endpoint exists in `API_CONTRACT.md` but not in the ARCHITECTURE interfaces table
- A component is referenced in `now.md` but not documented in `ARCHITECTURE.md`
- A new top-level directory exists not listed in `VAULT_CONTRACT.md`

## Minimal future approach (no implementation now)
- Store periodic snapshots (monthly or weekly) of:
  - `ARCHITECTURE.md`
  - `API_CONTRACT.md`
  - `VAULT_CONTRACT.md`
- Compare text sections (simple line diff)
- Report changes into `weekly-report.md` (Tool 8 later)

## Drift checklist (manual for now)
- [ ] Components match reality
- [ ] Interfaces table reflects endpoints
- [ ] Contracts list all allowed dirs
- [ ] Decisions ledger references ADRs for major changes
