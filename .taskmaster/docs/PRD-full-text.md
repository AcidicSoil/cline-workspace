## 1) Overview

### Problem

AI-assisted engineering workflows are currently ad-hoc: prompts drift, steps vary by person, and automations are brittle across environments (terminal agents, chat apps, CI). Teams need a repeatable, distributable workflow pack that exposes the same “daily engineering” actions (PR review, lint sweep, test triage, etc.) through multiple host surfaces (standalone CLI, MCP tools, Gemini CLI extension, LM Studio tools) without rewriting workflows per host.

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
* **Adoption:** ≥60% of active engineers run at least one packaged workflow weekly (via local run history + CI invocations).
* **Time-to-action:** PR review summary produced in ≤2 minutes median after diff fetch (excluding network latency).
* **Error budget:** <5% runs fail due to missing prerequisites without producing a clear “missing dependency” report.

### Constraints and assumptions

* Must support distribution patterns: **Gemini CLI extension**, **MCP server**, **Standalone CLI**, **LM Studio TypeScript plugin**.
* For Cline-compatible “workflow files,” repo-local storage under `.clinerules/workflows/` is supported and expected.
* Many workflows assume external CLIs exist (`gh`, `git`, language linters/test runners).
* **Native MCP requirement:** the MCP surface must be a **standalone native MCP server** (usable by any MCP host), not Gemini-extension-scoped MCP logic. Gemini extension may only *reference/launch* the native server.
* **MVP definition (assumption):** smallest end-to-end usable path ships via **Standalone CLI + workflow runner + registry + PR review + one maintenance workflow + JSON artifacts**; MCP and other host surfaces are delivered after the CLI baseline.

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

#### Feature: Shell command step (MVP)

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

### Capability: Tool Integrations (MVP for Git/GitHub)

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

#### Feature: Test runner integration (MVP for one maintenance workflow)

* **Description**: Run project tests and capture logs for analysis.
* **Inputs**: Test command; optional scope selector.
* **Outputs**: Test output log; pass/fail; failure signatures.
* **Behavior**: Run then analyze; allow “run anyway” even on failure to capture logs.

#### Feature: Linter integration (MVP for one maintenance workflow)

* **Description**: Run linting, optionally apply fixes, re-run to confirm clean state.
* **Inputs**: Lint command; fix command policy.
* **Outputs**: Lint logs; applied diff summary; final status.
* **Behavior**: Minimal-diff policy; require final clean run for success.

#### Feature: CI-friendly mode (MVP)

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
* **Behavior**: Map CLI args to workflow params; select formatter; support E2E validation requirement.

#### Feature: Native MCP server runtime (Non-MVP host surface; MCP-MVP when started)

* **Description**: Expose each workflow as a native MCP tool callable by any compatible MCP client, independent of Gemini extension.
* **Inputs**: MCP client requests; server config; workflow registry; tool invocation payloads (workflow params).
* **Outputs**: MCP `tools/list` tool definitions (with `inputSchema`); `tools/call` results; structured errors.
* **Behavior**: Implement MCP lifecycle (initialize/ready); one tool per workflow; validate args against schema; execute via shared runner; enforce stdout/stderr separation for stdio transport.

#### Feature: Gemini CLI extension packaging (Non-MVP)

* **Description**: Generate `gemini-extension.json` mapping workflows to `customCommands`, optionally declaring `mcpServers` and `contextFiles`.
* **Inputs**: Pack manifest; selected workflow list; optional MCP server launch config.
* **Outputs**: `gemini-extension.json`; install docs snippet.
* **Behavior**: Deterministic command naming; may reference/launch the native MCP server, but must not implement MCP server logic inside the extension.

#### Feature: LM Studio plugin packaging (Non-MVP)

* **Description**: Provide an LM Studio TypeScript plugin exposing workflows as tools via a Tools Provider.
* **Inputs**: Pack config (workspaceRoot, packsDir); workflow set.
* **Outputs**: `manifest.json`; tools provider list; runnable plugin bundle.
* **Behavior**: One tool per workflow; configuration must not assume editor workspace state.

---

### Capability: Built-in Daily Engineering Workflows (MVP: PR Review + one maintenance workflow)

Ship a default catalog aligned with common workflow patterns.

#### Feature: PR review workflow (MVP)

* **Description**: Fetch PR metadata + diff, analyze risk, produce structured review, optionally submit via `gh`.
* **Inputs**: PR number/URL; repo path; review action choice.
* **Outputs**: Review report (Must fix / Should fix / Nits / Questions); optional `gh pr review` result.
* **Behavior**: Sequence: view → diff → analyze → choose action → (optional) submit; deterministic headings and JSON keys.

#### Feature: One maintenance workflow (MVP; choose one)

* **Option A: Daily lint sweep auto-fix workflow**

  * **Description**: Run linter, apply minimal fixes, re-run lint/tests, summarize remaining issues.
  * **Inputs**: Lint command(s); optional test command.
  * **Outputs**: Fixed diff summary; final lint status; remaining issues list.
  * **Behavior**: “lint → fix → re-run” cadence; enforce minimal diff policy; fail if final lint not clean.
* **Option B: Test run + failure triage workflow**

  * **Description**: Run tests, cluster failures, propose fix order, optionally apply minimal fixes and re-run.
  * **Inputs**: Test command; optional scope selector.
  * **Outputs**: Failure clusters; likely causes; suggested next steps; optional patch summary.
  * **Behavior**: Group by signature/module; prioritize minimal fixes; deterministic summary shape.

---

## 3) Repository Structure + Module Definitions (Structural Decomposition)

### Repository structure

```
workflow-pack/
├── packages/
│   ├── foundation/
│   │   ├── types/
│   │   ├── errors/
│   │   ├── config/
│   │   └── logging/
│   ├── workflow/
│   │   ├── spec/
│   │   ├── manifest/
│   │   └── registry/
│   ├── runner/
│   │   ├── context/
│   │   ├── steps/
│   │   └── formatting/
│   ├── integrations/
│   │   ├── git/
│   │   ├── github-gh/
│   │   ├── linter/
│   │   └── test-runner/
│   ├── workflows/
│   │   ├── pr-review/
│   │   └── maintenance/         # lint-sweep OR test-triage
│   └── adapters/
│       ├── cli/
│       ├── mcp-server/
│       │   ├── protocol/
│       │   ├── transports/
│       │   │   ├── stdio/
│       │   │   └── http/         # optional
│       │   ├── tools/
│       │   └── runtime/
│       ├── gemini-extension/
│       └── lmstudio-plugin/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

Native MCP module split is required to keep protocol/transport/tool-binding boundaries explicit.

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

#### Module: `workflows/pr-review`

* **Responsibility**: PR review workflow definition + prompt templates + prereqs.
* **Exports**: `workflowDefinition`, `defaultParams`, `prereqs`, `docs`.

#### Module: `workflows/maintenance`

* **Responsibility**: Single chosen maintenance workflow definition (lint-sweep OR test-triage).
* **Exports**: `workflowDefinition`, `defaultParams`, `prereqs`, `docs`.

#### Module: `adapters/cli`

* **Responsibility**: CLI argument parsing → workflow run invocation.
* **Exports**: `main(argv)`, `commands`.

#### Module: `adapters/mcp-server/protocol`

* **Responsibility**: JSON-RPC method routing and MCP lifecycle state machine.
* **Exports**: `createMcpRouter()`, `handleInitialize()`, `handleInitializedNotification()`, `routeRequest(req)`.

#### Module: `adapters/mcp-server/transports/stdio`

* **Responsibility**: Stdio framing/parsing/writing for newline-delimited JSON-RPC; stderr logging only.
* **Exports**: `startStdioTransport(router, options)`, `parseLine(line)`, `writeMessage(msg)`.

#### Module: `adapters/mcp-server/transports/http` (optional)

* **Responsibility**: HTTP transport mapping requests to router invocations.
* **Exports**: `startHttpTransport(router, options)`.

#### Module: `adapters/mcp-server/tools`

* **Responsibility**: Convert workflow registry entries into MCP tool definitions and execute tool calls.
* **Exports**: `listTools(registry)`, `getTool(name)`, `callTool(name, args, runCtx)`.

#### Module: `adapters/mcp-server/runtime`

* **Responsibility**: Server bootstrap wiring (config → registry → runner binding → protocol → transport).
* **Exports**: `startMcpServer(config)`, `buildServerContext(config)`.

#### Module: `adapters/gemini-extension`

* **Responsibility**: Generate `gemini-extension.json` from pack manifest/workflow registry; optionally reference native MCP server launch config.
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
* **workflows/maintenance**: Depends on:

  * If lint-sweep: [workflow/spec, integrations/linter, runner/steps, runner/context]
  * If test-triage: [workflow/spec, integrations/test-runner, runner/steps, runner/context]

### Adapter layer (Phase 5+)

* **adapters/cli**: Depends on: [workflow/registry, runner/steps, runner/formatting, workflow/manifest]
* **adapters/mcp-server/protocol**: Depends on: [foundation/types, foundation/errors, foundation/logging]
* **adapters/mcp-server/tools**: Depends on: [workflow/registry, workflow/manifest, runner/steps, runner/formatting, foundation/errors, foundation/logging]
* **adapters/mcp-server/transports/stdio**: Depends on: [adapters/mcp-server/protocol, foundation/logging, foundation/errors]
* **adapters/mcp-server/transports/http (optional)**: Depends on: [adapters/mcp-server/protocol, foundation/logging, foundation/errors]
* **adapters/mcp-server/runtime**: Depends on: [adapters/mcp-server/tools, adapters/mcp-server/protocol, adapters/mcp-server/transports/stdio, workflow/registry, foundation/config]
* **adapters/gemini-extension**: Depends on: [workflow/registry, workflow/manifest]
* **adapters/lmstudio-plugin**: Depends on: [workflow/registry, runner/steps, workflow/manifest]

No cycles: MCP protocol/transports do not depend on tool binding; tool binding does not depend on transports.

---

## 5) Development Phases (Phase 0…N)

### Phase 0: Foundation

**Entry criteria**: Repository initialized; test runner available.
**Tasks**:

* [ ] Implement `foundation/types` (depends on: none)

  * Acceptance criteria: Types compile; exported surface matches module definition.
  * Test strategy: Type-level compile tests.
* [ ] Implement `foundation/errors` (depends on: [foundation/types])

  * Acceptance criteria: Error taxonomy complete; stable exit code mapping.
  * Test strategy: Unit tests mapping error → exit code.
* [ ] Implement `foundation/config` (depends on: [foundation/types, foundation/errors])

  * Acceptance criteria: Loads config from file/env; redaction works.
  * Test strategy: Unit tests for precedence + redaction snapshots.
* [ ] Implement `foundation/logging` (depends on: [foundation/types, foundation/config])

  * Acceptance criteria: Structured logs with run correlation ID.
  * Test strategy: Unit tests verifying emitted JSON shape.
    **Exit criteria**: All foundation modules importable with zero circular deps; unit suite green.

---

### Phase 1: Workflow modeling

**Entry criteria**: Phase 0 complete.
**Tasks**:

* [ ] Implement `workflow/spec` (depends on: [foundation/types, foundation/errors])

  * Acceptance criteria: Valid workflows parse; invalid workflows return structured validation errors.
  * Test strategy: Golden fixtures (valid/invalid) + property tests on required fields.
* [ ] Implement `workflow/manifest` (depends on: [foundation/types, foundation/errors, foundation/config])

  * Acceptance criteria: Computes prereqs + host compatibility; version parsing stable.
  * Test strategy: Unit tests for compatibility matrix + semver fixtures.
* [ ] Implement `workflow/registry` (depends on: [workflow/spec, workflow/manifest, foundation/config, foundation/logging])

  * Acceptance criteria: Lists/resolves workflows deterministically across sources.
  * Test strategy: Integration tests with temp dirs containing multiple packs.
    **Exit criteria**: `list/get/search` works in-process with fixture packs.

---

### Phase 2: Runner core

**Entry criteria**: Phase 1 complete.
**Tasks**:

* [ ] Implement `runner/context` (depends on: [foundation/config, foundation/logging, workflow/spec])

  * Acceptance criteria: Context contains only declared inputs; provenance + redaction applied.
  * Test strategy: Unit tests for redaction and provenance fields.
* [ ] Implement `runner/steps` (shell + AI + gate) (depends on: [foundation/errors, foundation/logging, runner/context, workflow/spec])

  * Acceptance criteria: Steps execute; failures stop run with partial artifacts; gate branching correct.
  * Test strategy: Unit tests with mocked shell + mocked AI adapter; branching tests.
* [ ] Implement `runner/formatting` (depends on: [foundation/config, foundation/logging, foundation/errors, workflow/spec])

  * Acceptance criteria: Human + JSON outputs stable; artifacts written; no secrets included.
  * Test strategy: Snapshot tests for JSON schema; size-limit tests; secret redaction tests.
    **Exit criteria**: A trivial sample workflow runs end-to-end producing both text and JSON.

---

### Phase 3: Core integrations

**Entry criteria**: Phase 2 complete.
**Tasks**:

* [ ] Implement `integrations/git` (depends on: [foundation/errors, foundation/logging, foundation/config])

  * Acceptance criteria: Reads staged + range diffs; handles non-git gracefully.
  * Test strategy: Integration tests using a temp git repo fixture.
* [ ] Implement `integrations/github-gh` (depends on: [foundation/errors, foundation/logging, integrations/git, foundation/config])

  * Acceptance criteria: Detects missing `gh`; wraps `gh pr view/diff/review`.
  * Test strategy: Contract tests with command stubs; optional live tests gated by env.
* [ ] Implement exactly one of:

  * `integrations/linter` (depends on: [foundation/errors, foundation/logging, foundation/config])

    * Acceptance criteria: Captures lint/fix logs; confirms final clean run.
    * Test strategy: Command stub tests; parsing unit tests.
  * `integrations/test-runner` (depends on: [foundation/errors, foundation/logging, foundation/config])

    * Acceptance criteria: Captures logs and extracts failure signatures.
    * Test strategy: Fixture logs → expected clusters.
      **Exit criteria**: Integrations usable by workflows via the context builder.

---

### Phase 4: MVP workflow catalog

**Entry criteria**: Phase 3 complete.
**Tasks**:

* [ ] Implement `workflows/pr-review` (depends on: [workflow/spec, integrations/github-gh, runner/steps, runner/context])

  * Acceptance criteria: Produces structured review; optional submission via `gh`.
  * Test strategy: Fixture diff → expected report headings; submission path mocked.
* [ ] Implement `workflows/maintenance` (choose lint-sweep OR test-triage) (depends on corresponding integration + runner)

  * Acceptance criteria: Deterministic summary; correct exit codes; stable JSON artifact shape.
  * Test strategy: Fixture logs/diffs → expected structured output.
    **Exit criteria**: Two workflows runnable end-to-end via in-process runner.

---

### Phase 5: MVP host surface (Standalone CLI)

**Entry criteria**: Phase 4 complete.
**Tasks**:

* [ ] Implement `adapters/cli` (depends on: [workflow/registry, runner/steps, runner/formatting, workflow/manifest])

  * Acceptance criteria: `list` shows workflows; `run` executes with params; JSON output supported; correct exit codes.
  * Test strategy: E2E tests invoking CLI against fixture pack; golden JSON outputs.
    **Exit criteria**: Standalone CLI satisfies the shippable baseline with E2E validation.

---

### Phase 6: Additional distribution adapters (native MCP + generators)

**Entry criteria**: Phase 5 complete.
**Parallel tasks**:

* [ ] Implement native MCP server core (protocol + tools)

  * `adapters/mcp-server/protocol` (depends on: [foundation/types, foundation/errors, foundation/logging])

    * Acceptance criteria: Implements lifecycle; refuses tool calls until initialized/ready.
    * Test strategy: Unit tests for lifecycle state machine; JSON-RPC routing tests.
  * `adapters/mcp-server/tools` (depends on: [workflow/registry, runner/steps, runner/formatting, workflow/manifest])

    * Acceptance criteria: `tools/list` returns one tool per workflow with `inputSchema`; `tools/call` runs workflows and returns structured outputs/errors.
    * Test strategy: Integration tests with fixture workflows; schema validation tests.
* [ ] Implement MCP stdio transport + runtime bootstrap

  * `adapters/mcp-server/transports/stdio` (depends on: [adapters/mcp-server/protocol])

    * Acceptance criteria: newline-delimited JSON-RPC on stdout; logs to stderr only.
    * Test strategy: Transport unit tests for framing; stdout/stderr separation assertions.
  * `adapters/mcp-server/runtime` (depends on: [tools, protocol, stdio, workflow/registry, foundation/config])

    * Acceptance criteria: Standalone server runnable; config selects packs/workflows and cwd policy.
    * Test strategy: E2E harness spawning process and executing `initialize → tools/list → tools/call` over stdio.
* [ ] Implement `adapters/gemini-extension` generator (depends on: [workflow/registry, workflow/manifest])

  * Acceptance criteria: Generates valid `gemini-extension.json` mapping commands; may reference native MCP server, but does not embed MCP server logic.
  * Test strategy: Snapshot tests of generated JSON.
* [ ] Implement `adapters/lmstudio-plugin` (depends on: [workflow/registry, runner/steps, workflow/manifest])

  * Acceptance criteria: Tools Provider returns tool list; config fields present for paths; plugin runs.
  * Test strategy: Node-level integration tests for provider return shapes.
    **Exit criteria**: Same workflow set accessible through native MCP + generated Gemini extension + LM Studio plugin surface.

---

## 6) User Experience

### Personas

* **Solo engineer**: Wants quick local “run PR review” / “run maintenance workflow” with minimal setup.
* **Team reviewer**: Wants standardized PR review output sections and optional auto-submit.
* **CI maintainer**: Wants non-interactive runs with stable artifacts and exit codes.

### Key flows

* **Standalone CLI**: install pack → `list` workflows → `run pr-review --pr <id> --format json`.
* **Cline workflow-file consumption**: commit workflows under `.clinerules/workflows/` and invoke by convention.
* **Native MCP**: MCP host connects → `tools/list` → `tools/call` per workflow tool.
* **Gemini CLI**: enable extension → run mapped custom commands; extension may launch/reference native MCP server.
* **LM Studio**: install plugin → workflows appear as tools via Tools Provider.
* **CI**: run in non-interactive mode → store JSON artifact → fail build on thresholds.

### UX notes (capability-tied)

* Canonical headings/JSON keys across workflows for skimmability and downstream automation.
* Human gates are explicit and auditable; CI mode requires gates to be pre-decided via params.

---

## 7) Technical Architecture

### System components

* **Pack loader + registry**: discovers workflows, validates schemas, checks host compatibility.
* **Runner**: executes typed steps with a shared context object and structured results.
* **Integrations**: wrappers around `git`, `gh`, linters, test runners.
* **Adapters**: translate host invocations (CLI args, MCP calls, Gemini custom commands, LM Studio tools) into workflow runs.
* **Native MCP server**: separate protocol router + transport + tool-binding to runner; not Gemini-scoped.

### Data models (core)

* `Workflow`: `{ id, name, version, description, params[], steps[], outputs[] }`
* `Step`: union of `{ type: "shell" | "ai" | "gate", ... }`
* `RunResult`: `{ runId, workflowId, status, startedAt, finishedAt, steps[], artifacts[], warnings[] }`
* `Prereq`: `{ kind: "binary" | "env" | "auth", name, checkCommand, fixHint }`

### APIs and integration contracts

* Runner API: `runWorkflow(workflowId, params, hostContext) -> RunResult`.
* Host AI adapter: `invokeAi(prompt, schema) -> { text|json, meta }`.
* Gate adapter: `requestGate(choices) -> choice`.
* Native MCP mapping: one MCP tool per workflow; schemas derived from workflow params; results returned as structured content/errors.

### Key decisions (rationale, trade-offs, alternatives)

* **Host-agnostic workflow spec + host-specific adapters**

  * Rationale: minimizes duplication; keeps workflows consistent across surfaces.
  * Trade-off: adapters must bridge capability mismatches (interactive gates vs CI vs MCP).
  * Alternatives: per-host workflow definitions (rejected due to drift/duplication).
* **Deterministic JSON outputs as first-class**

  * Rationale: enables CI gating and downstream automation.
  * Trade-off: stricter contracts; requires schema versioning discipline.
  * Alternatives: free-form text only (rejected due to non-deterministic parsing).
* **Native MCP server as a standalone runtime**

  * Rationale: any MCP host can use it; Gemini extension remains a packaging wrapper.
  * Trade-off: additional protocol/transport surface area to test.
  * Alternatives: Gemini-only MCP shim (explicitly rejected).

---

## 8) Test Strategy

### Test pyramid targets

* **Unit**: ~70% (schema validation, formatting, error mapping, parsers, MCP protocol state machine)
* **Integration**: ~25% (git repo fixtures, command stubs, registry discovery, MCP tools binding)
* **E2E**: ~5% (CLI E2E with fixture pack; MCP stdio contract harness).

### Coverage minimums

* Line: 85%
* Branch: 75%
* Function: 85%
* Statement: 85%

### Critical scenarios (by module)

* **workflow/spec**: valid parses; invalid returns structured validation errors.
* **runner/steps**: shell nonzero exit stops run with partial artifacts; AI output contract enforcement; gate branching correctness.
* **integrations/github-gh**: missing `gh` produces `PrereqMissingError` with fix hint.
* **adapters/cli**: exit code stability; JSON artifact emitted on success/failure.
* **adapters/mcp-server/transports/stdio**: stdout never contains logs; stderr never contains protocol messages; newline framing enforced.
* **adapters/mcp-server/tools**: `tools/list` deterministic ordering; `tools/call` arg validation against `inputSchema`; rejects calls before initialized.

---

## 9) Risks and Mitigations

### Risk: Host capability mismatch (interactive gates vs CI/MCP)

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Require gate satisfaction via params in non-interactive mode; enforce in runner; in MCP, return structured “gate required” error when unsatisfied.
* **Fallback**: Provide “analysis-only” workflow variants that never execute side-effect steps.

### Risk: External CLI drift (`gh`, linters, test runners)

* **Impact**: High
* **Likelihood**: High
* **Mitigation**: Prereq checks per workflow; version hints; command adapters with tolerant parsing.
* **Fallback**: Allow user-supplied command templates per repo.

### Risk: Output instability from AI steps

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Strict output schemas + post-validators; retries off by default.
* **Fallback**: Deterministic non-AI fallback steps where feasible.

### Risk: Security/secrets leakage in artifacts

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Central redaction in context builder + formatter; denylist env keys; never log raw env.
* **Fallback**: “Safe mode” disabling artifact persistence and logging only summaries.

### Risk: MCP protocol/transport incompatibility across hosts

* **Impact**: High
* **Likelihood**: Medium
* **Mitigation**: Contract-test suite over stdio; strict stdout/stderr separation; fuzz framing tests.
* **Fallback**: Diagnostics mode that reports negotiation/framing to stderr only.

---

## 10) Appendix

### Source anchors

* Baseline PRD for workflow pack capabilities, modules, dependencies, and CLI-first MVP.
* Revision note: MCP must be a native standalone server; Gemini extension may only reference it.

### MVP definition (smallest end-to-end usable path)

* Standalone CLI adapter + workflow registry + runner + PR review workflow + one maintenance workflow + JSON artifacts.

### Open questions

* Canonical workflow spec authoring format: YAML vs JSON vs TS objects; schema evolution policy.
* Whether to generate Cline `.clinerules/workflows/*.md` as a build artifact from the host-agnostic spec or treat them as authored sources.
* Standard minimum prerequisite set for the default pack (required binaries per workflow).
