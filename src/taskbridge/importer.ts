import crypto from 'crypto';
import { TaskGraph, TaskNode } from './schemas';

export interface GeminiTask {
  id: string;
  name: string; // mapped from title
  description?: string;
  prerequisites: string[]; // mapped from dependencies
  metadata: {
    originalId: string;
    priority?: string;
    status: string;
  };
}

export interface ImportResult {
  tasks: GeminiTask[];
  idMap: Record<string, string>; // Internal ID -> Gemini Stable ID
}

export function generateStableId(task: TaskNode): string {
  const hash = crypto.createHash('sha256');
  hash.update(task.title);
  if (task.description) hash.update(task.description);
  return hash.digest('hex').substring(0, 12);
}

export function importToGeminiFlow(graph: TaskGraph): ImportResult {
  const idMap: Record<string, string> = {};
  const geminiTasks: GeminiTask[] = [];

  // First pass: generate stable IDs
  function processNodeIds(nodes: TaskNode[]) {
    for (const node of nodes) {
      if (!idMap[node.id]) {
        idMap[node.id] = generateStableId(node);
      }
      if (node.subtasks) {
        processNodeIds(node.subtasks);
      }
    }
  }
  processNodeIds(graph.tasks);

  // Second pass: generate tasks with mapped dependencies
  function processNodes(nodes: TaskNode[], parentId?: string) {
    for (const node of nodes) {
      const stableId = idMap[node.id];
      const prereqs: string[] = [];

      // Add declared dependencies
      if (node.dependencies) {
        for (const dep of node.dependencies) {
            const depStr = String(dep);
            if (idMap[depStr]) {
                prereqs.push(idMap[depStr]);
            }
        }
      }

      // If subtask, strict dependency on parent? 
      // Often subtasks just belong to parent. 
      // For now, let's treat them as separate tasks, maybe linking via metadata or implicit dependency if needed.
      // PRD doesn't specify strictly, but parent usually comes before child.
      if (parentId) {
          // Optional: Add parent as prerequisite?
          // prereqs.push(parentId);
      }

      geminiTasks.push({
        id: stableId,
        name: node.title,
        description: node.description,
        prerequisites: prereqs,
        metadata: {
            originalId: node.id,
            priority: node.priority,
            status: node.status || 'pending',
        }
      });

      if (node.subtasks) {
        processNodes(node.subtasks, stableId);
      }
    }
  }
  
  processNodes(graph.tasks);

  return {
    tasks: geminiTasks,
    idMap,
  };
}
