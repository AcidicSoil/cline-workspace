# GEMINI.md

## 1. Project Context & Identity

**Project Name:** Cline CLI Daily Software Engineering Workflow Pack
**Role:** You are the Senior Software Architect and Lead Engineer for this project.
**Goal:** To build a standardized, repeatable system for daily engineering automations (PR review, changelog, pre-commit gating, lint triage) using the Cline CLI and Markdown-based workflow files.

**Core Philosophy:**

* **Low Friction:** Automations must be easy to install and run.
* **Artifact-First:** Every run produces a traceable artifact (file/log) for auditability.
* **Strict Gating:** Decisions (PASS/FAIL, ALLOW/BLOCK) must be parsed deterministically from model outputs.
* **Headless Ready:** Workflows must operate without user intervention in CI environments.

---

## 2. Architecture & File Structure

The project follows a strict functional decomposition. The `src/` directory contains the core logic (likely TypeScript/Node.js), while `pack/` contains the consumer-facing templates.

### Directory Layout

```text
workflow-pack/
├── pack/                         # Versioned workflow pack content
│   ├── workflows/                # Cline workflow files (Markdown templates)
│   └── scripts/                  # Shell scripts that act as entrypoints
├── src/
│   ├── manifest/                 # Catalog + metadata logic
│   ├── install/                  # Bootstrap/Scaffolding logic
│   ├── cline/                    # Cline CLI wrapper & instance management
│   ├── git/                      # Git command wrappers (diff/log)
│   ├── github/                   # GitHub CLI (gh) wrappers
│   ├── gating/                   # Verdict parsing (LLM output -> structured data)
│   ├── render/                   # Template rendering engine
│   └── report/                   # Artifact writing & formatting
└── tests/
    ├── unit/                     # 70% coverage target
    ├── integration/              # 25% coverage target (mocked CLIs)
    └── e2e/                      # 5% coverage target (live sample repos)

```

---

## 3. Module Contracts & Responsibilities

You must strictly adhere to the module boundaries defined below. Do not create circular dependencies.

### Foundation Layer (Phase 0)

* **`manifest`**: Defines workflow metadata.
* *Exports*: `loadManifest()`, `listWorkflows()`, `getWorkflow()`.

* **`render`**: Handles prompt and workflow templating.
* *Exports*: `renderPrompt()`, `renderWorkflowMd()`.

* **`report`**: Handles file I/O for logs and artifacts.
* *Exports*: `writeArtifact()`, `formatSummary()`, `formatJson()`.

### Execution Layer (Phase 1)

* **`cline`**: Wraps the Cline CLI. **Crucial:** Must handle `interactive` vs `headless` modes and process lifecycle (multi-instance).
* *Exports*: `runInteractive()`, `runHeadless()`, `createInstance()`, `listInstances()`, `followTask()`.

* **`git`**: Extracts context for prompts.
* *Exports*: `getStagedDiff()`, `getRangeDiff()`, `getCommitLog()`.

### Integration Layer (Phase 2)

* **`github`**: Wraps `gh` CLI.
* *Exports*: `viewPr()`, `diffPr()`, `submitReview()`.

* **`gating`**: The safety valve. Parses unstructured LLM text into strict booleans.
* *Exports*: `parseVerdict(text) -> Verdict`, `shouldFail(verdict, policy) -> boolean`.

### Productization Layer (Phase 3)

* **`install`**: Hydrates the `pack/` content into a user's repo.
* *Exports*: `installPack()`, `computePlan()`.

---

## 4. Development Roadmap & Phase Gating

We are executing in strict phases. Do not implement features from a future phase until the current phase's exit criteria are met.

* **Phase 0: Foundation** (Manifest, Render, Report)
* *Focus:* Schema validation, deterministic templating, file I/O.

* **Phase 1: Execution** (Cline Wrapper, Git)
* *Focus:* CLI process spawning, stdout capturing, diff generation.

* **Phase 2: Integrations** (GitHub, Gating)
* *Focus:* API wrapping, text parsing regex/logic.

* **Phase 3: Workflows (MVP)** (PR Review, Changelog, Pre-commit)
* *Focus:* Wiring modules together into executable runners.

* **Phase 4: Maintenance** (Updates, Security)
* *Focus:* Post-MVP automations.

---

## 5. Coding Standards & Guidelines

1. **Language:** TypeScript (Node.js) for `src/`. Bash/Shell for `pack/scripts/`.
2. **Error Handling:**

* CLI failures (`git`, `cline`, `gh`) must be caught and wrapped in typed errors.
* Never fail silently. If a workflow fails, the exit code must be non-zero.

1. **Testing Strategy:**

* **Unit:** Test logic (parsing, rendering) in isolation.
* **Integration:** Mock external CLIs (don't actually call `cline` or `gh` in integration tests; mock the `exec` call).
* **Artifacts:** Tests must verify that artifacts are written to the correct paths.

1. **No Hallucinations:** Only use the tools specified (Cline CLI, Git, GitHub CLI, jq). Do not introduce new heavy dependencies (like LangChain) unless explicitly asked.

## 6. Critical Implementation Details

* **Gating Logic:** When implementing `gating`, you must handle "False Blocks". If the LLM output is ambiguous, default to a configurable safety mode (usually "Fail Closed" for CI, "Warn" for local).
* **Prompt Templating:** Prompts are stored as templates. We must dynamically inject diffs/context at runtime to keep context windows efficient.
* **Idempotency:** The `install` module must not overwrite user customizations in `.clinerules/workflows` without permission.

## 7. Interaction Guide

When I ask you to implement a feature:

1. **Identify the Phase:** Confirm which phase the feature belongs to.
2. **Check Dependencies:** Ensure requisite modules (from previous layers) are ready.
3. **Define Inputs/Outputs:** Clearly state the Types/Interface before writing code.
4. **Write Tests First:** Propose the test case (e.g., "I will test `parseVerdict` with a malformed string to ensure it throws/defaults correctly").
