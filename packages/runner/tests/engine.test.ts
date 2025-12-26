import { WorkflowEngine } from '../src/engine';
import { ExecutionContext } from '../src/context';
import { Logger } from '@workflow-pack/foundation/dist/logging';
import { StepRunner } from '../src/types';
import { WorkflowDefinition } from '@workflow-pack/workflow/dist/schema';

describe('WorkflowEngine', () => {
  let context: ExecutionContext;
  let engine: WorkflowEngine;
  let mockRunner: StepRunner;

  beforeEach(() => {
    context = new ExecutionContext(new Logger());
    engine = new WorkflowEngine(context, { stopOnFailure: true });
    
    mockRunner = {
      canHandle: () => true,
      execute: jest.fn().mockResolvedValue({ stepId: 'test', status: 'success' })
    };
    engine.registerStepRunner('shell', mockRunner);
  });

  it('should execute a simple workflow', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [{ id: 'step1', name: 'Step 1', type: 'shell', command: 'echo' }]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('success');
    expect(mockRunner.execute).toHaveBeenCalledTimes(1);
  });

  it('should stop on failure', async () => {
    (mockRunner.execute as jest.Mock).mockResolvedValueOnce({ stepId: 'step1', status: 'failure' });
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'fail' },
        { id: 'step2', name: 'Step 2', type: 'shell', command: 'skip me' }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('failure');
    expect(mockRunner.execute).toHaveBeenCalledTimes(1); // Should not run step 2
  });

  it('should skip steps based on condition', async () => {
    context.setVar('SKIP', true);
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'echo', if: '!vars.SKIP' }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.steps[0].status).toBe('skipped');
    expect(mockRunner.execute).not.toHaveBeenCalled();
  });

  it('should handle timeouts and return partial results (Q6)', async () => {
    (mockRunner.execute as jest.Mock).mockImplementation(() => new Promise(r => setTimeout(r, 100)));
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'echo', timeout: 10 }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('failure'); // Catastrophic failure due to throw
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].status).toBe('failure');
    expect(result.steps[0].error?.message).toContain('timed out');
  });
});
