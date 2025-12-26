#!/usr/bin/env node
import path from 'path';
import fs from 'fs/promises';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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
import { PLAN_TOOL_NAME, buildPlanResult, planToolDefinition, workflowToTool } from './mapping';
import { WorkflowDefinition } from '@workflow-pack/workflow';

const DEFAULT_AI_MODE = 'mock';

export type McpServerOptions = {
  localWorkflowDirs?: string[];
  includeBuiltIns?: boolean;
};

export async function createRegistry(logger: Logger, options: McpServerOptions) {
  const registry = new WorkflowRegistry(logger);
  const localDirs = options.localWorkflowDirs ?? (await resolveLocalWorkflowDirs());
  await registry.initialize(localDirs, []);

  if (options.includeBuiltIns !== false) {
    for (const wf of builtInWorkflows) {
      registry.registerWorkflow(wf, 'installed');
    }
  }

  return registry;
}

export async function startServer(options: McpServerOptions = {}) {
  const logger = new Logger();
  const registry = await createRegistry(logger, options);

  const server = new Server(
    {
      name: 'workflow-pack',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: { listChanged: false }
      }
    }
  );

  const handlers = buildHandlers(registry);
  server.setRequestHandler(ListToolsRequestSchema, handlers.listTools);
  server.setRequestHandler(CallToolRequestSchema, handlers.callTool);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP server started (stdio transport).');
}

export function buildHandlers(registry: WorkflowRegistry) {
  return {
    listTools: async () => {
      const workflows = registry.listWorkflows();
      const tools = [planToolDefinition(), ...workflows.map(workflowToTool)];
      return { tools };
    },
    callTool: async (request: any) => {
      const name = request.params.name;
      const args = (request.params.arguments ?? {}) as Record<string, unknown>;

      if (name === PLAN_TOOL_NAME) {
        const workflowId = String(args.workflowId ?? '');
        if (!workflowId) {
          return toolError('workflowId is required to build a plan.');
        }
        const workflow = registry.getWorkflow(workflowId);
        const plan = buildPlanResult(workflow);
        return toolResult(plan);
      }

      let workflow: WorkflowDefinition;
      try {
        workflow = registry.getWorkflow(name);
      } catch (error) {
        throw error;
      }

      const { params, dryRun, autoApproveGates } = splitToolArgs(args);
      const runTarget = autoApproveGates ? withAutoApprovedGates(workflow) : workflow;
      const result = await runWorkflow(runTarget, params, { dryRun });

      return result.status === 'success'
        ? toolResult(result)
        : toolError('Workflow execution failed.', result);
    }
  };
}

async function runWorkflow(
  workflow: WorkflowDefinition,
  params: Record<string, unknown>,
  options: { dryRun?: boolean }
) {
  const logger = new Logger();
  const context = new ExecutionContext(logger, process.env as Record<string, string>, params);
  if (options.dryRun) {
    context.setVar('dryRun', true);
  }

  const engine = new WorkflowEngine(context);
  engine.registerStepRunner('shell', new ShellStepRunner());
  engine.registerStepRunner('gate', new GateStepRunner(HostKind.MCP));
  engine.registerStepRunner('ai', new AiStepRunner(createAiAdapter()));

  return engine.run(workflow);
}

function splitToolArgs(args: Record<string, unknown>) {
  const params = { ...args };
  const dryRun = Boolean(params._dryRun);
  const autoApproveGates = Boolean(params._autoApproveGates);

  delete params._dryRun;
  delete params._autoApproveGates;

  return { params, dryRun, autoApproveGates };
}

function withAutoApprovedGates(workflow: WorkflowDefinition): WorkflowDefinition {
  return {
    ...workflow,
    steps: workflow.steps.map((step) => {
      if (step.type !== 'gate') return step;
      return { ...step, autoApprove: true };
    })
  };
}

function createAiAdapter() {
  const mode = (process.env.MCP_AI_MODE || DEFAULT_AI_MODE).toLowerCase();

  if (mode === 'echo') {
    return {
      generate: async (prompt: string) => prompt
    };
  }

  if (mode === 'mock') {
    return {
      generate: async () => {
        return JSON.stringify({
          summary: 'Mock AI result from MCP adapter.',
          riskLevel: 'low',
          issues: []
        });
      }
    };
  }

  return {
    generate: async () => {
      throw new Error('AI steps are not enabled in MCP adapter. Set MCP_AI_MODE=mock to proceed.');
    }
  };
}

function toolResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ],
    structuredContent: payload,
    isError: false
  };
}

function toolError(message: string, payload?: unknown) {
  const body = payload ?? { error: message };
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(body, null, 2)
      }
    ],
    structuredContent: body,
    isError: true
  };
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

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
