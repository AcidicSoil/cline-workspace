export enum HostKind {
  CLI = "CLI",
  MCP = "MCP",
  GEMINI_EXTENSION = "GEMINI_EXTENSION",
  LM_STUDIO = "LM_STUDIO"
}

export enum Severity {
  Info = "info",
  Warning = "warning",
  Error = "error"
}

export interface StepResult {
  stepId: string;
  status: "success" | "failure" | "skipped" | "cancelled";
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  artifacts?: string[];
  error?: Error;
}

export interface RunResult {
  runId: string;
  workflowId: string;
  status: "success" | "failure" | "cancelled";
  startedAt: Date;
  finishedAt?: Date;
  steps: StepResult[];
  artifacts: string[];
  warnings: string[];
}

export type StepType = "shell" | "ai" | "gate";

export interface BaseStep {
  id: string;
  name: string;
  type: StepType;
  if?: string; // Condition expression
  timeout?: number; // Milliseconds
}

export interface ShellStep extends BaseStep {
  type: "shell";
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  dryRun?: boolean; // Added based on Strategy Question 13
}

export interface AiStep extends BaseStep {
  type: "ai";
  prompt: string;
  model?: string;
  contextFiles?: string[];
  outputSchema?: Record<string, unknown>; // JSON Schema
}

export interface GateStep extends BaseStep {
  type: "gate";
  message: string;
  autoApprove?: boolean;
  requiredApprovals?: number; // Added based on Strategy Question 15
}

export type Step = ShellStep | AiStep | GateStep;

export interface Workflow {
  id: string;
  name: string;
  version: string;
  description?: string;
  params?: Record<string, { type: string; description?: string; default?: unknown }>;
  steps: Step[];
  outputs?: Record<string, string>;
}
