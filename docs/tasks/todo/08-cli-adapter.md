Context
- **Goal**: Develop the primary CLI interface for installing, listing, and running workflows.
- **Dependency**: Builds on `packages/registry` and `packages/runner`.
- **Strategist Insight**: Need to map complex nested workflow parameters to flat CLI flags (Q9).
- **Strategist Insight**: Must ensure hook-friendly exit codes (Q10) and distinct codes for integration failures (Q12).

Success criteria
- `packages/cli` initialized.
- `list` command displays available workflows from the registry.
- `run <id>` command executes a workflow.
- CLI flags correctly map to workflow parameters (Q9).
- Support for `--json` output flag for all commands.
- Exit codes correctly reflect success/failure (0 for success, non-zero for errors).
- Spinner (ora) and colors (chalk) used for better UX.

Deliverables
- `packages/cli/package.json`
- `packages/cli/src/index.ts` (Entry point)
- `packages/cli/src/commands/list.ts`
- `packages/cli/src/commands/run.ts`
- E2E tests invoking the CLI against mock workflows.

Approach
1) **Package Setup**: Initialize `packages/cli` with `commander`, `chalk`, `ora`, and `cli-table3`.
2) **Registry Integration**: Wire up `WorkflowRegistry` to discover built-in and local workflows.
3) **List Command**: Implement `list` with table output and JSON support.
4) **Run Command**: Implement `run <id>`.
   - Implement dynamic flag parsing to map CLI arguments to workflow `params` (Q9 experiment: nested objects to flat flags).
   - Invoke `WorkflowEngine` and render results using `runner/formatting`.
   - Map `RunResult` status to process exit code (Q10, Q12).

Risks / unknowns
- **Unknown**: Complexity of dynamic flag generation for workflows with many parameters.
- **Unknown**: Handling of standard input for `gate` steps within the CLI command structure.

Testing & validation
- **E2E Tests**:
  - Run `bin list --json` and verify JSON structure.
  - Run `bin run test-workflow` and verify exit code 0 on success.
  - Run `bin run failing-workflow` and verify non-zero exit code.

Rollback / escape hatch
- Delete `packages/cli` directory.

Owner/Date
- Unknown / 2025-12-24
