"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGraphSchema = exports.TaskNodeSchema = exports.BaseTaskSchema = exports.TaskStatusSchema = void 0;
const zod_1 = require("zod");
exports.TaskStatusSchema = zod_1.z.enum([
    'pending',
    'in-progress',
    'done',
    'review',
    'deferred',
    'cancelled',
    'blocked'
]);
exports.BaseTaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    status: exports.TaskStatusSchema.optional().default('pending'),
    priority: zod_1.z.enum(['high', 'medium', 'low']).optional(),
    dependencies: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])).optional().default([]),
    details: zod_1.z.string().optional(),
});
exports.TaskNodeSchema = exports.BaseTaskSchema.extend({
    subtasks: zod_1.z.lazy(() => zod_1.z.array(exports.TaskNodeSchema).optional()),
});
exports.TaskGraphSchema = zod_1.z.object({
    tasks: zod_1.z.array(exports.TaskNodeSchema),
    version: zod_1.z.string().optional(),
});
