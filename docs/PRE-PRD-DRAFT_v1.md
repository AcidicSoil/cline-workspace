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

* run `gemini <your-command>` directly

* * *

Pattern B — Expose pack as an MCP server (best composability)
------------------------------------------------------------------

Implement an MCP server that exposes tools matching your CLI surface area:

Users add it to Gemini CLI via `mcpServers` in `settings.json`. [Gemini CLI+1](https://geminicli.com/docs/tools/mcp-server/)
Gemini CLI supports Stdio/SSE/streamable HTTP MCP transports. [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/)
MCP is a JSON-RPC–based client/server protocol; tool exposure is the intended integration point. [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25?utm_source=chatgpt.com)

User experience becomes:

* install your npm package / binary

* add `mcpServers` config

* in Gemini CLI: `/mcp list` to confirm tools, then natural-language requests invoke your tools. [Gemini CLI+1](https://geminicli.com/docs/tools/mcp-server/)

* * *

Pattern C — Ship only standalone CLI (works, least integrated)
------------------------------------------------------------------

Include a standalone CLI entry point and E2E validation.

Users can run it directly in terminals/CI

* * *
