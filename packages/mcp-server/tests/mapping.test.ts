import { WorkflowDefinition } from '@workflow-pack/workflow';
import { buildPlanResult, workflowToTool, workflowParamsToSchema } from '../src/mapping';

describe('mapping', () => {
  const workflow: WorkflowDefinition = {
    id: 'sample-workflow',
    name: 'Sample Workflow',
    version: '1.0.0',
    description: 'Demo workflow',
    params: {
      name: { type: 'string', description: 'Name to greet' },
      count: { type: 'number', default: 1 },
      tags: { type: 'string[]' },
      mode: { type: 'fast|safe|full' }
    },
    steps: [
      {
        id: 'step-1',
        name: 'Run command',
        type: 'shell',
        command: 'echo hello'
      }
    ]
  };

  it('maps workflow params to JSON schema', () => {
    const schema = workflowParamsToSchema(workflow.params);
    expect(schema.type).toBe('object');
    expect(schema.properties?.name.type).toBe('string');
    expect(schema.properties?.count.type).toBe('number');
    expect(schema.properties?.tags.type).toBe('array');
    expect(schema.properties?.tags.items?.type).toBe('string');
    expect(schema.properties?.mode.enum).toEqual(['fast', 'safe', 'full']);
  });

  it('marks params without defaults as required', () => {
    const schema = workflowParamsToSchema(workflow.params);
    expect(schema.required).toEqual(expect.arrayContaining(['name', 'tags', 'mode']));
    expect(schema.required).not.toContain('count');
  });

  it('creates tool definition from workflow', () => {
    const tool = workflowToTool(workflow);
    expect(tool.name).toBe('sample-workflow');
    expect(tool.title).toBe('Sample Workflow');
    expect(tool.inputSchema.type).toBe('object');
  });

  it('builds a plan result payload', () => {
    const plan = buildPlanResult(workflow);
    expect(plan.id).toBe('sample-workflow');
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].details.command).toBe('echo hello');
  });
});
