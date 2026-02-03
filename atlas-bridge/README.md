# Atlas Bridge (Read-Only)

Local read-only HTTP interface for the Atlas vault. Deterministic lookups only. No AI reasoning.

## Install
```sh
cd atlas-bridge
npm install
```

## Run
```sh
ATLAS_VAULT_ROOT="/absolute/path/to/repo-root" \
ATLAS_PORT=3737 \
ATLAS_MAX_BYTES=250000 \
ATLAS_MAX_RESULTS=10 \
node server.js
```

## Endpoints

### GET /health
```sh
curl -s http://localhost:3737/health
```

### POST /context/current
```sh
curl -s -X POST http://localhost:3737/context/current \
  -H "Content-Type: application/json" \
  -d '{ "include": ["vault/explainers/git-branching.md"], "max_sources": 10 }'
```

### POST /find
```sh
curl -s -X POST http://localhost:3737/find \
  -H "Content-Type: application/json" \
  -d '{ "term": "capture", "max_results": 10 }'
```

### POST /query
```sh
curl -s -X POST http://localhost:3737/query \
  -H "Content-Type: application/json" \
  -d '{ "question": "Where is capture defined?" }'
```

## Files Read/Written
Reads:
- `vault/**.md` (for context and search)
- `agent/**.md` (search scope)
- root `docker-compose.yml`, `*.yml`, `*.yaml`, `*.json` (search scope)

Writes:
- `vault/system/search-notes.md` (overwritten on each `/find`)

No other vault writes.

## Safety Notes
- Read-only behavior enforced; only `/find` writes search output.
- Path traversal guarded: all reads are constrained to the repo root and `vault/`.
- File size caps enforced via `ATLAS_MAX_BYTES`.

## Manual Verification Checklist
If you cannot run commands here, verify locally:
1) Start the server with a valid `ATLAS_VAULT_ROOT`.
2) `GET /health` returns `{ "ok": true, "version": "0.1.0" }`.
3) `POST /context/current` returns `sources` including `vault/planning/now.md`.
4) `POST /find` creates/overwrites `vault/system/search-notes.md`.
5) `POST /query` returns citations for allowed intents.
