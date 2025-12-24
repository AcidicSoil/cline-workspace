Title:

* Fix cline-workspace MCP server packaging/path resolution for LM Studio (missing workflow scripts, broken pack install, undefined workspace)

Summary:

* The `cline-workspace` MCP server fails when run under LM Studio because the `pr-review` workflow module is not present in LM Studio’s installed plugin directory, causing a “Cannot find module … pr-review.js” runtime error.
* The `install_pack` operation reports “0 files installed,” indicating the pack selection resolves to no files and/or the source/target paths are incorrect; the target path observed is `/project/workspace/undefined`.
* The server must package workflow assets (`scripts/**`, `packs/**`) correctly (or bundle them into `dist/**`), resolve workflow paths relative to the server file location, and make workspace root deterministic across MCP hosts like LM Studio.

Background / Context:

* LM Studio is used as an MCP host and launches MCP servers from `mcp.json` (Cursor-style notation).
* LM Studio installs MCP servers under a per-user directory (example shown on Windows under `C:\Users\user\.cache\lm-studio\extensions\plugins\mcp\...`) and executes the server from that installed location.
* Available workflows mentioned: PR Review, Daily Changelog, Pre-commit Risk Gate, Lint Sweep & Auto-Fix.
* A secondary goal discussed: optionally ship an LM Studio TypeScript plugin (SDK) in addition to the MCP server, sharing a common core module.

Current Behavior (Actual):

* Running PR Review fails with a missing module error (verbatim excerpt): “Error: Cannot find module 'C:\Users\user\.cache\lm-studio\extensions\plugins\mcp\cline-workspace\scripts\cline\pr-review.js'”.
* `install_pack` for “pr-review” reports 0 files installed.
* Workspace path derivation produces `/project/workspace/undefined`, indicating a required value is unset in LM Studio context.

Expected Behavior:

* Workflows (including `pr-review`) execute in LM Studio without missing-module/path errors.
* `install_pack` installs at least one file for the selected workflow pack and returns the installed file list.
* Workspace root is deterministic (explicit tool arg/env/cwd) and never resolves to `/project/workspace/undefined`.

Requirements:

* Packaging / distribution

  * Ensure `scripts/cline/pr-review.js` is present at runtime where the server expects it, **or** remove runtime filesystem loading by bundling workflows into `dist/**`.
  * If keeping runtime loading, include `scripts/**` and `packs/**` in the distributed artifact (example approach: `package.json` `files` allowlist).
* Path resolution

  * Resolve workflow paths relative to the server module location (`import.meta.url` / `__dirname`), not `process.cwd()`, so LM Studio’s install directory layout works.
* Pack installation (`install_pack`)

  * Pack must include a manifest mapping `"pr-review"` → concrete file paths (at minimum `scripts/cline/pr-review.js`).
  * `install_pack` must validate non-empty selection, copy files to a real writable target directory, and return installed file list (not “0 files”).
  * If packs install into the plugin, target directory should be inside the plugin install (not `/project/workspace/...`).
* Workspace root handling

  * Treat workspace root as explicit (tool arg or environment variable such as `CLINE_WORKSPACE_ROOT`), or only default to `process.cwd()` when `cwd` is set intentionally in `mcp.json`.
* LM Studio MCP configuration (for local stdio)

  * Provide an `mcp.json` entry using `command` + `args` to point to the built JS entrypoint; optionally set `cwd` and `CLINE_WORKSPACE_ROOT`.
* Optional: LM Studio TypeScript plugin (in addition to MCP server)

  * Implement a plugin that exposes the same workflows via a Tools Provider, calling a shared “core” module used by the MCP server.
  * Note: plugin affects LM Studio in-app tool availability; it does not change OpenAI-compatible REST clients’ need to send tool definitions.
  * Plugin dependency constraint: LM Studio installs dependencies from `package.json` + `package-lock.json` and does not run `postinstall`.

Out of Scope:

* Removing the requirement for OpenAI-compatible REST clients to provide tool definitions/tool-call execution logic.
* Remote MCP transport setup (HTTP/SSE) unless explicitly implemented/required.

Reproduction Steps:

1. Configure LM Studio `mcp.json` to run the `cline-workspace` MCP server.
2. In LM Studio, list workflows/tools (workflows visible include PR Review, Daily Changelog, Pre-commit Risk Gate, Lint Sweep & Auto-Fix).
3. Execute the PR Review workflow (example mentioned: PR #123).
4. Observe failure: missing module `...scripts\\cline\\pr-review.js`.
5. Run `install_pack` for “pr-review”; observe “0 files installed” and `/project/workspace/undefined` path symptom.

Environment:

* OS: Windows (implied by `C:\Users\user\...`).
* LM Studio version: Unknown (conversation references MCP host behavior; exact version not provided).
* Node.js version: Unknown
* MCP server repo: `https://github.com/AcidicSoil/cline-workspace` (per user).
* LM Studio install path basis: `C:\Users\user\.cache\lm-studio\extensions\plugins\mcp\...` observed.

Evidence:

* Missing module error: `Error: Cannot find module 'C:\\Users\\user\\.cache\\lm-studio\\extensions\\plugins\\mcp\\cline-workspace\\scripts\\cline\\pr-review.js'`.
* Pack install result: “0 files installed”.
* Invalid derived workspace path: `/project/workspace/undefined`.
* LM Studio `mcp.json` pattern including `cwd` and `CLINE_WORKSPACE_ROOT` discussed.

Decisions / Agreements:

* Workflows/scripts must be bundled into `dist/**` or shipped alongside as package files (`scripts/**`, `packs/**`) for LM Studio-installed execution.
* Path resolution should be based on server file location, not `process.cwd()`.
* Workspace root must be explicit (env/tool arg/cwd) in LM Studio; do not assume VS Code-style workspace behavior.
* It is feasible to provide an LM Studio TypeScript plugin in addition to the MCP server by sharing a “core” module.

Open Items / Unknowns:

* Actual build entrypoint file name/path used by the MCP server under LM Studio (`dist/index.js` vs `dist/server.js` mentioned in examples).
* Current pack manifest format/location and how `install_pack` selects files (not provided).
* Intended install target for packs (inside plugin vs external workspace directory) not finalized beyond “must be real/writable and not `/project/workspace/...`”.
* LM Studio version and exact install root (`.cache` vs `.lmstudio`) in the user’s setup.

Risks / Dependencies:

* If workflow scripts remain filesystem-loaded, packaging omissions will continue to break under hosts that relocate installs (LM Studio plugin directory).
* LM Studio plugin dependency installation constraints (no `postinstall`) may require adjusting build/publish process for the optional TypeScript plugin.

Acceptance Criteria:

* [ ] In LM Studio, `pr-review` executes without “Cannot find module … pr-review.js”.
* [ ] Pack installation for “pr-review” installs ≥1 file and returns an installed-file list (not “0 files installed”).
* [ ] Workspace root never resolves to `/project/workspace/undefined`; it is provided deterministically (env/tool arg/cwd).
* [ ] Workflow asset handling is host-agnostic: either workflows bundled into `dist/**` or `scripts/**` + `packs/**` reliably included in the distributed artifact.
* [ ] (Optional) LM Studio TypeScript plugin builds and registers equivalent tools via a Tools Provider using a shared core module.

Priority & Severity (if inferable from text):

* Priority: Not provided
* Severity: Not provided

Labels (optional):

* bug, mcp, lm-studio, packaging, path-resolution, install-pack, workflows, plugin
