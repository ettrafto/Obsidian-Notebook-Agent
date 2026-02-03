# Command Spec: prompt

## Command: prompt: <intent>
- Maps intent to an approved prompt template in `vault/system/cursor-prompts/`
- Fills in:
  - task ID (if supplied)
  - affected files (if known)
- Outputs a ready-to-paste Cursor prompt

## Intent Map
- implement-feature -> `implement-feature.md`
- add-docs -> `add-docs.md`
- refactor -> `refactor-no-behavior-change.md`
- fix-bug -> `fix-bug.md`
