# AGENTS.md

Centralised AI agent instructions. Add coding guidelines, style guides, and project context here.

Ruler concatenates all .md files in this directory (and subdirectories), starting with AGENTS.md (if present), then remaining files in sorted order.

## Purpose

This repository defines a host-agnostic workflow pack for daily engineering tasks. Agents working here should preserve determinism, safety gates, and structured outputs across all host surfaces (CLI, MCP, Gemini CLI, LM Studio).

## Product Goals (from PRD)

- Ship a repeatable, distributable workflow pack with one source of truth.
- Expose identical workflows across CLI, MCP tools, Gemini CLI commands, and LM Studio tools.
- Enforce safety gates (approval before side effects).
- Produce stable, machine-readable artifacts for CI and automation.

## Expected Repo Layout

```
workflow-pack/
├── packages/
│   ├── foundation/
│   │   ├── errors/
│   │   ├── logging/
│   │   ├── types/
│   │   └── config/
│   ├── workflow/
│   │   ├── spec/
│   │   ├── registry/
│   │   └── manifest/
│   ├── runner/
│   │   ├── context/
│   │   ├── steps/
│   │   └── formatting/
│   ├── integrations/
│   │   ├── git/
│   │   ├── github-gh/
│   │   ├── test-runner/
│   │   └── linter/
│   ├── workflows/
│   │   ├── pr-review/
│   │   ├── precommit-risk/
│   │   ├── lint-sweep/
│   │   ├── test-triage/
│   │   ├── daily-changelog/
│   │   └── docs-refresh/
│   └── adapters/
│       ├── cli/
│       ├── mcp-server/
│       ├── gemini-extension/
│       └── lmstudio-plugin/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## Architecture Invariants

- Host-agnostic workflow spec is the single source of truth.
- Deterministic outputs: stable JSON shapes and canonical headings.
- Safety gates are explicit and auditable; CI requires pre-satisfied gates.
- Steps are typed (`shell`, `ai`, `gate`) and enforce IO contracts.
- Redaction is centralized; never log secrets or raw env.

## Core Models (summary)

- `Workflow`: `{ id, name, version, description, params[], steps[], outputs[] }`
- `Step`: `{ type: "shell" | "ai" | "gate", ... }`
- `RunResult`: `{ runId, workflowId, status, startedAt, finishedAt, steps[], artifacts[], warnings[] }`
- `Prereq`: `{ kind: "binary" | "env" | "auth", name, checkCommand, fixHint }`

## Execution Rules

- Top-to-bottom step execution; stop on failure with partial artifacts preserved.
- No implicit retries unless a workflow explicitly declares them.
- Shell steps must normalize newlines and cap output sizes.
- AI steps must validate required headings or schema before passing.

## Workflow Catalog (MVP)

- `pr-review`: fetch PR metadata/diff, analyze risk, produce structured review, optional `gh` submit.
- `precommit-risk`: analyze staged diff; output ALLOW/BLOCK + findings; hook-friendly exit code.
- `lint-sweep`: lint, minimal fixes, re-run; summarize remaining issues.
- `test-triage`: run tests, cluster failures, propose fix order, optional minimal patch summary.
- `daily-changelog`: summarize recent commits and append to `changelog.md`.
- `docs-refresh`: add/normalize docstrings without behavior changes.

## Integration Expectations

- `git` and `gh` integrations must detect missing binaries and emit `PrereqMissingError` with fix hints.
- Linter/test integrations must capture logs and normalize signatures.
- CI mode must be non-interactive and deterministic.

## Prompt Design Guidance (AI steps)

Use structured, contract-first prompts. Each AI step should:

- Declare required sections and output format up front.
- Include only the declared context bindings.
- Add a verification clause that re-checks headings or schema.

Template skeleton:

```
SYSTEM: You are a precise engineering assistant. Produce deterministic, structured output.
TASK: <short instruction with explicit scope>
CONTEXT:
- <bound inputs, no secrets>
OUTPUT FORMAT:
- <fixed headings or JSON schema>
VERIFY:
- Ensure all required sections are present; if missing, return a structured error.
```

## Testing Expectations

- Target pyramid: 70% unit, 25% integration, 5% E2E.
- Coverage minimums: line 85%, branch 75%, function 85%, statement 85%.
- CLI E2E tests must assert JSON artifacts and exit codes.

## Working Agreements

- Preserve determinism and schema compatibility when refactoring.
- Update tests and docs for any public contract change.
- Avoid host-specific logic in workflow definitions; keep it in adapters.
