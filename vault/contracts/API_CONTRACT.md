# API Contract

## Purpose
Provide a deterministic, auditable interface for reading vault facts.

## Endpoint Standards
- All endpoints MUST be read-only unless explicitly stated.
- Responses MUST include citations if answering from vault text:
  - path, anchor, short exact quote
- Error format: `{ "detail": "<message>" }`

## Endpoints
| Endpoint | Method | Read/Write | Request JSON | Response JSON | Notes |
|---|---|---:|---|---|---|
| `/query` | POST | Read | `{ "question": "..." }` | `{ "answer": "...", "citations": [...] }` | Tool 1 |
| `/status` | POST | Read | `{}` | `{ "ok": true, "generated": "planning/now.md" }` | Planned (Tool 2) |
| `/find` | POST | Read | `{ "query": "...", "scope": "..." }` | `{ "answer": "...", "citations": [...] }` | Planned (Tool 9) |

## Citation Format (mandatory)
{
  "path": "...",
  "anchor": "#...",
  "quote": "..."
}

## Determinism Rules
- Prefer heading-based lookups over guessing
- If not found: return "Not found" + closest headings
# API Contract

## Purpose
Provide a deterministic, auditable interface for reading vault facts.

## Endpoint Standards
- All endpoints MUST be read-only unless explicitly stated.
- Responses MUST include citations if answering from vault text:
  - path, anchor, short exact quote
- Error format: `{ "detail": "<message>" }`

## Endpoints
| Endpoint | Method | Read/Write | Request JSON | Response JSON | Notes |
|---|---|---:|---|---|---|
| `/query` | POST | Read | `{ "question": "..." }` | `{ "answer": "...", "citations": [...] }` | Tool 1 |
| `/status` | POST | Read | `{}` | `{ "ok": true, "generated": "planning/now.md" }` | Planned (Tool 2) |
| `/find` | POST | Read | `{ "query": "...", "scope": "..." }` | `{ "answer": "...", "citations": [...] }` | Planned (Tool 9) |

## Citation Format (mandatory)
{
  "path": "...",
  "anchor": "#...",
  "quote": "..."
}

## Determinism Rules
- Prefer heading-based lookups over guessing
- If not found: return "Not found" + closest headings
