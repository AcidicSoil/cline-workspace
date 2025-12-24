# Codebase Strategic Questions

1. **Does `parseVerdict` handle negated keywords (e.g., "NOT BLOCK") which could invert logic?**
   - **Reference:** `src/gating/index.ts:parseVerdict`
   - **Rationale:** Regex logic captures keywords blindly; a negation could cause false positives for blocking.
   - **Experiment:** Create a test case with input "I do NOT BLOCK this release" and assert it returns `UNKNOWN` or `PASS`.

2. **How does `computePlan` resolve `../../pack` when the package is installed globally or in a different structure?**
   - **Reference:** `src/install/index.ts:computePlan`
   - **Rationale:** Relative paths from `__dirname` are fragile in different deployment environments (e.g. npx vs local).
   - **Experiment:** Run the script from a different directory level and check if `packDir` resolves correctly.

3. **Why is `MVP_REGISTRY` static when `loadManifest` implies async loading?**
   - **Reference:** `src/manifest/index.ts:loadManifest`
   - **Rationale:** Hardcoded registry prevents user-defined workflows or dynamic extensions without code changes.
   - **Experiment:** Change `loadManifest` to read a JSON file from `process.cwd()` if present, falling back to registry.

4. **Can `ai` model configuration be overridden via environment variables for A/B testing?**
   - **Reference:** `src/index.ts:ai`
   - **Rationale:** Hardcoded `gemini-2.5-flash` limits testing newer models or falling back to cheaper ones.
   - **Experiment:** Set `process.env.GENKIT_MODEL` and log the effective model in `src/index.ts`.

5. **Does `shouldFail`'s default policy for `UNKNOWN` risk blocking legitimate obscure outputs?**
   - **Reference:** `src/gating/index.ts:shouldFail`
   - **Rationale:** Fail-closed on `UNKNOWN` (default `true`) might block workflow if the LLM is chatty or ambiguous.
   - **Experiment:** Call `shouldFail('UNKNOWN', { failOnUnknown: false })` and verify it returns `false`.

6. **Is `WorkflowInput.defaultValue: any` bypassing type safety in consumer code?**
   - **Reference:** `src/manifest/types.ts:WorkflowInput`
   - **Rationale:** `any` type allows runtime errors if defaults don't match the declared `type`.
   - **Experiment:** Change `defaultValue` to `unknown` and try to assign a string to a number input in `MVP_REGISTRY`.

7. **Does `installPack` distinguish between "user modified" and "outdated" files during overwrite?**
   - **Reference:** `src/install/index.ts:installPack`
   - **Rationale:** Blind overwrite destroys user customization; lack of version tracking makes updates dangerous.
   - **Experiment:** Modify a target file, run `installPack` with `overwrite: true`, and verify the modification is lost.

8. **How does `taskGeneratorFlow` handle partial JSON or hallucinated schemas from the LLM?**
   - **Reference:** `src/index.ts:taskGeneratorFlow`
   - **Rationale:** Genkit's schema validation might throw; no fallback strategy for partial recovery.
   - **Experiment:** Mock `ai.generate` to return malformed JSON and verify if it crashes or handles gracefully.

9. **Why does `installPack` mix status logs with potential return values?**
   - **Reference:** `src/install/index.ts:installPack`
   - **Rationale:** `console.log` makes it hard to compose this function into a larger CLI pipeline that parses output.
   - **Experiment:** Refactor to return an array of `InstallResult` objects instead of logging.

10. **Does `fs.copyFile` in `installPack` handle missing permissions on the target directory?**
    - **Reference:** `src/install/index.ts:fs.copyFile`
    - **Rationale:** Installation might fail silently or crash if run without `sudo` in protected paths.
    - **Experiment:** Run `installPack` against a read-only directory and check if it throws a helpful error.

11. **Is `MVP_REGISTRY` guaranteed to have matching keys and `id` fields?**
    - **Reference:** `src/manifest/index.ts:MVP_REGISTRY`
    - **Rationale:** Mismatch between object key and `id` property can break lookup by ID.
    - **Experiment:** Add a startup assertion loop that checks `key === value.id` for all entries.

12. **Does `pr-review` workflow input validation occur before or after model invocation?**
    - **Reference:** `src/manifest/index.ts:MVP_REGISTRY` (referenced symbol)
    - **Rationale:** Validation isn't visible in the manifest; executing expensive flows with bad inputs is wasteful.
    - **Experiment:** Call `getWorkflow('pr-review')` and inspect if it has a validation hook defined.

13. **How does `installPreCommitHook` behave if the git hooks path is non-standard?**
    - **Reference:** `src/install/index.ts:installPreCommitHook` (referenced symbol)
    - **Rationale:** Assumes standard `.git/hooks`; fails in submodules or custom git setups.
    - **Experiment:** Run `git config core.hooksPath custom-hooks` and see if the installer respects it.

14. **Can `Verdict` be extended to support "conditional pass" or confidence scores?**
    - **Reference:** `src/gating/index.ts:Verdict`
    - **Rationale:** Binary Pass/Fail/Allow/Block lacks nuance for "Pass with warnings".
    - **Experiment:** Add `WARN` to `Verdict` type and see if `shouldFail` needs a logic update.

15. **Does `parseVerdict` priority (Block > Allow > Fail > Pass) match business logic?**
    - **Reference:** `src/gating/index.ts:parseVerdict`
    - **Rationale:** Current order allows a text with "BLOCK" and "PASS" to return "BLOCK".
    - **Experiment:** Test input "PASS this check, do not BLOCK" and confirm it returns `BLOCK`.

16. **Why is `inputs` in `WorkflowInfo` an array instead of a keyed object?**
    - **Reference:** `src/manifest/types.ts:WorkflowInfo`
    - **Rationale:** Array requires O(n) lookup for validation; object would be O(1) and safer.
    - **Experiment:** Attempt to convert `inputs` to `Record<string, WorkflowInput>` and check type errors.

17. **Does `taskGeneratorFlow` support streaming output for long generation times?**
    - **Reference:** `src/index.ts:taskGeneratorFlow`
    - **Rationale:** Batch generation leaves the user staring at a spinner for complex tasks.
    - **Experiment:** Check `ai.defineFlow` options for `streamingCallback` support.

18. **Is `dotenv/config` loaded early enough for all imports?**
    - **Reference:** `src/index.ts`
    - **Rationale:** If imported modules use `process.env` at the top level, they might read undefined.
    - **Experiment:** Move `import 'dotenv/config'` to the very first line of the entry point and verify.

19. **How are `prerequisites` in `WorkflowInfo` enforced?**
    - **Reference:** `src/manifest/types.ts:WorkflowPrerequisites`
    - **Rationale:** Defined in interface but no logic seen to check `tools` or `env` existence.
    - **Experiment:** Create a workflow with a missing tool prerequisite and see if it runs.

20. **Can `lint-sweep` auto-fix command be restricted for security?**
    - **Reference:** `src/manifest/index.ts:MVP_REGISTRY` (referenced symbol)
    - **Rationale:** Arbitrary command execution via `lint-sweep` input is a security risk.
    - **Experiment:** Try passing `rm -rf /` as the command to `lint-sweep` (in a safe container) to test limits.
