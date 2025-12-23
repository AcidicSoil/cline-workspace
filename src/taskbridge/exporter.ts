import fs from 'fs/promises';
import { GeminiFlowProvider, GeminiTaskStatus } from './provider';
import { TaskStatus } from './schemas';

export interface ExportOptions {
  provider: GeminiFlowProvider;
  idMap: Record<string, string>; // Internal ID -> Stable ID
  outputPath: string;
}

export interface TaskGraphSnapshot {
  timestamp: string;
  tasks: Record<string, { status: TaskStatus }>; // Internal ID -> Status
}

function mapExternalStatus(external: string): TaskStatus {
  switch (external) {
    case 'completed': return 'done';
    case 'failed': return 'blocked'; // Or failed? PRD says 'blocked' for dependencies? Let's use 'blocked' or keep 'pending' if failed?
    // Let's map 'failed' to 'blocked' for now to indicate intervention needed.
    case 'in-progress': return 'in-progress';
    default: return 'pending';
  }
}

export async function exportFromGeminiFlow(options: ExportOptions): Promise<TaskGraphSnapshot> {
  const externalStatuses = await options.provider.getTaskStatuses();
  const snapshot: TaskGraphSnapshot = {
    timestamp: new Date().toISOString(),
    tasks: {}
  };

  // Reverse ID map for lookup: Stable ID -> Internal ID
  const stableToInternal: Record<string, string> = {};
  for (const [internalId, stableId] of Object.entries(options.idMap)) {
    stableToInternal[stableId] = internalId;
  }

  for (const status of externalStatuses) {
    const internalId = stableToInternal[status.id];
    if (internalId) {
      snapshot.tasks[internalId] = {
        status: mapExternalStatus(status.status)
      };
    }
  }

  await fs.writeFile(options.outputPath, JSON.stringify(snapshot, null, 2));
  return snapshot;
}
