Context
- **Goal**: Expose workflows as Model Context Protocol (MCP) tools.
- **Dependency**: Builds on `packages/registry` and `packages/runner`.
- **Strategist Insight**: LLMs need a `plan` tool to confirm intent before execution (Q19).

Success criteria
- `packages/mcp-server` initialized.
- MCP server implemented using `@modelcontextprotocol/sdk`.
- `tools/list` dynamically maps registered workflows to MCP tools.
- `tools/call` invokes the `WorkflowEngine`.
- A specific `plan` tool returns the workflow execution graph without running it (Q19).
- Workflow parameters are correctly advertised in the MCP tool schemas.
- Error handling maps Runner errors to MCP error responses.

Deliverables
- `packages/mcp-server/package.json`
- `packages/mcp-server/src/index.ts` (Server implementation)
- `packages/mcp-server/src/mapping.ts` (Workflow to Tool schema)
- Unit tests using an MCP client simulator.

Approach
1) **Package Setup**: Initialize `packages/mcp-server` with `@modelcontextprotocol/sdk`.
2) **Dynamic Mapping**: Implement logic to convert `WorkflowDefinition` into MCP `Tool` definitions.
3) **Server Logic**: Implement `StdioServerTransport` server.
   - `listTools`: Include all discovered workflows + the generic `plan` tool (Q19).
   - `callTool`: 
     - For `plan`: Return the steps/description of the workflow.
     - For others: Build context, run engine, return formatted results.
4) **Testing**: Verify tool registration and calling using a mock stdio client.

Risks / unknowns
- **Unknown**: Mapping complex parameter types (enums, arrays) to MCP JSON schema precisely.
- **Unknown**: Performance of dynamic tool listing if the registry grows very large.

Testing & validation
- **Integration Tests**:
  - Verify `listTools` includes `pr-review`.
  - Verify `callTool` for `plan` returns step sequence.
  - Verify `callTool` for `pr-review` (dry-run) triggers engine.

Rollback / escape hatch
- Delete `packages/mcp-server` directory.

Owner/Date
- Unknown / 2025-12-24
