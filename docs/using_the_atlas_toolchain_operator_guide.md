# Atlas Toolchain — Operator Guide

This document explains **how to use the Atlas vault toolchain day-to-day**, how the tools relate to each other, and the correct order of operations. Treat this as the human-facing manual for the system.

---

## Mental Model (Read This First)

Atlas separates *thinking* from *doing*:

- **Architecture & Contracts** define what is allowed
- **Planning** defines what you intend to do
- **Execution logs** record what actually happened
- **Explainers & ADRs** preserve understanding
- **Maintenance & Search** prevent drift and confusion

If something feels unclear, you are almost always missing **one of these artifacts**, not more code.

---

## Tool Overview (What Each Tool Is For)

| Tool | Purpose | When You Touch It |
|---|---|---|
| Tool 1 — Architecture Map | What exists, how it connects | When structure changes |
| Tool 2 — Master Plan / Now | Where you are + what’s next | Every day |
| Tool 3 — Implementation Journal | What actually changed | After meaningful work |
| Tool 4 — Contracts | What is allowed | Rarely (guardrails) |
| Tool 5 — ADRs | Why decisions were made | When choosing between options |
| Tool 6 — Task System | Agent-readable tasks | When adding or finishing work |
| Tool 7 — Explainers | Learnable system docs | When confused / onboarding |
| Tool 8 — Weekly Maintenance | Catch drift & entropy | Weekly |
| Tool 9 — Find / Index | “Where is X?” | Constantly |
| Tool 10 — Cursor Bridge | Safe AI usage | Before Cursor runs |

---

## Daily Workflow (The Happy Path)

### 1. Start Your Day

Open:
- `vault/planning/now.md`

This file answers:
- What am I doing *today*?
- What should I not think about yet?

If it feels wrong → run **status** (Tool 2) before doing anything else.

---

### 2. Do Work

- Work on **one task ID at a time**
- Use **Cursor only through Tool 10 prompt templates**
- Stay inside the scope defined by the task

If you realize the task is unclear:
- Stop
- Create or update an **ADR** (Tool 5)

---

### 3. Record What Happened

After meaningful progress:

- Add an entry to the current `vault/devlog/YYYY-MM.md`
- Include:
  - What changed
  - Why
  - Files touched
  - Next step

This is not optional — this is how Future You stays sane.

---

### 4. Advance the Task

When a task is complete:

- Mark it complete in `masterplan.md`
- Log completion in `progress.md`
- Regenerate `now.md` via **advance <task-id>** (or manually if needed)

Never complete tasks silently.

---

## Weekly Workflow (Non-Negotiable)

Once per week (or before major merges):

- Run **weekly maintenance** (Tool 8)
- Read the report top-to-bottom
- Fix issues in this order:
  1. Contract violations
  2. Architecture drift
  3. Stale tasks
  4. Orphan notes

If you skip this, entropy *will* win.

---

## When to Create an ADR (Tool 5)

Create an ADR when:
- You choose between two reasonable approaches
- You change contracts
- You introduce a new architectural seam
- You say "we’ll live with this tradeoff"

Do **not** create ADRs for trivial refactors.

---

## How Explainers Are Used (Tool 7)

Explainers are for:
- Re-entry after time away
- Teaching the system to yourself
- Giving the agent grounded context

If you ask yourself:
> “Wait… how does this work again?”

You should write or update an explainer.

---

## Using Search Correctly (Tool 9)

Use **find:** when:
- You don’t remember where something lives
- You want citations, not guesses

Trust search over memory.

If search fails:
- The documentation is incomplete
- Fix the docs, not the search

---

## Cursor Rules (Tool 10, Read Carefully)

Cursor is a **power tool**, not a collaborator.

Always:
- Start from a canonical prompt template
- Specify task IDs
- Specify files in scope
- Demand acceptance criteria
- Require rollback steps

If Cursor surprises you:
- Roll back
- Tighten the prompt
- Try again

Never let Cursor improvise architecture.

---

## Failure Modes & How to Recover

### “I feel lost”
- Open `now.md`
- Run `find:` for the concept
- Read the explainer or architecture section

### “This feels messy”
- Run weekly maintenance
- Look for drift warnings

### “Why did I do this?”
- Check ADRs
- Check devlog

### “The agent guessed wrong”
- Strengthen contracts or explainers
- Add structure, not prompts

---

## Golden Rule

> If it isn’t written down, it didn’t happen.

Atlas exists to make that rule painless.

---

## Next Step

Once you are comfortable with this guide:
- Generate your **first gold-standard Cursor prompt**
- Run a full dry-run of the workflow end-to-end

When you’re ready, say:
**“Generate the gold standard Cursor prompt.”**