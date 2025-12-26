Context
- **Goal**: Implement the core execution engine that builds the run context and orchestrates step execution.
- **Dependency**: Builds on `packages/foundation` (types, logging) and `packages/workflow` (spec).
- **Strategist Insight**: Host hooks must be isolated from core context (Q3).
- **Strategist Insight**: Engine needs to persist partial state on timeout (Q6).
- **Strategist Insight**: Context serialization support for resumability (Q14).

Success criteria
- `packages/runner` initialized.
- `buildContext` implemented, merging params/env/secrets safely.
- `Runner` class implemented with `runWorkflow` loop.
- Abstract `StepRunner` interface defined.
- `if` condition evaluation logic implemented (basic expression support).
- Stop-on-failure logic implemented.
- Timeout handling captures partial `RunResult` (Q6).

Deliverables
- `packages/runner/package.json`
- `packages/runner/src/context.ts` (Context Builder)
- `packages/runner/src/types.ts` (Runner Interfaces)
- `packages/runner/src/engine.ts` (Main Loop)
- Unit tests for context isolation, state persistence, and flow control.

Approach
1) **Package Setup**: Initialize `packages/runner`.
2) **Context Builder**: Implement `buildContext` with `SecretManager`.
   - Ensure host hooks don't pollute context (Q3 experiment).
   - Add `serialize`/`deserialize` to Context (Q14).
3) **Step Runner Interface**: Define `StepRunner` abstract class.
4) **Engine Core**: Implement `runWorkflow` loop.
   - Iterate steps.
   - Check `if` conditions.
   - Execute step runner.
   - Update context with outputs.
   - Handle stop-on-failure and timeouts (Q6 experiment: verify partial result on timeout).

Risks / unknowns
- **Unknown**: Complexity of `if` expression evaluation (using `vm` vs simple eval vs library). Will start with simple JS eval in safe context.
- **Unknown**: Overhead of context serialization for large outputs.

Testing & validation
- **Unit Tests**:
  - Test `buildContext` merges correctly.
  - Test engine stops on failure.
  - Test engine handles timeouts and returns partial status.
  - Test condition evaluation allows skipping steps.

Rollback / escape hatch
- Delete `packages/runner` directory.

Owner/Date
- Unknown / 2025-12-24
