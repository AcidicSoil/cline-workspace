# Custom Cline + Cline CLI Workflows for Daily Software Engineering

## Scope and primitives

### What Cline CLI is for

Cline CLI runs coding agents in the terminal for scripting, CI/CD, and parallelized work across multiple instances. It supports piping data in/out and multiple output formats. ([Cline][1])

Cline CLI is currently a preview release for macOS/Linux (Windows support not yet available per docs). ([Cline][1])

### Three core CLI flows (daily usage)

1. **Interactive (Plan → Act)**

   * Start: `cline`
   * Execute after planning: `/act` ([Cline][2])

2. **Headless single-shot (automation / CI)**

   * Start an instance: `cline instance new --default`
   * Run a task autonomously: `cline task new -y "…"`
   * Monitor: `cline task view --follow` ([Cline][2])

3. **Multi-instance parallelization**

   * Spawn instances: `cline instance new` (and optionally `--default`)
   * Run tasks against the default instance, or target others via `cline task -a|--address ADDR …` (from CLI reference) ([Cline][3])

### “Instant task” mode (fastest terminal entrypoint)

* `cline "prompt here"` = spawn instance + create task + enter chat mode in one command. ([Cline][3])
* Useful flags:

  * `-y` fully autonomous mode (disables interactive question tools and auto-completes). ([Cline][3])
  * `-F json` JSON client-message output for scripts (or `--output-format json`). ([Cline][3])

### Workflows (IDE/editor automation)

Workflows are Markdown files invoked via `/workflow-name.md` in the Cline chat UI. They can live per-project in `.clinerules/workflows/` or globally under:

* macOS/Linux: `~/Documents/Cline/Workflows/`
* Windows: `C:\Users\USERNAME\Documents\Cline\Workflows\` ([Cline][4])

Workflow authoring does not require explicit tool-call blocks; high-level instructions are sufficient. ([Cline][4])

---

## Recommended repo layout

```text
repo/
  .clinerules/
    workflows/
      pr-review.md
      test-triage.md
      lint-sweep.md
      deps-bump-and-test.md
      release-cut.md
      bug-triage-and-fix.md
      docs-refresh.md
      daily-changelog.md
```

---

## Workflow catalog (daily engineering)

Each entry includes:

* **Purpose**
* **Prereqs**
* **Invocation**
* **Workflow file content** (ready to drop into `.clinerules/workflows/`)

---

## 1) Pull Request Review (gh-based)

### Purpose

Fetch PR metadata + diff, analyze changes, draft review text, then run the correct `gh pr review …` action.

### Prereqs

* `gh` installed + authenticated.

### Invocation (IDE)

`/pr-review.md 123` ([Cline][5])

````md
<!-- path: .clinerules/workflows/pr-review.md -->

# Pull Request Reviewer

Review a GitHub PR end-to-end: fetch context, analyze diff, draft feedback, and execute the chosen review action.

## Inputs
- PR number is provided as the first argument after the workflow name.

## 1. Gather PR information
Run:
```bash
gh pr view PR_NUMBER --json title,body,files
````

## 2. Examine the diff

Run:

```bash
gh pr diff PR_NUMBER
```

## 3. Analyze changes

Analyze for:

* Bugs (logic, edge cases, error handling)
* Performance (hot paths, unnecessary work, allocations)
* Security (injection vectors, authz/authn mistakes, unsafe deserialization)
* Maintainability (naming, structure, tests, coupling)

## 4. Present assessment and require an explicit decision

Output:

* A concise risk summary (low/med/high)
* A bullet list of actionable issues (if any)
* A suggested review action: Approve / Request changes / Comment / Do nothing

Then ask for the final decision and the exact review body to submit.

## 5. Execute the selected action

If Approve:

```bash
gh pr review PR_NUMBER --approve --body "REVIEW_BODY"
```

If Request changes:

```bash
gh pr review PR_NUMBER --request-changes --body "REVIEW_BODY"
```

If Comment:

```bash
gh pr review PR_NUMBER --comment --body "REVIEW_BODY"
```

````

---

## 2) Test Runner + Failure Triage (one workflow, deterministic output)

### Purpose
Run the project’s test suite, summarize failures, cluster by root cause hypothesis, and output a fix plan.

### Prereqs
- Project test command exists (adjust to your stack).

### Invocation (IDE)
`/test-triage.md`

```md
<!-- path: .clinerules/workflows/test-triage.md -->

# Test Runner + Failure Triage

Run tests, summarize failures, and produce a fix plan.

## 1. Run tests
Use the project-standard command. If unknown, infer from package files, then run the best match:
- JS/TS: `npm test` or `pnpm test` or `yarn test`
- Python: `pytest -q`
- Go: `go test ./...`
- Rust: `cargo test`

## 2. Parse and summarize output
Produce:
- Total failing tests count
- Failure table: test name → file → error snippet → likely category

## 3. Cluster failures
Cluster by:
- Single shared dependency/config issue
- Flaky/time-based
- Environment-specific
- Legit regression in one module

## 4. Decide the shortest verification loop
Pick the minimal command to re-run only the failing set.

## 5. Output fix plan
- Ordered steps
- Files to inspect
- Expected changes
- Expected passing signal
````

---

## 3) Lint Sweep + Auto-Fix (safe-by-default)

### Purpose

Run linters/formatters, apply auto-fixes, rerun, then stage changes (optional), and output a report.

### Prereqs

* Lint/format commands exist.

### Invocation (IDE)

`/lint-sweep.md`

```md
<!-- path: .clinerules/workflows/lint-sweep.md -->

# Lint Sweep + Auto-Fix

Run lint/format, auto-fix, verify, and report.

## 1. Detect stack and commands
Infer from repo files:
- JS/TS: eslint, prettier, biome
- Python: ruff, black
- Go: gofmt, golangci-lint
- Rust: rustfmt, clippy

## 2. Run formatters first
Run the formatter command(s). Prefer idempotent formatting.

## 3. Run linters with auto-fix if available
Run lint with fix flags when supported.

## 4. Re-run linters in strict mode
Verify clean output.

## 5. Produce report
Output:
- Commands executed
- Files changed count
- Remaining issues (if any) with exact command to reproduce
```

---

## 4) Dependency Upgrade + Regression Test (bounded change)

### Purpose

Update dependencies within constraints, update lockfiles, run tests, and output a rollback-safe summary.

### Prereqs

* Dependency tooling present (`npm/pnpm/yarn`, `pip/uv`, `cargo`, `go` modules, etc.)

### Invocation (IDE)

`/deps-bump-and-test.md`

```md
<!-- path: .clinerules/workflows/deps-bump-and-test.md -->

# Dependency Upgrade + Regression Test

Upgrade dependencies in a bounded manner, run tests, and output a change log.

## 1. Establish constraints
- Prefer patch/minor upgrades unless explicitly required.
- Avoid major upgrades unless they fix a known issue.

## 2. Update deps + lockfiles
Use stack-appropriate command(s).

## 3. Run tests
Run full suite. If it’s too slow, run unit tests + the most critical integration smoke.

## 4. Summarize changes
Output:
- Upgraded packages (name, from, to)
- Lockfile changes present (yes/no)
- Test results
- Potential breaking changes detected from changelogs (if available locally)
```

---

## 5) Release Cut (version bump → changelog → tag/push)

### Purpose

Perform a consistent release process encoded as executable procedure.

### Invocation (IDE)

`/release-cut.md`

````md
<!-- path: .clinerules/workflows/release-cut.md -->

# Release Cut

Prepare a release in a consistent, repeatable way.

## 1. Confirm current branch and clean working tree
Run:
```bash
git status
````

## 2. Run tests

Use project standard test command.

## 3. Version bump

Update version file(s) appropriate to the stack:

* `package.json`
* `pyproject.toml`
* `Cargo.toml`
* etc.

## 4. Update CHANGELOG.md

Add a new section for the version/date and summarize notable commits since last tag.

## 5. Commit, tag, push

Run:

```bash
git add -A
git commit -m "vVERSION"
git tag "vVERSION"
git push origin HEAD --tags
```

## 6. Output release summary

* Version
* Commit hash
* Tag
* Key changes

````

---

## 6) Bug Triage → Repro → Fix → Verification (fast loop)

### Purpose
Convert an issue report or error log into a minimal repro, implement fix, verify, and document.

### Invocation (IDE)
`/bug-triage-and-fix.md`

```md
<!-- path: .clinerules/workflows/bug-triage-and-fix.md -->

# Bug Triage and Fix

Turn a bug report into a verified fix with minimal iteration.

## 1. Ingest bug input
Accept any of:
- stack trace
- failing test output
- issue text
- screenshot description

## 2. Locate likely code region
- Search for error strings, function names, file paths.
- Identify entrypoints and call chain.

## 3. Build a minimal repro
Prefer:
- a failing unit test
- or a minimal script/command that triggers it

## 4. Implement the smallest fix
- Change only what’s necessary.
- Add/adjust tests to prevent regression.

## 5. Verify
- Re-run minimal repro.
- Re-run relevant test subset.
- If risk is non-trivial, run full suite.

## 6. Document
- Inline comment only if it prevents future confusion.
- Add changelog entry only if project requires it.
````

---

## 7) Docs Refresh (docstrings / JSDoc / API docs)

### Purpose

Generate/update documentation across the repo and keep it consistent with current code.

### Invocation (CLI headless)

```bash
cline instance new --default
cline task new -y "Add JSDoc comments to all functions in src/"
```

([Cline][2])

### Invocation (IDE workflow)

`/docs-refresh.md`

```md
<!-- path: .clinerules/workflows/docs-refresh.md -->

# Documentation Refresh

Update inline docs and top-level docs for current code state.

## 1. Determine documentation targets
- Inline docs: docstrings/JSDoc
- Top-level: README, ADRs, API docs

## 2. Inline docs pass
- Add missing docs for public functions/modules.
- Normalize style and parameter descriptions.

## 3. Top-level docs pass
- Update README for setup/build/test commands.
- Ensure examples reflect actual CLI/API.

## 4. Verification
- Run doc build if available (e.g., typedoc/sphinx/mdbook).
- Ensure no broken links in docs tree.
```

---

## 8) Daily Changelog (work log from commits)

### Purpose

Generate a daily changelog entry from commits and a brief human summary.

### Invocation (IDE)

`/daily-changelog.md` ([Cline][4])

````md
<!-- path: .clinerules/workflows/daily-changelog.md -->

# Daily Changelog Generator

Create or append a daily changelog entry from recent commits.

## 1. Collect commits since yesterday
Run:
```bash
git log --author="$(git config user.name)" --since="yesterday" --oneline
````

## 2. Summarize into a changelog entry

Produce:

* Date header
* Bullet list of commits grouped by theme (feature/fix/chore)
* One-paragraph narrative summary

## 3. Append to changelog.md

Append the generated entry to `changelog.md`.

````

---

## CLI automation equivalents (cron/CI ready)

### A) Headless lint sweep (single command)
```bash
cline instance new --default
cline task new -y "Run formatter + linter with auto-fix, then rerun linters strictly and report changes."
````

([Cline][2])

### B) Pipe diffs/logs into Cline (script composition)

CLI supports stdin-driven tasks and messages. ([Cline][3])

```bash
git diff --staged | cline task send
```

### C) Machine-readable output for CI annotations

Use JSON output for scripts. ([Cline][3])

```bash
cline -F json "Summarize the risk in this diff and propose review comments." < <(git diff)
```

### D) Hooks enforcement in automated runs

Enable hooks per task or globally. ([Cline][1])

```bash
cline "Analyze this repo quickly" -s hooks_enabled=true
cline config set hooks-enabled=true
```

---

## Command shorthand (CLI reference)

```bash
# Instance management
cline instance new --default     # full
cline i n --default              # shorthand

cline instance list              # full
cline i l                        # shorthand

cline instance kill localhost:50052 --all  # full
cline i k localhost:50052 --all            # shorthand

# Task management
cline task new -y "..."          # full
cline t n -y "..."               # shorthand

cline task chat                  # full
cline t c                        # shorthand

cline task view --follow         # full
cline t v --follow               # shorthand
```

([Cline][3])

[1]: https://docs.cline.bot/cline-cli/overview "Overview - Cline"
[2]: https://docs.cline.bot/cline-cli/three-core-flows "Three Core Flows - Cline"
[3]: https://docs.cline.bot/cline-cli/cli-reference "CLI Reference - Cline"
[4]: https://docs.cline.bot/features/slash-commands/workflows "Workflows Overview - Cline"
[5]: https://docs.cline.bot/features/slash-commands/workflows/quickstart "Workflows Quick Start - Cline"
