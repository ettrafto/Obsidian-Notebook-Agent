# Docker Networking

## What this is in our system
- A planned deployment model if Atlas services are containerized
- Describes how agent and supporting services would communicate
- Anchors future networking decisions to our contracts

## Why it exists
- Avoid ad-hoc networking decisions as services grow
- Keep service-to-service routing deterministic
- Support volume mapping for the vault and logs

## How it works (current)
- Planned: services share a Docker network for name-based discovery
- Planned: agent exposes HTTP port within the network
- Planned: vault is mounted as a volume at `/vault`

## Interfaces & Files
- `vault/architecture/ARCHITECTURE.md`
- `vault/contracts/VAULT_CONTRACT.md`
- `vault/contracts/API_CONTRACT.md`
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`

## Common failures
- Agent cannot reach host → missing host mapping → Add proper network route
- Service not found → wrong container name → Fix service name in config
- Writes not persisted → missing volume mount → Mount `/vault`
- Unexpected isolation → wrong network → Attach services to the same network

## Decisions
- `vault/architecture/decisions/ADR-0001-initial-architecture-decisions.md`
- `vault/architecture/DECISIONS.md`

## TODO
- Confirm whether Docker is required for current environment (TODO)
