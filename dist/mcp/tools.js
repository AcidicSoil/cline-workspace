"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallPackSchema = exports.RunWorkflowSchema = exports.ListWorkflowsSchema = void 0;
exports.handleListWorkflows = handleListWorkflows;
exports.handleRunWorkflow = handleRunWorkflow;
exports.handleInstallPack = handleInstallPack;
const zod_1 = require("zod");
const index_1 = require("../manifest/index");
const exec_1 = require("../utils/exec");
const index_2 = require("../manifest/index");
const verdict_1 = require("../gating/verdict");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const file_ops_1 = require("../utils/file-ops");
exports.ListWorkflowsSchema = zod_1.z.object({});
exports.RunWorkflowSchema = zod_1.z.object({
    workflow_id: zod_1.z.string(),
    inputs: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    mode: zod_1.z.enum(['headless', 'interactive']).optional(),
    artifactDir: zod_1.z.string().optional(),
});
exports.InstallPackSchema = zod_1.z.object({
    targetPath: zod_1.z.string(),
    selection: zod_1.z.array(zod_1.z.string()).optional(), // specific files or 'all'
    overwritePolicy: zod_1.z.enum(['overwrite', 'skip', 'abort']).default('skip'),
});
async function handleListWorkflows(args) {
    // Ensure manifest is loaded (if dynamic)
    await (0, index_1.loadManifest)();
    return (0, index_1.listWorkflows)();
}
async function handleRunWorkflow(args) {
    const workflow = (0, index_2.getWorkflow)(args.workflow_id);
    if (!workflow) {
        throw new Error(`Workflow not found: ${args.workflow_id}`);
    }
    const command = `node`;
    const scriptPath = `scripts/cline/${args.workflow_id}.js`; // Convention
    const cliArgs = [scriptPath];
    if (args.inputs) {
        cliArgs.push('--inputs', JSON.stringify(args.inputs));
    }
    try {
        const result = await (0, exec_1.executeCommand)(command, cliArgs);
        let verdict;
        if (workflow.outputs.some(o => o.name === 'verdict' || o.name === 'status')) {
            verdict = (0, verdict_1.parseVerdict)(result.stdout);
        }
        return {
            workflowId: args.workflow_id,
            status: result.exitCode === 0 ? 'success' : 'failure',
            verdict,
            output: result.stdout + (result.stderr ? `\nSTDERR:\n${result.stderr}` : ''),
            artifacts: args.artifactDir ? [] : [], // Would list files in artifactDir
        };
    }
    catch (error) {
        return {
            workflowId: args.workflow_id,
            status: 'failure',
            output: `Execution failed: ${error.message}`,
            artifacts: [],
        };
    }
}
async function handleInstallPack(args) {
    const report = { status: 'success', actions: [], summary: '' };
    // Hardcoded pack path for MVP
    const packSrc = path_1.default.join(__dirname, '../../pack');
    const workflowSrc = path_1.default.join(packSrc, 'workflows');
    // Check if pack exists (mock if running in minimal env)
    try {
        // Simplified: just install workflows
        const files = await promises_1.default.readdir(workflowSrc);
        for (const file of files) {
            if (args.selection && args.selection.length > 0 && !args.selection.includes(file)) {
                continue;
            }
            const srcFile = path_1.default.join(workflowSrc, file);
            const destFile = path_1.default.join(args.targetPath, '.clinerules/workflows', file);
            let action = 'created';
            let fileExists = false;
            try {
                await promises_1.default.access(destFile);
                fileExists = true;
            }
            catch {
                fileExists = false;
            }
            if (fileExists) {
                if (args.overwritePolicy === 'abort') {
                    throw new Error(`File ${file} exists and policy is abort`);
                }
                else if (args.overwritePolicy === 'skip') {
                    action = 'skipped';
                }
                else {
                    action = 'overwritten';
                }
            }
            else {
                action = 'created';
            }
            if (action !== 'skipped') {
                // Determine if it needs template rendering (e.g. if it ends in .template)
                // For now, simple copy
                await (0, file_ops_1.copyFile)(srcFile, destFile);
            }
            report.actions.push({ file, action });
        }
    }
    catch (e) {
        report.status = 'failure';
        report.summary = e.message;
        return report;
    }
    report.summary = `Installed ${report.actions.filter(a => a.action === 'created' || a.action === 'overwritten').length} files.`;
    return report;
}
