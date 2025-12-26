import { WorkflowDefinition } from '@workflow-pack/workflow';

export const PLAN_TOOL_NAME = 'workflow-plan';

export type JsonSchema = {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description?: string;
  default?: unknown;
  enum?: string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean;
};

export type ToolDefinition = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
};

export function planToolDefinition(): ToolDefinition {
  return {
    name: PLAN_TOOL_NAME,
    title: 'Workflow Plan',
    description: 'Return the execution plan for a workflow without running it.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Workflow identifier to plan.'
        }
      },
      required: ['workflowId'],
      additionalProperties: false
    }
  };
}

export function workflowToTool(workflow: WorkflowDefinition): ToolDefinition {
  return {
    name: workflow.id,
    title: workflow.name,
    description: workflow.description,
    inputSchema: workflowParamsToSchema(workflow.params)
  };
}

export function workflowParamsToSchema(
  params: WorkflowDefinition['params']
): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  if (params) {
    for (const [key, param] of Object.entries(params)) {
      const schema = paramTypeToSchema(param.type);
      if (param.description) schema.description = param.description;
      if (param.default !== undefined) {
        schema.default = param.default;
      } else {
        required.push(key);
      }
      properties[key] = schema;
    }
  }

  properties._dryRun = {
    type: 'boolean',
    description: 'Run without executing side-effect steps.'
  };
  properties._autoApproveGates = {
    type: 'boolean',
    description: 'Auto-approve gate steps for non-interactive hosts.'
  };
  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false
  };
}

export function buildPlanResult(workflow: WorkflowDefinition) {
  return {
    id: workflow.id,
    name: workflow.name,
    version: workflow.version,
    description: workflow.description,
    params: workflow.params ?? {},
    steps: workflow.steps.map((step) => {
      return {
        id: step.id,
        name: step.name,
        type: step.type,
        if: step.if,
        timeout: step.timeout,
        details: stepDetails(step)
      };
    })
  };
}

function paramTypeToSchema(type: string): JsonSchema {
  const trimmed = type.trim();

  if (trimmed.includes('|')) {
    return {
      type: 'string',
      enum: trimmed.split('|').map((value) => value.trim()).filter(Boolean)
    };
  }

  if (trimmed.endsWith('[]')) {
    const base = trimmed.slice(0, -2);
    return {
      type: 'array',
      items: paramTypeToSchema(base)
    };
  }

  switch (trimmed) {
    case 'string':
    case 'number':
    case 'integer':
    case 'boolean':
    case 'object':
    case 'array':
      return { type: trimmed } as JsonSchema;
    default:
      return { type: 'string', description: `Original type: ${trimmed}` };
  }
}

function stepDetails(step: WorkflowDefinition['steps'][number]) {
  switch (step.type) {
    case 'shell':
      return {
        command: step.command,
        cwd: step.cwd,
        env: step.env
      };
    case 'ai':
      return {
        prompt: step.prompt,
        model: step.model,
        contextFiles: step.contextFiles,
        outputSchema: step.outputSchema
      };
    case 'gate':
      return {
        message: step.message,
        autoApprove: step.autoApprove,
        requiredApprovals: step.requiredApprovals
      };
    default:
      return {};
  }
}
