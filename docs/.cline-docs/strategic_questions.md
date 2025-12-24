# Strategic Questions for Cline Workflow Pack

1. **contracts/interfaces**
   - `src/manifest/types.ts:WorkflowInfo`
   - How should we define the strictly typed schema for workflow metadata (inputs, mode, constraints) to ensure the "Single-Source of Truth" mandate?
   - Create `src/manifest/types.ts` and define an interface `WorkflowInfo` with `id`, `inputs`, and `mode` fields.

2. **invariants**
   - `src/gating/index.ts:parseVerdict`
   - What regex pattern guarantees we can deterministically extract `PASS` or `FAIL` verdicts from noisy LLM outputs (e.g., "The verdict is PASS")?
   - Create a test script that runs a regex against 5 varied sample LLM response strings to verify extraction.

3. **background jobs**
   - `src/cline/index.ts:runHeadless`
   - How will we reliably spawn `cline task new` and capture its `stdout`/`stderr` without hanging if the process prompts for user input?
   - Run `const { spawn } = require('child_process'); spawn('echo', ['test']);` in a temp script to verify stream capture mechanics.

4. **caching/state**
   - `src/git/index.ts:getStagedDiff`
   - Can we optimize context window usage by implementing a strict token limit or "diff summary" mode for large staged files?
   - Run `git diff --cached --stat` in the repo to see if summary metrics provide enough initial context.

5. **observability**
   - `src/report/index.ts:writeArtifact`
   - How do we ensure atomic writes to `.clinerules/artifacts` to prevent race conditions during parallel workflow executions?
   - Write a script that attempts to write to the same file from two async `Promise.all` calls to test locking/overwriting.

6. **permissions**
   - `src/github/index.ts:checkAuth`
   - What is the fastest way to "fail fast" if the user has `gh` installed but not authenticated?
   - Run `gh auth status --hostname github.com` via `child_process.exec` and inspect the exit code.

7. **migrations**
   - `src/install/index.ts:installPack`
   - How should the installer handle existing user modifications to `pack/workflows/*.md` files in the target `.clinerules` directory?
   - Manually create a dummy `.clinerules/workflows/test.md`, modify it, and define a policy (overwrite vs. skip) in a comment.

8. **contracts/interfaces**
   - `src/render/index.ts:renderPrompt`
   - Should we use a lightweight template literal function or a dedicated library like `mustache` to interpolate dynamic Git context into prompts?
   - Benchmark a simple `str.replace({{key}}, val)` function against a regex-based replacement for performance.

9. **failure modes**
   - `src/gating/index.ts:shouldFail`
   - How do we map ambiguous AI responses (e.g., "I recommend checking X but it looks okay") to a strict `BLOCK` or `ALLOW` policy?
   - Define a `defaultVerdict` constant in `src/gating/config.ts` and test it against an `undefined` parse result.

10. **UX flows**
    - `bin/cline-pack.ts:main`
    - How can we expose a `--dry-run` flag that prints the constructed prompt and context without invoking the potentially expensive AI model?
    - Skeleton out a `bin/cline-pack.ts` that accepts `--dry-run` and logs "Would run..." to console.

11. **observability**
    - `src/cline/index.ts:followTask`
    - Is it possible to attach to a running `cline` task ID to stream its "thinking" process to the CI console in real-time?
    - Check `cline --help` or documentation to verify if `task view` supports streaming output.

12. **invariants**
    - `src/index.ts:genkit`
    - Does the current Genkit dependency conflict with the `GEMINI.md` goal of using the `Cline CLI` as the core runner, or is it a fallback?
    - Inspect `package.json` dependencies to decide if `@genkit-ai/*` should be removed in favor of `child_process` calls to `cline`.

13. **strategic planning**
    - `GEMINI.md:Roadmap`
    - Given "Phase 0/1" status, should we prioritize the "Pre-commit Risk Gate" (Task 5) as the MVP to demonstrate immediate value?
    - Move "Pre-commit Risk Gate" to top of the backlog and scope it to a simple regex check before adding AI.

14. **strategic planning**
    - `src/manifest/index.ts:registry`
    - How can we architect the workflow registry to allow users to register *custom* local workflows not included in the default pack?
    - Draft a schema for `clinerules.json` that supports a `customWorkflows` array path.

15. **strategic planning**
    - `pack/workflows/ci-pr-review.md:Prompt`
    - What "Persona" instructions in the system prompt yield the lowest false-positive rate for security critical reviews?
    - Create two prompt variants (one "Strict Auditor", one "Helpful Peer") and test against a known buggy diff.

16. **strategic planning**
    - `src/install/index.ts:computePlan`
    - Should the installation process automatically scaffold a `.github/workflows/cline-check.yml` to reduce friction for CI adoption?
    - Create a sample GitHub Action YAML file in `pack/ci/` to test feasibility of auto-creation.

17. **strategic planning**
    - `src/git/index.ts:getRangeDiff`
    - How do we handle "shallow clones" in CI environments (e.g., GitHub Actions default) which often break diff generation?
    - Add a `git fetch --depth=100` fallback command in the git wrapper logic plan.

18. **strategic planning**
    - `src/report/index.ts:formatSummary`
    - Should the reporting module output a specific JSON schema compatible with GitHub Actions "Job Summaries" for better visibility?
    - Generate a sample JSON object and verify if it renders correctly in a GitHub Job Summary preview.

19. **strategic planning**
    - `src/cline/index.ts:timeouts`
    - What is the maximum acceptable timeout for a pre-commit hook before we fallback to "Fail Open" or "Fail Closed" to avoid developer frustration?
    - Set a hard timeout constant (e.g., `15000ms`) in a config file and document the tradeoff.

20. **strategic planning**
    - `GEMINI.md:Constraint`
    - Since "gh is optional", how do we degrade functionality gracefully for the "CI PR Review" workflow if `gh` is missing?
    - Define a `VerificationResult` type that includes a `skipped` reason to communicate missing dependencies without erroring.
