# Pre-commit Risk Gate

## Purpose

Blocks risky changes before commit by reviewing the staged diff.

## Script

- Entry: `pack/scripts/pre-commit.ts`
- Template: `pack/workflows/pre-commit-review.md`

## Inputs

- Staged diff from `git diff --cached`

## Behavior

1) Load staged diff
2) Render prompt from template with `{{diff}}`
3) Run `cline` headless
4) Parse verdict (ALLOW/BLOCK/PASS/FAIL)
5) Write artifact under `.clinerules/artifacts/pre-commit/`
6) Exit `1` on BLOCK/FAIL, `0` otherwise

## Usage

```bash
git add -A
npx tsx pack/scripts/pre-commit.ts
```

## Artifacts

- `.clinerules/artifacts/pre-commit/<timestamp>.md`
