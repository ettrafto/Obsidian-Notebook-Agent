# Command Spec: adr

## Command: adr: <title>
- Creates: `vault/architecture/decisions/ADR-XXXX-<slug>.md`
- Rules:
  - ADR numbers are sequential (next available)
  - slug is lowercase and hyphenated
  - file content is copied from `ADR-TEMPLATE.md`
  - References must include links to:
    - `vault/planning/now.md`
    - `vault/architecture/ARCHITECTURE.md`
    - `vault/architecture/DECISIONS.md`
- Also updates `vault/architecture/DECISIONS.md`:
  - Appends a new row in the Decision Ledger:
    - Date
    - Decision (title)
    - Context (1 phrase)
    - Alternatives (short)
    - Consequences (short)
  - Adds the ADR to the ADR Index
