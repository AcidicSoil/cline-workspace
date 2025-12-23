"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLoaderError = void 0;
exports.loadTasksJson = loadTasksJson;
const promises_1 = __importDefault(require("fs/promises"));
const schemas_1 = require("./schemas");
class TaskLoaderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TaskLoaderError';
    }
}
exports.TaskLoaderError = TaskLoaderError;
async function loadTasksJson(path) {
    let content;
    try {
        content = await promises_1.default.readFile(path, 'utf-8');
    }
    catch (error) {
        throw new TaskLoaderError(`Failed to read task file at ${path}`);
    }
    let rawData;
    try {
        rawData = JSON.parse(content);
    }
    catch (error) {
        throw new TaskLoaderError('Failed to parse JSON content');
    }
    const result = schemas_1.TaskGraphSchema.safeParse(rawData);
    if (!result.success) {
        throw new TaskLoaderError(`Schema validation failed: ${result.error.message}`);
    }
    const graph = result.data;
    validateDependencies(graph.tasks);
    return graph;
}
function validateDependencies(tasks) {
    const taskMap = new Map();
    const visited = new Set();
    const recursionStack = new Set();
    // Helper to flatten tasks for easier ID lookup
    function collectTasks(nodes) {
        for (const node of nodes) {
            if (taskMap.has(node.id)) {
                throw new TaskLoaderError(`Duplicate task ID found: ${node.id}`);
            }
            taskMap.set(node.id, node);
            if (node.subtasks) {
                collectTasks(node.subtasks);
            }
        }
    }
    collectTasks(tasks);
    function checkCycle(taskId) {
        visited.add(taskId);
        recursionStack.add(taskId);
        const node = taskMap.get(taskId);
        if (node && node.dependencies) {
            for (const depId of node.dependencies) {
                const depIdStr = String(depId);
                if (!taskMap.has(depIdStr)) {
                    // Warning: Dependency on missing task? 
                    // For strict validation we might throw, but let's assume it might be external or allow it for now unless strictly required.
                    // PRD says "validate dependencies", so let's throw if missing.
                    throw new TaskLoaderError(`Task ${taskId} depends on missing task ${depIdStr}`);
                }
                if (!visited.has(depIdStr)) {
                    checkCycle(depIdStr);
                }
                else if (recursionStack.has(depIdStr)) {
                    throw new TaskLoaderError(`Circular dependency detected: ${taskId} -> ${depIdStr}`);
                }
            }
        }
        recursionStack.delete(taskId);
    }
    for (const taskId of taskMap.keys()) {
        if (!visited.has(taskId)) {
            checkCycle(taskId);
        }
    }
}
