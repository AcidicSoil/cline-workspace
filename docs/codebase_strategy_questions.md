# Codebase Strategy Questions

1. **How will `HostKind` in `packages/foundation/src/types.ts` handle capabilities like interactive prompts across different hosts?**
   - **Reference:** `packages/foundation/src/types.ts` (Planned)
   - **Rationale:** Host-specific capabilities (e.g., CLI interactivity vs. MCP headless) need explicit feature flags in the type definition to prevent runtime errors.
   - **Experiment:** Create a mock `HostKind` enum in a test file and verify conditional logic for `runGateStep` based on the host type.

2. **Does `workflow/spec` enforcement of unique IDs account for potential conflicts between distributed packs?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 2`
   - **Rationale:** Collision of workflow IDs across different installed packs could cause unpredictable behavior in the registry.
   - **Experiment:** Create two dummy workflow files with the same ID in different directories and run the discovery logic to see which one wins.

3. **How does `runner/context` merge "host hooks" without polluting the agnostic execution context?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 4.1`
   - **Rationale:** Host-specific hooks must be isolated from the core workflow context to ensure determinism and portability.
   - **Experiment:** Write a unit test for `buildContext` that injects a mock host hook and asserts it doesn't overwrite reserved context keys.

4. **What is the specific schema for `correlationId` in `foundation/logging` to ensure traceability across async steps?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 1.5`
   - **Rationale:** Inconsistent correlation IDs make debugging concurrent workflow executions impossible.
   - **Experiment:** Implement a simple logger, log two events in an async sequence, and grep the output to verify the same `correlationId` persists.

5. **How will `runShellStep` in `runner/steps` handle non-standard git configurations like GPG signing prompts?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 5.1`
   - **Rationale:** Interactive prompts in shell steps will hang headless executions (MCP/CI) if not explicitly handled or bypassed.
   - **Experiment:** Run a `git commit` command via `child_process` in a test script with `GPG_TTY` unset and verify it fails gracefully or timeouts.

6. **How does `runner/engine.ts` persist or recover state if a step times out?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 4.4`
   - **Rationale:** Without state persistence, a timeout crashes the entire workflow, losing all progress and intermediate artifacts.
   - **Experiment:** Simulate a timeout in a mock `StepRunner` and check if the `RunResult` captures the partial state up to that point.

7. **How are secrets identified for `redactSensitive` in `foundation/config` (by key name or value pattern)?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 1.4`
   - **Rationale:** Redaction based solely on key names (e.g., "API_KEY") leaks secrets in non-standard config fields; value-based is safer but slower.
   - **Experiment:** Write a test case with a secret in a non-standard key (e.g., `MY_TOKEN`) and see if `redactSensitive` catches it.

8. **Does `workflow/manifest` support specifying minimum host versions to prevent compatibility issues?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 2.2`
   - **Rationale:** New workflow features running on old CLI versions will cause confusing runtime errors without strict version guards.
   - **Experiment:** Parse a manifest with a `engines` field using semver logic and assert it throws on an older mocked host version.

9. **How will `adapters/gemini-extension` map complex nested workflow parameters to flat CLI flags?**
   - **Reference:** `.taskmaster/tasks/tasks.json:Task 10.1`
   - **Rationale:** Complex JSON objects in workflow params don't map clean to CLI flags, potentially breaking the Gemini integration.
   - **Experiment:** Write a mapper function test that converts a nested JSON param object into a linear array of `--flag value` strings.

10. **What specifically defines the "hook-friendly exit code" for the `precommit-risk` workflow?**
    - **Reference:** `AGENTS.md:Workflow Catalog`
    - **Rationale:** Git hooks require specific non-zero exit codes to block commits; generic errors might be ignored or confusing.
    - **Experiment:** Create a script returning exit code `1` vs `127` and verify how a standard `pre-commit` hook interprets them.

11. **How does `runAiStep` validation logic handle AI models returning valid JSON but invalid schema data?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 5.2`
    - **Rationale:** Zod validation must run *after* JSON parsing to catch semantic errors (missing fields) that are syntactically valid JSON.
    - **Experiment:** Feed valid JSON with missing required fields to the `AiStep` validator and verify it throws a structured `ValidationError`.

12. **How will `foundation/errors` map diverse integration failures (e.g., `gh` vs `git`) to stable, unique exit codes?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 1.3`
    - **Rationale:** Overloaded exit codes make automated debugging/CI scripts unreliable; each integration failure needs a distinct code.
    - **Experiment:** Define an `ExecutionError` subclass for `GitError` and `GhError` and assert `getExitCode` returns different values.

13. **Should `Workflow` schema enforce a `dryRun` command for every `ShellStep` to enable safe preview?**
    - **Reference:** `AGENTS.md:Safety gates`
    - **Rationale:** Users need to know what a workflow *will* do before it executes side effects, especially for "fix" workflows.
    - **Experiment:** Add a `dryRun` field to a `ShellStep` schema and verify the parser requires it or provides a default.

14. **Can `runner/context` support serializing execution state to disk to enable resumable runs?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 4.1`
    - **Rationale:** Long-running workflows (e.g., massive migrations) need resume capability to be viable in production.
    - **Experiment:** Serialize a mock `Context` object to JSON, verify size/content, and deserialize it back to checking data fidelity.

15. **Should `runGateStep` support multi-party approval or role-based checks for high-risk flows?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 5.3`
    - **Rationale:** Single-user approval is insufficient for critical production deployments or sensitive data access.
    - **Experiment:** Mock a `GateStep` with a `requiredApprovals: 2` config and test if the runner waits for a second signal.

16. **How do we test `integrations/github-gh` in CI without hitting public API rate limits?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 6.2`
    - **Rationale:** CI tests relying on real GitHub API calls will flake due to rate limits; a recording/mocking strategy is essential.
    - **Experiment:** Use `nock` or similar to record a `gh` CLI response and replay it in a unit test to verify parsing logic.

17. **Should `WorkflowRegistry` support "shadow" or "preview" workflows that don't appear in the main list?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 3.3`
    - **Rationale:** Testing new workflows in production requires a way to hide them from general users (feature flagging).
    - **Experiment:** Filter the `listWorkflows` output based on a `hidden: true` metadata field and verify visibility.

18. **Can we standardize a `rollback` step definition in the `Workflow` schema for atomic failure recovery?**
    - **Reference:** `AGENTS.md:Core Models`
    - **Rationale:** Stop-on-failure leaves systems in a dirty state; explicit rollback steps are needed for true safety.
    - **Experiment:** Add a `onFailure` field to the `Step` schema pointing to another step ID and verify the parser accepts it.

19. **Should `adapters/mcp-server` expose a specific `plan` tool to return the execution graph without running it?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 9.2`
    - **Rationale:** LLMs need to "see" the plan to confirm intent before executing potentially destructive tools.
    - **Experiment:** Implement a `tools/plan` handler that returns the workflow steps as JSON without invoking the runner.

20. **How will we manage breaking changes in the `Workflow` schema versioning to avoid breaking existing packs?**
    - **Reference:** `.taskmaster/tasks/tasks.json:Task 2.2`
    - **Rationale:** Future schema updates will break installed packs if version negotiation isn't strict.
    - **Experiment:** Create a workflow with `version: "2.0"` and assert the current `parseManifest` logic rejects or warns on it.
