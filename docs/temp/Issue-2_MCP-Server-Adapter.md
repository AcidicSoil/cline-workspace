Title:

* Implement native MCP server adapter independent of Gemini CLI extension

Summary:

* The workflow-pack architecture includes an MCP “server adapter,” but the user clarified the MCP surface must be a standalone, native MCP server (not a Gemini-extension-specific MCP shim). The MCP server must be usable by any MCP host/client and must implement the MCP lifecycle plus tools primitives for workflows. The Gemini CLI extension should remain a distribution wrapper that can optionally launch/reference the native MCP server.

Background / Context:

* Goal: ship a repeatable “AI-assisted engineering workflows” pack that exposes the same workflow catalog across multiple host surfaces (standalone CLI, MCP tools, Gemini CLI extension, LM Studio plugin).

* Original plan placed MCP server work under “Additional distribution adapters,” alongside Gemini extension generator and LM Studio plugin.

* User requirement update: “the mcp server needs to be native mcp server, and not just the gemini extension mcp” (per user).

Current Behavior (Actual):

* MCP is described as an “adapter” and may be interpreted as Gemini-extension-scoped rather than a first-class standalone server (per user requirement change).

* No explicit native MCP server runtime boundaries (protocol lifecycle + transport) are guaranteed by the earlier “adapter” description alone.

Expected Behavior:

* Provide a standalone MCP server implementation that any MCP client can connect to (not tied to Gemini extension).

* MCP server supports MCP lifecycle (initialize/capability negotiation) and tools primitives (`tools/list`, `tools/call`) where each workflow is exposed as a tool with an input schema.

* Gemini CLI extension remains a packaging/distribution wrapper that can optionally start/reference the native MCP server (instead of “being” the MCP server).

Requirements:

* Native MCP server must be usable by any MCP host/client (e.g., not Gemini-only).

* Transport:

  * Must support stdio transport at minimum with newline-delimited JSON-RPC; logs to stderr.

  * Optional: support Streamable HTTP transport for remote/multi-client deployment.

* Protocol/lifecycle:

  * Implement MCP initialization and capability negotiation (`initialize`, `notifications/initialized` readiness flow).

* Tools surface:

  * Implement `tools/list` and `tools/call`.

  * Expose one tool per workflow; `tools/list` is dynamic; each tool advertises `inputSchema` (JSON Schema) and returns structured results/errors via the shared runner.

* Repository/module structure for MCP:

  * `adapters/mcp-server/` split into `protocol/`, `transports/stdio/`, `transports/http/` (optional), `tools/` (workflow-to-tool registry + execution binding).

* Dependency alignment:

  * `adapters/mcp-server` depends on workflow registry + runner + formatting + manifest + logging (as first-class adapter, not Gemini-specific).

Out of Scope:

* Resources and Prompts MCP primitives are explicitly optional/non-MVP.

* Whether MCP is required for MVP vs later phase is not decided (see Open Items).

Reproduction Steps:

* Not provided.

Environment:

* OS: Unknown

* Runtime/Language: Unknown (architecture mentions TypeScript components elsewhere, but not explicitly required here)

* Deployment/Host(s): Unknown

Evidence:

* Source conversation + design notes: “AI-assisted Engineering Workflows.md”.

* User requirement statement: “the mcp server needs to be native mcp server, and not just the gemini extension mcp” (per user).

Decisions / Agreements:

* MCP server must be a standalone native MCP server (per user).

* Gemini extension remains a distribution wrapper that can reference/start the native MCP server via stdio (per assistant update).

* Optional HTTP transport is recommended but not required for MVP (per assistant).

Open Items / Unknowns:

* Whether MCP is required for MVP or remains a later-phase adapter (assistant suggested moving it earlier “if MCP is required for MVP,” but no decision captured).

* Exact MCP protocol version target and compatibility policy: Not provided.

* Concurrency/multi-client behavior expectations (esp. for HTTP transport): Not provided.

Risks / Dependencies:

* Dependency on external MCP client compatibility and transport framing correctness (stdio newline-delimited JSON-RPC; stderr logging).

* If optional HTTP transport is implemented, additional multi-client and integration testing complexity (implied by “remote/multi-client deployment”).

Acceptance Criteria:

* MCP server successfully completes MCP lifecycle:

  * Responds to `initialize` with negotiated capabilities and handles `notifications/initialized`.

* MCP tools surface works end-to-end:

  * `tools/list` returns a tool per workflow with a valid `inputSchema`.

  * `tools/call` executes the mapped workflow via the shared runner and returns structured output/errors.

* Stdio transport compliance:

  * JSON-RPC messages are newline-delimited; no embedded newlines; server logs go to stderr.

* Test coverage exists for:

  * Protocol contract: initialize → tools/list → tools/call (fixture-based).

  * Transport framing rules for stdio.

* Gemini extension packaging does not replace the MCP server:

  * Extension can optionally launch/reference the native MCP server (stdio) but MCP server remains independently runnable.

Priority & Severity (if inferable from text):

* Priority: Not provided

* Severity: Not provided

Labels (optional):

* enhancement

* mcp

* server

* protocol

* transport

* tooling

* architecture

---
