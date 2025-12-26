Context

- **Goal**: specific the schema and parsing logic for workflows and pack manifests.
- **Dependency**: Builds on `packages/foundation` (types).
- **Strategist Insight**: Need strict version control in manifests to prevent host incompatibility (Q8, Q20).
- **Strategist Insight**: Schema should support safety features like `dryRun` (Q13) and failure recovery (Q18).

Success criteria

- `packages/workflow` initialized.
- Zod schemas implemented for all `Step` types and `WorkflowDefinition`.
- `Manifest` schema defined with `engines` support (semver).
- `parseWorkflow` validates JSON/YAML against schema.
- `parseManifest` enforces host version compatibility.
- Error reporting provides specific path/line details for validation failures.

Deliverables

- `packages/workflow/package.json`
- `packages/workflow/src/schema.ts`
- `packages/workflow/src/manifest.ts`
- `packages/workflow/src/parser.ts`
- Unit tests for schema validation and manifest parsing.

Approach

1) **Package Setup**: Initialize `packages/workflow` with dependencies (`zod`, `js-yaml`, `semver`).
2) **Schema Definition**: Implement Zod schemas mirroring `foundation/types`.
   - Add `onFailure` (step ID) to Step schema (Q18).
   - Add `dryRun` to ShellStep schema (Q13).
3) **Manifest Implementation**: Define `PackManifest` schema with `engines` field (Q8 experiment: parse and throw on version mismatch).
4) **Parser Implementation**: Create `parseWorkflow` and `validateWorkflow`.
   - Implement strict version checking (Q20 experiment: warn/reject breaking versions).

Risks / unknowns

- **Unknown**: Performance cost of large Zod schema validation on massive workflows.
- **Unknown**: Handling of forward compatibility (ignoring unknown fields vs strict validation). Task description says "reject unknown fields", which implies strictness.

Testing & validation

- **Unit Tests**:
  - Verify invalid schemas return helpful error messages.
  - Verify `engines` check correctly handles semantic version ranges.
  - Verify `dryRun` and `onFailure` fields are parsed correctly.

Rollback / escape hatch

- Delete `packages/workflow` directory.

Owner/Date

- Unknown / 2025-12-24
