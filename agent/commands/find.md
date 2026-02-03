# Command Spec: find

## Command: find: <term>
- Inputs searched:
  - `vault/` (all `.md` files)
  - `agent/` (if present)
  - `docker-compose.yml` (if present)
  - root-level `*.yml`, `*.yaml`, `*.json` (optional)
- Output:
  - Writes `vault/system/search-notes.md`

## Search Rules (deterministic)
1) Filename match (case-insensitive) — highest priority
2) Heading match (`#`, `##`, `###`) — next priority
3) Plain text substring match — next priority
4) Return top 10 matches

## Result Fields
- path
- nearest heading (scan upward for last heading above match)
- excerpt: 1–3 lines around match

## Output Behavior
- Overwrite `vault/system/search-notes.md` on each search.
- If no results: report “No matches found” and list closest headings (if available).

## API Endpoint (if available)
POST `/find`
Request:
```
{ "term": "..." }
```
Response:
```
{
  "term": "...",
  "results": [
    { "path": "...", "anchor": "#...", "quote": "..." }
  ]
}
```
