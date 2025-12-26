"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildToolsProviderSource = buildToolsProviderSource;
function buildToolsProviderSource() {
    return `import path from 'path';
import fs from 'fs/promises';
import { tool, type Tool, type ToolsProviderController } from '@lmstudio/sdk';
import { z } from 'zod';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { workflows as builtInWorkflows } from '@workflow-pack/workflows';
import {
  WorkflowEngine,
  ExecutionContext,
  ShellStepRunner,
  GateStepRunner,
  AiStepRunner
} from '@workflow-pack/runner';
import { HostKind, Logger } from '@workflow-pack/foundation';
import { configSchematics } from './config';

export async function toolsProvider(ctl: ToolsProviderController) {
  const tools: Tool[] = [];
  const logger = new Logger();
  const registry = new WorkflowRegistry(logger);

  const config = ctl.getPluginConfig(configSchematics);
  const workspaceRoot = config.get('workspaceRoot');

  const localDir = path.join(workspaceRoot, '.clinerules', 'workflows');
  const localDirs: string[] = [];
  try {
    await fs.access(localDir);
    localDirs.push(localDir);
  } catch {
    // Ignore missing local workflows
  }

  await registry.initialize(localDirs, []);
  for (const wf of builtInWorkflows) {
    registry.registerWorkflow(wf, 'installed');
  }

  const workflows = registry.listWorkflows();
  for (const workflow of workflows) {
    const parameters = buildParamShape(workflow.params ?? {});
    const toolDef = tool({
      name: workflow.id,
      description: workflow.description ?? workflow.name,
      parameters,
      implementation: async (args) => {
        const autoApprove = config.get('autoApproveGates');
        const dryRun = config.get('dryRun');
        const aiMode = config.get('aiMode');

        const workflowToRun = autoApprove ? withAutoApprovedGates(workflow) : workflow;
        const result = await runWorkflow(workflowToRun, args, {
          dryRun,
          aiMode
        });

        if (result.status === 'success') {
          return result;
        }

        return {
          error: 'Workflow execution failed.',
          result
        };
      }
    });

    tools.push(toolDef);
  }

  return tools;
}

function buildParamShape(params: Record<string, { type: string; description?: string; default?: unknown }>) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, param] of Object.entries(params)) {
    let schema = paramTypeToZod(param.type);
    if (param.description) schema = schema.describe(param.description);
    if (param.default !== undefined) schema = schema.optional();
    shape[key] = schema;
  }

  return shape;
}

function paramTypeToZod(type: string): z.ZodTypeAny {
  const trimmed = type.trim();

  if (trimmed.includes('|')) {
    const values = trimmed.split('|').map((value) => value.trim()).filter(Boolean);
    if (values.length > 0) {
      return z.enum(values as [string, ...string[]]);
    }
  }

  if (trimmed.endsWith('[]')) {
    const base = trimmed.slice(0, -2);
    return z.array(paramTypeToZod(base));
  }

  switch (trimmed) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'integer':
      return z.number().int();
    case 'boolean':
      return z.boolean();
    case 'object':
      return z.record(z.any());
    case 'array':
      return z.array(z.any());
    default:
      return z.string();
  }
}

function withAutoApprovedGates(workflow: { steps: any[] }) {
  return {
    ...workflow,
    steps: workflow.steps.map((step) => {
      if (step.type !== 'gate') return step;
      return { ...step, autoApprove: true };
    })
  };
}

async function runWorkflow(
  workflow: any,
  params: Record<string, unknown>,
  options: { dryRun: boolean; aiMode: string }
) {
  const logger = new Logger();
  const context = new ExecutionContext(logger, process.env as Record<string, string>, params);
  if (options.dryRun) {
    context.setVar('dryRun', true);
  }

  const engine = new WorkflowEngine(context);
  engine.registerStepRunner('shell', new ShellStepRunner());
  engine.registerStepRunner('gate', new GateStepRunner(HostKind.LM_STUDIO));
  engine.registerStepRunner('ai', new AiStepRunner(createAiAdapter(options.aiMode)));

  return engine.run(workflow);
}

function createAiAdapter(mode: string) {
  const normalized = (mode || 'mock').toLowerCase();

  if (normalized === 'echo') {
    return { generate: async (prompt: string) => prompt };
  }

  if (normalized === 'mock') {
    return {
      generate: async () => {
        return JSON.stringify({
          summary: 'Mock AI result from LM Studio plugin.',
          riskLevel: 'low',
          issues: []
        });
      }
    };
  }

  return {
    generate: async () => {
      throw new Error('AI steps are disabled. Set aiMode to mock or echo.');
    }
  };
}
`;
}
