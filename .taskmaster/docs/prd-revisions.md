## 1) Overview

### Problem

Workflow automation for daily engineering tasks (PR review, lint sweep, test triage) is duplicated across surfaces (editor workflows, CI scripts, tool servers). This causes drift, inconsistent guardrails, and non-deterministic outputs when used in automation.

### Target users

* Engineers authoring and running repo-local workflows in Cline (slash command workflows).
* DevEx/platform teams standardizing runbooks for CI and local usage.
* Tooling builders needing one workflow definition projected into multiple execution/distribution surfaces.

### Why current approaches fail

* Workflows are authored separately for editor and CI (drift).
* CI pipelines need deterministic outputs; interactive workflows and free-form output are brittle.
* Prereqs/guardrails (auth checks, ignore rules, hooks) are inconsistently applied.

### Success metrics

* One canonical workflow definition produces:

  * a deterministic `.clinerules/workflows/*.md` artifact (stable diffs)
  * a deterministic `scripts/run-*.sh` runner (stable JSON extraction)
* ≥90% runs in headless mode produce a stable JSON summary shape across identical inputs.
* <5% runs fail without a structured prereq error explaining what to install/authenticate.
* Generated artifacts are reproducible (bitwise-identical output given same inputs + versions).

### Constraints and assumptions

* Canonical source format is YAML + prompt markdown; build emits artifacts.
* Execution engine for workflows is **Cline** (editor workflows + Cline CLI), not a bespoke runner.
* Output parsing in automation standardizes on headless mode (`-y`) and JSON format (`-F json`) with a deterministic extraction strategy.
* If MCP is supported, it must be a **native standalone MCP server** (not Gemini-extension-scoped MCP). Gemini extension may only *reference/launch* the native server.

---

## 2) Capability Tree (Functional Decomposition)

### Capability: Canonical Pack Specification (MVP)

Define workflows once, compile into multiple targets.

#### Feature: Pack manifest (`pack.yaml`) parsing + validation (MVP)

* **Description**: Parse pack-level metadata (versions, targets, baseline prereqs, workflow entries).
* **Inputs**: `pack.yaml`
* **Outputs**: Pack model; structured validation errors
* **Behavior**: Enforce required fields; validate semver strings; resolve workflow file paths relative to pack root; reject unknown fields (with `x-*` escape hatch).

#### Feature: Workflow definition YAML parsing + validation (MVP)

* **Description**: Parse per-workflow YAML (id, version, params, prereqs, bindings to prompt templates, output contract).
* **Inputs**: `workflows/*.yaml`
* **Outputs**: Workflow model; structured validation errors
* **Behavior**: Schema-versioned; reject unknown fields by default; allow `x-*` fields (ignored unless a target opts in).

#### Feature: Prompt template loading (MVP)

* **Description**: Load `prompts/*.md` and bind workflow parameters/context into the prompt.
* **Inputs**: Prompt markdown; workflow params; target-specific context fragments
* **Outputs**: Rendered prompt text
* **Behavior**: Deterministic rendering; missing bindings are errors; supports stable ordering for injected sections.

---

### Capability: Schema and Evolution Policy (MVP)

Keep packs forward-compatible and automation-safe.

#### Feature: JSON schema generation + publication (MVP)

* **Description**: Provide `dist/schema/workflow.schema.json` corresponding to `schemaVersion`.
* **Inputs**: Internal schema definition (code)
* **Outputs**: JSON schema file
* **Behavior**: Schema changes follow semver policy; generator emits schema with stable ordering.

#### Feature: Versioning and strictness rules (MVP)

* **Description**: Enforce `schemaVersion` semantics and strict field policy.
* **Inputs**: Pack/workflow YAML
* **Outputs**: Errors/warnings; compatibility report
* **Behavior**: MAJOR = breaking, MINOR = additive, PATCH = clarifications/tightening; reject unknown fields; allow `x-*` escape hatch.

---

### Capability: Artifact Compilation Pipeline (MVP)

Compile canonical spec to deterministic artifacts.

#### Feature: Normalized compilation output (`dist/workflows.json`) (MVP)

* **Description**: Merge validated workflows into a normalized JSON representation.
* **Inputs**: Pack model; workflow models; prompts (resolved)
* **Outputs**: `dist/workflows.json`
* **Behavior**: Stable ordering; includes resolved prereqs; includes target compatibility; includes prompt hash for reproducibility.

#### Feature: Generate Cline editor workflows (`.clinerules/workflows/*.md`) (MVP)

* **Description**: Generate Markdown workflows suitable for invocation via `/filename.md`.
* **Inputs**: Workflow model; rendered prompt; prereqs; outputs contract; guardrails config
* **Outputs**: Markdown files in `.clinerules/workflows/`
* **Behavior**: Deterministic ordering; always includes:

  * prereqs section
  * outputs section
  * non-interactive guidance when headless target exists
  * optional “handoff strategy” section for long runs (new_task pattern)

#### Feature: Generate headless runner scripts (`scripts/run-*.sh`) (MVP)

* **Description**: Generate bash scripts that call Cline CLI in headless JSON mode and extract a deterministic completion artifact.
* **Inputs**: Workflow model; rendered prompt; prereqs; script target config
* **Outputs**: Scripts in `scripts/`
* **Behavior**: Deterministic templates; standardizes:

  * prereq checks (binary/auth)
  * `cline -y --mode act -F json ...`
  * extraction of final completion result into a stable file/stream contract

---

### Capability: Prereqs and Guardrails (MVP)

Make workflows safe and automation-friendly by default.

#### Feature: Baseline prereq checks (MVP)

* **Description**: Pack-level prereqs (e.g., `git`, `cline`) enforced for all workflows.
* **Inputs**: `baselinePrereqs`
* **Outputs**: Structured prereq report; script exit code policy
* **Behavior**: Fail fast with fix hints; supports “check only” mode.

#### Feature: Workflow-specific prereqs (MVP)

* **Description**: Add workflow prereqs (e.g., `gh`, `jq`, repo lint/test commands).
* **Inputs**: Workflow prereq list
* **Outputs**: Structured prereq report
* **Behavior**: Union with baseline prereqs; deterministic ordering in generated docs/scripts.

#### Feature: Context control defaults (MVP)

* **Description**: Recommend/provide `.clineignore` baseline to reduce noise and exclude generated artifacts.
* **Inputs**: Optional baseline ignore template
* **Outputs**: Generated or recommended `.clineignore`
* **Behavior**: If emitting a file, do not overwrite without explicit flag; otherwise output guidance in generated Markdown.

#### Feature: Hooks enablement policy (MVP)

* **Description**: Allow pack/workflow to specify whether hooks should be enabled by default for headless scripts.
* **Inputs**: pack/workflow policy flags
* **Outputs**: Script args (e.g., `-s hooks_enabled=true`) and Markdown guidance
* **Behavior**: Deterministic mapping of policy → CLI flags.

---

### Capability: Distribution Surfaces Beyond Cline (Non-MVP, optional)

(Kept compatible via normalized `dist/workflows.json`.)

#### Feature: Native MCP server over compiled workflows (optional)

* **Description**: Expose workflows as MCP tools using `dist/workflows.json` as the registry; execution may call generated scripts or invoke Cline CLI directly.
* **Inputs**: MCP tool calls; workflow params
* **Outputs**: MCP tool results (structured)
* **Behavior**: Standalone native MCP server; one tool per workflow; validates params against schema-derived `inputSchema`; returns deterministic JSON output.

#### Feature: Gemini CLI extension generator (optional)

* **Description**: Emit `gemini-extension.json` referencing generated scripts and/or the native MCP server.
* **Inputs**: pack + dist outputs
* **Outputs**: extension manifest
* **Behavior**: Does not implement MCP server logic inside the extension.

#### Feature: LM Studio tools provider generator (optional)

* **Description**: Provide an LM Studio plugin that lists tools based on `dist/workflows.json`.
* **Inputs**: dist output
* **Outputs**: plugin bundle
* **Behavior**: One tool per workflow; execution uses scripts or Cline CLI.

---

## 3) Repository Structure + Module Definitions (Structural Decomposition)

### Repository structure (recommended)

```
workflow-pack/
  pack.yaml
  workflows/
    pr-review.yaml
    lint-sweep.yaml
    test-triage.yaml
  prompts/
    pr_review.md
    lint_sweep.md
    test_triage.md
  dist/
    workflows.json
    schema/
      workflow.schema.json
  .clinerules/
    workflows/
      pr-review.md
      lint-sweep.md
      test-triage.md
  scripts/
    run-pr-review.sh
    run-lint-sweep.sh
    run-test-triage.sh
  src/
    foundation/
      types.ts
      errors.ts
      fs.ts
      stable_sort.ts
    spec/
      pack_parser.ts
      workflow_parser.ts
      schema.ts
      validator.ts
    compiler/
      compile.ts
      normalize.ts
      prompt_render.ts
      prereqs.ts
    targets/
      cline_md.ts
      cline_cli_script.ts
      dist_json.ts
      schema_json.ts
    cli/
      main.ts
      commands/
        build.ts
        validate.ts
        clean.ts
  tests/
    unit/
    integration/
    golden/
```

### Module definitions

#### `foundation/types`

* **Responsibility**: Pack/workflow/target data models.
* **Exports**: `Pack`, `Workflow`, `TargetConfig`, `Prereq`, `SchemaVersion`.

#### `foundation/errors`

* **Responsibility**: Typed errors + exit code mapping for CLI/build.
* **Exports**: `ValidationError`, `PrereqError`, `CompileError`, `exitCodeFor()`.

#### `foundation/fs`

* **Responsibility**: File IO with safe writes and deterministic newline policy.
* **Exports**: `readText()`, `writeTextAtomic()`, `ensureDir()`, `listFiles()`.

#### `foundation/stable_sort`

* **Responsibility**: Deterministic ordering primitives used across compilation.
* **Exports**: `stableSort()`, `stableStringify()`.

#### `spec/pack_parser`

* **Responsibility**: Parse + resolve `pack.yaml`.
* **Exports**: `parsePackYaml()`.

#### `spec/workflow_parser`

* **Responsibility**: Parse + resolve `workflows/*.yaml`.
* **Exports**: `parseWorkflowYaml()`.

#### `spec/schema`

* **Responsibility**: In-code schema definitions + version policy.
* **Exports**: `CURRENT_SCHEMA_VERSION`, `schemaDefinition`.

#### `spec/validator`

* **Responsibility**: Validate pack/workflow against schema rules (unknown fields, x-* escape).
* **Exports**: `validatePack()`, `validateWorkflow()`.

#### `compiler/prompt_render`

* **Responsibility**: Bind prompts + workflow params into deterministic prompt strings.
* **Exports**: `renderPrompt()`.

#### `compiler/prereqs`

* **Responsibility**: Merge baseline + workflow prereqs; generate prereq check blocks for targets.
* **Exports**: `resolvePrereqs()`, `renderPrereqSection()`, `renderPrereqChecksBash()`.

#### `compiler/normalize`

* **Responsibility**: Produce normalized workflow objects for `dist/workflows.json`.
* **Exports**: `normalizePack()`.

#### `compiler/compile`

* **Responsibility**: Orchestrate parse → validate → normalize → emit targets.
* **Exports**: `compilePack()`.

#### `targets/cline_md`

* **Responsibility**: Emit `.clinerules/workflows/*.md`.
* **Exports**: `emitClineMarkdown(workflow, outDir)`.

#### `targets/cline_cli_script`

* **Responsibility**: Emit `scripts/run-*.sh`.
* **Exports**: `emitClineRunnerScript(workflow, outDir, config)`.

#### `targets/dist_json`

* **Responsibility**: Emit `dist/workflows.json`.
* **Exports**: `emitDistWorkflowsJson(normalized, outPath)`.

#### `targets/schema_json`

* **Responsibility**: Emit `dist/schema/workflow.schema.json`.
* **Exports**: `emitSchemaJson(outPath)`.

#### `cli/main` + `cli/commands/*`

* **Responsibility**: CLI entry points (build/validate/clean).
* **Exports**: `main()`.

---

## 4) Dependency Chain (layers, explicit “Depends on: […]”)

### Foundation layer

* `foundation/types`: Depends on: []
* `foundation/errors`: Depends on: [foundation/types]
* `foundation/fs`: Depends on: [foundation/errors]
* `foundation/stable_sort`: Depends on: []

### Spec layer

* `spec/schema`: Depends on: [foundation/types]
* `spec/pack_parser`: Depends on: [foundation/types, foundation/errors, foundation/fs]
* `spec/workflow_parser`: Depends on: [foundation/types, foundation/errors, foundation/fs]
* `spec/validator`: Depends on: [foundation/types, foundation/errors, spec/schema]

### Compiler layer

* `compiler/prompt_render`: Depends on: [foundation/errors]
* `compiler/prereqs`: Depends on: [foundation/types, foundation/errors]
* `compiler/normalize`: Depends on: [foundation/types, foundation/stable_sort]
* `compiler/compile`: Depends on: [spec/*, compiler/*, targets/*]

### Targets layer

* `targets/dist_json`: Depends on: [foundation/fs, foundation/stable_sort]
* `targets/schema_json`: Depends on: [foundation/fs, spec/schema]
* `targets/cline_md`: Depends on: [foundation/fs, foundation/stable_sort, compiler/prereqs]
* `targets/cline_cli_script`: Depends on: [foundation/fs, compiler/prereqs]

### CLI layer

* `cli/main`: Depends on: [compiler/compile, foundation/errors]
* `cli/commands/build`: Depends on: [compiler/compile]
* `cli/commands/validate`: Depends on: [spec/*]
* `cli/commands/clean`: Depends on: [foundation/fs]

(Optional, later)

* `adapters/mcp-server/*`: Depends on: [dist/workflows.json consumer + CLI/script execution wrapper]; must be standalone native MCP.

---

## 5) Development Phases (topo-derived)

### Phase 0: Foundation

**Entry**: Repo created; test harness ready.
**Tasks**

* Implement `foundation/types`, `foundation/errors`, `foundation/fs`, `foundation/stable_sort`

  * **Acceptance**: deterministic stringify; atomic write; typed errors with exit codes
  * **Tests**: unit tests for stable stringify ordering; fs atomic write behavior

**Exit**: foundation modules complete; no cycles.

---

### Phase 1: Spec + validation

**Tasks**

* Implement `spec/schema` + `spec/validator`

  * **Acceptance**: unknown fields rejected; `x-*` accepted; schemaVersion policy enforced
  * **Tests**: fixtures for valid/invalid packs and workflows
* Implement `spec/pack_parser` + `spec/workflow_parser`

  * **Acceptance**: correct path resolution; structured errors with line/field hints when possible
  * **Tests**: parser fixtures; missing file tests

**Exit**: `validate` command works on a fixture pack.

---

### Phase 2: Normalization + dist output (deliver usable early)

**Tasks**

* Implement `compiler/normalize` + `targets/dist_json`

  * **Acceptance**: `dist/workflows.json` produced with stable ordering and hashes
  * **Tests**: golden file snapshot for normalized output

**Exit**: pack compiles to `dist/workflows.json`.

---

### Phase 3: Generate Cline Markdown workflows (MVP usable in editor)

**Tasks**

* Implement `compiler/prereqs` + `targets/cline_md`

  * **Acceptance**: `.clinerules/workflows/*.md` generated; includes prereqs and outputs sections; stable diffs
  * **Tests**: golden markdown snapshots; ordering tests

**Exit**: engineers can run generated workflows via Cline `/workflow.md`.

---

### Phase 4: Generate headless CLI runner scripts (MVP automation)

**Tasks**

* Implement `targets/cline_cli_script`

  * **Acceptance**: `scripts/run-*.sh` generated; performs prereq checks; runs `cline` headless JSON mode; extracts completion artifact deterministically
  * **Tests**: shellcheck (if used); unit tests for script template rendering; integration test that scripts are executable and reference correct paths

**Exit**: CI can call scripts and consume stable JSON output.

---

### Phase 5: CLI UX polish

**Tasks**

* Implement `cli/main` + `build/validate/clean`

  * **Acceptance**: `workflow-pack build` produces all targets; `workflow-pack clean` removes generated artifacts; exit codes reflect validation vs prereq vs compile errors
  * **Tests**: E2E tests against fixture repo verifying emitted files match goldens

**Exit**: shippable CLI + build pipeline.

---

### Phase 6: Optional distribution surfaces

**Parallelizable**

* Native MCP server (standalone)

  * **Acceptance**: `tools/list` from `dist/workflows.json`; `tools/call` runs script/Cline and returns structured output
  * **Tests**: stdio protocol contract tests; tool schema derived from workflow params
* Gemini extension generator referencing scripts/native MCP (no MCP logic inside extension)
* LM Studio tools provider generator referencing `dist/workflows.json`

---

## 6) User Experience

### Authoring flow

* Author `pack.yaml`, `workflows/*.yaml`, `prompts/*.md`.
* Run `workflow-pack build`.
* Commit generated `.clinerules/workflows/*.md` and `scripts/run-*.sh` (policy-driven; some teams may commit only sources and build in CI).

### Running flow

* **Editor (Cline)**: invoke `/pr-review.md` (generated).
* **Headless**: run `scripts/run-pr-review.sh` in CI; parse JSON result deterministically.

### UX notes

* Generated Markdown includes:

  * prereqs and fix hints
  * explicit outputs contract (files written, artifacts produced)
  * guidance for `.clineignore`
  * “handoff/new_task” guidance when workflows may exceed context limits
* Generated scripts use a uniform interface:

  * consistent env vars/flags for parameters
  * consistent artifact locations and exit codes

---

## 7) Technical Architecture

### Components

* **Compiler CLI**: parse/validate → normalize → emit targets.
* **Targets**: emit Cline Markdown workflows, bash runner scripts, dist JSON, JSON schema.
* **Execution**: performed by Cline (editor and CLI). The project does not implement a separate workflow runtime.

### Data and contracts

* `dist/workflows.json` is the canonical compiled registry for downstream surfaces (MCP, extension generators).
* Headless outputs are standardized via Cline CLI JSON stream extraction into a stable completion artifact.

### Key decisions

* **YAML-as-source, compile-to-artifacts**: reduces drift; enables reproducible builds.
* **Cline as execution engine**: avoids maintaining a runner; leverages Cline’s workflow semantics and CLI automation.
* **Strict schema + `x-*` escape hatch**: keeps automation safe while allowing experimental fields.
* **Native MCP requirement**: any MCP exposure must be via a standalone MCP server using the compiled registry.

---

## 8) Test Strategy

### Pyramid

* Unit: schema rules, parsing, normalization, deterministic rendering
* Golden tests: emitted markdown/scripts/json against snapshots
* Integration: compile a fixture pack and assert filesystem outputs
* E2E (optional): spawn headless script against a stubbed Cline binary in CI to validate invocation/extraction behavior

### Critical scenarios

* Unknown field rejection and `x-*` acceptance
* Stable ordering across runs (no diff when nothing changes)
* Missing prereq produces actionable error and nonzero exit code
* Script template correctly maps to `-y` and `-F json` and extracts completion result deterministically

---

## 9) Risks and Mitigations

* **Cline CLI output shape changes**

  * Mitigation: pin minimum supported Cline version in prereqs; build-time compatibility checks; robust extraction targeting stable markers.
* **Non-deterministic prompt rendering**

  * Mitigation: strict ordering rules; stable stringify; include prompt hash in dist output.
* **Repo-specific commands for lint/test**

  * Mitigation: workflow params for commands; document conventions; validate command presence optionally.
* **Secrets leakage into generated artifacts**

  * Mitigation: generator never inlines env values; only references variable names; recommend hooks and ignore rules.

---

## 10) Appendix

### Canonical pack layout (recommended)

* `pack.yaml` + `workflows/*.yaml` + `prompts/*.md`
* Generated:

  * `.clinerules/workflows/*.md`
  * `scripts/run-*.sh`
  * `dist/workflows.json`
  * `dist/schema/workflow.schema.json`

### Open questions

* Final YAML workflow schema: step granularity and required fields for output contracts.
* Standard parameter interface for scripts (env vars vs flags) and artifact locations.
* Whether generated artifacts are committed or built on-demand in CI.
