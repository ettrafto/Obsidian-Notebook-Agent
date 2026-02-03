# Vault Inbox (Draft Intake)

This folder is a staging area for external drafts (e.g., ChatGPT outputs).
Do not merge drafts directly into canonical docs without review.

## Required File Naming
All imported drafts must be named:
- `ARCH-DRAFT-YYYY-MM-DD-<slug>.md`

Example:
- `ARCH-DRAFT-2026-02-03-context-endpoint.md`

## Required Header Block (NOT YAML)
At the top of every draft, require exactly this block:

- Source: ChatGPT
- Date: YYYY-MM-DD
- Intended destination: ARCHITECTURE | ADR | CONTRACT | EXPLAINER
- Affected components: Agent | Vault | Tunnel | Git | Cursor (comma-separated allowed)
- Confidence: high | medium | low
- Requires ADR: yes | no
---

## Routing Rules (Deterministic)
- ARCHITECTURE → merge into `vault/architecture/ARCHITECTURE.md` (must fit existing headings)
- ADR → create/update `vault/architecture/decisions/ADR-XXXX-<slug>.md` and add to `DECISIONS.md`
- CONTRACT → merge into `vault/contracts/*.md` (convert to MUST/SHOULD bullets)
- EXPLAINER → merge into `vault/explainers/<topic>.md` (must link to architecture + contract + ADR)

## Merge Checklist (5 minutes)
- Destination correct
- Matches destination structure
- Adds links
- Interfaces/endpoints aligned
- Contract changes require ADR

## Exit Condition for Drafts
A draft is done when:
- Content is merged into canonical docs
- Devlog notes the merge (Tool 3)
- Weekly maintenance/drift passes (Tool 8)

## Automatic Import (Optional)
Use `npm run atlas:import-arch -- vault/inbox/ARCH-DRAFT-YYYY-MM-DD-<slug>.md` to:
- validate the draft header
- scaffold ADRs if required
- append a maintenance log entry
