"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installPreCommitHook = installPreCommitHook;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function installPreCommitHook() {
    const gitHooksDir = path_1.default.join(process.cwd(), '.git', 'hooks');
    const hookPath = path_1.default.join(gitHooksDir, 'pre-commit');
    // The hook script invokes our pre-commit.ts runner via tsx (or node if compiled)
    // For development/MVP, we'll assume tsx is available or use a relative path to node_modules/.bin/tsx
    const hookContent = `#!/bin/sh
# Cline Workflow Pack: Pre-commit Risk Gate
npx tsx pack/scripts/pre-commit.ts
`;
    try {
        await promises_1.default.mkdir(gitHooksDir, { recursive: true });
        await promises_1.default.writeFile(hookPath, hookContent, { mode: 0o755 });
        console.log(`✅ Pre-commit hook installed to ${hookPath}`);
    }
    catch (error) {
        throw new Error(`Failed to install pre-commit hook: ${error.message}`);
    }
}
