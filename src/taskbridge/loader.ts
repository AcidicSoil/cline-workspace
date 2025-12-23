import fs from 'fs/promises';
import { TaskGraph, TaskGraphSchema, TaskNode } from './schemas';

export class TaskLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskLoaderError';
  }
}

export async function loadTasksJson(path: string): Promise<TaskGraph> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf-8');
  } catch (error) {
    throw new TaskLoaderError(`Failed to read task file at ${path}`);
  }

  let rawData: unknown;
  try {
    rawData = JSON.parse(content);
  } catch (error) {
    throw new TaskLoaderError('Failed to parse JSON content');
  }

  const result = TaskGraphSchema.safeParse(rawData);
  if (!result.success) {
    throw new TaskLoaderError(`Schema validation failed: ${result.error.message}`);
  }

  const graph = result.data;
  validateDependencies(graph.tasks);
  
  return graph;
}

function validateDependencies(tasks: TaskNode[]) {
  const taskMap = new Map<string, TaskNode>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Helper to flatten tasks for easier ID lookup
  function collectTasks(nodes: TaskNode[]) {
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

  function checkCycle(taskId: string) {
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
        } else if (recursionStack.has(depIdStr)) {
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
