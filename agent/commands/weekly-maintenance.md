# Command Spec: weekly maintenance

## Command: weekly maintenance
- Inputs:
  - `vault/contracts/VAULT_CONTRACT.md`
  - `vault/contracts/API_CONTRACT.md`
  - `vault/architecture/ARCHITECTURE.md`
  - `vault/planning/masterplan.md`
  - `vault/planning/progress.md`
  - `vault/explainers/*.md` (if present)
  - `vault/` (for orphan scan)
  - git (optional; if available)
- Outputs:
  - Append to `vault/system/weekly-report.md`
  - Append to `vault/system/maintenance.md`

## Deterministic Checks
1) Required files exist (from VAULT_CONTRACT Required Files list)
2) Orphan notes created/modified this week
   - If file timestamps are unavailable, scan last 50 modified Markdown files
3) Stale tasks
   - Parse task IDs from `masterplan.md`
   - Determine last mentioned in `progress.md` by date blocks and ID mentions
4) Unmerged agent branches
   - If git is available:
     - `git branch --all | grep '^  agent/'`
     - `git branch --merged main`
   - Otherwise: output TODO + manual commands
5) Architecture drift warnings
   - Parse endpoint names from `API_CONTRACT.md` Endpoints table
   - Parse endpoint names from ARCHITECTURE Interfaces table
   - Warn on set difference
   - Parse component headings from ARCHITECTURE Components section
   - Warn if explainers reference components not in list

## Status Scoring
- FAIL if any required file missing OR contract violations severe
- WARN if stale tasks > 0 OR orphan notes > 0 OR drift warnings > 0
- PASS if all clear

## Output Format
Must match the `weekly-report.md` section structure.
