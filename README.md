# Workflow Pack

A host-agnostic workflow pack for daily engineering tasks. The same workflows are exposed across:
- Standalone CLI
- MCP tools (Model Context Protocol)
- Gemini CLI extension
- LM Studio tools provider plugin

The goal is deterministic, repeatable automation with explicit safety gates and stable JSON outputs.

## Highlights

- One source of truth for workflows (schema-driven definitions)
- Deterministic outputs for CI and automation
- Explicit safety gates (approve before side effects)
- Multiple host surfaces with shared execution engine

## Repository Layout

```
packages/
  foundation/        Shared types, errors, config, logging
  workflow/          Workflow schema, parsing, manifest logic
  registry/          Workflow discovery and precedence resolution
  runner/            Execution engine and step runners
  integrations/      Git/GitHub/test/lint wrappers
  workflows/         Built-in workflow catalog
  cli/               Standalone CLI adapter
  mcp-server/        MCP server adapter (stdio)
  gemini-extension/  Gemini CLI extension generator
  lmstudio-plugin/   LM Studio plugin generator
```

## Package Details

### packages/foundation
Core building blocks used by all packages.
- Types: Workflow, Step, RunResult, StepResult, HostKind
- Errors: ValidationError, PrereqMissingError, ExecutionError
- Logging: structured JSON or human logs with correlation IDs

### packages/workflow
Schema and parsing for workflow definitions.
- Zod schemas for workflow and step types
- YAML/JSON parsing and validation

### packages/registry
Discovery and resolution of workflows from built-ins and repo-local files.
- Local workflows: `.clinerules/workflows`
- Deterministic sorting and conflict resolution

### packages/runner
Execution engine and step runners.
- Shell steps with output capture
- AI steps with adapter contract
- Gate steps with interactive approvals
- Human-readable and JSON formatting

### packages/integrations
Wrappers around common external tools.
- git
- gh (GitHub CLI)
- test runner
- linter

### packages/workflows
Built-in workflow catalog.
- pr-review
- lint-sweep

### packages/cli
Standalone CLI adapter.
- list workflows
- run workflows
- generate Gemini/LM Studio artifacts

### packages/mcp-server
MCP server adapter (stdio transport).
- exposes each workflow as a tool
- includes a workflow-plan tool

### packages/gemini-extension
Generator for Gemini CLI extensions.
- emits `gemini-extension.json`
- emits `commands/*.toml`
- optional MCP server wiring with `${extensionPath}`

### packages/lmstudio-plugin
Generator for LM Studio tools provider plugin.
- emits `manifest.json`
- emits `src/toolsProvider.ts`
- includes configuration schematics

## Prerequisites

- Node.js 18+ recommended
- pnpm (managed via corepack)
- Optional: gh (GitHub CLI) for PR workflows

## Install

```bash
corepack enable
corepack use pnpm@10.25.0
pnpm install
```

## Build

```bash
pnpm -r run build
```

## Test

```bash
pnpm test
```

## CLI Usage

Build the CLI:

```bash
pnpm --filter @workflow-pack/cli run build
```

List workflows:

```bash
node packages/cli/dist/index.js list
```

Run a workflow:

```bash
node packages/cli/dist/index.js run pr-review --prNumber 123
```

Dry-run to avoid side effects:

```bash
node packages/cli/dist/index.js run lint-sweep --dry-run
```

### Generate Gemini + LM Studio artifacts

```bash
node packages/cli/dist/index.js generate --out /tmp/workflow-pack-artifacts
```

Outputs:
- `/tmp/workflow-pack-artifacts/gemini-extension`
- `/tmp/workflow-pack-artifacts/lmstudio-plugin`

## MCP Server Usage

Build the MCP server:

```bash
pnpm --filter @workflow-pack/mcp-server run build
```

Run the MCP server (stdio):

```bash
node packages/mcp-server/dist/index.js
```

Optional AI mode:

```bash
MCP_AI_MODE=mock node packages/mcp-server/dist/index.js
```

### Validate with MCP Inspector

```bash
npx -y @modelcontextprotocol/inspector node packages/mcp-server/dist/index.js
```

## Gemini Extension Output

Generated `gemini-extension.json` includes MCP wiring using `${extensionPath}`:

```json
{
  "mcpServers": {
    "workflow-pack": {
      "command": "node",
      "args": ["${extensionPath}${/}mcp-server.mjs"],
      "cwd": "${extensionPath}"
    }
  }
}
```

The generator also emits `commands/*.toml` for Gemini custom commands.

## LM Studio Plugin Output

The LM Studio generator scaffolds a plugin with:
- `manifest.json` (type: plugin, runner: node)
- `src/toolsProvider.ts` mapping workflows to tools
- `src/config.ts` for plugin configuration

## Local Workflows

Repo-local workflows can be added under:

```
.clinerules/workflows/
```

These override built-in workflows when IDs collide.

## Safety Gates

Gate steps require explicit approval in interactive hosts.
In non-interactive hosts (MCP, LM Studio), use auto-approve flags:
- MCP tool args: `_autoApproveGates: true`
- LM Studio plugin config: `autoApproveGates: true`

## Contributing Notes

- Keep outputs deterministic and machine-readable.
- Avoid host-specific logic inside workflow definitions.
- Add tests for schema changes and new adapters.

