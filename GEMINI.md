# GEMINI.md

## Purpose

This file defines how the workflow pack should be exposed to Gemini CLI as custom commands. It documents naming, parameters, and output expectations so Gemini integrations remain deterministic and compatible with CI.

## Gemini CLI Extension Requirements

- Generate `gemini-extension.json` from the pack manifest and workflow registry.
- Each workflow becomes a `customCommand` with deterministic naming.
- Optionally declare `mcpServers` when workflows run through the MCP adapter.
- Use `contextFiles` for repo-local hints such as `.clinerules/workflows/` when present.

## Command Naming Convention

Use a stable prefix and the workflow id:

- `wp.pr-review`
- `wp.precommit-risk`
- `wp.lint-sweep`
- `wp.test-triage`
- `wp.daily-changelog`
- `wp.docs-refresh`

## Command Contract

Each custom command must:

- Accept the same params as the underlying workflow spec.
- Support `--format text|json` (default: `text`).
- Produce a JSON artifact file when `--format json` is selected.
- Exit non-zero on `BLOCK` or failure (CI-friendly).

## Output Format (canonical)

All AI outputs must use consistent headings for easy parsing:

- MUST FIX
- SHOULD FIX
- NITS
- QUESTIONS
- WARNINGS
- SUMMARY

When JSON is selected, emit a stable schema matching `RunResult` with:

- `runId`, `workflowId`, `status`, `startedAt`, `finishedAt`
- `steps[]` with `type`, `status`, `outputs`
- `artifacts[]` (paths, mime)
- `warnings[]`

## Prompt Pattern (AI steps)

Use structured prompts to reduce variance and enforce validation.

```
SYSTEM: You are a precise engineering assistant. Output deterministic, structured results.
TASK: <single-sentence instruction scoped to the workflow>
CONTEXT:
- <diff/logs/metadata bound here>
OUTPUT FORMAT:
- <required headings or JSON schema>
VERIFY:
- If required sections are missing, return a structured error instead of partial output.
```

## Recommended Gemini Extension Fields

- `name`: "workflow-pack"
- `version`: from pack manifest
- `customCommands`: generated from registry
- `mcpServers`: optional, when using MCP adapter
- `contextFiles`: include `.clinerules/workflows/` if present

## Example Custom Command (conceptual)

```
name: wp.pr-review
description: Run PR review workflow and produce structured feedback
command: workflow-pack run pr-review --pr {pr} --format {format}
parameters:
  - name: pr
    description: PR number or URL
    required: true
  - name: format
    description: text or json
    required: false
```

## Safety Gates

- Commands that submit reviews must require an explicit `action` param.
- Non-interactive mode must fail if a gate is not pre-satisfied.
- Always record gate choice in the run artifacts.
