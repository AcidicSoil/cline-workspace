#!/usr/bin/env node
import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { workflows as builtInWorkflows } from '@workflow-pack/workflows';
import { makeListCommand } from './commands/list';
import { makeRunCommand } from './commands/run';
import { Logger } from '@workflow-pack/foundation';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const logger = new Logger();
  const registry = new WorkflowRegistry(logger);

  // 1. Initialize registry with local workflows from .clinerules/workflows
  const localDir = path.join(process.cwd(), '.clinerules', 'workflows');
  const localDirs = [];
  try {
    await fs.access(localDir);
    localDirs.push(localDir);
  } catch {}

  await registry.initialize(localDirs, []);

  // 2. Register built-in workflows from the workflows package
  for (const wf of builtInWorkflows) {
    registry.registerWorkflow(wf, 'installed');
  }

  // 3. Setup CLI
  const program = new Command();
  program
    .name('workflow-pack')
    .description('A host-agnostic workflow execution tool')
    .version('0.1.0');

  program.addCommand(makeListCommand(registry));
  program.addCommand(makeRunCommand(registry));

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});