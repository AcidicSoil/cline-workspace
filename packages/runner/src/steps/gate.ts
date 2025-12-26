import { StepRunner } from '../types';
import { GateStep, StepResult, HostKind } from '@workflow-pack/foundation';
import { ExecutionContext } from '../context';
import readline from 'readline';

export class GateStepRunner implements StepRunner {
  constructor(private hostKind: HostKind = HostKind.CLI) {}

  canHandle(step: any): boolean {
    return step.type === 'gate';
  }

  async execute(step: GateStep, context: ExecutionContext): Promise<StepResult> {
    const logger = context.getLogger();

    if (step.autoApprove) {
      logger.info(`Auto-approving gate: ${step.message}`);
      return { stepId: step.id, status: 'success' };
    }

    // Q1: Host check
    if (this.hostKind !== HostKind.CLI) {
      // In non-interactive modes without autoApprove, we must fail or implement a different mechanism (e.g. MCP request)
      // For MVP, we fail safe
      return {
        stepId: step.id,
        status: 'failure',
        error: new Error(`Interactive gate required in non-interactive host (${this.hostKind}) without autoApprove.`)
      };
    }

    logger.info(`GATE: ${step.message}`);
    logger.info('Press "y" to approve, any other key to deny.');

    const answer = await this.promptUser();
    
    if (answer.toLowerCase() === 'y') {
      return { stepId: step.id, status: 'success' };
    } else {
      return { 
        stepId: step.id, 
        status: 'failure', 
        error: new Error('User denied gate.') 
      };
    }
  }

  private promptUser(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('> ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}