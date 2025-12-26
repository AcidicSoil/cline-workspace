import fg from 'fast-glob';
import fs from 'fs/promises';
import { parseWorkflow } from '@workflow-pack/workflow/dist/parser';
import { WorkflowDefinition } from '@workflow-pack/workflow/dist/schema';
import { Logger } from '@workflow-pack/foundation/dist/logging';

// Step 2: Discovery Implementation
// Scans for .yml/.json workflow files

export interface DiscoveredWorkflow {
  definition: WorkflowDefinition;
  path: string;
  source: 'local' | 'installed';
}

export async function scanForWorkflows(
  directories: string[], 
  source: 'local' | 'installed',
  logger?: Logger
): Promise<DiscoveredWorkflow[]> {
  const workflows: DiscoveredWorkflow[] = [];

  for (const dir of directories) {
    try {
      // Find all .yaml, .yml, .json files recursively
      const entries = await fg(['**/*.{yaml,yml,json}'], { 
        cwd: dir, 
        absolute: true,
        deep: 5 // Limit depth to prevent performance issues
      });

      for (const entry of entries) {
        try {
          const content = await fs.readFile(entry, 'utf-8');
          const ext = entry.endsWith('.json') ? 'json' : 'yaml';
          
          const definition = parseWorkflow(content, ext);
          workflows.push({ definition, path: entry, source });
        } catch (error: any) {
          // Log warning but don't crash
          if (logger) {
            logger.warn(`Failed to parse workflow at ${entry}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
       if (logger) {
        logger.warn(`Failed to scan directory ${dir}: ${error.message}`);
      }
    }
  }

  return workflows;
}
