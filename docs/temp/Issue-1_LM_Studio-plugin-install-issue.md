Title:

* Fix LM Studio plugin packaging: remove unpublished `@workflow-pack/*` runtime deps and bundle workspace code

Summary:

* LM Studio’s plugin install fails because the generated plugin `package.json` references internal scoped packages (e.g., `@workflow-pack/foundation`) with semver ranges, causing npm to fetch them from the public registry where they are not published, resulting in `E404`. The install log also shows an npm auth issue (`Access token expired or revoked`) that can block private-scope access. The plugin output needs to be an npm-installable, self-contained artifact with internal workspace code bundled and only public dependencies listed.

Background / Context:

* Repo is a monorepo using workspace packages (e.g., `@workflow-pack/*`) during development.

* LM Studio plugin installation uses npm semantics and expects dependencies from `package.json` + `package-lock.json`; shipping only `pnpm-lock.yaml` is not sufficient for LM Studio’s install flow.

* The plugin generator currently emits `@workflow-pack/*` dependencies as external runtime deps, which breaks when installing outside the monorepo/workspace context.

Current Behavior (Actual):

* `npm notice Access token expired or revoked`.

* `npm error E404 … @workflow-pack/foundation … could not be found or you do not have permission`.

* Generated plugin uses `tsc` build only, so imports remain and runtime still requires `@workflow-pack/*` to be resolvable via npm.

* Generator hardcodes internal deps in `packages/lmstudio-plugin/src/scaffold.ts` (e.g., `@workflow-pack/foundation`, `@workflow-pack/workflow`, `@workflow-pack/registry`, `@workflow-pack/runner`, `@workflow-pack/workflows`), which guarantees npm attempts registry resolution and fails.

Expected Behavior:

* LM Studio can run `npm install` successfully for the generated plugin folder using `package.json` + `package-lock.json`.

* The plugin runs without requiring unpublished workspace packages to be installed from any registry (internal code is bundled into `dist/`).

Requirements:

* Generated plugin `package.json` must not include any `@workflow-pack/*` dependencies as registry-resolved runtime deps.

* Generated plugin build must bundle internal workspace code so `dist/` is self-contained (no runtime imports of `@workflow-pack/*`).

* Generated plugin output must include an npm lockfile (`package-lock.json`) and be installable via npm per LM Studio expectations.

* Resolve/refresh npm auth token when authentication is required (e.g., `npm logout`, `npm login`, `npm whoami`).

Out of Scope:

* Switching the entire monorepo from pnpm to npm (problem is not “pnpm vs npm” globally).

* Publishing internal packages just to make installation succeed (“Do not publish it just to proceed.”).

Reproduction Steps:

1. Generate/build the LM Studio plugin output folder.

2. In the generated plugin folder (standalone, outside workspace resolution), run `npm install` (as LM Studio does).

3. Observe `Access token expired or revoked` and/or `E404` for `@workflow-pack/foundation`.

Environment:

* OS: Unknown

* Node version: Unknown (example bundling target mentioned as `node20`, but actual runtime not provided).

* Package managers involved: pnpm (monorepo dev), npm (LM Studio plugin install).

* LM Studio version: Unknown

Evidence:

* Errors (verbatim fragments):

  * `npm notice Access token expired or revoked`

  * `npm error E404 … @workflow-pack/foundation … could not be found or you do not have permission`

* Code references:

  * `packages/lmstudio-plugin/src/scaffold.ts` emits `@workflow-pack/*` deps with `^0.1.0`.

  * Generated plugin uses `scripts.build = "tsc"` (no bundling).

Decisions / Agreements:

* Recommended approach: **Option 1** — bundle internal workspace packages into the LM Studio plugin build so the distributable plugin has only public deps (`@lmstudio/sdk`, `zod`) and does not require unpublished `@workflow-pack/*` at install/runtime.

* `file:` dependencies are acceptable only for local testing and are considered brittle for distribution.

Open Items / Unknowns:

* Exact LM Studio install workflow details for this repo (whether it copies plugin folders or installs in-place): Not provided.

* Actual Node/runtime version used by LM Studio in this environment: Unknown.

* Whether `@workflow-pack/*` is intended to be private registry hosted vs never published: Not provided (user stated “never published … still developing”).

Risks / Dependencies:

* If npm auth remains invalid, installs that require authenticated scopes/registries will continue to fail.

* Bundling must be configured to keep truly external/public deps external (e.g., `@lmstudio/sdk`, `zod`) while bundling workspace code.

Acceptance Criteria:

* Running `npm install` in the generated plugin folder succeeds without `E404` for any `@workflow-pack/*`.

* Generated plugin `package.json` contains only public installable dependencies (explicitly: keep `@lmstudio/sdk`, `zod`; remove all `@workflow-pack/*`).

* Generated plugin build output (`dist/`) includes bundled internal workflow-pack code (no runtime imports requiring `@workflow-pack/*` resolution).

* Generated plugin includes `package-lock.json` consistent with npm-based installs in LM Studio.

* If authentication is required for any remaining deps/registries, `npm whoami` succeeds after re-login and installs proceed.

Priority & Severity (if inferable from text):

* Priority: Not provided

* Severity: Not provided

Labels (optional):

* bug

* build

* packaging

* npm

* monorepo

* bundling

* lm-studio-plugin

* auth

---
