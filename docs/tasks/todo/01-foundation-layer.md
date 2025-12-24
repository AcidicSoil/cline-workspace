Context
- **Project Goal**: Create a host-agnostic workflow pack with one source of truth (`AGENTS.md`).
- **Current State**: Green field; no existing code.
- **Strategist Insight**: Need to handle `HostKind` capabilities early to prevent runtime errors (Q1).
- **Strategist Insight**: Secret redaction needs to be robust (Q7).
- **Strategist Insight**: Logging requires correlation IDs for async traceability (Q4).
- **Strategist Insight**: Error handling needs to map diverse failures to stable exit codes (Q12).

Success criteria
- Monorepo structure initialized with `pnpm`.
- `packages/foundation` created and compiling.
- `HostKind` enum defined in `types.ts`.
- `PackError` hierarchy defined in `errors.ts` with exit code mapping.
- `loadConfig` implemented with precedence logic and secret redaction.
- Structured JSON logging implemented with correlation IDs.
- CI/CD tooling (ESLint, Vitest) configured at root.

Deliverables
- `pnpm-workspace.yaml`
- `package.json` (Root)
- `packages/foundation/package.json`
- `packages/foundation/src/types.ts`
- `packages/foundation/src/errors.ts`
- `packages/foundation/src/config.ts`
- `packages/foundation/src/logging.ts`
- Root `tsconfig.json` & `.eslintrc.json`

Approach
1) **Initialize Monorepo**: Set up `pnpm` workspace, root `package.json`, and create package directories (`foundation`, `workflow`, `cli`, etc.).
2) **Foundation Setup**: Initialize `packages/foundation` with TypeScript config.
3) **Types Implementation**: Define `Workflow`, `Step`, and `HostKind` (Q1 experiment: mock `HostKind` to verify conditional logic).
4) **Errors Implementation**: Create `PackError` and subclasses. Implement `getExitCode` (Q12 experiment: verify distinct codes for different error types).
5) **Config Implementation**: Build `loadConfig` and `redactSensitive` (Q7 experiment: verify redaction of non-standard keys).
6) **Logging Implementation**: Setup `Logger` with `correlationId` (Q4 experiment: verify persistence across async steps).

Risks / unknowns
- **Unknown**: How strict `redactSensitive` needs to be (value-based vs key-based). Q7 suggests key-based might be insufficient.
- **Unknown**: Specifics of `HostKind` capabilities for future hosts (LM Studio vs CLI).
- **Unknown**: Performance overhead of structured logging in high-volume steps.

Testing & validation
- **Unit Tests**:
  - Verify `getExitCode` returns correct integers.
  - Verify `redactSensitive` masks secrets.
  - Verify `Logger` outputs valid JSON with correlation IDs.
- **Build Verification**: Ensure `packages/foundation` compiles with `tsc`.

Rollback / escape hatch
- Delete `packages/foundation` and revert `pnpm-workspace.yaml` if architecture proves untenable.

Owner/Date
- Unknown / 2025-12-24
