# CI PR Review Workflow

## Purpose

Runs an AI-assisted PR review in CI and fails the job on a FAIL/BLOCK verdict.

## Script

- Entry: `pack/scripts/ci-review.ts`
- Template: `pack/workflows/ci-pr-review.md`

## Inputs

- `GITHUB_BASE_REF` (default `main`)
- `GITHUB_HEAD_REF` (default `HEAD`)
- `GITHUB_ACTIONS` (if set, hydrates git history)

## Behavior

1) Compute diff: `origin/<base>.. <head>`
2) Render prompt from template with `{{diff}}`
3) Run `cline` headless
4) Parse verdict (PASS/FAIL/ALLOW/BLOCK)
5) Write artifact under `.clinerules/artifacts/ci-review/`
6) Exit `1` on FAIL/BLOCK, `0` otherwise

## Usage

```bash
# GitHub Actions
npx tsx pack/scripts/ci-review.ts

# Local
GITHUB_BASE_REF=main GITHUB_HEAD_REF=HEAD npx tsx pack/scripts/ci-review.ts
```

## Artifacts

- `.clinerules/artifacts/ci-review/<timestamp>.md`
