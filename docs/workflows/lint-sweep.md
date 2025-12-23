# Lint Sweep & Auto-fix

## Purpose

Runs a lint command and attempts AI-guided fixes up to 3 times.

## Script

- Entry: `pack/scripts/lint-sweep.ts`
- Template: `pack/workflows/lint-fix.md`

## Inputs

- Lint command string (CLI arg, default `npm run lint`)

## Behavior

1) Run lint command
2) Parse first file path from lint output
3) Render prompt with error log + file contents
4) Run `cline` headless
5) Apply SEARCH/REPLACE patches
6) Retry up to 3 attempts

## Usage

```bash
npx tsx pack/scripts/lint-sweep.ts
npx tsx pack/scripts/lint-sweep.ts "npm run lint -- --fix"
```

## Outputs

- Modified source files as suggested by AI
