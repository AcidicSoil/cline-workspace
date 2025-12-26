import { ShellStepRunner } from '../src/steps/shell';
import { AiStepRunner } from '../src/steps/ai';
import { GateStepRunner } from '../src/steps/gate';
import { ExecutionContext } from '../src/context';
import { Logger } from '@workflow-pack/foundation/dist/logging';
import { HostKind } from '@workflow-pack/foundation/dist/types';

describe('Concrete Step Runners', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = new ExecutionContext(new Logger());
  });

  describe('ShellStepRunner', () => {
    it('should capture output', async () => {
      const runner = new ShellStepRunner();
      const result = await runner.execute({
        id: '1', name: 'echo', type: 'shell', command: 'echo "hello world"'
      }, context);
      
      expect(result.status).toBe('success');
      expect(result.stdout).toContain('hello world');
    });

    it('should respect dryRun', async () => {
      const runner = new ShellStepRunner();
      const result = await runner.execute({
        id: '1', name: 'rm', type: 'shell', command: 'rm -rf /', dryRun: true
      }, context);
      
      expect(result.status).toBe('success');
      expect(result.stdout).toContain('[DRY-RUN]');
    });
  });

  describe('AiStepRunner', () => {
    it('should validate JSON output', async () => {
      const mockAdapter = {
        generate: jest.fn().mockResolvedValue('{"answer": 42}')
      };
      const runner = new AiStepRunner(mockAdapter);
      
      const result = await runner.execute({
        id: '1', name: 'ai', type: 'ai', prompt: 'calc', outputSchema: {}
      }, context);

      expect(result.status).toBe('success');
    });

    it('should fail on malformed JSON', async () => {
      const mockAdapter = {
        generate: jest.fn().mockResolvedValue('not json')
      };
      const runner = new AiStepRunner(mockAdapter);
      
      const result = await runner.execute({
        id: '1', name: 'ai', type: 'ai', prompt: 'calc', outputSchema: {}
      }, context);

      expect(result.status).toBe('failure');
    });
  });

  describe('GateStepRunner', () => {
    it('should auto-approve', async () => {
      const runner = new GateStepRunner();
      const result = await runner.execute({
        id: '1', name: 'gate', type: 'gate', message: 'ok?', autoApprove: true
      }, context);
      
      expect(result.status).toBe('success');
    });

    it('should fail in headless mode without autoApprove', async () => {
      const runner = new GateStepRunner(HostKind.MCP);
      const result = await runner.execute({
        id: '1', name: 'gate', type: 'gate', message: 'ok?'
      }, context);
      
      expect(result.status).toBe('failure');
    });
  });
});
