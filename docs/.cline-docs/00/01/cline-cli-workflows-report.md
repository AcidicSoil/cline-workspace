# Automating Daily Development Workflows with Cline CLI (Ask, Do, Compose Flows)

## Executive summary

Cline CLI can be used to streamline daily software engineering tasks by applying three core interaction patterns:

- **Ask flow**: interactive chat-driven work with an explicit plan phase before execution (human-in-the-loop).
- **Do flow**: one-shot, headless execution for well-scoped tasks (automation-first).
- **Compose flow**: reusable, multi-step workflows defined as Markdown “recipes” that orchestrate tools/commands and Cline steps.

This report provides practical, code-oriented workflows for PR review, test execution, deployment, documentation generation, and bug triage, plus integration patterns for GitHub, Jira, Slack, and editor environments.

---

## 1) Core flows and when to use them

### Ask flow (interactive)

Best for:

- ambiguous problems
- debugging and design exploration
- tasks where you want checkpoints and review before changes land

Characteristics:

- conversational input
- Cline proposes a plan, then executes after approval
- ideal when correctness > speed

### Do flow (one-shot / headless)

Best for:

- deterministic, well-scoped tasks
- batch operations (docs generation, formatting, refactors)
- CI-style automation

Characteristics:

- single command triggers end-to-end execution
- minimal/no interaction
- higher risk if prompt is underspecified

### Compose flow (workflow files)

Best for:

- repeatable multi-step processes (PR review, deploy, release notes)
- team-shared playbooks committed to the repo
- orchestration of shell commands + AI steps + optional user gates

Characteristics:

- workflows stored as Markdown
- can include steps that execute commands, read/write files, and ask for user choice
- encourages consistency and reduces “tribal knowledge” variance

---

## 2) Custom workflow: Pull request review automation (Compose flow)

### Purpose

Reduce PR review toil by:

- fetching PR context and diffs
- running static checks (optional)
- generating a structured review summary
- optionally posting approval / comments via GitHub CLI

### Prerequisites

- `gh` (GitHub CLI) installed and authenticated
- repository checked out locally
- convention: store workflows under `.clinerules/workflows/`

### Steps

1. Fetch PR metadata (title/description/labels)
2. Fetch diff and changed files
3. Analyze diff for:
   - correctness, edge cases
   - security / unsafe patterns
   - performance regressions
   - style/maintainability
4. Produce:
   - “Must fix”
   - “Should fix”
   - “Nit”
   - “Questions”
5. Ask reviewer action:
   - approve
   - request changes
   - comment only
6. Execute selected action via `gh pr review`

### Example commands inside the workflow

```bash
gh pr view <PR_NUMBER> --json title,body,author,labels,files
gh pr diff <PR_NUMBER>
gh pr review <PR_NUMBER> --approve
gh pr review <PR_NUMBER> --request-changes -b "<comment>"
gh pr review <PR_NUMBER> --comment -b "<comment>"
```

### Trigger example

```bash
/pr-review.md 42
```

### Notes

- Add optional steps to run `lint`, `typecheck`, or `test` on touched packages only.
- Use a “risk gate” section to highlight dangerous changes (auth, payments, data migrations).

---

## 3) Custom workflow: Automated test execution and analysis (Do flow)

### Purpose

Run tests and transform raw output into an actionable failure report:

- failing tests list
- failure clusters (common root cause)
- probable fixes / next debugging steps

### Prerequisites

- project test command available (e.g., `npm test`, `pytest`, `go test ./...`)
- deterministic environment (same node/python/go versions as expected)

### Do-flow invocation examples

```bash
cline task new -y "Run the full test suite. Summarize failures grouped by root cause. Output a short fix plan."
```

### Implementation pattern

1. Execute test command
2. Capture stdout/stderr
3. Parse for:
   - failure names
   - stack traces
   - common modules/files implicated
4. Output:
   - Top 3 likely root causes
   - Exact failing tests
   - First fix to try
5. Optionally:
   - open/modify the implicated file(s)
   - create or update a regression test
   - re-run the failing subset until green

### Practical variations

- “Run only impacted tests”: determine impacted packages via `git diff --name-only` and map to test selectors.
- “CI failure triage”: ingest a CI log file and generate a targeted debugging checklist.

---

## 4) Custom workflow: Deployment pipeline automation (Compose flow)

### Purpose

Automate a safe, repeatable deploy sequence while retaining a human gate for production.

### Prerequisites

- deployment tooling installed (Docker/Kubernetes/terraform/your CLI)
- access configured (kubeconfig, cloud credentials, etc.)
- optional Slack/Jira integrations if you want notifications/status updates

### Steps (staging-first)

1. Run tests
2. Build artifacts
3. Deploy to staging
4. Health check
5. Notify team (Slack)
6. Ask for production approval
7. Deploy to production (if approved)
8. Post-deploy verification + notify

### Example command steps

```bash
npm test
npm run build
kubectl apply -f k8s/staging/
curl -fsS https://staging.example.com/health
kubectl apply -f k8s/prod/
curl -fsS https://example.com/health
```

### Gating pattern

Use an explicit “approval” step before running production commands. If not approved, stop and report the staging result.

### Recommended safety rails

- refuse to deploy if the git working tree is dirty
- print the commit SHA being deployed
- require changelog/release notes generation before production

---

## 5) Custom workflow: Code documentation generation (Do flow)

### Purpose

Mass-generate or normalize docs consistently:

- docstrings / JSDoc / TSDoc
- README updates
- API reference stubs
- architecture notes from code structure

### Do-flow invocation examples

```bash
cline task new -y "Add JSDoc to exported functions in src/. Keep style consistent with existing docs. Do not change logic."
cline task new -y "Update README.md with current setup steps based on package.json scripts and env vars."
```

### Guardrails

- restrict edits to comments/docs only
- require a diff summary at the end
- optionally run formatter/linter after doc edits

---

## 6) Custom workflow: Bug triage and fix playbook (Ask + Compose)

### Purpose

Turn bug reports into a repeatable process:

- reproduce
- localize cause
- patch
- verify
- document + link to issue

### Ask flow usage (interactive debugging)

Use Ask flow when reproduction or root cause is uncertain:

- paste stack trace, logs, or repro steps
- let Cline propose an investigation plan
- approve targeted file reads and minimal edits

### Compose workflow pattern (repeatable triage)

Steps:

1. Ingest bug context (issue text/log snippet)
2. Reproduce (run failing test or scenario)
3. Identify implicated module(s)
4. Propose minimal fix
5. Apply patch + add regression test
6. Re-run target tests
7. Draft commit message and PR description

### Practical integration points

- GitHub issue → fetch details with `gh issue view`
- Jira ticket → fetch details via integration
- Slack → post triage status updates and link to PR

---

## 7) Integration patterns (GitHub, Jira, Slack, editors, CI)

### GitHub

- Use `gh` to fetch PRs/issues, post reviews, create PRs.
- Add a workflow that standardizes PR descriptions (checklist + risk notes).

### Jira

- Use a Jira integration (API/MCP) to:
  - fetch ticket context into the workflow
  - update status when PR is opened/merged
  - append a release note comment automatically

### Slack

- Notify on:
  - staging deploy success/failure
  - production deploy approval required
  - test failures in main branch
- Keep messages short and include links/commit SHAs.

### VS Code / editor loop

- Start an Ask flow in-editor for design/debugging.
- Switch to terminal Do flow for batch operations (docs/refactors).
- Use Compose workflows as shared team runbooks committed to the repo.

### CI usage

- Run Do-flow tasks in CI for:
  - failure triage summaries
  - changelog drafting
  - automatic “what changed” reports for nightly builds
- Keep CI prompts deterministic and bounded.

---

## 8) Recommended workflow catalog (daily engineer set)

1. **pr-review.md** — PR summary + risk gates + review action
2. **lint-sweep.md** — run linters, auto-fix, summarize remaining issues
3. **precommit-risk-gate.md** — detect risky diffs (auth/db/migrations) and require confirmation
4. **test-triage.md** — run tests, cluster failures, propose fix order
5. **bugfix-playbook.md** — reproduce → patch → regression test → verify → draft PR
6. **deploy-staging.md** — tests/build/deploy/health-check/notify
7. **release-notes.md** — generate release notes from commits/merged PRs
8. **docs-refresh.md** — update README + docstrings with project conventions

---

## 9) Implementation guidance (how to keep workflows effective)

- Keep prompts explicit about:
  - allowed edit scope (docs only vs code changes)
  - success criteria (tests passing, lint clean)
  - stopping conditions (don’t keep iterating endlessly)
- Build workflows around standard CLIs you already trust (`gh`, `git`, `npm`, `pytest`, `kubectl`).
- Insert human gates at high-risk boundaries (production deploy, schema migrations, auth changes).
- Commit workflows to the repo and treat them like code:
  - review changes
  - version them
  - keep them minimal and composable
