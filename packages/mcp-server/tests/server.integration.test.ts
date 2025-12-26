import { buildHandlers, createRegistry } from '../src/index';
import { Logger } from '@workflow-pack/foundation';
import { PLAN_TOOL_NAME } from '../src/mapping';

describe('mcp server integration', () => {
  it('lists tools and executes plan and workflow calls', async () => {
    const logger = new Logger();
    const registry = await createRegistry(logger, { localWorkflowDirs: [], includeBuiltIns: true });
    const handlers = buildHandlers(registry);

    const listResult = await handlers.listTools();
    const toolNames = listResult.tools.map((tool: any) => tool.name);

    expect(toolNames).toContain(PLAN_TOOL_NAME);
    expect(toolNames).toContain('pr-review');

    const planResult = await handlers.callTool({
      params: {
        name: PLAN_TOOL_NAME,
        arguments: { workflowId: 'pr-review' }
      }
    });

    expect(planResult.isError).toBe(false);
    expect(planResult.structuredContent.steps).toBeTruthy();

    const runResult = await handlers.callTool({
      params: {
        name: 'lint-sweep',
        arguments: {
          _dryRun: true
        }
      }
    });

    expect(runResult.isError).toBe(false);
    expect(runResult.structuredContent.workflowId).toBe('lint-sweep');
    expect(runResult.structuredContent.steps.length).toBeGreaterThan(0);
  });
});
