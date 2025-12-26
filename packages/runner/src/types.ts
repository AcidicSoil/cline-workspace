import { Step, StepResult } from '@workflow-pack/foundation/dist/types';
import { ExecutionContext } from './context';

export interface StepRunner {
  canHandle(step: Step): boolean;
  execute(step: Step, context: ExecutionContext): Promise<StepResult>;
}

export interface RunnerOptions {
  stopOnFailure?: boolean;
  dryRun?: boolean;
}
