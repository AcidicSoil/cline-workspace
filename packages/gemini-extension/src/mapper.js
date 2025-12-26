"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGeminiExtensionConfig = buildGeminiExtensionConfig;
exports.buildCustomCommand = buildCustomCommand;
exports.buildCustomCommandToml = buildCustomCommandToml;
function buildGeminiExtensionConfig(workflows, options) {
    const config = {
        name: options.name,
        version: options.version,
        contextFileName: options.contextFileName
    };
    if (options.includeMcpServer) {
        const serverName = options.mcpServerName ?? 'workflow-pack';
        const useExtensionPath = options.mcpServerUseExtensionPath ?? false;
        const entryFile = options.mcpServerEntryFile ?? 'mcp-server.mjs';
        const serverCommand = options.mcpServerCommand ?? 'workflow-mcp';
        const serverArgs = options.mcpServerArgs ?? [];
        const serverCwd = options.mcpServerCwd;
        config.mcpServers = {
            [serverName]: useExtensionPath
                ? {
                    command: 'node',
                    args: [`${'${extensionPath}'}${'${/}'}${entryFile}`],
                    cwd: `${'${extensionPath}'}`
                }
                : {
                    command: serverCommand,
                    args: serverArgs,
                    cwd: serverCwd
                }
        };
    }
    if (options.includeCustomCommands !== false) {
        const commands = {};
        for (const workflow of workflows) {
            commands[workflow.id] = buildCustomCommand(workflow);
        }
        config.customCommands = commands;
    }
    return config;
}
function buildCustomCommand(workflow) {
    const description = workflow.description ?? `Run workflow ${workflow.id}`;
    const requiredParams = Object.entries(workflow.params ?? {})
        .filter(([, param]) => param.default === undefined)
        .map(([key]) => key);
    const requirements = requiredParams.length > 0
        ? `Required params: ${requiredParams.join(', ')}`
        : 'No required params.';
    const prompt = [
        `Run the workflow tool named "${workflow.id}".`,
        requirements,
        'If arguments are provided, parse them into workflow parameters.',
        'Arguments:',
        '{{args}}'
    ].join('\n');
    return { description, prompt };
}
function buildCustomCommandToml(workflow) {
    const command = buildCustomCommand(workflow);
    const description = command.description ? `description = "${escapeToml(command.description)}"\n` : '';
    const prompt = `prompt = """\n${escapeTomlMultiline(command.prompt)}\n"""\n`;
    return `${description}${prompt}`;
}
function escapeToml(value) {
    return value.replace(/"/g, '\\"');
}
function escapeTomlMultiline(value) {
    return value.replace(/"""/g, '\\"\\"\\"');
}
