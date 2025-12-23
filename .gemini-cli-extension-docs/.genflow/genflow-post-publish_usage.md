What “finished and published” looks like for your pack
------------------------------------------------------

Your project (manifest + installer + runners) is set up to ship as a reusable workflow pack with a CLI that can `install`, `list`, and `run <workflow-id>`, and includes workflows like pre-commit risk gating, CI PR review gating, changelog generation, and lint sweep/auto-fix.

tasks

How gemini-flow becomes the “front-end” for users
-------------------------------------------------

`gemini-flow` is already an official Gemini CLI extension that adds multi-agent orchestration commands (`hive-mind`, `swarm`, `agent`, `task`, `memory`, `sparc`, `workspace`) and bundles MCP servers/tools. [GitHub](https://github.com/clduab11/gemini-flow)

To let users drive _your_ workflows through that orchestration layer, publish your pack in one of these production shapes.

* * *

Pattern A — Ship your pack as a Gemini CLI extension (best UX)
--------------------------------------------------------------

1. Publish a repo containing `gemini-extension.json` with:

* `customCommands` that map to your workflows (`install`, `list`, `run pr-review`, `run lint-sweep`, etc.).

* Optional `mcpServers` entry that starts your local server (Pattern B) automatically.

* Optional `contextFiles` (ex: docs + usage) to prime the model.

Gemini CLI extensions are installed/enabled with `gemini extensions install <github-url>` and `gemini extensions enable <name>`. [Gemini CLI+1](https://geminicli.com/docs/extensions/)

User experience becomes:

* install your extension

* enable it

* run `gemini <your-command>` directly (same style as gemini-flow commands). [GitHub+1](https://github.com/clduab11/gemini-flow)

* * *

Pattern B — Expose your pack as an MCP server (best composability)
------------------------------------------------------------------

Implement an MCP server that exposes tools matching your CLI surface area:

* `list_workflows` → backed by your manifest (`listWorkflows`)

    tasks

* `run_workflow(id, inputs)` → backed by your `run <workflow-id>` orchestration

    tasks

* `install_pack(selection, overwritePolicy)` → backed by your installer plan/apply functions

    tasks

Users add it to Gemini CLI via `mcpServers` in `settings.json`. [Gemini CLI+1](https://geminicli.com/docs/tools/mcp-server/)
Gemini CLI supports Stdio/SSE/streamable HTTP MCP transports. [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)
MCP is a JSON-RPC–based client/server protocol; tool exposure is the intended integration point. [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25?utm_source=chatgpt.com)

User experience becomes:

* install your npm package / binary

* add `mcpServers` config

* in Gemini CLI: `/mcp list` to confirm tools, then natural-language requests invoke your tools. [Gemini CLI+1](https://geminicli.com/docs/tools/mcp-server/)

This is the cleanest way for gemini-flow swarms to call your workflows as “tools” during execution. [GitHub+1](https://github.com/clduab11/gemini-flow)

* * *

Pattern C — Ship only the standalone CLI (works, least integrated)
------------------------------------------------------------------

Your plan already includes a standalone CLI entry point (`install`, `list`, `run <workflow-id>`) and E2E validation.

tasks

Users can run it directly in terminals/CI, and gemini-flow remains separate.

* * *

What end users can do once installed
------------------------------------

Based on your defined workflows, the user-visible outcomes are:

* **Pre-commit risk gate**: stages diff → headless review → parse verdict → write artifact → block/allow commit via exit code.

    tasks

* **CI PR review gate**: compute PR diff → headless review → PASS/FAIL → attach `review-report.md` artifact → fail CI on FAIL.

    tasks

* **Daily changelog**: summarize recent commits → append to `CHANGELOG.md`.

    tasks

* **Lint sweep auto-fix**: run linter → on failure generate patch → apply patch → retry loop → exit non-zero if still failing.

    tasks

gemini-flow then adds the orchestration layer (agents/swarms/tasks/memory) on top of these deterministic workflow entrypoints. [GitHub](https://github.com/clduab11/gemini-flow)

---
