# ADR-0001 — Initial Architecture Decisions

## Context
- We need a minimal but durable vault structure that supports agent and human workflows.
- Constraints include plain Markdown, deterministic parsing, and no secrets handling.

## Decision
- Establish a minimal, contract-driven vault with markdown-first planning, tasks, and decision logs.

## Alternatives Considered
- External task manager — plausible for reminders but breaks single-source-of-truth.
- Remote-first service — plausible for access but adds early complexity and risk.

## Tradeoffs
- Pros
  - Lower cognitive load with a small, consistent structure
  - Easy auditability with citations and logs
- Cons
  - Some manual overhead for hygiene and tagging
  - Requires discipline to keep logs current

## Consequences
- Easier: deterministic agent behavior, searchable history, safe review loop.
- Harder: maintaining discipline around logging and tags.

## Follow-ups
- [ ] (P2-002) Add drift detection workflow (Tool 8 spec)
- [ ] (P2-001) Add weekly maintenance command automation

## References
- `vault/planning/now.md`
- `vault/architecture/ARCHITECTURE.md`
- `vault/architecture/DECISIONS.md`
