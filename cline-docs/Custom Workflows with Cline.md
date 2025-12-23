
Cline CLI Daily Software Engineering Workflow Pack
==================================================

Scope
-----

This report defines practical, repeatable daily workflows implemented with Cline CLI primitives (tasks, instances, headless execution) plus optional Cline “workflow files” (Markdown procedures invoked by slash command) for cases where an in-editor, step-by-step runbook is the right fit. Cline CLI runs AI coding agents in your terminal, supports piping git diffs for automation, tracks instances system-wide, and targets both human and script-friendly outputs. [Cline](https://docs.cline.bot/cline-cli/overview)

* * *

Foundation
----------

### Core terms

* **Task**: one job (example: “add tests to utils.js”). Tasks run on instances. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* **Instance**: an independent Cline workspace; one task at a time; multiple instances enable parallel work without context collisions. [Cline+1](https://docs.cline.bot/cline-cli/three-core-flows)

### Three CLI flows

#### 1) Interactive (Plan → Act)

Used when plan review matters.

    cline
    # inside the interactive session
    /act

`cline` opens an interactive session; Cline proposes a step-by-step plan, then `/act` executes the approved plan. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

#### 2) Headless single-shot (automation / CI / scripts)

Used for one-liners that plan and execute autonomously.

    cline instance new --default
    cline task new -y "Generate unit tests for all Go files"
    cline task view --follow

`-y` enables YOLO-style autonomous execution; monitor with `cline task view` or `--follow`. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

#### 3) Multi-instance parallel agents

Used to split workstreams (frontend/backend/infra) into isolated contexts.

    cline instance new
    cline task new -y "Build React components"

    cline instance new --default
    cline task new -y "Implement API endpoints"

    cline instances list
    cline instances kill -a

Instances can be listed and killed; default instance simplifies targeting. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

### CLI prerequisites (baseline)

* Cline CLI currently in preview and available for **macOS and Linux** (Windows support pending). [Cline](https://docs.cline.bot/cline-cli/overview)

* Authenticate and configure provider using `cline auth`. [Cline](https://docs.cline.bot/cline-cli/overview)

* Providers supported include Anthropic, OpenAI, OpenRouter, AWS Bedrock, Google Gemini, Ollama, and others. [Cline](https://docs.cline.bot/cline-cli/overview)

### Context management rules that keep automation stable

* **User-guided context**: mention files/folders/URLs, add documentation via `.clinerules` or Memory Bank, provide requirements, and answer clarifications. [Cline](https://docs.cline.bot/prompting/understanding-context-management)

* **Focus Chain** (default on): keeps a todo list that preserves task continuity even after compaction. [Cline](https://docs.cline.bot/prompting/understanding-context-management)

* **Auto Compact** (always on): summarizes automatically around ~80% context usage to preserve decisions and code changes. [Cline](https://docs.cline.bot/prompting/understanding-context-management)

### Local provider context window configuration (CLI)

    cline config s ollama-api-options-ctx-num=32768
    cline config s lm-studio-max-tokens=32768

Applies to Ollama and LM Studio; other providers use model metadata limits. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

### Hooks (policy enforcement in automation)

    cline "What does this repo do?" -s hooks_enabled=true
    cline config set hooks-enabled=true

Hooks let you inject validation/enforcement into automated/headless execution. [Cline](https://docs.cline.bot/cline-cli/overview)

* * *

Optional: Cline “Workflow Files” (Markdown procedures)
------------------------------------------------------

Workflow files are Markdown files defining step-by-step procedures invoked via `/filename.md` in Cline chat. [Cline+1](https://docs.cline.bot/features/slash-commands/workflows)

### Storage locations

* Project workflows: `.clinerules/workflows/` [Cline+1](https://docs.cline.bot/features/slash-commands/workflows/quickstart)

* Global workflows:

  * macOS/Linux: `~/Documents/Cline/Workflows/`

  * Windows: `C:\Users\USERNAME\Documents\Cline\Workflows\` [Cline](https://docs.cline.bot/features/slash-commands/workflows)

### Workflow construction rules

* Keep workflows modular and concise; split long runs to avoid exceeding context. [Cline+1](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

* Version control workflow files as part of the repo. [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

* Use MCP tools inside workflows to interact with external systems (GitHub/Slack/databases) when connected. [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

* Use the “workflow for building workflows” pattern: `/create-new-workflow.md` generates a structured workflow file from your description and steps. [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

* * *

Workflow Catalog (Daily Engineering)
------------------------------------

Each workflow includes: purpose, prerequisites, steps, and a concrete implementation (CLI commands and/or a workflow file).

* * *

1) PR Review Automation (Cline Workflow File)
=============================================

Purpose
-------

Automate PR fetching, diff inspection, risk analysis, and review submission via GitHub CLI.

Best flow
---------

Workflow file (in-editor procedure), invoked by slash command.

Prerequisites
-------------

* Cline installed

* `gh` installed and authenticated

* A git repo with a PR to review [Cline](https://docs.cline.bot/features/slash-commands/workflows/quickstart)

Steps (as defined in Cline’s quick start)
-----------------------------------------

1. Fetch PR metadata and changed files

2. Fetch PR diff

3. Analyze for bugs, performance, security

4. Collect approval choice

5. Submit `gh pr review` [Cline](https://docs.cline.bot/features/slash-commands/workflows/quickstart)

Implementation
--------------

    <!-- path: .clinerules/workflows/pr-review.md -->
    # Pull Request Reviewer
    This workflow reviews a pull request by analyzing changes and drafting a review.

    ## 1. Gather PR Information
    Run:
    ```bash
    gh pr view PR_NUMBER --json title,body,files

2\. Examine Modified Files
--------------------------

Run:

    gh pr diff PR_NUMBER

3\. Analyze Changes
-------------------

Analyze for:

* Bugs

* Performance

* Security

4\. Confirm Assessment
----------------------

Use a followup prompt to select: Approve / Request Changes / Comment / Do nothing.

5\. Execute Review
------------------

Run the appropriate `gh pr review` command based on the selection.

    Run it by typing `/pr-review.md 42`. Cline may pause after command output; continuation requires “Proceed While Running” in the UI. :contentReference[oaicite:23]{index=23}

    ---

    # 2) Daily Changelog Generator (Cline Workflow File)

    ## Purpose
    Turn yesterday/today’s commit history into a daily changelog entry.

    ## Best flow
    Workflow file for repeatable reporting.

    ## Prerequisites
    - git repo with commits and author configured :contentReference[oaicite:24]{index=24}

    ## Steps
    1. Collect recent commits by author
    2. Summarize work
    3. Append to `changelog.md` with date header :contentReference[oaicite:25]{index=25}

    ## Implementation

    ```md
    <!-- path: .clinerules/workflows/daily-changelog.md -->
    # Daily Changelog Generator
    This workflow creates a daily changelog entry.

    1. Check recent commits:
    ```bash
    git log --author="$(git config user.name)" --since="yesterday" --oneline

2.  Summarize work:
    Present commits and collect a short summary.

1. Append to changelog.md:
    Append a dated header, commit list, and summary.

    Workflow storage and global directory locations are defined in the Workflows Overview doc. :contentReference[oaicite:26]{index=26}

    ---

    # 3) Pre-Commit AI Risk Review (Cline CLI + git hook)

    ## Purpose

    Block risky commits by running an automated diff review on staged changes.

    ## Best flow

    Headless single-shot invoked by `pre-commit`/`commit-msg`.

    ## Prerequisites

    * Cline CLI authenticated (`cline auth`) :contentReference[oaicite:27]{index=27}
    * git installed
    * Optional: enable hooks for consistent enforcement :contentReference[oaicite:28]{index=28}

    ## Steps

    1. Extract staged diff
    2. Feed diff into a headless Cline task
    3. Parse output and fail commit on “high severity” findings

    ## Implementation

    ```bash
    # path: .git/hooks/pre-commit
    #!/usr/bin/env bash
    set -euo pipefail

    DIFF="$(git diff --cached --unified=3)"

    # Ensure a default instance exists (idempotent pattern)
    cline instance new --default >/dev/null 2>&1 || true

    # Ask Cline to review staged diff for bugs/security/perf and output an allow/block verdict.
    # Store output for audit.
    OUT_FILE=".git/cline-precommit-review.txt"

    printf "%s\n" "$DIFF" | \
      cline task new -y "Review this staged diff for correctness, security, and performance. Output:
    1) Verdict: ALLOW or BLOCK
    2) High-risk findings (bullets)
    3) Minimal fix recommendations
    Diff:\n\n$(cat)" > "$OUT_FILE"

    # Naive block condition. Replace with structured parsing if using JSON output formats.
    if grep -q "Verdict: BLOCK" "$OUT_FILE"; then
      echo "Cline blocked commit. See $OUT_FILE"
      exit 1
    fi


The CLI explicitly supports piping git diffs for automated code reviews and integrating into shell workflows, including git hooks and toolchain pipes (`jq`, `grep`, `awk`). [Cline](https://docs.cline.bot/cline-cli/overview)

* * *

1) Daily Lint Sweep Auto-Fix (Cline CLI scheduled task)
=======================================================

Purpose
-------

Run linting daily, apply fixes, and ensure the repository stays clean.

Best flow
---------

Headless single-shot via cron/CI.

Prerequisites
-------------

* Linter available (eslint/ruff/golangci-lint/etc.)

* Clean branch (YOLO automation tradeoff) [Cline+1](https://docs.cline.bot/cline-cli/three-core-flows)

Steps
-----

1. Run linter, capture failures

2. Let Cline apply minimal fixes

3. Re-run linter and tests

Implementation
--------------

    # path: scripts/cline/daily-lint-fix.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true

    # Example commands; replace per stack.
    npm run lint || true

    cline task new -y "Fix all lint errors in this repo. Requirements:
    - Minimal diffs
    - Preserve behavior
    - After fixes, run the lint command again and ensure clean output."

    cline task view --follow

Automated code maintenance use cases explicitly include scheduling daily runs to identify and fix lint issues. [Cline+1](https://docs.cline.bot/cline-cli/overview)

* * *

1) Test Run + Failure Triage Summary (Cline CLI)
================================================

Purpose
-------

Run tests and produce a concise failure summary with likely root causes and next steps.

Best flow
---------

Headless single-shot or interactive depending on trust level.

Prerequisites
-------------

* Test runner configured

* Optional: multi-instance if running frontend/backend suites in parallel [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

Steps
-----

1. Execute test suite

2. If failures, summarize by module, failure signature, and suspected causes

3. If authorized, apply fixes and re-run tests

Implementation
--------------

    # path: scripts/cline/test-triage.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true

    # Run tests first to generate real output.
    npm test || true

    cline task new -y "Analyze the latest test output and failures in this repo.
    Output:
    - Failure grouping by file/module
    - Most likely causes
    - Minimal fixes
    Then apply fixes and re-run tests until green or a hard blocker is identified."

    cline task view --follow

The CLI is designed for automation, CI, and scripts with headless tasks and follow mode for progress. [Cline+1](https://docs.cline.bot/cline-cli/three-core-flows)

* * *

1) Generate Unit Tests for Changed Files (Cline CLI)
====================================================

Purpose
-------

Keep coverage from eroding by generating tests for newly changed logic.

Best flow
---------

Headless single-shot.

Prerequisites
-------------

* Test framework in repo

* A diff range available (staged or branch diff)

Steps
-----

1. Identify changed source files

2. Generate focused unit tests

3. Run tests

Implementation
--------------

    # path: scripts/cline/gen-tests-changed.sh
    #!/usr/bin/env bash
    set -euo pipefail

    FILES="$(git diff --name-only --diff-filter=AMR origin/main...HEAD | tr '\n' ' ')"

    cline instance new --default >/dev/null 2>&1 || true
    cline task new -y "Generate unit tests for the changed files: ${FILES}.
    Constraints:
    - Only add tests (avoid refactors)
    - Prefer small, deterministic tests
    - Run the test suite and ensure passing."
    cline task view --follow

Headless tasks are explicitly supported via `cline task new -y` for automated test generation. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* * *

1) Documentation Pass (JSDoc / docstrings) (Cline CLI)
======================================================

Purpose
-------

Auto-generate and normalize inline documentation for maintainability.

Best flow
---------

Headless single-shot.

Prerequisites
-------------

* Repo language conventions and doc style defined (optionally via `.clinerules`)

Steps
-----

1. Identify undocumented public functions

2. Add doc blocks

3. Run lint/typecheck

Implementation
--------------

    # path: scripts/cline/docs-pass.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true
    cline task new -y "Add JSDoc comments to all functions in src/. Do not change behavior."
    cline task view --follow

The Three Core Flows doc lists documentation generation as a standard headless task example. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* * *

1) Mechanical Refactor / Codemod Assist (Cline CLI)
===================================================

Purpose
-------

Execute repetitive refactors safely (syntax modernization, API migration, naming alignment).

Best flow
---------

Headless single-shot for mechanical changes; interactive for risky migrations.

Prerequisites
-------------

* Clean branch and rollback strategy (YOLO tradeoff) [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

Steps
-----

1. Apply refactor

2. Run formatting + tests

3. Produce a concise change summary

Implementation
--------------

    # path: scripts/cline/refactor-var-to-const.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true
    cline task new -y "Convert all var declarations to const/let. Preserve behavior. Run tests afterward."
    cline task view --follow

Mechanical refactoring is a documented headless task pattern. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* * *

1) Dependency Update + Test Gate (Cline CLI)
============================================

Purpose
-------

Update deprecated dependencies, remediate breakage, and keep CI green.

Best flow
---------

Headless single-shot; multi-instance if split by package domains.

Prerequisites
-------------

* Package manager present (npm/pnpm/yarn/poetry/etc.)

Steps
-----

1. Run dependency update

2. Identify deprecated/vulnerable packages

3. Apply code changes required by upgrades

4. Run tests

Implementation
--------------

    # path: scripts/cline/deps-update.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true

    # Example; swap per stack.
    npm update || true

    cline task new -y "Update deprecated dependencies safely and make required code changes.
    Constraints:
    - Prefer minimal version bumps
    - Run tests and fix breakages
    - Output a summary of upgrades and any notable behavior changes."
    cline task view --follow

The CLI overview explicitly lists updating deprecated dependencies and running tests as an automation target. [Cline](https://docs.cline.bot/cline-cli/overview)

* * *

1) Security Scan + Auto Patch (Cline CLI)
==========================================

Purpose
-------

Scan for vulnerabilities and patch with minimal diffs.

Best flow
---------

Headless single-shot.

Prerequisites
-------------

* Security scanner available (`npm audit`, `pip-audit`, `trivy`, etc.)

Steps
-----

1. Run scanner

2. Patch vulnerable packages and required code changes

3. Run tests

Implementation
--------------

    # path: scripts/cline/security-patch.sh
    #!/usr/bin/env bash
    set -euo pipefail

    cline instance new --default >/dev/null 2>&1 || true

    # Example; replace with your scanner.
    npm audit || true

    cline task new -y "Scan the repo for security vulnerabilities using the available audit outputs.
    Patch vulnerabilities with minimal diffs. Run tests and confirm no regressions."
    cline task view --follow

Security scanning and automatic patching are listed as a core “automated code maintenance” use case. [Cline](https://docs.cline.bot/cline-cli/overview)

* * *

1) Parallel Feature Delivery (Frontend/Backend split) (Multi-instance)
=======================================================================

Purpose
-------

Reduce cycle time by parallelizing independent workstreams while keeping isolated context.

Best flow
---------

Multi-instance.

Prerequisites
-------------

* Clear separation of tasks (frontend/backend/infra)

Steps
-----

1. Create a frontend instance and run UI tasks

2. Create a backend instance and run API tasks

3. Merge outputs via normal git workflow

Implementation
--------------

    # path: scripts/cline/parallel-feature.sh
    #!/usr/bin/env bash
    set -euo pipefail

    # Frontend instance
    FE_ADDR="$(cline instance new | tail -n 1 || true)"
    cline task new -y "Implement the UI changes for feature X. Update components, styling, and tests."

    # Backend instance as default
    cline instance new --default >/dev/null 2>&1
    cline task new -y "Implement API endpoints and data model changes for feature X. Add tests and migrations."

    cline instances list

Multi-instance usage and commands are defined in the Three Core Flows doc. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* * *

1) CI PR Review Gate (Cline CLI in CI)
=======================================

Purpose
-------

Automate PR risk review in CI by piping diffs into Cline and failing builds on critical issues.

Best flow
---------

Headless single-shot (CI).

Prerequisites
-------------

* Cline CLI installed on runner

* Provider configured and authenticated (`cline auth`) [Cline](https://docs.cline.bot/cline-cli/overview)

Steps
-----

1. Generate diff (merge base → head)

2. Run headless Cline task to review

3. Emit JSON or text output; fail build on threshold

Implementation (generic CI step)
--------------------------------

    # path: scripts/cline/ci-pr-gate.sh
    #!/usr/bin/env bash
    set -euo pipefail

    BASE_SHA="${BASE_SHA:-origin/main}"
    HEAD_SHA="${HEAD_SHA:-HEAD}"

    DIFF="$(git diff "$BASE_SHA...$HEAD_SHA")"

    cline instance new --default >/dev/null 2>&1 || true

    printf "%s\n" "$DIFF" | \
      cline task new -y "Review this diff and output:
    - Critical issues (security/data loss)
    - High issues (logic/perf)
    - Medium/Low issues
    - Verdict: PASS or FAIL
    Diff:\n\n$(cat)" > cline_pr_review.txt

    grep -q "Verdict: FAIL" cline_pr_review.txt && exit 1 || true

Cline CLI is explicitly positioned for CI/CD code review via piped diffs and shell integration. [Cline+1](https://docs.cline.bot/cline-cli/overview)

* * *

1) CI Test Failure Analysis (Cline CLI in Jenkins/GitLab)
==========================================================

Purpose
-------

Convert noisy test failures into actionable summaries and candidate fixes.

Best flow
---------

Headless single-shot in CI, optionally post results as artifact/comment.

Prerequisites
-------------

* Test logs available in job workspace

Steps
-----

1. Run tests

2. Feed failing logs into Cline

3. Output analysis and recommended patch set

Implementation (pattern)
------------------------

    # path: scripts/cline/ci-test-rca.sh
    #!/usr/bin/env bash
    set -euo pipefail

    # Run your test command and keep logs
    npm test | tee test.log || true

    cline instance new --default >/dev/null 2>&1 || true
    cline task new -y "Analyze test.log for failure root causes. Propose minimal fixes, apply them, and re-run tests."
    cline task view --follow

The CLI overview explicitly calls out CI/CD integration and using Cline to analyze test failures (example: Jenkins jobs). [Cline+2Cline+2](https://docs.cline.bot/cline-cli/overview)

* * *

1) GitHub Issue Root Cause Analysis (CLI Sample Pattern)
=========================================================

Purpose
-------

Fetch and analyze a GitHub issue, producing clean parseable output for integration into other automation.

Best flow
---------

Headless single-shot with JSON output piping.

Prerequisites (from sample)
---------------------------

* Cline CLI installed and authenticated (`cline auth`)

* Provider configured

* `gh` installed and authenticated

* `jq` installed

* bash [Cline+1](https://docs.cline.bot/cline-cli/samples/github-issue-rca)

Steps
-----

1. Validate args (issue URL)

2. Execute headless Cline analysis with JSON output

3. Use `jq` to extract completion result text

Implementation (from sample, condensed)
---------------------------------------

    # path: scripts/cline/analyze-issue.sh
    #!/usr/bin/env bash
    set -euo pipefail

    ISSUE_URL="${1:?usage: analyze-issue.sh <github-issue-url> [prompt] [address]}"
    PROMPT="${2:-What is the root cause of this issue?}"
    ADDRESS_OPT=""
    [ -n "${3:-}" ] && ADDRESS_OPT="--address $3"

    cline -y "$PROMPT: $ISSUE_URL" --mode act $ADDRESS_OPT -F json | \
      sed -n '/^{/,$p' | \
      jq -r 'select(.say == "completion_result") | .text' | \
      sed 's/\\n/\n/g'

This sample is documented as an end-to-end pattern for autonomous analysis with parseable output. [Cline+1](https://docs.cline.bot/cline-cli/samples/github-issue-rca)

* * *

1) Workflow Authoring Accelerator (Cline Workflow File)
========================================================

Purpose
-------

Turn repeated procedures into durable workflow files.

Best flow
---------

Workflow-driven workflow creation.

Prerequisites
-------------

* Save the `create-new-workflow.md` helper into `.clinerules/workflows/` [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

Steps
-----

1. Invoke `/create-new-workflow.md`

2. Provide purpose, objective, major steps, and expected outputs

3. Accept generated structured workflow file [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

Implementation (invocation only)
--------------------------------

* Place the helper file into `.clinerules/workflows/`

* Invoke it by slash command `/create-new-workflow.md` [Cline](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

* * *

Operational Notes (for daily stability)
---------------------------------------

* Prefer headless tasks (`cline task new -y`) for repeatable automation and CI. [Cline+1](https://docs.cline.bot/cline-cli/three-core-flows)

* Use multi-instance when parallelizing independent domains; list and kill instances when finished. [Cline](https://docs.cline.bot/cline-cli/three-core-flows)

* Keep procedures modular, concise, and version-controlled; avoid workflow bloat to stay within context windows. [Cline+2Cline+2](https://docs.cline.bot/features/slash-commands/workflows/best-practices)

---
