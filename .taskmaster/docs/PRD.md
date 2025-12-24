## 1) Overview

### Problem

AI-assisted engineering workflows are currently ad-hoc: prompts drift, steps vary by person, and automations are brittle across environments (terminal agents, chat apps, CI). Teams need a **repeatable, distributable workflow pack** that exposes the same “daily engineering” actions (PR review, lint sweep, test triage, etc.) through multiple host surfaces (standalone CLI, MCP tools, Gemini CLI extension, LM Studio tools) without rewriting the workflows per host.

### Target users

* **Individual engineers** who want one-command automation for review/triage/maintenance tasks (local + CI).
* **DevEx / platform teams** who want standardized runbooks committed to repos and invoked consistently.
* **Tooling builders** who need to expose the same workflows as (a) CLI commands, (b) MCP tools, (c) Gemini CLI custom commands, (d) LM Studio tools provider.

### Why current solutions fail

* Prompts and runbooks are not versioned as product artifacts; behavior diverges.
* Each host surface has different integration primitives (commands vs tools vs plugins), forcing duplication.
* Safety gates (approval before posting reviews or deploying) are inconsistently applied.

### Success metrics

* **Workflow determinism:** ≥90% of runs produce the same structured outputs given the same inputs (diff/logs/config).
* **Adoption:** ≥60% of active engineers run at least one packaged workflow weekly (measured via local run history + CI invocations).
* **Time-to-action:** PR review summary produced in ≤2 minutes median after diff fetch (excluding network latency).
* **Error budget:** <5% runs fail due to missing prerequisites without producing a clear “missing dependency” report.

### Constraints and assumptions (explicit)

* Must support distribution patterns:

  * **Gemini CLI extension** via `gemini-extension.json` with `customCommands` (optionally bootstrapping MCP server, and shipping `contextFiles`).
  * **MCP server** exposing tools matching the workflow surface area (JSON-RPC based).
  * **Standalone CLI** entry point with E2E validation.
  * **LM Studio TypeScript plugin** with `manifest.json` and a Tools Provider exposing workflows as tools.
* For Cline-compatible “workflow files,” repo-local storage under `.clinerules/workflows/` is supported and expected.
* Many workflows assume external CLIs exist (e.g., `gh`, `git`, language-specific linters/test runners).

---

## 2) Capability Tree (Functional Decomposition)

### Capability: Workflow Definition and Packaging (MVP)

Defines what a workflow is, how it is configured, discovered, versioned, and packaged.

#### Feature: Workflow specification schema (MVP)

* **Description**: Define a host-agnostic workflow format (name, description, parameters, steps, gates, outputs).
* **Inputs**: Workflow definition file(s); schema version.
* **Outputs**: Parsed workflow model; validation errors (structured).
* **Behavior**: Validate structure; enforce step-type invariants; reject unknown fields unless explicitly allowed by schema versioning.

#### Feature: Workflow registry and discovery (MVP)

* **Description**: Provide `list/get/search` over packaged workflows.
* **Inputs**: Pack install location(s); optional filters (tag, host support, risk level).
* **Outputs**: Workflow metadata list; selected workflow definition.
* **Behavior**: Merge multiple sources (built-ins + repo-local pack); stable sorting; deterministic IDs.

#### Feature: Pack manifest and versioning (MVP)

* **Description**: Package workflows plus metadata (version, required tools, supported hosts).
* **Inputs**: Workflow files; pack manifest file.
* **Outputs**: Resolved pack manifest; compatibility report.
* **Behavior**: Enforce semantic version rules; compute dependency requirements per workflow; expose “host capability requirements.”

---

### Capability: Workflow Execution Orchestration (MVP)

Runs workflows deterministically across hosts while preserving safety gates and producing structured outputs.

#### Feature: Run context builder (MVP)

* **Description**: Assemble execution context (repo state, diffs, logs, env, config, user params).
* **Inputs**: Workflow params; working directory; host-provided context hooks.
* **Outputs**: Context object; redacted context view for logging.
* **Behavior**: Collect only declared inputs; redact secrets; attach provenance (file paths, command sources).

#### Feature: Step execution engine (MVP)

* **Description**: Execute a workflow as an ordered set of steps with typed IO between steps.
* **Inputs**: Workflow model; context object.
* **Outputs**: Step results; final run result; structured error on failure.
* **Behavior**: Top-to-bottom execution; stop-on-failure with partial artifact capture; per-step timeouts; deterministic retries policy (default: none).

#### Feature: Shell command step

* **Description**: Run a shell command and capture stdout/stderr/exit code.
* **Inputs**: Command string; cwd; env overlays; stdin (optional).
* **Outputs**: Command result (stdout/stderr/exitCode); parsed output (optional).
* **Behavior**: Stream capture; size limits; normalize newlines; mark failures by exit code.

#### Feature: AI analysis/generation step (MVP)

* **Description**: Invoke the host model/tooling to analyze provided inputs and return structured text/JSON.
* **Inputs**: Prompt template; context bindings; host adapter invocation contract.
* **Outputs**: Model output (text/JSON); token/latency metadata when available.
* **Behavior**: Enforce output contract (schema/required headings); fail if missing required sections.

#### Feature: Human gate step (MVP)

* **Description**: Require an explicit choice before executing downstream steps (e.g., approve vs request-changes).
* **Inputs**: Prompt; allowed choices; default behavior.
* **Outputs**: Selected choice; audit log entry.
* **Behavior**: Block until host supplies selection; record selection; branch execution path by choice.

#### Feature: Artifact output and formatting (MVP)

* **Description**: Emit run outputs in human-readable and machine-readable formats.
* **Inputs**: Run results; formatter selection (text/JSON).
* **Outputs**: Console output; JSON artifact file; optional host tool return payload.
* **Behavior**: Stable JSON shape; include warnings; never include secrets.

---

### Capability: Tool Integrations (MVP for Git/GitHub; others incremental)

Reusable integration primitives shared across workflows.

#### Feature: Git repository introspection (MVP)

* **Description**: Read branch, status, staged diff, range diff, changed files.
* **Inputs**: Repo path; diff selectors (staged, PR range).
* **Outputs**: Diff text; file list; repo metadata.
* **Behavior**: Refuse if not a git repo; cap diff sizes; canonicalize file paths.

#### Feature: GitHub CLI integration (MVP)

* **Description**: Fetch PR metadata/diff and submit reviews via `gh`.
* **Inputs**: PR identifier; auth state; desired review action.
* **Outputs**: PR JSON metadata; diff; review submission result.
* **Behavior**: Validate `gh` availability; map workflow decisions to `gh pr review` actions used by the PR review workflow pattern.

#### Feature: Test runner integration

* **Description**: Run project tests and capture logs for analysis.
* **Inputs**: Test command; optional scope selector.
* **Outputs**: Test output log; pass/fail; failure signatures.
* **Behavior**: Run then analyze; allow “run anyway” even on failure to capture logs (as described in test triage patterns).

#### Feature: Linter integration

* **Description**: Run linting, optionally apply fixes, re-run to confirm clean state.
* **Inputs**: Lint command; fix command policy.
* **Outputs**: Lint logs; applied diff summary; final status.
* **Behavior**: Minimal-diff policy; require final clean run for success (mirrors daily lint sweep pattern).

#### Feature: CI-friendly mode

* **Description**: Non-interactive execution with deterministic outputs and exit codes.
* **Inputs**: Workflow + params; env flags.
* **Outputs**: Exit code; JSON artifact; concise console summary.
* **Behavior**: Disallow human gates unless pre-satisfied by params; fail fast on missing prerequisites; stable formatting.

---

### Capability: Distribution Adapters (MVP: Standalone CLI)

Expose the same workflow pack through multiple host surfaces.

#### Feature: Standalone CLI surface (MVP)

* **Description**: Provide `install`, `list`, `run <workflow>` commands.
* **Inputs**: Pack location; workflow name; params.
* **Outputs**: Exit code; text/JSON outputs; artifact files.
* **Behavior**: Maps CLI args to workflow params; selects formatter; supports E2E validation requirement.

#### Feature: MCP server adapter

* **Description**: Expose each workflow as an MCP tool callable by compatible clients.
* **Inputs**: Tool invocation payloads (workflow + params); server config.
* **Outputs**: MCP tool results; structured errors.
* **Behavior**: One tool per workflow; schema-advertise params; run via shared execution engine.

#### Feature: Gemini CLI extension packaging

* **Description**: Generate `gemini-extension.json` mapping workflows to `customCommands`, optionally declaring `mcpServers` and `contextFiles`.
* **Inputs**: Pack manifest; selected workflow list.
* **Outputs**: `gemini-extension.json`; install docs snippet.
* **Behavior**: Deterministic command naming; optional “start MCP server” wiring.

#### Feature: LM Studio plugin packaging

* **Description**: Provide an LM Studio TypeScript plugin exposing workflows as tools via a Tools Provider.
* **Inputs**: Pack config (workspaceRoot, packsDir); workflow set.
* **Outputs**: `manifest.json`; tools provider list; runnable plugin bundle.
* **Behavior**: One tool per workflow; configuration fields avoid assuming editor workspace state.

---

### Capability: Built-in Daily Engineering Workflows (MVP: PR Review + one maintenance workflow)

Ship a default catalog aligned with common Cline workflow patterns.

#### Feature: PR review workflow (MVP)

* **Description**: Fetch PR metadata + diff, analyze risk, produce structured review, optionally submit via `gh`.
* **Inputs**: PR number/URL; repo path; review action choice.
* **Outputs**: Review report (Must fix / Should fix / Nits / Questions); optional `gh pr review` result.
* **Behavior**: Matches the documented step sequence (view → diff → analyze → choose action → submit).

#### Feature: Pre-commit risk gate workflow

* **Description**: Analyze staged diff and output ALLOW/BLOCK with findings.
* **Inputs**: Staged diff; severity thresholds.
* **Outputs**: Verdict; findings; minimal fix guidance; exit code for hooks.
* **Behavior**: Designed for git hook usage with piped diffs and a deterministic verdict.

#### Feature: Daily lint sweep auto-fix workflow

* **Description**: Run linter, apply minimal fixes, re-run lint/tests, summarize remaining issues.
* **Inputs**: Lint command(s); optional test command.
* **Outputs**: Fixed diff summary; final lint status; remaining issues list.
* **Behavior**: Mirrors the “lint, fix, re-run” cadence described in the workflow pack.

#### Feature: Test run + failure triage workflow

* **Description**: Run tests, cluster failures, propose fix order, optionally apply minimal fixes and re-run.
* **Inputs**: Test command; optional scope selector.
* **Outputs**: Failure clusters; top likely causes; suggested next steps; optional patch summary.
* **Behavior**: Implements the documented triage structure (group by signature/module, propose minimal fixes).

#### Feature: Daily changelog workflow

* **Description**: Summarize recent commits and append a dated entry to `changelog.md`.
* **Inputs**: Git author; time range; changelog path.
* **Outputs**: Changelog entry; commit list; summary text.
* **Behavior**: Follows “git log → summarize → append” workflow pattern.

#### Feature: Docs refresh workflow

* **Description**: Add/normalize docstrings/JSDoc for public surfaces without behavior changes.
* **Inputs**: Target paths; doc style rules.
* **Outputs**: Comment-only diffs; lint/typecheck output (optional).
* **Behavior**: Enforces “docs-only” edit scope.

---

## 3) Repository Structure + Module Definitions (Structural Decomposition)

### Repository structure

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

### Module definitions (single responsibility + exports)

#### Module: `foundation/types`

* **Responsibility**: Shared type definitions for workflows, steps, results, and errors.
* **Exports**: `Workflow`, `Step`, `RunResult`, `StepResult`, `Severity`, `HostKind`.

#### Module: `foundation/errors`

* **Responsibility**: Typed error taxonomy and error-to-exit-code mapping.
* **Exports**: `PackError`, `ValidationError`, `PrereqMissingError`, `ExecutionError`, `exitCodeFor(error)`.

#### Module: `foundation/config`

* **Responsibility**: Load/merge config from files/env/CLI flags; provide redaction utilities.
* **Exports**: `loadConfig()`, `resolvePaths()`, `redact(obj)`.

#### Module: `foundation/logging`

* **Responsibility**: Structured logging and run event recording.
* **Exports**: `createLogger()`, `logEvent()`, `withRunContext()`.

#### Module: `workflow/spec`

* **Responsibility**: Workflow schema, parsing, and validation.
* **Exports**: `parseWorkflow(text)`, `validateWorkflow(workflow)`, `CURRENT_SCHEMA_VERSION`.

#### Module: `workflow/manifest`

* **Responsibility**: Pack manifest parsing and compatibility checks.
* **Exports**: `parseManifest()`, `checkHostCompatibility(host, pack)`, `computePrereqs(workflow)`.

#### Module: `workflow/registry`

* **Responsibility**: Workflow discovery across installed packs and local repo sources.
* **Exports**: `listWorkflows()`, `getWorkflow(id)`, `searchWorkflows(query)`.

#### Module: `runner/context`

* **Responsibility**: Build execution context from declared inputs and integrations.
* **Exports**: `buildContext(workflow, params, host)`, `attachProvenance()`.

#### Module: `runner/steps`

* **Responsibility**: Step-type implementations and IO contracts.
* **Exports**: `runShellStep()`, `runAiStep()`, `runGateStep()`, `runCompositeStep()`.

#### Module: `runner/formatting`

* **Responsibility**: Render results to text/JSON and write artifacts.
* **Exports**: `formatHuman(result)`, `formatJson(result)`, `writeArtifacts(result)`.

#### Module: `integrations/git`

* **Responsibility**: Obtain diffs, changed files, repo metadata.
* **Exports**: `getStagedDiff()`, `getRangeDiff(base, head)`, `listChangedFiles()`.

#### Module: `integrations/github-gh`

* **Responsibility**: `gh` wrappers for PR view/diff/review.
* **Exports**: `ghPrView(pr)`, `ghPrDiff(pr)`, `ghPrReview(pr, action, body)`.

#### Module: `integrations/test-runner`

* **Responsibility**: Execute tests and normalize logs/signatures for triage.
* **Exports**: `runTests(cmd)`, `summarizeFailures(log)`.

#### Module: `integrations/linter`

* **Responsibility**: Execute lint/fix and normalize outputs.
* **Exports**: `runLint(cmd)`, `runFix(cmd)`, `summarizeLint(log)`.

#### Module: `workflows/*`

* **Responsibility**: Provide concrete workflow definitions and prompt templates.
* **Exports**: `workflowDefinition`, `defaultParams`, `prereqs`, `docs`.

#### Module: `adapters/cli`

* **Responsibility**: CLI argument parsing → workflow run invocation.
* **Exports**: `main(argv)`, `commands`.

#### Module: `adapters/mcp-server`

* **Responsibility**: MCP tool definitions + request handling → workflow run invocation.
* **Exports**: `startServer(config)`, `listTools()`.

#### Module: `adapters/gemini-extension`

* **Responsibility**: Generate `gemini-extension.json` from pack manifest/workflow registry.
* **Exports**: `generateGeminiExtension(pack, options)`.

#### Module: `adapters/lmstudio-plugin`

* **Responsibility**: LM Studio plugin scaffolding + tools provider binding to workflows.
* **Exports**: `createToolsProvider(registry)`, `pluginManifest`.

---

## 4) Dependency Chain (layers, explicit “Depends on: […]”)

### Foundation layer (Phase 0)

* **foundation/types**: No dependencies
* **foundation/errors**: Depends on: [foundation/types]
* **foundation/config**: Depends on: [foundation/types, foundation/errors]
* **foundation/logging**: Depends on: [foundation/types, foundation/config]

### Workflow modeling layer (Phase 1)

* **workflow/spec**: Depends on: [foundation/types, foundation/errors]
* **workflow/manifest**: Depends on: [foundation/types, foundation/errors, foundation/config]
* **workflow/registry**: Depends on: [workflow/spec, workflow/manifest, foundation/config, foundation/logging]

### Runner layer (Phase 2)

* **runner/context**: Depends on: [foundation/config, foundation/logging, workflow/spec]
* **runner/steps**: Depends on: [foundation/errors, foundation/logging, runner/context, workflow/spec]
* **runner/formatting**: Depends on: [foundation/config, foundation/logging, foundation/errors, workflow/spec]

### Integrations layer (Phase 3)

* **integrations/git**: Depends on: [foundation/errors, foundation/logging, foundation/config]
* **integrations/github-gh**: Depends on: [foundation/errors, foundation/logging, integrations/git, foundation/config]
* **integrations/test-runner**: Depends on: [foundation/errors, foundation/logging, foundation/config]
* **integrations/linter**: Depends on: [foundation/errors, foundation/logging, foundation/config]

### Workflow catalog layer (Phase 4)

* **workflows/pr-review**: Depends on: [workflow/spec, integrations/github-gh, runner/steps, runner/context]
* **workflows/precommit-risk**: Depends on: [workflow/spec, integrations/git, runner/steps, runner/context]
* **workflows/lint-sweep**: Depends on: [workflow/spec, integrations/linter, runner/steps, runner/context]
* **workflows/test-triage**: Depends on: [workflow/spec, integrations/test-runner, runner/steps, runner/context]
* **workflows/daily-changelog**: Depends on: [workflow/spec, integrations/git, runner/steps, runner/context]
* **workflows/docs-refresh**: Depends on: [workflow/spec, runner/steps, runner/context]

### Adapter layer (Phase 5+)

* **adapters/cli**: Depends on: [workflow/registry, runner/steps, runner/formatting, workflow/manifest]
* **adapters/mcp-server**: Depends on: [workflow/registry, runner/steps, runner/formatting, workflow/manifest]
* **adapters/gemini-extension**: Depends on: [workflow/registry, workflow/manifest]
* **adapters/lmstudio-plugin**: Depends on: [workflow/registry, runner/steps, workflow/manifest]

---

## 5) Development Phases (Phase 0…N; entry/exit criteria; tasks with dependencies + acceptance criteria + test strategy)

### Phase 0: Foundation

**Entry criteria**: Repo initialized; test runner available.
**Tasks**:

* [ ] Implement `foundation/types` (depends on: none)

  * Acceptance: Types compile; exported surface matches module definition.
  * Test: Type-level checks + unit compile tests.
* [ ] Implement `foundation/errors` (depends on: foundation/types)

  * Acceptance: Error taxonomy complete; stable error codes.
  * Test: Unit tests mapping error→exit code.
* [ ] Implement `foundation/config` (depends on: foundation/types, foundation/errors)

  * Acceptance: Loads config from file/env; redaction works.
  * Test: Unit tests for precedence + redaction snapshots.
* [ ] Implement `foundation/logging` (depends on: foundation/types, foundation/config)

  * Acceptance: Structured logs with run correlation ID.
  * Test: Unit tests verifying emitted JSON shape.

**Exit criteria**: All foundation modules importable with zero circular deps; unit suite green.

---

### Phase 1: Workflow modeling

**Entry criteria**: Phase 0 complete.
**Tasks**:

* [ ] Implement `workflow/spec` (depends on: foundation/types, foundation/errors)

  * Acceptance: Valid workflows parse; invalid workflows return structured validation errors.
  * Test: Golden fixtures (valid/invalid) + property tests on required fields.
* [ ] Implement `workflow/manifest` (depends on: foundation/types, foundation/errors, foundation/config)

  * Acceptance: Computes prereqs and host compatibility; version parsing stable.
  * Test: Unit tests for compatibility matrix.
* [ ] Implement `workflow/registry` (depends on: workflow/spec, workflow/manifest, foundation/config, foundation/logging)

  * Acceptance: Lists and resolves workflows deterministically across sources.
  * Test: Integration tests with temp dirs containing multiple packs.

**Exit criteria**: `list/get/search` works in-process with fixture packs.

---

### Phase 2: Runner core

**Entry criteria**: Phase 1 complete.
**Tasks**:

* [ ] Implement `runner/context` (depends on: foundation/config, foundation/logging, workflow/spec)

  * Acceptance: Context contains only declared inputs; provenance attached.
  * Test: Unit tests for redaction + provenance.
* [ ] Implement `runner/steps` for shell + AI + gate (depends on: foundation/errors, foundation/logging, runner/context, workflow/spec)

  * Acceptance: Steps execute; failures stop run with partial artifacts.
  * Test: Unit tests with mocked shell + mocked host AI adapter; gate branching tests.
* [ ] Implement `runner/formatting` (depends on: foundation/config, foundation/logging, foundation/errors, workflow/spec)

  * Acceptance: Human + JSON outputs stable; artifacts written.
  * Test: Snapshot tests for output JSON; size limit tests.

**Exit criteria**: A trivial sample workflow runs end-to-end producing both text and JSON.

---

### Phase 3: Core integrations

**Entry criteria**: Phase 2 complete.
**Tasks**:

* [ ] Implement `integrations/git` (depends on: foundation/errors, foundation/logging, foundation/config)

  * Acceptance: Reads staged and range diffs; handles non-git gracefully.
  * Test: Integration tests using a temp git repo fixture.
* [ ] Implement `integrations/github-gh` (depends on: foundation/errors, foundation/logging, integrations/git, foundation/config)

  * Acceptance: Detects missing `gh`; wraps `gh pr view/diff/review`.
  * Test: Contract tests with command stubs; optional live tests gated by env.
* [ ] Implement `integrations/test-runner` (depends on: foundation/errors, foundation/logging, foundation/config)

  * Acceptance: Captures logs and extracts failure signatures.
  * Test: Fixture logs → expected clusters.
* [ ] Implement `integrations/linter` (depends on: foundation/errors, foundation/logging, foundation/config)

  * Acceptance: Captures lint/fix logs; confirms final clean run.
  * Test: Command stub tests; parsing unit tests.

**Exit criteria**: Integrations usable by workflows via the context builder.

---

### Phase 4: MVP workflow catalog

**Entry criteria**: Phase 3 complete.
**Tasks**:

* [ ] Implement `workflows/pr-review` (depends on: workflow/spec, integrations/github-gh, runner/steps, runner/context)

  * Acceptance: Produces structured review; optional submission via `gh`.
  * Test: Fixture diff → expected report headings; submission path mocked.
* [ ] Implement one maintenance workflow (choose: lint-sweep OR test-triage) (depends on corresponding integration + runner)

  * Acceptance: Produces deterministic summary; sets exit codes appropriately.
  * Test: Fixture logs → expected structured output.

**Exit criteria**: Two workflows runnable end-to-end via in-process runner.

---

### Phase 5: MVP host surface (Standalone CLI)

**Entry criteria**: Phase 4 complete.
**Tasks**:

* [ ] Implement `adapters/cli` (depends on: workflow/registry, runner/steps, runner/formatting, workflow/manifest)

  * Acceptance: `list` shows workflows; `run` executes with params; JSON output supported; correct exit codes.
  * Test: E2E tests invoking CLI against fixture pack; golden JSON outputs.

**Exit criteria**: Standalone CLI satisfies “Pattern C” shippable baseline with E2E validation.

---

### Phase 6: Additional distribution adapters

**Entry criteria**: Phase 5 complete.
**Parallel tasks**:

* [ ] Implement `adapters/mcp-server` (depends on: workflow/registry, runner/steps, runner/formatting, workflow/manifest)

  * Acceptance: Tools listed; tool invocation runs workflows; stable JSON tool outputs.
  * Test: Integration tests via MCP client harness.
* [ ] Implement `adapters/gemini-extension` generator (depends on: workflow/registry, workflow/manifest)

  * Acceptance: Generates valid `gemini-extension.json` with `customCommands`; optional MCP bootstrap wiring.
  * Test: Snapshot tests of generated JSON.
* [ ] Implement `adapters/lmstudio-plugin` (depends on: workflow/registry, runner/steps, workflow/manifest)

  * Acceptance: Tools Provider returns tool list; config fields present for paths; plugin runs.
  * Test: Node-level integration tests for provider return shapes.

**Exit criteria**: Same workflow set accessible through MCP + generated Gemini extension + LM Studio plugin surface.

---

## 6) User Experience

### Personas

* **Solo engineer**: Wants quick, local “run PR review” and “triage tests” with minimal setup.
* **Team reviewer**: Wants standardized PR review output sections and optional auto-submit.
* **CI maintainer**: Wants non-interactive runs with stable artifacts and exit codes.

### Key flows

* **Standalone CLI**

  * Install pack → `list` workflows → `run pr-review --pr 123 --format json`.
* **Cline workflow-file consumption**

  * Commit workflow files under `.clinerules/workflows/` and invoke via slash command conventions used by Cline workflows.
* **Gemini CLI**

  * Install/enable extension → run mapped custom command names created from pack workflows.
* **LM Studio**

  * Install plugin → workflows appear as tools immediately via Tools Provider mapping.
* **CI**

  * Run workflow in non-interactive mode → store JSON artifact → fail build on verdict thresholds.

### UX notes tied to capabilities

* Every workflow output uses the same canonical headings/JSON keys (improves skimmability and automation).
* Human gates are explicit and auditable; CI mode requires gates to be pre-decided via params.

---

## 7) Technical Architecture

### System components

* **Pack loader + registry**: discovers workflows and validates compatibility.
* **Runner**: executes typed steps with a shared context object and structured results.
* **Integrations**: wrappers around git/gh/lint/test commands.
* **Adapters**: translate host invocations (CLI args, MCP calls, Gemini custom commands, LM Studio tools) into workflow runs.

### Data models (core)

* `Workflow`: `{ id, name, version, description, params[], steps[], outputs[] }`
* `Step`: union of `{ type: "shell" | "ai" | "gate", ... }`
* `RunResult`: `{ runId, workflowId, status, startedAt, finishedAt, steps[], artifacts[], warnings[] }`
* `Prereq`: `{ kind: "binary" | "env" | "auth", name, checkCommand, fixHint }`

### APIs and integration contracts

* **Runner API**: `runWorkflow(workflowId, params, hostContext) -> RunResult`
* **Host adapter API**: `invokeAi(prompt, schema) -> { text|json, meta }` and `requestGate(choices) -> choice`
* **MCP**: one tool per workflow, params advertised, results returned as structured payloads.

### Key decisions (with trade-offs)

* **Host-agnostic workflow spec, host-specific adapters**

  * Rationale: minimizes duplication; workflows stay consistent across surfaces.
  * Trade-off: adapters must cover host capability mismatches (e.g., interactive gates).
* **Deterministic JSON outputs as first-class**

  * Rationale: enables CI gating and downstream automation.
  * Trade-off: more rigid contracts; requires schema versioning discipline.
* **Distribution targets align to documented patterns**

  * Rationale: matches real installation and invocation mechanics for Gemini CLI, MCP, and LM Studio plugins.
  * Trade-off: packaging logic increases surface area; mitigated by generating artifacts from the same pack manifest.

---

## 8) Test Strategy

### Test pyramid targets

* **Unit**: 70% (schema validation, formatting, error mapping, parsers)
* **Integration**: 25% (git repo fixtures, command stubs, registry discovery)
* **E2E**: 5% (CLI end-to-end with fixture packs and golden outputs)

### Coverage minimums

* Line: 85%
* Branch: 75%
* Function: 85%
* Statement: 85%

### Critical scenarios (by module)

* **workflow/spec**

  * Happy: valid workflow parses and validates.
  * Error: missing required fields → structured validation errors.
* **runner/steps**

  * Shell step nonzero exit → run stops, artifacts preserved.
  * AI step missing required sections → contract failure.
  * Gate step branching correctness (approve vs request-changes).
* **integrations/github-gh**

  * Missing `gh` produces `PrereqMissingError` with fix hint.
* **adapters/cli**

  * Exit code stability across statuses; JSON artifact emitted on both success and failure.

### Integration points

* PR review workflow uses `gh pr view/diff/review` command contract as documented.

---

## 9) Risks and Mitigations

### Risk: Host capability mismatch (interactive gates vs CI)

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Require gate satisfaction via params in non-interactive mode; enforce in runner.
* **Fallback**: Provide “analysis-only” variants that never execute side-effect steps.

### Risk: External CLI drift (`gh`, linters, test runners)

* **Impact**: High
* **Likelihood**: High
* **Mitigation**: Prereq checks per workflow; version hints; command adapters with parse tolerance.
* **Fallback**: Allow user-supplied command templates per repo.

### Risk: Output instability from AI steps

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Strict output schemas + post-validators; retry policy optional but off by default.
* **Fallback**: Provide deterministic non-AI fallback steps where feasible (e.g., pure command summaries).

### Risk: Security/secrets leakage in artifacts

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Central redaction in context builder + formatter; denylist env keys; never log raw env.
* **Fallback**: “Safe mode” that disables artifact persistence and logs only summaries.

---

## 10) Appendix

### Source anchors (from provided drafts)

* Distribution patterns A–D (Gemini extension, MCP server, standalone CLI, LM Studio plugin).
* Cline workflow-file conventions and daily workflow catalog examples (PR review, lint sweep, test triage, changelog, hooks).
* Ask/Do/Compose workflow framing and CI/deploy automation examples.

### MVP definition (smallest end-to-end usable path)

* Standalone CLI adapter + workflow registry + runner + PR review workflow + one maintenance workflow + JSON artifacts.

### Open questions (explicitly tracked)

* Canonical workflow spec format choice (YAML vs JSON vs TS objects) and schema evolution policy.
* Whether to generate Cline `.clinerules/workflows/*.md` as a build artifact from the host-agnostic spec, or treat them as first-class authored sources.
* Standard set of required integrations for “default pack” (minimum binaries per workflow).
