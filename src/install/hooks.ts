import fs from 'fs/promises';
import path from 'path';

export async function installPreCommitHook(): Promise<void> {
  const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
  const hookPath = path.join(gitHooksDir, 'pre-commit');

  // The hook script invokes our pre-commit.ts runner via tsx (or node if compiled)
  // For development/MVP, we'll assume tsx is available or use a relative path to node_modules/.bin/tsx
  const hookContent = `#!/bin/sh
# Cline Workflow Pack: Pre-commit Risk Gate
npx tsx pack/scripts/pre-commit.ts
`;

  try {
    await fs.mkdir(gitHooksDir, { recursive: true });
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
    console.log(`✅ Pre-commit hook installed to ${hookPath}`);
  } catch (error: any) {
    throw new Error(`Failed to install pre-commit hook: ${error.message}`);
  }
}
