import { WorkflowDefinition, Step } from '@workflow-pack/workflow';
import { RunResult, StepResult } from '@workflow-pack/foundation';
import { ExecutionContext } from './context';
import { StepRunner, RunnerOptions } from './types';
import safeEval from 'safe-eval';
import { randomUUID } from 'crypto';

export class WorkflowEngine {
  private stepRunners: Map<string, StepRunner> = new Map();

  constructor(private context: ExecutionContext, private options: RunnerOptions = {}) {}

  public registerStepRunner(type: string, runner: StepRunner) {
    this.stepRunners.set(type, runner);
  }

  public async run(workflow: WorkflowDefinition): Promise<RunResult> {
    const runId = randomUUID();
    const results: StepResult[] = [];
    const startTime = new Date();

    this.context.getLogger().info(`Starting workflow run ${runId}`);

    try {
      for (const step of workflow.steps) {
        // 1. Check Condition
        if (step.if) {
          const shouldRun = this.evaluateCondition(step.if);
          if (!shouldRun) {
            results.push({
              stepId: step.id,
              status: 'skipped'
            });
            continue;
          }
        }

        // 2. Resolve Runner
        const runner = this.stepRunners.get(step.type);
        if (!runner) {
          throw new Error(`No runner registered for step type: ${step.type}`);
        }

        // 3. Execute with Timeout (Q6)
        try {
          const result = await this.executeStepWithTimeout(runner, step);
          results.push(result);
          this.context.setOutput(step.id, result.stdout || result.artifacts); // Simple output mapping

          if (result.status === 'failure') {
            if (this.options.stopOnFailure !== false) { // Default true
               this.context.getLogger().error(`Step ${step.id} failed. Stopping execution.`);
               break;
            }
          }
        } catch (error: any) {
             results.push({
              stepId: step.id,
              status: 'failure',
              error
            });
            if (this.options.stopOnFailure !== false) {
               break;
            }
        }
      }

      const hasFailure = results.some(r => r.status === 'failure');
      
      return {
        runId,
        workflowId: workflow.id,
        status: hasFailure ? 'failure' : 'success',
        startedAt: startTime,
        finishedAt: new Date(),
        steps: results,
        artifacts: [], // TODO: Collect artifacts
        warnings: []
      };

    } catch (error: any) {
      // Catastrophic failure
      return {
        runId,
        workflowId: workflow.id,
        status: 'failure',
        startedAt: startTime,
        finishedAt: new Date(),
        steps: results, // Q6: Return partial results
        artifacts: [],
        warnings: [error.message]
      };
    }
  }

  private evaluateCondition(expression: string): boolean {
    try {
      const snapshot = this.context.getSnapshot();
      // Expose vars, outputs, env directly to eval scope
      const scope = {
        vars: snapshot.vars,
        outputs: snapshot.outputs,
        env: snapshot.env
      };
      return !!safeEval(expression, scope);
    } catch (e) {
      this.context.getLogger().warn(`Failed to evaluate condition '${expression}': ${(e as Error).message}`);
      return false; // Fail safe
    }
  }

  private async executeStepWithTimeout(runner: StepRunner, step: Step): Promise<StepResult> {
    const timeoutMs = step.timeout ?? 60000; // Default 1 min
    
    // Q6: Timeout logic
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<StepResult>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Step ${step.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        runner.execute(step, this.context),
        timeoutPromise
      ]);
      clearTimeout(timer!);
      return result;
    } catch (error) {
      clearTimeout(timer!);
      throw error;
    }
  }
}