import { DiscoveredWorkflow, scanForWorkflows } from './discovery';
import { WorkflowDefinition } from '@workflow-pack/workflow/dist/schema';
import { PackError } from '@workflow-pack/foundation/dist/errors';
import { Logger } from '@workflow-pack/foundation/dist/logging';

export class RegistryError extends PackError {
  constructor(message: string) {
    super(message, "REGISTRY_ERROR");
  }
}

export class WorkflowRegistry {
  private workflows: Map<string, DiscoveredWorkflow> = new Map();

  constructor(private logger?: Logger) {}

  public async initialize(localDirs: string[] = [], installedDirs: string[] = []) {
    const local = await scanForWorkflows(localDirs, 'local', this.logger);
    const installed = await scanForWorkflows(installedDirs, 'installed', this.logger);

    this.resolveWorkflows([...local, ...installed]);
  }

  // Q2: Resolution logic - ID collision handling
  private resolveWorkflows(candidates: DiscoveredWorkflow[]) {
    for (const candidate of candidates) {
      const id = candidate.definition.id;
      const existing = this.workflows.get(id);

      if (!existing) {
        this.workflows.set(id, candidate);
        continue;
      }

      // Conflict resolution
      if (existing.source === 'local' && candidate.source === 'installed') {
        // Keep local (override)
        continue;
      } else if (existing.source === 'installed' && candidate.source === 'local') {
        // Replace installed with local
        this.workflows.set(id, candidate);
      } else if (existing.source === candidate.source) {
         // Collision in same source type
         // If paths are different, it's an ambiguity error
         if (existing.path !== candidate.path) {
            this.logger?.warn(`Duplicate workflow ID '${id}' found in ${existing.path} and ${candidate.path}. Keeping the first one.`);
         }
      }
    }
  }

  public getWorkflow(id: string): WorkflowDefinition {
    const wf = this.workflows.get(id);
    if (!wf) {
      throw new RegistryError(`Workflow not found: ${id}`);
    }
    return wf.definition;
  }

  // Q17: Support hiding workflows
  public listWorkflows(includeHidden = false): WorkflowDefinition[] {
    const list = Array.from(this.workflows.values())
      .map(w => w.definition)
      .filter(w => includeHidden || !(w as any).hidden); // Check for 'hidden' prop if we add it to schema, or metadata

    // Deterministic sort
    return list.sort((a, b) => a.id.localeCompare(b.id));
  }

  public searchWorkflows(query: string): WorkflowDefinition[] {
    const q = query.toLowerCase();
    return this.listWorkflows(true).filter(w => 
      w.id.toLowerCase().includes(q) || 
      w.name.toLowerCase().includes(q) || 
      w.description?.toLowerCase().includes(q)
    );
  }
}
