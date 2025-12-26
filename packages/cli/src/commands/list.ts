import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import Table from 'cli-table3';
import chalk from 'chalk';

export function makeListCommand(registry: WorkflowRegistry) {
  return new Command('list')
    .description('List available workflows')
    .option('--json', 'Output results as JSON')
    .action(async (options) => {
      const workflows = registry.listWorkflows();

      if (options.json) {
        console.log(JSON.stringify(workflows, null, 2));
        return;
      }

      if (workflows.length === 0) {
        console.log(chalk.yellow('No workflows found.'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Version'), chalk.cyan('Description')],
        colWidths: [20, 25, 10, 40]
      });

      for (const wf of workflows) {
        table.push([wf.id, wf.name, wf.version, wf.description || '']);
      }

      console.log(table.toString());
    });
}