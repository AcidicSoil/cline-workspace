"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGeminiExtension = generateGeminiExtension;
exports.loadWorkflows = loadWorkflows;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const registry_1 = require("@workflow-pack/registry");
const workflows_1 = require("@workflow-pack/workflows");
const foundation_1 = require("@workflow-pack/foundation");
const mapper_1 = require("./mapper");
async function generateGeminiExtension(options) {
    const workflows = options.workflows ?? (await loadWorkflows());
    const config = (0, mapper_1.buildGeminiExtensionConfig)(workflows, options);
    await promises_1.default.mkdir(options.outputDir, { recursive: true });
    const configPath = path_1.default.join(options.outputDir, 'gemini-extension.json');
    await promises_1.default.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    if (options.contextFileContent && options.contextFileName) {
        const contextPath = path_1.default.join(options.outputDir, options.contextFileName);
        await promises_1.default.writeFile(contextPath, options.contextFileContent, 'utf-8');
    }
    if (options.includeMcpServer && options.mcpServerUseExtensionPath) {
        const entryFile = options.mcpServerEntryFile ?? 'mcp-server.mjs';
        const entryPath = path_1.default.join(options.outputDir, entryFile);
        const script = buildMcpServerEntry();
        await promises_1.default.writeFile(entryPath, script, 'utf-8');
    }
    if (options.includeCommands !== false) {
        const commandsDir = path_1.default.join(options.outputDir, 'commands');
        await promises_1.default.mkdir(commandsDir, { recursive: true });
        for (const workflow of workflows) {
            const fileName = `${workflow.id}.toml`;
            const filePath = path_1.default.join(commandsDir, fileName);
            const toml = (0, mapper_1.buildCustomCommandToml)(workflow);
            await promises_1.default.writeFile(filePath, toml, 'utf-8');
        }
    }
}
async function loadWorkflows() {
    const logger = new foundation_1.Logger();
    const registry = new registry_1.WorkflowRegistry(logger);
    const localDirs = await resolveLocalWorkflowDirs();
    await registry.initialize(localDirs, []);
    for (const wf of workflows_1.workflows) {
        registry.registerWorkflow(wf, 'installed');
    }
    return registry.listWorkflows();
}
function buildMcpServerEntry() {
    return [
        "import { startServer } from '@workflow-pack/mcp-server';",
        '',
        'startServer().catch((error) => {',
        '  console.error(error);',
        '  process.exit(1);',
        '});',
        ''
    ].join('\n');
}
async function resolveLocalWorkflowDirs() {
    const localDir = path_1.default.join(process.cwd(), '.clinerules', 'workflows');
    try {
        await promises_1.default.access(localDir);
        return [localDir];
    }
    catch {
        return [];
    }
}
