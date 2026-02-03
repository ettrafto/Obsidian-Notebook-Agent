# Atlas Maintenance Runner Scripts

Deterministic Node scripts that maintain Atlas planning and maintenance logs.
No AI, no network, no shell commands.

## Scripts
- `status.js` — regenerates `vault/planning/now.md`
- `contract-check.js` — appends to `vault/system/maintenance.md`
- `weekly-maintenance.js` — appends to `vault/system/weekly-report.md` and `vault/system/maintenance.md`

## Usage
From repo root:
```sh
npm run atlas:status
npm run atlas:contract-check
npm run atlas:weekly
```

## Manual Verification Checklist
1) Run `npm run atlas:status` → confirm `now.md` overwritten and valid headings.
2) Run `npm run atlas:contract-check` → confirm `maintenance.md` appended.
3) Run `npm run atlas:weekly` → confirm `weekly-report.md` appended + `maintenance.md` appended.
4) Confirm no other files were modified.
