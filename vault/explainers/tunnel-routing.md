# Tunnel Routing

## What this is in our system
- A planned external access path into the Atlas Agent
- Represents the “Tunnel” component in `vault/architecture/ARCHITECTURE.md`
- Enables future remote access without changing vault structure

## Why it exists
- Keep the system local-first now while reserving a path for remote access
- Separate external routing from internal agent behavior
- Aligns with the decision to avoid secrets handling for now

## How it works (current)
- Planned: external request enters a tunnel service
- Planned: tunnel routes to the agent service and its HTTP API
- Planned: agent reads/writes the vault under `/vault`

## Interfaces & Files
- `vault/architecture/ARCHITECTURE.md`
- `vault/contracts/API_CONTRACT.md`
- `vault/contracts/VAULT_CONTRACT.md`
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`

## Common failures
- Request fails → DNS not pointing to tunnel → Fix DNS entry
- 404 from tunnel → service name mismatch → Update tunnel target
- Connection refused → wrong port mapping → Fix port config
- No response → tunnel not running → Start/restart tunnel service

## Decisions
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`
- `vault/architecture/DECISIONS.md`

## TODO
- Decide tunnel provider and config location (TODO)
