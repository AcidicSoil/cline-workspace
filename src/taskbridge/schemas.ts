import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'pending',
  'in-progress',
  'done',
  'review',
  'deferred',
  'cancelled',
  'blocked'
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const BaseTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional().default('pending'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dependencies: z.array(z.union([z.string(), z.number()])).optional().default([]),
  details: z.string().optional(),
});

export type TaskNode = z.infer<typeof BaseTaskSchema> & {
  subtasks?: TaskNode[];
};

export const TaskNodeSchema: z.ZodType<TaskNode> = BaseTaskSchema.extend({
  subtasks: z.lazy(() => z.array(TaskNodeSchema).optional()),
});

export const TaskGraphSchema = z.object({
  tasks: z.array(TaskNodeSchema),
  version: z.string().optional(),
});

export type TaskGraph = z.infer<typeof TaskGraphSchema>;
