import { WorkflowDefinition } from '@workflow-pack/workflow';

export type GeminiMcpServerConfig = {
  command: string;
  args?: string[];
  cwd?: string;
};

export type GeminiCustomCommand = {
  description?: string;
  prompt: string;
};

export type GeminiExtensionConfig = {
  name: string;
  version: string;
  contextFileName?: string;
  mcpServers?: Record<string, GeminiMcpServerConfig>;
  customCommands?: Record<string, GeminiCustomCommand>;
};

export type GeminiExtensionOptions = {
  name: string;
  version: string;
  contextFileName?: string;
  includeMcpServer?: boolean;
  mcpServerName?: string;
  mcpServerCommand?: string;
  mcpServerArgs?: string[];
  mcpServerCwd?: string;
  mcpServerUseExtensionPath?: boolean;
  mcpServerEntryFile?: string;
  includeCustomCommands?: boolean;
};

export function buildGeminiExtensionConfig(
  workflows: WorkflowDefinition[],
  options: GeminiExtensionOptions
): GeminiExtensionConfig {
  const config: GeminiExtensionConfig = {
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
    const commands: Record<string, GeminiCustomCommand> = {};
    for (const workflow of workflows) {
      commands[workflow.id] = buildCustomCommand(workflow);
    }
    config.customCommands = commands;
  }

  return config;
}

export function buildCustomCommand(workflow: WorkflowDefinition): GeminiCustomCommand {
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

export function buildCustomCommandToml(workflow: WorkflowDefinition): string {
  const command = buildCustomCommand(workflow);
  const description = command.description ? `description = "${escapeToml(command.description)}"\n` : '';
  const prompt = `prompt = """\n${escapeTomlMultiline(command.prompt)}\n"""\n`;
  return `${description}${prompt}`;
}

function escapeToml(value: string): string {
  return value.replace(/"/g, '\\"');
}

function escapeTomlMultiline(value: string): string {
  return value.replace(/"""/g, '\\"\\"\\"');
}
