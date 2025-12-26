import path from 'path';
import fs from 'fs/promises';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { workflows as builtInWorkflows } from '@workflow-pack/workflows';
import { Logger } from '@workflow-pack/foundation';
import { buildCustomCommandToml, buildGeminiExtensionConfig, GeminiExtensionOptions } from './mapper';
import { WorkflowDefinition } from '@workflow-pack/workflow';

export type GenerateGeminiExtensionOptions = GeminiExtensionOptions & {
  outputDir: string;
  includeCommands?: boolean;
  contextFileContent?: string;
  workflows?: WorkflowDefinition[];
};

export async function generateGeminiExtension(options: GenerateGeminiExtensionOptions) {
  const workflows = options.workflows ?? (await loadWorkflows());
  const config = buildGeminiExtensionConfig(workflows, options);

  await fs.mkdir(options.outputDir, { recursive: true });
  const configPath = path.join(options.outputDir, 'gemini-extension.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  if (options.contextFileContent && options.contextFileName) {
    const contextPath = path.join(options.outputDir, options.contextFileName);
    await fs.writeFile(contextPath, options.contextFileContent, 'utf-8');
  }

  if (options.includeMcpServer && options.mcpServerUseExtensionPath) {
    const entryFile = options.mcpServerEntryFile ?? 'mcp-server.mjs';
    const entryPath = path.join(options.outputDir, entryFile);
    const script = buildMcpServerEntry();
    await fs.writeFile(entryPath, script, 'utf-8');
  }

  if (options.includeCommands !== false) {
    const commandsDir = path.join(options.outputDir, 'commands');
    await fs.mkdir(commandsDir, { recursive: true });

    for (const workflow of workflows) {
      const fileName = `${workflow.id}.toml`;
      const filePath = path.join(commandsDir, fileName);
      const toml = buildCustomCommandToml(workflow);
      await fs.writeFile(filePath, toml, 'utf-8');
    }
  }
}

export async function loadWorkflows(): Promise<WorkflowDefinition[]> {
  const logger = new Logger();
  const registry = new WorkflowRegistry(logger);
  const localDirs = await resolveLocalWorkflowDirs();

  await registry.initialize(localDirs, []);
  for (const wf of builtInWorkflows) {
    registry.registerWorkflow(wf, 'installed');
  }

  return registry.listWorkflows();
}

function buildMcpServerEntry(): string {
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

async function resolveLocalWorkflowDirs(): Promise<string[]> {
  const localDir = path.join(process.cwd(), '.clinerules', 'workflows');
  try {
    await fs.access(localDir);
    return [localDir];
  } catch {
    return [];
  }
}
