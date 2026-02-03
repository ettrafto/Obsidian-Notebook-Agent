# Atlas Architecture Import Workflow — One‑Page Guide

This guide explains **how to bring architecture documents from ChatGPT into Atlas safely, quickly, and consistently**, without polluting canonical docs or losing context.

This workflow is **deterministic, auditable, and low‑friction**. Follow it exactly.

---

## Mental Model (Read First)

ChatGPT produces **drafts**, not truth.

Atlas accepts drafts only through a **staging → validation → routing** pipeline:

1. **Inbox** = capture safely
2. **Header block** = make intent machine‑readable
3. **Import command** = validate + scaffold decisions
4. **Manual merge** = human judgment
5. **Maintenance log** = permanent record

Nothing skips steps.

---

## Folder You Use

All external architecture drafts go here:

```
vault/inbox/
```

Never paste directly into:
- ARCHITECTURE.md
- contracts
- explainers
- ADRs

Inbox is the only entry point.

---

## Step 1 — Capture the Draft

When ChatGPT produces an architecture document:

1. Create a new file in `vault/inbox/`
2. Name it exactly:

```
ARCH-DRAFT-YYYY-MM-DD-short-slug.md
```

Example:
```
ARCH-DRAFT-2026-02-04-context-endpoint.md
```

3. Paste the content into that file

---

## Step 2 — Fill the Required Header Block

At the **top of the draft**, add this block (NOT YAML):

```
- Source: ChatGPT
- Date: 2026-02-04
- Intended destination: ARCHITECTURE | ADR | CONTRACT | EXPLAINER
- Affected components: Agent, Vault
- Confidence: high | medium | low
- Requires ADR: yes | no
---
```

### How to choose fields

- **Intended destination**
  - ARCHITECTURE → structure, components, data flow, interfaces
  - ADR → tradeoffs, alternatives, decisions
  - CONTRACT → rules, MUST/SHOULD, policies
  - EXPLAINER → how something works or is used

- **Requires ADR = yes** if the draft:
  - chooses between options
  - introduces tradeoffs
  - changes rules or interfaces

If unsure, set it to **yes**.

---

## Step 3 — Validate & Import (Automatic)

Run the import command:

```
npm run atlas:import-arch -- vault/inbox/ARCH-DRAFT-2026-02-04-context-endpoint.md
```

### What this does automatically

- Validates:
  - filename format
  - header block completeness
  - allowed enum values
- Logs the import to:
  - `vault/system/maintenance.md`
- If `Requires ADR: yes`:
  - creates a new ADR from the template
  - assigns the next ADR number
  - updates `DECISIONS.md` (ADR Index + ledger if present)

### What it does NOT do

- It does NOT modify ARCHITECTURE.md
- It does NOT modify contracts
- It does NOT merge content automatically
- It does NOT guess placement

This is intentional.

---

## Step 4 — Review the Result

After the command:

Check:
- `vault/system/maintenance.md` → confirm Draft Import entry
- `vault/architecture/decisions/` → confirm ADR created (if required)
- `vault/architecture/DECISIONS.md` → confirm ADR index updated

If the command reports **WARN**:
- The draft was already processed
- No duplicate ADRs were created

This is safe and expected behavior.

---

## Step 5 — Manual Merge (Human Judgment)

Now (and only now) you merge content.

Use this routing:

- **ARCHITECTURE** → merge into matching section of `ARCHITECTURE.md`
- **ADR** → refine the generated ADR (keep it short)
- **CONTRACT** → convert prose into MUST/SHOULD bullets
- **EXPLAINER** → add to `vault/explainers/` and link back to architecture + ADR

### 5‑Minute Merge Checklist

Before merging:
- Destination is correct
- Structure matches the destination file
- Links added (architecture ↔ ADR ↔ explainer)
- Interfaces/endpoints aligned with contracts
- Contract changes have an ADR

---

## Step 6 — Close the Loop

After merging:

- Add a devlog entry (Tool 3):
  - “Imported architecture draft → merged into X”
- If it advanced work, update:
  - `progress.md`
- Run:
  - `npm run atlas:contract-check`
  - (optionally) `npm run atlas:weekly`

This keeps the system coherent.

---

## Common Mistakes (Avoid These)

- ❌ Pasting ChatGPT output directly into ARCHITECTURE.md
- ❌ Skipping the header block
- ❌ Letting drafts linger unprocessed in inbox
- ❌ Auto‑merging decisions without ADRs

Inbox exists to protect you from these.

---

## Golden Rule

> **ChatGPT proposes. Atlas decides.**

If you follow this workflow, your architecture stays:
- clean
- auditable
- self‑maintaining
- and future‑proof

---

## When to Use This Workflow

Use it whenever you:
- design new architecture
- rethink interfaces
- explore alternatives
- document system behavior

If it matters later, it goes through the inbox.

