Context
- **Goal**: Create adapters to generate configuration for Gemini CLI and LM Studio plugins.
- **Dependency**: Builds on `packages/registry` (to list workflows).
- **Strategist Insight**: Need to handle complex parameter mapping for Gemini `customCommands` (Q9).
- **Strategist Insight**: Strict versioning in manifests affects generation logic (Q20).

Success criteria
- `packages/adapters/gemini` initialized.
- `packages/adapters/lmstudio` initialized.
- `generateGeminiConfig`:
  - Maps workflows to `customCommands`.
  - Generates `gemini-extension.json`.
- `generateLmStudioPlugin`:
  - Scaffolds plugin directory structure.
  - Generates `manifest.json` and `package.json`.
  - Generates TypeScript tool definitions calling the CLI.

Deliverables
- `packages/adapters/gemini/src/generator.ts`
- `packages/adapters/lmstudio/src/generator.ts`
- `packages/adapters/lmstudio/src/scaffold.ts`
- Unit tests verifying JSON output against schemas.

Approach
1) **Gemini Generator**:
   - Iterate registry workflows.
   - Map parameters to `--flag` arguments in the `command` string.
   - Output `gemini-extension.json`.
2) **LM Studio Generator**:
   - Create a template for the LM Studio plugin entry point.
   - Generate a `tools.ts` file that imports the workflow registry (or spawns CLI) and maps inputs/outputs.
   - Generate `manifest.json`.

Risks / unknowns
- **Unknown**: Specific schema for LM Studio plugin manifest (will use generic placeholder based on PRD).
- **Unknown**: How to handle "interactive" steps in LM Studio tools (likely via tool result requesting user action, or just failing).

Testing & validation
- **Snapshot Tests**:
  - Run generator against mock registry.
  - Snapshot the resulting `gemini-extension.json` and LM Studio files.

Rollback / escape hatch
- Delete `packages/adapters` directory.

Owner/Date
- Unknown / 2025-12-24
