import { StepRunner } from '../types';
import { AiStep, StepResult } from '@workflow-pack/foundation/dist/types';
import { ExecutionContext } from '../context';
import { ValidationError } from '@workflow-pack/foundation/dist/errors';

// Adapter interface for host AI capability
export interface AiAdapter {
  generate(prompt: string, contextFiles?: string[]): Promise<string>;
}

export class AiStepRunner implements StepRunner {
  constructor(private adapter: AiAdapter) {}

  canHandle(step: any): boolean {
    return step.type === 'ai';
  }

  async execute(step: AiStep, context: ExecutionContext): Promise<StepResult> {
    try {
      const response = await this.adapter.generate(step.prompt, step.contextFiles);
      
      let parsed: unknown;
      try {
        // Try parsing as JSON first if schema is present
        if (step.outputSchema) {
           parsed = JSON.parse(response);
           // Q11: In a real impl, we'd use AJV or Zod here to validate 'parsed' against 'step.outputSchema'
           // For now, simple check
           if (typeof parsed !== 'object' || parsed === null) {
             throw new Error("Response is not a valid JSON object");
           }
        } else {
          parsed = response;
        }
      } catch (e) {
        throw new ValidationError(`AI response validation failed: ${(e as Error).message}`);
      }

      return {
        stepId: step.id,
        status: 'success',
        stdout: typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2),
        artifacts: [] 
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'failure',
        error: error as Error
      };
    }
  }
}
