import { WorkflowEngine } from '@workflow-pack/runner'
import { ExecutionContext } from '@workflow-pack/runner'
import { Logger } from '@workflow-pack/foundation'
import { PrReviewWorkflow } from '../src/pr-review';
import { LintSweepWorkflow } from '../src/lint-sweep';

describe('Workflow Catalog Integration', () => {
  let logger: Logger;
  let context: ExecutionContext;
  let engine: WorkflowEngine;

  beforeEach(() => {
    logger = new Logger();
    context = new ExecutionContext(logger);
    engine = new WorkflowEngine(context, { stopOnFailure: true });
  });

  it('should validate pr-review workflow structure', () => {
    expect(PrReviewWorkflow.id).toBe('pr-review');
    expect(PrReviewWorkflow.steps.length).toBeGreaterThan(0);
  });

  it('should validate lint-sweep workflow structure', () => {
    expect(LintSweepWorkflow.id).toBe('lint-sweep');
    expect(LintSweepWorkflow.steps.length).toBeGreaterThan(0);
  });

  it('should simulate pr-review execution with mock runners', async () => {
    const mockShellRunner = {
      canHandle: (s: any) => s.type === 'shell',
      execute: jest.fn().mockResolvedValue({ status: 'success', stdout: 'mock output' })
    };
    const mockAiRunner = {
      canHandle: (s: any) => s.type === 'ai',
      execute: jest.fn().mockResolvedValue({ status: 'success', stdout: '{"summary": "looks good"}' })
    };
    const mockGateRunner = {
      canHandle: (s: any) => s.type === 'gate',
      execute: jest.fn().mockResolvedValue({ status: 'success' })
    };

    engine.registerStepRunner('shell', mockShellRunner as any);
    engine.registerStepRunner('ai', mockAiRunner as any);
    engine.registerStepRunner('gate', mockGateRunner as any);

    const result = await engine.run(PrReviewWorkflow);
    expect(result.status).toBe('success');
    expect(mockShellRunner.execute).toHaveBeenCalled();
    expect(mockAiRunner.execute).toHaveBeenCalled();
    expect(mockGateRunner.execute).toHaveBeenCalled();
  });
});
