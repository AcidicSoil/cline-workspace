Context
- Add a CLI surface to generate Gemini CLI extension and LM Studio plugin artifacts from the repo’s workflow registry.
- Wire the MCP server into Gemini extension output using ${extensionPath} for portable paths.
- Add MCP integration tests that exercise tools/list and tools/call using a live stdio server.

Success criteria
- CLI command generates Gemini and LM Studio artifacts to a user-specified output directory.
- Generated gemini-extension.json includes mcpServers wiring with ${extensionPath} paths and optional commands/context files.
- MCP integration tests start the server, call tools/list, call workflow-plan, and call a workflow tool with dry-run options.

Deliverables
- CLI command implementation in packages/cli (new command + wiring).
- Gemini generator update to support extensionPath-based MCP server config.
- MCP integration tests under packages/mcp-server/tests (or tests/integration).
- README or docs update if CLI usage needs to be documented.

Approach
1) Review CLI command patterns (packages/cli/src/commands) and add a new command (e.g., generate) that calls gemini/lmstudio generators.
2) Update gemini-extension generator/mapper to allow ${extensionPath} templating for mcpServers and context files, with explicit options.
3) Implement MCP integration tests using a stdio client from @modelcontextprotocol/sdk to spin up the server and assert:
   - tools/list includes workflow-plan and at least one workflow.
   - tools/call workflow-plan returns a plan shape.
   - tools/call on a workflow respects _dryRun and returns a RunResult.
4) Add test fixtures or environment setup for predictable workflows (built-ins) and ensure deterministic outputs.
5) Update docs/README if new CLI usage is added.

Risks / unknowns
- MCP client/transport API stability and test harness setup in Node (stdio transport life-cycle).
- Gemini CLI support for customCommands vs commands/*.toml; ensure generated artifacts match actual CLI behavior.
- Determinism of RunResult timestamps in tests (may need to assert shape, not exact time values).

Testing & validation
- Unit tests for CLI argument parsing (if needed).
- Integration tests for MCP tools/list and tools/call via stdio client.
- Optional: run CLI generate command in a temp dir and verify outputs exist.

Rollback / escape hatch
- Remove the new CLI command and generator options if MCP/Gemini wiring causes issues.

Owner/Date
- Codex / 2025-12-26
