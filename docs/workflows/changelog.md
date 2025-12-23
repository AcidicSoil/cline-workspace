# Changelog Generation

## Purpose

Summarizes recent commits into `CHANGELOG.md`.

## Script

- Entry: `pack/scripts/generate-changelog.ts`
- Template: `pack/workflows/changelog.md`

## Inputs

- Commit count (CLI arg, default `20`)

## Behavior

1) Read last N commits via `git log`
2) Render prompt from template with `{{commits}}`
3) Run `cline` headless
4) Append summary to `CHANGELOG.md`

## Usage

```bash
npx tsx pack/scripts/generate-changelog.ts
npx tsx pack/scripts/generate-changelog.ts 50
```

## Outputs

- `CHANGELOG.md` (appended)
