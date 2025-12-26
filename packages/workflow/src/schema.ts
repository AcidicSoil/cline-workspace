import { z } from 'zod';
import { StepType, HostKind } from '@workflow-pack/foundation';

// Step 2: Schema Definition
// Addressing Q13 (dryRun) and Q18 (onFailure)

const BaseStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  if: z.string().optional(),
  timeout: z.number().optional(),
  onFailure: z.string().optional(), // Q18: Rollback/recovery step ID
});

export const ShellStepSchema = BaseStepSchema.extend({
  type: z.literal('shell'),
  command: z.string(),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  dryRun: z.boolean().optional(), // Q13: Safe preview support
});

export const AiStepSchema = BaseStepSchema.extend({
  type: z.literal('ai'),
  prompt: z.string(),
  model: z.string().optional(),
  contextFiles: z.array(z.string()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
});

export const GateStepSchema = BaseStepSchema.extend({
  type: z.literal('gate'),
  message: z.string(),
  autoApprove: z.boolean().optional(),
  requiredApprovals: z.number().optional(),
});

export const StepSchema = z.discriminatedUnion('type', [
  ShellStepSchema,
  AiStepSchema,
  GateStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;

export const ParamSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  default: z.unknown().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(), // Q20: Version checking will happen against this
  description: z.string().optional(),
  params: z.record(ParamSchema).optional(),
  steps: z.array(StepSchema),
  outputs: z.record(z.string()).optional(),
}).strict(); // Enforce no unknown fields

export type WorkflowDefinition = z.infer<typeof WorkflowSchema>;