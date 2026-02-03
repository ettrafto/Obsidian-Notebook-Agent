# Atlas Maintenance Runner Scripts

Deterministic Node scripts that maintain Atlas planning and maintenance logs.
No AI, no network, no shell commands.

## Scripts
- `status.js` — regenerates `vault/planning/now.md`
- `contract-check.js` — appends to `vault/system/maintenance.md`
- `weekly-maintenance.js` — appends to `vault/system/weekly-report.md` and `vault/system/maintenance.md`
- `import/validate-draft.js` — validates draft headers in `vault/inbox/`
- `import/import-arch.js` — processes drafts and scaffolds ADRs

## Usage
From repo root:
```sh
npm run atlas:status
npm run atlas:contract-check
npm run atlas:weekly
npm run atlas:validate-draft -- vault/inbox/ARCH-DRAFT-YYYY-MM-DD-slug.md
npm run atlas:import-arch -- vault/inbox/ARCH-DRAFT-YYYY-MM-DD-slug.md
```

## Manual Verification Checklist
1) Run `npm run atlas:status` → confirm `now.md` overwritten and valid headings.
2) Run `npm run atlas:contract-check` → confirm `maintenance.md` appended.
3) Run `npm run atlas:weekly` → confirm `weekly-report.md` appended + `maintenance.md` appended.
4) Run `npm run atlas:validate-draft -- <path-to-draft>` → confirm PASS/FAIL output.
5) Run `npm run atlas:import-arch -- <path-to-draft>` → confirm ADR scaffolding and maintenance log entry.
6) Confirm no other files were modified.
