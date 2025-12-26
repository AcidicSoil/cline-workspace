Context
- **Goal**: Develop reusable integration primitives for interacting with external tools (Git, GitHub, Test, Lint).
- **Dependency**: Builds on `packages/foundation` (errors).
- **Strategist Insight**: Need to map diverse failures (e.g., `git` vs `gh`) to stable, unique exit codes (Q12).
- **Strategist Insight**: CI tests for GitHub CLI integration need mocking to avoid rate limits (Q16).
- **Strategist Insight**: `git` operations must handle GPG signing prompts gracefully (Q5).

Success criteria
- `packages/integrations` initialized.
- `git` wrapper implemented (`diff`, `status`, `show`).
- `gh` wrapper implemented (`pr view`, `pr diff`, `pr review`).
- `test-runner` implemented with log parsing.
- `linter` implemented with fix/check logic.
- Integration errors map to `GitError`, `GhError` with distinct exit codes (Q12).
- CI tests use mocks for `gh` CLI calls (Q16).

Deliverables
- `packages/integrations/package.json`
- `packages/integrations/src/git.ts`
- `packages/integrations/src/github.ts`
- `packages/integrations/src/test-runner.ts`
- `packages/integrations/src/linter.ts`
- Unit/Integration tests for each module.

Approach
1) **Package Setup**: Initialize `packages/integrations`.
2) **Git Integration**: Implement `Git` class using `exec`. Handle `GPG_TTY` or prompt isolation (Q5 experiment). Map errors to `GitError`.
3) **GitHub Integration**: Implement `GitHub` class. Pre-check `gh` binary. Use `--json` for parsing. Mock `gh` calls in tests (Q16 experiment).
4) **Test/Lint Integration**: Implement generic runners that parse stdout/stderr for specific failure patterns.

Risks / unknowns
- **Unknown**: Parsing stability of CLI tools across versions.
- **Unknown**: Handling of large diffs in `git` output (buffer limits).

Testing & validation
- **Unit Tests**:
  - Mock `exec` to simulate `git` and `gh` outputs (success/fail).
  - Verify error mapping (e.g. exit code 128 -> `GitError`).
  - Verify JSON parsing of `gh` output.

Rollback / escape hatch
- Delete `packages/integrations` directory.

Owner/Date
- Unknown / 2025-12-24
