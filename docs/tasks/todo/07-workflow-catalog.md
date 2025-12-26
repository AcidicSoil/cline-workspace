Context
- **Goal**: Implement the 'PR Review' and 'Lint Sweep' workflows using the defined schema and integrations.
- **Dependency**: Builds on `packages/workflow` (spec) and `packages/integrations`.
- **Strategist Insight**: `precommit-risk` workflow needs specific exit codes for git hooks (Q10). We'll assume the same rigorous exit code logic applies to `lint-sweep` if used in CI/hooks.

Success criteria
- `packages/workflows` initialized.
- `pr-review` workflow defined:
  - Steps: git fetch, gh pr view, git diff, AI analysis (mocked or template), gh pr review (optional).
- `lint-sweep` workflow defined:
  - Steps: linter check, linter fix, test run, AI summarize (optional).
- Workflows validate against `WorkflowSchema`.
- Integration tests verify step sequencing (using mocked runners/integrations).

Deliverables
- `packages/workflows/package.json`
- `packages/workflows/src/pr-review.yaml` (or .ts exporting definition)
- `packages/workflows/src/lint-sweep.yaml`
- `packages/workflows/src/index.ts` (Registry export)
- Integration tests simulating workflow runs.

Approach
1) **Package Setup**: Initialize `packages/workflows`.
2) **Workflow Definitions**: Create YAML/JSON definitions for MVP workflows.
   - Use `shell` steps for git/gh/lint/test commands.
   - Use `ai` steps for analysis/summary.
   - Use `gate` steps for review submission approval.
3) **Testing**: Use `Runner` and `WorkflowEngine` (from packages/runner) to execute these workflows in a test environment with mocked shell commands.

Risks / unknowns
- **Unknown**: Precise prompts for AI steps (will use placeholders).
- **Unknown**: Handling of large diffs in AI context window (will need truncation logic in future, for now assume small diffs).

Testing & validation
- **Integration Tests**:
  - Load `pr-review` workflow.
  - Register mock runners.
  - Run engine and verify correct sequence of "shell" commands (e.g., did it call `gh pr view` before `git diff`?).

Rollback / escape hatch
- Delete `packages/workflows` directory.

Owner/Date
- Unknown / 2025-12-24
