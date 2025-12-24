export class PackError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends PackError {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR");
  }
}

export class PrereqMissingError extends PackError {
  constructor(public readonly toolName: string, public readonly fixHint: string) {
    super(`Missing prerequisite: ${toolName}. ${fixHint}`, "PREREQ_MISSING");
  }
}

export class ExecutionError extends PackError {
  constructor(message: string, public readonly exitCode: number, public readonly stepId?: string) {
    super(message, "EXECUTION_ERROR");
  }
}

// Strategy Question 12: Distinct codes for integrations
export class GitError extends ExecutionError {
  constructor(message: string) {
    super(message, 128); // Standard git error code often related to arguments or state
    this.name = "GitError";
  }
}

export class GhError extends ExecutionError {
  constructor(message: string) {
    super(message, 70); // EX_SOFTWARE or similar
    this.name = "GhError";
  }
}

export function getExitCode(error: unknown): number {
  if (error instanceof ExecutionError) {
    return error.exitCode;
  }
  if (error instanceof ValidationError) {
    return 2; // Usage/Data error
  }
  if (error instanceof PrereqMissingError) {
    return 69; // EX_UNAVAILABLE
  }
  if (error instanceof PackError) {
    return 1;
  }
  return 1; // Generic error
}
