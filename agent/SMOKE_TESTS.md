# Smoke Tests

```sh
curl -s http://localhost:8000/health
# Expected: {"ok":true,"vault":"/vault"}
```

```sh
curl -s -X POST http://localhost:8000/command -H "Content-Type: application/json" -d "{\"text\":\"capture: buy milk\"}"
# Expected: {"ok":true,"captured_to":"inbox/inbox.md"}
```

```sh
curl -s -X POST http://localhost:8000/command -H "Content-Type: application/json" -d "{\"text\":\"weekly maintenance\"}"
# Expected: {"ok":true,"logged_to":"system/agent-runs.md"}
```
