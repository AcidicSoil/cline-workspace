# Repository Map (hierarchical)

- AI Flow Runtime
  - Purpose: Defines Genkit AI runtime and two flows (helloFlow, taskGeneratorFlow).
  - Responsibilities: Configure Genkit with Google AI model; define flow schemas; run ai.generate calls.
  - Public surface: export `ai`, `helloFlow`, `taskGeneratorFlow`.
  - Evidence: src/index.ts:{ai, helloFlow, taskGeneratorFlow}

- Workflow Pack Orchestration (scripts)
  - Purpose: Orchestrate workflow runs (CI PR review, pre-commit gate, changelog generation, lint auto-fix).
  - Responsibilities: Gather inputs (git diffs/commits, lint logs), render prompts, invoke Cline headless, apply gating/patches, write artifacts, exit with status.
  - Public surface: script entrypoints `main()` in each pack script.
  - Evidence: pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}; pack/scripts/generate-changelog.ts:{main}; pack/scripts/lint-sweep.ts:{main}

- Workflow Registry (Manifest)
  - Purpose: Define static registry of workflow metadata.
  - Responsibilities: Provide list/get functions for workflows; describe inputs/outputs.
  - Public surface: `loadManifest`, `listWorkflows`, `getWorkflow`.
  - Evidence: src/manifest/index.ts:{MVP_REGISTRY, loadManifest, listWorkflows, getWorkflow}

- Prompt Rendering
  - Purpose: Render Markdown prompt templates with data and describe workflows in Markdown.
  - Responsibilities: Load templates by ID, interpolate variables, format workflow docs.
  - Public surface: `renderPrompt`, `renderWorkflowMd`.
  - Evidence: src/render/index.ts:{renderPrompt, renderWorkflowMd, interpolate}

- Verdict Gating
  - Purpose: Parse model output and enforce allow/fail policy.
  - Responsibilities: Parse verdict tokens; decide fail/allow per policy.
  - Public surface: `parseVerdict`, `shouldFail`.
  - Evidence: src/gating/index.ts:{parseVerdict, shouldFail}

- CLI Adapters
  - Cline CLI Runner
    - Purpose: Invoke Cline CLI in headless or interactive mode; follow tasks.
    - Responsibilities: Spawn `cline task new` / `cline task view` and capture output or inherit stdio.
    - Public surface: `runHeadless`, `runInteractive`, `followTask`.
    - Evidence: src/cline/index.ts:{runHeadless, runInteractive, followTask}
  - Git CLI Adapter
    - Purpose: Execute git commands for diffs and logs.
    - Responsibilities: Shell out to `git`, format logs, return diffs.
    - Public surface: `execGit`, `getCommitLog`, `getStagedDiff`, `getRangeDiff`.
    - Evidence: src/git/index.ts:{execGit, getCommitLog, getStagedDiff, getRangeDiff}
  - GitHub CLI Adapter
    - Purpose: Execute GitHub CLI operations for PR data and reviews.
    - Responsibilities: Check auth, read PRs, get diff, submit review.
    - Public surface: `checkAuth`, `viewPr`, `diffPr`, `submitReview`.
    - Evidence: src/github/index.ts:{checkAuth, viewPr, diffPr, submitReview}

- Reporting & Artifacts
  - Purpose: Write artifacts under `.clinerules/artifacts` and format summaries/JSON.
  - Responsibilities: Atomic artifact writes; summary/JSON formatting.
  - Public surface: `writeArtifact`, `formatSummary`, `formatJson`.
  - Evidence: src/report/index.ts:{writeArtifact, formatSummary, formatJson}

- Installer & Git Hook Integration
  - Purpose: Install workflow pack assets and a pre-commit git hook.
  - Responsibilities: Compute copy plan, copy pack files, install pre-commit hook script.
  - Public surface: `computePlan`, `installPack`, `installPreCommitHook`.
  - Evidence: src/install/index.ts:{computePlan, installPack}; src/install/hooks.ts:{installPreCommitHook}

- Workflow Templates (prompt assets)
  - Purpose: Provide prompt templates for workflows.
  - Responsibilities: Define prompt text with placeholders.
  - Public surface: template files.
  - Evidence: pack/workflows/ci-pr-review.md:{"{{diff}}"}; pack/workflows/pre-commit-review.md:{"{{diff}}"}; pack/workflows/changelog.md:{"{{commits}}"}; pack/workflows/lint-fix.md:{"{{errorLog}}"}

- Build Artifacts (dist/)
  - Purpose: Compiled outputs.
  - Responsibilities: Unknown from source inspection.
  - Public surface: Unknown.
  - Evidence: Unknown (missing file contents: dist/index.js)

# Module Table

| Module | Type | Purpose | Key Dependencies | Main Inputs → Outputs | Extensibility Points | Boundary Notes | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI Flow Runtime | Domain | Define Genkit flows for greeting and task generation | genkit, @genkit-ai/google-genai, zod | name/goal strings → greeting text / task list | Add new `ai.defineFlow` in `src/index.ts` | Flows defined but no invocation surface in repo | Evidence: src/index.ts:{ai, helloFlow, taskGeneratorFlow} |
| Workflow Pack Orchestration | Glue | Run CI/commit workflows using Cline + git data | src/cline, src/git, src/gating, src/report, fs | git diffs/commits → reports, exit codes | Add new script in `pack/scripts` and template in `pack/workflows` | Scripts directly handle I/O and policy (mixed concerns) | Evidence: pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}; pack/scripts/generate-changelog.ts:{main}; pack/scripts/lint-sweep.ts:{main} |
| Workflow Registry (Manifest) | Domain | Static registry of workflow metadata | none (local types) | none → workflow list/lookup | Extend `MVP_REGISTRY` | Static registry only; no file-based loading | Evidence: src/manifest/index.ts:{MVP_REGISTRY, loadManifest, listWorkflows, getWorkflow} |
| Prompt Rendering | Utility | Load templates and interpolate data | fs, path | templateId+data → prompt markdown | Add templates under `src/render/templates` (currently missing) | Template path tied to `__dirname`, mismatched with pack usage | Evidence: src/render/index.ts:{renderPrompt, interpolate} |
| Verdict Gating | Utility | Parse verdict text and enforce policy | none | text+policy → PASS/FAIL/ALLOW/BLOCK | Adjust `parseVerdict`/policy | Simple regex may misclassify ambiguous outputs | Evidence: src/gating/index.ts:{parseVerdict, shouldFail} |
| Cline CLI Runner | Adapter | Spawn Cline CLI tasks | child_process.spawn | prompt → stdout/stderr/exit | None (hardcoded `cline` binary) | External CLI dependency not validated | Evidence: src/cline/index.ts:{runHeadless, runInteractive, followTask} |
| Git CLI Adapter | Adapter | Execute git commands | child_process.exec | commands → stdout | None | Shell string interpolation risk if inputs not controlled | Evidence: src/git/index.ts:{execGit, getCommitLog, getStagedDiff, getRangeDiff} |
| GitHub CLI Adapter | Adapter | Execute GitHub CLI commands | child_process.exec | prNumber/body → gh output | None | Shell escaping only for quotes; multiline body risk | Evidence: src/github/index.ts:{submitReview, viewPr, diffPr} |
| Reporting & Artifacts | Infrastructure | Write artifacts atomically | fs, crypto | content → artifact path | None | Artifact root fixed at `.clinerules/artifacts` | Evidence: src/report/index.ts:{writeArtifact, formatSummary, formatJson} |
| Installer & Git Hook Integration | Glue | Copy pack assets and install pre-commit hook | fs, path | targetDir → files/hooks installed | Add new assets under `pack/` | Hardcoded hook uses `npx tsx` | Evidence: src/install/index.ts:{computePlan, installPack}; src/install/hooks.ts:{installPreCommitHook} |
| Workflow Templates | Utility | Prompt text assets | none | placeholders → prompt text | Add/edit files in `pack/workflows` | Tightly coupled to scripts by filename | Evidence: pack/workflows/ci-pr-review.md:{"{{diff}}"}; pack/workflows/lint-fix.md:{"{{errorLog}}"} |

# Agent-Centric Component Map (if applicable)

- Memory
  - Components found: Artifact store under `.clinerules/artifacts`.
  - What state they own: Markdown reports for CI/pre-commit runs.
  - How they’re invoked: `writeArtifact` called by pack scripts.
  - Evidence: src/report/index.ts:{writeArtifact}; pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}

- Planning
  - Components found: Not detected.
  - Evidence: Unknown (no planning components identified in inspected files)

- Evaluation/Reasoning
  - Components found: Verdict parsing and policy gating.
  - What state they own: Verdict interpretation (PASS/FAIL/ALLOW/BLOCK).
  - How they’re invoked: Pack scripts call `parseVerdict`/`shouldFail` on AI output.
  - Evidence: src/gating/index.ts:{parseVerdict, shouldFail}; pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}

- Communication/Adapters
  - Components found: Cline CLI runner, Git CLI adapter, GitHub CLI adapter.
  - What state they own: None (thin wrappers over CLI calls).
  - How they’re invoked: Pack scripts call `runHeadless`, `execGit`, `execGh`.
  - Evidence: src/cline/index.ts:{runHeadless}; src/git/index.ts:{execGit}; src/github/index.ts:{checkAuth, viewPr, diffPr, submitReview}; pack/scripts/ci-review.ts:{main}

- Tooling/Utilities
  - Components found: Prompt rendering, workflow registry, report formatting.
  - What state they own: Template content; workflow metadata; formatted strings.
  - How they’re invoked: Pack scripts read templates; API returns metadata.
  - Evidence: src/render/index.ts:{renderPrompt, renderWorkflowMd}; src/manifest/index.ts:{MVP_REGISTRY, listWorkflows}; src/report/index.ts:{formatSummary, formatJson}

# Data & Control Flow

Happy path narratives

1) CI PR Review workflow
   - Read base/head refs and git diff, load template, invoke Cline, parse verdict, write artifact, exit with status.
   - Evidence: pack/scripts/ci-review.ts:{main}; src/git/index.ts:{execGit}; src/cline/index.ts:{runHeadless}; src/gating/index.ts:{parseVerdict, shouldFail}; src/report/index.ts:{writeArtifact}

2) Pre-commit gate
   - Read staged diff, load template, invoke Cline, parse verdict, write artifact, exit with status.
   - Evidence: pack/scripts/pre-commit.ts:{main}; src/git/index.ts:{getStagedDiff}; src/cline/index.ts:{runHeadless}; src/gating/index.ts:{parseVerdict, shouldFail}; src/report/index.ts:{writeArtifact}

3) Changelog generation
   - Read recent commit log, load template, invoke Cline, append to CHANGELOG.md.
   - Evidence: pack/scripts/generate-changelog.ts:{main}; src/git/index.ts:{getCommitLog}; src/cline/index.ts:{runHeadless}

4) Lint sweep auto-fix
   - Run lint command, parse failing file, load template, invoke Cline, apply patches, write file, retry.
   - Evidence: pack/scripts/lint-sweep.ts:{main, runLint, applyPatches}

Key touchpoints between modules

- Pack scripts orchestrate Git adapters, Cline runner, gating, and reporting.
  - Evidence: pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}
- Workflow templates feed prompt strings used by pack scripts.
  - Evidence: pack/workflows/ci-pr-review.md:{"{{diff}}"}; pack/workflows/pre-commit-review.md:{"{{diff}}"}

Persistence and side-effect points

- Filesystem writes: artifacts and CHANGELOG updates.
  - Evidence: src/report/index.ts:{writeArtifact}; pack/scripts/generate-changelog.ts:{main}
- Git/GitHub CLI calls: diff/log fetches and PR review actions.
  - Evidence: src/git/index.ts:{execGit, getCommitLog}; src/github/index.ts:{viewPr, diffPr, submitReview}
- External AI model calls via Genkit.
  - Evidence: src/index.ts:{ai, helloFlow, taskGeneratorFlow}

Dependency edge list

- Pack Scripts → Git Adapter (diff/logs)
  - Evidence: pack/scripts/ci-review.ts:{main}; src/git/index.ts:{execGit}
- Pack Scripts → Cline CLI Runner (AI execution)
  - Evidence: pack/scripts/pre-commit.ts:{main}; src/cline/index.ts:{runHeadless}
- Pack Scripts → Verdict Gating (policy)
  - Evidence: pack/scripts/ci-review.ts:{main}; src/gating/index.ts:{parseVerdict, shouldFail}
- Pack Scripts → Reporting (artifacts)
  - Evidence: pack/scripts/ci-review.ts:{main}; src/report/index.ts:{writeArtifact}
- Installer → Pack Assets (copy + hook)
  - Evidence: src/install/index.ts:{installPack}; src/install/hooks.ts:{installPreCommitHook}

# Architecture Assessment

Best-fit archetype

- AI-assisted workflow automation toolkit with CLI integrations and safety gates.
  - Evidence: pack/scripts/ci-review.ts:{main}; src/cline/index.ts:{runHeadless}; src/gating/index.ts:{parseVerdict, shouldFail}

Strengths / constraints implied by the architecture

- Strength: Clear orchestration scripts for CI/pre-commit use cases with explicit exit codes.
  - Evidence: pack/scripts/ci-review.ts:{main}; pack/scripts/pre-commit.ts:{main}
- Strength: Thin adapters around Git/GitHub/Cline make external integration explicit.
  - Evidence: src/git/index.ts:{execGit}; src/github/index.ts:{viewPr, submitReview}; src/cline/index.ts:{runHeadless}
- Constraint: Workflow registry is static and not loadable from disk/config.
  - Evidence: src/manifest/index.ts:{MVP_REGISTRY, loadManifest}
- Constraint: Prompt rendering base path conflicts with pack templates; scripts bypass renderer.
  - Evidence: src/render/index.ts:{renderPrompt}; pack/scripts/pre-commit.ts:{main}

Top 5 improvement opportunities

1) Align prompt rendering with pack templates (base path or config), remove manual template reads in scripts.
   - Impact: High (reduces duplication and path bugs); Risk: Low; Scope: Medium.
   - Evidence: src/render/index.ts:{renderPrompt}; pack/scripts/pre-commit.ts:{main}
2) Externalize workflow registry to a file or pack manifest to allow extension without code changes.
   - Impact: Medium; Risk: Low; Scope: Medium.
   - Evidence: src/manifest/index.ts:{MVP_REGISTRY, loadManifest}
3) Harden lint sweep patching: parse multiple files and robustly apply patches with clear format validation.
   - Impact: Medium; Risk: Medium; Scope: Medium.
   - Evidence: pack/scripts/lint-sweep.ts:{applyPatches, main}
4) Improve GitHub review submission by avoiding shell-escaped bodies (use stdin or temp file) to support multiline content safely.
   - Impact: Medium; Risk: Medium; Scope: Small.
   - Evidence: src/github/index.ts:{submitReview}
5) Validate external tool availability (cline, gh, git, tsx) before running workflows; emit actionable errors.
   - Impact: Medium; Risk: Low; Scope: Small.
   - Evidence: src/cline/index.ts:{runHeadless}; src/github/index.ts:{checkAuth}; src/install/hooks.ts:{installPreCommitHook}

Coverage notes

- Coverage is limited to `src/` and `pack/` sources plus `package.json`. Build outputs under `dist/` were not inspected; behaviors there are Unknown.
  - Evidence: Unknown (missing file contents: dist/index.js)
