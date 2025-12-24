## 1) Overview

### Problem

Your workflow pack (Cline-based automations: PR review gate, pre-commit risk gate, changelog, lint sweep) is well-scoped, but users of Gemini CLI + gemini-flow cannot treat it as a first-class, tool-invocable capability set. The missing piece is a stable “bridge” that exposes your pack as **tools** (for orchestration) and optionally as **Gemini CLI extension commands** (for UX), while allowing a dependency-aware task graph (your `tasks.json`) to be imported into gemini-flow’s task system for coordinated execution.

### Target users

* Maintainers/DevOps using Gemini CLI and gemini-flow to coordinate multi-step engineering automation across repos. ([Gemini CLI][1])
* Engineers who want deterministic “run workflow X” tooling surfaced inside Gemini CLI, while gemini-flow handles orchestration (agents/swarms/tasks). ([GitHub][2])

### Why current solutions fail

* Workflow pack is runnable, but not exposed as MCP tools, so gemini-flow cannot reliably invoke it as composable tool calls. ([Gemini CLI][3])
* Task graphs exist (`tasks.json`) but are not importable into gemini-flow’s task routing, so coordination and dependency enforcement are manual.

### Success metrics

* ≥80% of “run workflow” invocations succeed without manual fixes (local + CI headless).
* ≥90% of `tasks.json` nodes import with correct dependency edges and stable IDs (idempotent import).
* ≤5% false-block rate for gates after standard verdict formatting and robust parsing.

### Constraints / assumptions

* Gemini CLI supports extensions packaging prompts/MCP servers/custom commands. ([Gemini CLI][1])
* Gemini CLI connects to MCP servers via `mcpServers` in `~/.gemini/settings.json`. ([Gemini CLI][3])
* MCP uses JSON-RPC 2.0; tools are the primary invocation surface. ([Model Context Protocol][4])
* gemini-flow provides orchestration commands (hive-mind/swarm/agent/task) and bundles MCP servers. ([GitHub][2])

---

## 2) Capability Tree (Functional Decomposition)

### Capability: Pack Tool Exposure via MCP (MVP)

#### Feature: MCP tool `list_workflows`

* **Description**: Return the workflow catalog (IDs, modes, prerequisites, inputs/outputs).
* **Inputs**: Local pack manifest.
* **Outputs**: JSON array of `WorkflowInfo`.
* **Behavior**: Load manifest; normalize schema; optionally include installed status and required binaries (`cline`, `git`, `gh`).  ([Gemini CLI][3])

#### Feature: MCP tool `run_workflow`

* **Description**: Execute a workflow deterministically (headless or interactive) and return structured results.
* **Inputs**: `workflow_id`; `inputs` object; execution mode override; artifact directory override.
* **Outputs**: `RunResult` { exitCode, stdout, stderr, artifactsWritten[], verdict? }.
* **Behavior**: Resolve workflow runner; execute; write artifacts; return exit code + artifact paths.  ([Model Context Protocol][5])

#### Feature: MCP tool `install_pack`

* **Description**: Bootstrap workflow files/scripts into a target repo.
* **Inputs**: target path; selection; overwrite policy.
* **Outputs**: install plan + applied actions + conflicts.
* **Behavior**: Compute plan; apply file operations; preserve local changes per policy; write install report.  ([Model Context Protocol][5])

### Capability: Gemini CLI Extension Surface (Optional UX Layer)

#### Feature: Extension command `pack list`

* **Description**: Human-readable list + JSON output option.
* **Inputs**: output format flag.
* **Outputs**: printed list or JSON.
* **Behavior**: Calls MCP `list_workflows` (preferred) or local manifest loader fallback. ([Gemini CLI][1])

#### Feature: Extension command `pack run <id>`

* **Description**: Run a workflow from Gemini CLI without manually wiring MCP calls.
* **Inputs**: workflow id; flags; inputs file/stdin.
* **Outputs**: printed summary; exit code.
* **Behavior**: Calls MCP `run_workflow`; prints artifact locations; exits with returned code. ([Gemini CLI][1])

### Capability: `tasks.json` ↔ gemini-flow Task Graph Bridge (MVP)

#### Feature: Import `tasks.json` into gemini-flow tasks

* **Description**: Convert your dependency-aware tasks into gemini-flow task items for assignment/execution.
* **Inputs**: path to `tasks.json`; import namespace; id mapping strategy.
* **Outputs**: created/updated gemini-flow tasks; dependency map persisted.
* **Behavior**: Parse tasks; create stable external IDs; encode dependencies; store mapping in gemini-flow memory; idempotent re-import updates titles/statuses without duplicating.  ([GitHub][2])

#### Feature: Export gemini-flow task status back to JSON

* **Description**: Emit an updated task graph snapshot for CI dashboards or repo artifacts.
* **Inputs**: namespace; output path.
* **Outputs**: JSON task graph with statuses and timestamps.
* **Behavior**: Query gemini-flow tasks; join with stored ID mapping; write artifact. ([GitHub][2])

### Capability: Gating Standardization for Orchestrators (MVP)

#### Feature: Verdict contract enforcement

* **Description**: Make gate workflows produce machine-parseable PASS/FAIL or ALLOW/BLOCK with required sections.
* **Inputs**: raw model output; policy config.
* **Outputs**: `Verdict` object + normalized markdown.
* **Behavior**: Strict header parsing; fallback to “inconclusive” category; configurable fail-open/fail-closed per environment.

---

## 3) Repository Structure + Module Definitions (Structural Decomposition)

### Repository Structure

```
workflow-pack/
├── pack/
│   ├── workflows/
│   └── scripts/
├── src/
│   ├── manifest/
│   ├── install/
│   ├── cline/
│   ├── git/
│   ├── github/
│   ├── gating/
│   ├── render/
│   ├── report/
│   ├── mcp/                 # NEW: MCP server exposing pack tools
│   ├── gemini_ext/          # NEW (optional): Gemini CLI extension manifest + wrappers
│   └── taskbridge/          # NEW: tasks.json import/export + mapping storage
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

(Existing base modules align to your current PRD.)

### Module: `mcp`

* **Maps to capability**: Pack Tool Exposure via MCP
* **Responsibility**: Implement MCP server endpoints for `list_workflows`, `run_workflow`, `install_pack`.
* **Exports**:

  * `startServer(config): void`
  * `registerTools(registry): Tool[]`
  * `handleListWorkflows(args): WorkflowInfo[]`
  * `handleRunWorkflow(args): RunResult`
  * `handleInstallPack(args): InstallResult`
* **Notes**: Align tool schemas to MCP “tools” model. ([Model Context Protocol][4])

### Module: `taskbridge`

* **Maps to capability**: `tasks.json` ↔ gemini-flow Task Graph Bridge
* **Responsibility**: Parse/import/export task graphs; persist ID mappings.
* **Exports**:

  * `loadTasksJson(path): TaskGraph`
  * `importToGeminiFlow(graph, opts): ImportResult`
  * `exportFromGeminiFlow(opts): TaskGraph`
  * `persistMapping(store, mapping): void`
  * `loadMapping(store): Mapping`
* **Notes**: Uses gemini-flow task + memory surfaces. ([GitHub][2])

### Module: `gemini_ext` (optional)

* **Maps to capability**: Gemini CLI Extension Surface
* **Responsibility**: Provide `gemini-extension.json` + command wrappers.
* **Exports**:

  * `buildExtensionManifest(): object`
  * `commandPackList(args): ExitCode`
  * `commandPackRun(args): ExitCode`
* **Notes**: Extension packaging rules per Gemini CLI docs. ([Gemini CLI][1])

(Existing module definitions remain as in `PRD.md`.)

---

## 4) Dependency Chain (layers, explicit “Depends on: […]”)

### Foundation Layer

* **manifest**: Depends on: []
* **render**: Depends on: []
* **report**: Depends on: []

### Execution Layer

* **cline**: Depends on: [report, render]
* **git**: Depends on: []
* **gating**: Depends on: []

### Integration Layer

* **github**: Depends on: [report]

### Bridge Layer (NEW)

* **mcp**: Depends on: [manifest, install, cline, report, gating]
* **taskbridge**: Depends on: [report]
* **gemini_ext** (optional): Depends on: [mcp] ([Gemini CLI][1])

Acyclic: Bridge consumes existing layers; nothing in base depends on Bridge.

---

## 5) Development Phases (topo order)

### Phase 0: Bridge foundations

**Entry**: existing foundation modules stable.
**Tasks**:

* [ ] Implement `taskbridge.loadTasksJson` + graph model (depends on: [])

  * Acceptance: parses `tasks.json` including nested subtasks and dependency lists.
  * Test: unit tests with fixture graphs; invalid schema cases.
* [ ] Implement `mcp` tool schemas + skeleton server (depends on: [])

  * Acceptance: server starts; tools register with correct JSON schemas. ([Model Context Protocol][5])
  * Test: contract tests validating schemas and request/response envelopes.

**Exit**: MCP server boots; task graph parses.

### Phase 1: MCP tool implementations

**Entry**: Phase 0 complete.
**Tasks**:

* [ ] `mcp.handleListWorkflows` (depends on: [manifest])

  * Acceptance: lists workflows identical to manifest list.
  * Test: unit tests against known manifest registry.
* [ ] `mcp.handleRunWorkflow` (depends on: [cline, report, gating])

  * Acceptance: returns `RunResult`; artifacts written; exitCode preserved.
  * Test: integration tests with mocked runner.
* [ ] `mcp.handleInstallPack` (depends on: [install, report])

  * Acceptance: produces plan + apply results; idempotent re-run.
  * Test: integration tests in temp dirs.

**Exit**: All three MCP tools function end-to-end.

### Phase 2: gemini-flow task integration

**Entry**: Phase 0 task parsing complete.
**Tasks**:

* [ ] `taskbridge.importToGeminiFlow` (depends on: [taskbridge.loadTasksJson])

  * Acceptance: imports top-level tasks + subtasks; preserves dependencies; idempotent updates.
  * Test: unit tests for mapping; integration tests using gemini-flow task APIs/CLI contract. ([GitHub][2])
* [ ] `taskbridge.exportFromGeminiFlow` (depends on: [taskbridge.importToGeminiFlow])

  * Acceptance: exports updated statuses and writes artifact.
  * Test: integration tests; golden JSON output.

**Exit**: `tasks.json` round-trips with stable IDs.

### Phase 3: Optional Gemini CLI extension packaging

**Entry**: MCP server stable.
**Tasks**:

* [ ] `gemini_ext` manifest + commands (depends on: [mcp])

  * Acceptance: `gemini extensions install ...` and command invocation works; commands call MCP tools. ([Gemini CLI][1])
  * Test: e2e tests in controlled environment with settings injection.

**Exit**: Users can install extension and run `pack list/run` from Gemini CLI.

---

## 6) User Experience

### Personas

* **Orchestrator maintainer**: uses gemini-flow to allocate work, enforce dependency order, and run pack tools as needed. ([GitHub][2])
* **Workflow consumer**: installs an extension and runs workflows with predictable artifacts and exit codes. ([Gemini CLI][1])

### Key flows

* Configure MCP server in `~/.gemini/settings.json` → verify in CLI (`/mcp list`) → gemini-flow swarm uses tools to install/run workflows. ([Gemini CLI][3])
* Import `tasks.json` → gemini-flow tasks created/assigned → each task invokes `run_workflow` where applicable → export status snapshot to artifacts.  ([GitHub][2])

---

## 7) Technical Architecture

### Components

* **Workflow pack**: manifest + runners + artifact writer (existing).
* **MCP server**: tool surface for list/run/install. ([Model Context Protocol][4])
* **Gemini CLI**: hosts MCP connections and extension commands. ([Gemini CLI][1])
* **gemini-flow**: orchestration layer (agents/swarms/tasks/memory). ([GitHub][2])

### Data models

* `WorkflowInfo` / `RunResult` / `Verdict` (existing).
* `TaskGraph` (from `tasks.json`): nodes, edges, statuses, mapping.

### APIs / integrations

* MCP “tools” invocation contract. ([Model Context Protocol][5])
* Gemini CLI `mcpServers` settings and discovery commands. ([Gemini CLI][3])

---

## 8) Test Strategy

* **Unit**: `taskbridge` parsing/mapping; `gating` parsing robustness; manifest schema validation.
* **Contract**: MCP tool schema validation + tool call/response fixtures. ([Model Context Protocol][5])
* **Integration**: temp repo installs; mocked runner execution; gemini-flow task import/export integration. ([GitHub][2])
* **E2E**: Gemini CLI settings config → `/mcp list` sees server → run workflow produces artifacts and correct exit code. ([Gemini CLI][3])

---

## 9) Risks and Mitigations

* **MCP spec/tooling changes** (tasks are marked experimental in MCP): keep tool surface minimal (list/run/install), version schemas, and add compatibility tests. ([Model Context Protocol][6])
* **Model output variability breaks gating**: strict output templates + robust parser + environment-specific fail policy (warn-only vs fail-closed).
* **User environment drift** (missing `cline`, `gh`, auth): preflight checks surfaced in `list_workflows` and `run_workflow` errors; deterministic exit codes.

---

## 10) Appendix

### Local artifacts

* `tasks.json` task graph and dependencies.
* Current workflow-pack PRD baseline.
* gemini-flow integration patterns (prior write-up).

### External references

* Gemini CLI extensions documentation. ([Gemini CLI][1])
* Gemini CLI MCP server configuration. ([Gemini CLI][3])
* gemini-flow repository (commands + bundled MCP servers). ([GitHub][2])
* MCP specification (tools, protocol overview). ([Model Context Protocol][4])

[1]: https://geminicli.com/docs/extensions/?utm_source=chatgpt.com "Gemini CLI extensions"
[2]: https://github.com/clduab11/gemini-flow?utm_source=chatgpt.com "clduab11/gemini-flow: rUv's Claude-Flow, translated to the ..."
[3]: https://geminicli.com/docs/tools/mcp-server/?utm_source=chatgpt.com "MCP servers with the Gemini CLI"
[4]: https://modelcontextprotocol.io/specification/2025-11-25?utm_source=chatgpt.com "Specification"
[5]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools?utm_source=chatgpt.com "Tools"
[6]: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks?utm_source=chatgpt.com "Tasks"
