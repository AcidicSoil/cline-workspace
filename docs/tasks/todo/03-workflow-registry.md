Context
- **Goal**: Create the system to discover, load, and resolve workflows from installed packs and local repositories.
- **Dependency**: Builds on `packages/workflow` (parser).
- **Strategist Insight**: ID collisions between packs need deterministic resolution (Q2).
- **Strategist Insight**: Need ability to hide/shadow workflows ("preview" mode) (Q17).

Success criteria
- `packages/registry` initialized.
- `WorkflowRegistry` class implemented with `list`, `get`, `search`.
- Recursive file system discovery implemented using `glob` or `fs`.
- Resolution logic handles ID collisions (Local > Installed).
- Support for `hidden: true` metadata in `listWorkflows` filtering (Q17).
- Deterministic sorting of workflows by ID.

Deliverables
- `packages/registry/package.json`
- `packages/registry/src/discovery.ts` (FileSystem scanning)
- `packages/registry/src/registry.ts` (Public API & Resolution)
- Unit tests for discovery, resolution precedence, and search.

Approach
1) **Package Setup**: Initialize `packages/registry` with dependencies (`glob`, `fast-glob`).
2) **Discovery Implementation**: Implement recursive scan for `.yml/.json` workflow files (Q2 experiment: verify discovery of duplicates).
3) **Registry Logic**:
   - Implement `resolveWorkflows` to merge lists.
   - Rule: Local repo workflows override built-in/installed workflows with same ID.
   - Rule: Throw error on collision between two *installed* packs (ambiguous).
   - Implement `listWorkflows` with optional `includeHidden` flag (Q17).
4) **Public API**: Expose `getWorkflow(id)` and `searchWorkflows(query)`.

Risks / unknowns
- **Unknown**: Performance of recursive scan on large repos (mitigated by `fast-glob` and depth limits).
- **Unknown**: Handling of malformed workflow files during discovery (should log warning and skip, not crash).

Testing & validation
- **Unit Tests**:
  - Mock file system with duplicates to test resolution logic.
  - Verify `hidden` workflows are excluded by default.
  - Verify fuzzy search accuracy.

Rollback / escape hatch
- Delete `packages/registry` directory.

Owner/Date
- Unknown / 2025-12-24
