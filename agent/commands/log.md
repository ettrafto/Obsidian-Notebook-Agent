# Command Spec: log

## Command: log: <free text>
- Appends a new entry to the current month’s `vault/devlog/YYYY-MM.md`
- Auto-fills:
  - timestamp
  - **Change**: derived from text
  - **Why**: inferred if obvious, else "Not specified"
  - **Files Touched**: "TBD"
  - **Next**: "TBD"

### Later hook (documented only)
- If git is available:
  - run `git diff --name-only HEAD`
  - auto-populate **Files Touched**
