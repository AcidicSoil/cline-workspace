import { Logger } from '@workflow-pack/foundation';
import { redactSensitive } from '@workflow-pack/foundation';

export interface ContextData {
  vars: Record<string, any>;
  outputs: Record<string, any>;
  env: Record<string, string>;
  secrets: string[];
}

export class ExecutionContext {
  private vars: Record<string, any> = {};
  private outputs: Record<string, any> = {};
  private secrets: string[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly env: Record<string, string> = {},
    initialVars: Record<string, any> = {},
    secrets: string[] = []
  ) {
    this.vars = { ...initialVars };
    this.secrets = [...secrets];
  }

  // Q3: Host hooks isolation - methods to run hooks shouldn't expose 'this' directly or allow overwrite
  // For now, we just expose safe accessors

  public get(key: string): any {
    return this.vars[key] ?? this.outputs[key] ?? this.env[key];
  }

  public setVar(key: string, value: any) {
    this.vars[key] = value;
  }

  public setOutput(stepId: string, output: any) {
    this.outputs[stepId] = output;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getSnapshot(): ContextData {
    return {
      vars: { ...this.vars },
      outputs: { ...this.outputs },
      env: { ...this.env }, // Should be careful with env serialization if it's huge
      secrets: [...this.secrets]
    };
  }

  // Q14: Serialization for resumability
  public serialize(): string {
    const snapshot = this.getSnapshot();
    // Redact sensitive data before serialization? 
    // Usually state file should be encrypted or secure. 
    // For now we serialize as is, assuming secure storage.
    return JSON.stringify(snapshot);
  }

  public static deserialize(json: string, logger: Logger): ExecutionContext {
    const data: ContextData = JSON.parse(json);
    const ctx = new ExecutionContext(logger, data.env, data.vars, data.secrets);
    ctx.outputs = data.outputs;
    return ctx;
  }
}

export function buildContext(
  params: Record<string, any>, 
  env: Record<string, string>, 
  logger: Logger,
  secrets: string[] = []
): ExecutionContext {
  return new ExecutionContext(logger, env, params, secrets);
}