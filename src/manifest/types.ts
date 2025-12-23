export type WorkflowMode = 'headless' | 'interactive';

export interface WorkflowInput {
  name: string;
  type: 'string' | 'boolean' | 'number';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  description: string;
}

export interface WorkflowPrerequisites {
  tools?: string[];
  env?: string[];
}

export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  mode: WorkflowMode;
  prerequisites?: WorkflowPrerequisites;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  // Path to the workflow definition file (e.g., relative to pack root)
  definitionPath?: string;
}

export type WorkflowRegistry = Record<string, WorkflowInfo>;
