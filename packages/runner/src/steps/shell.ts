import { spawn } from 'child_process';
import { StepRunner } from '../types';
import { ShellStep, StepResult } from '@workflow-pack/foundation/dist/types';
import { ExecutionContext } from '../context';

export class ShellStepRunner implements StepRunner {
  canHandle(step: any): boolean {
    return step.type === 'shell';
  }

  async execute(step: ShellStep, context: ExecutionContext): Promise<StepResult> {
    const logger = context.getLogger();
    
    if (step.dryRun || context.get('dryRun')) {
      logger.info(`[DRY-RUN] Would execute: ${step.command}`);
      return { stepId: step.id, status: 'success', stdout: '[DRY-RUN]' };
    }

    return new Promise((resolve, reject) => {
      const child = spawn(step.command, {
        shell: true,
        cwd: step.cwd || process.cwd(),
        env: { ...process.env, ...step.env },
        stdio: ['ignore', 'pipe', 'pipe'] // Q5: Ignore stdin to prevent hanging on prompts
      });

      let stdout = '';
      let stderr = '';
      const MAX_BUFFER = 1024 * 1024; // 1MB

      child.stdout.on('data', (data) => {
        if (stdout.length < MAX_BUFFER) stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < MAX_BUFFER) stderr += data.toString();
      });

      child.on('error', (error) => {
        resolve({
          stepId: step.id,
          status: 'failure',
          error,
          stdout,
          stderr
        });
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stepId: step.id, status: 'success', stdout, stderr });
        } else {
          resolve({ 
            stepId: step.id, 
            status: 'failure', 
            exitCode: code || 1, 
            stdout, 
            stderr,
            error: new Error(`Command failed with exit code ${code}`)
          });
        }
      });
    });
  }
}
