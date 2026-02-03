# Command Spec: explain

## Command: explain <topic>
- Inputs:
  - `vault/architecture/ARCHITECTURE.md`
  - `vault/architecture/DECISIONS.md`
  - `vault/architecture/decisions/*.md`
  - `vault/contracts/*.md`
- Output:
  - `vault/explainers/<topic-slug>.md`

## Deterministic Approach
- If the explainer exists:
  - Update only:
    - "How it works (current)"
    - "Interfaces & Files"
    - "TODO"
  - Do NOT rewrite "Decisions" links unless missing
- If it does not exist:
  - Create from the explainer template
- Always include at least 3 vault links:
  - ARCHITECTURE.md
  - a relevant contract
  - at least one ADR
- If topic does not match architecture/contracts:
  - Create explainer anyway
  - Mark Planned/Unknown and list missing context

## Topic Slug Rules
- Lowercase, hyphenated
- Example: "git branching" -> `git-branching.md`
