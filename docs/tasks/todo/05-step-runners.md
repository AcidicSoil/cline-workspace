Context
- **Goal**: Implement the concrete logic for Shell, AI, and Gate steps, plus output formatting.
- **Dependency**: Builds on `packages/runner` (abstract interfaces).
- **Strategist Insight**: Shell steps need to handle interactive prompts/GPG signing gracefully (Q5).
- **Strategist Insight**: AI steps need strict validation even if the model returns valid JSON but wrong schema (Q11).
- **Strategist Insight**: Gate steps might need multi-party approval logic (Q15).
- **Strategist Insight**: HostKind checks needed for interactive gates (Q1).

Success criteria
- `runShellStep` implemented:
  - Captures stdout/stderr.
  - Enforces buffer limits.
  - Handles timeouts (via engine, but cleanup needed in runner).
  - Handles `dryRun` flag (Q13).
- `runAiStep` implemented:
  - Defines `AiAdapter` interface.
  - Validates output against `outputSchema` using Zod/Ajv.
- `runGateStep` implemented:
  - Supports `autoApprove` for CI.
  - Checks `HostKind` to avoid hanging in headless modes (Q1).
- `formatHuman` / `formatJson` implemented.

Deliverables
- `packages/runner/src/steps/shell.ts`
- `packages/runner/src/steps/ai.ts`
- `packages/runner/src/steps/gate.ts`
- `packages/runner/src/formatting.ts`
- Unit tests for each runner type.

Approach
1) **Shell Runner**: Use `child_process.spawn`. Implement stream capturing with size limits. Add `dryRun` check. (Q5 experiment: ensure it fails/warns on interactive prompts if possible, or sets `stdio: pipe`).
2) **AI Runner**: Define `AiAdapter`. Implement `execute` that calls adapter and validates result (Q11 experiment: malformed schema checks).
3) **Gate Runner**: Implement interactive prompt using `readline`. Add `HostKind` check (if not CLI, default to deny or error unless auto-approved).
4) **Formatting**: Implement basic formatters for `RunResult`.

Risks / unknowns
- **Unknown**: Robustness of detecting "interactive prompts" in shell scripts. (Likely impossible to do perfectly; will rely on timeout).
- **Unknown**: Zod schema validation for dynamic `outputSchema`.

Testing & validation
- **Unit Tests**:
  - Mock `spawn` to test shell output capture and exit codes.
  - Mock `AiAdapter` to test validation success/failure.
  - Mock `readline` to test gate approvals.

Rollback / escape hatch
- Delete `packages/runner/src/steps/*`.

Owner/Date
- Unknown / 2025-12-24
