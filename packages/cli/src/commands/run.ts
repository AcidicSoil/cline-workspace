import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { WorkflowEngine, ExecutionContext, ShellStepRunner, GateStepRunner, AiStepRunner, formatHuman, formatJson } from '@workflow-pack/runner';
import { Logger } from '@workflow-pack/foundation';
import chalk from 'chalk';
import ora from 'ora';

export function makeRunCommand(registry: WorkflowRegistry) {
  return new Command('run')
    .description('Run a specific workflow')
    .argument('<id>', 'Workflow ID')
    .option('--json', 'Output results as JSON')
    .option('--dry-run', 'Run without executing side effects')
    .allowUnknownOption() // Important for dynamic params (Q9)
    .action(async (id, options, command) => {
      try {
        const workflow = registry.getWorkflow(id);
        const logger = new Logger();
        
        // Q9: Dynamic param parsing
        const params: Record<string, any> = {};
        const rawArgs = command.parent?.rawArgs || [];
        const runIndex = rawArgs.indexOf('run');
        const workflowArgs = rawArgs.slice(runIndex + 2); // after 'run' and '<id>'

        for (let i = 0; i < workflowArgs.length; i++) {
          if (workflowArgs[i].startsWith('--')) {
            const key = workflowArgs[i].slice(2);
            const nextArg = workflowArgs[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
              params[key] = nextArg;
              i++;
            } else {
              params[key] = true;
            }
          }
        }

        const context = new ExecutionContext(logger, process.env as any, params);
        if (options.dryRun) context.setVar('dryRun', true);

        const engine = new WorkflowEngine(context);
        engine.registerStepRunner('shell', new ShellStepRunner());
        engine.registerStepRunner('gate', new GateStepRunner());
        
        // Register a mock AI runner for the CLI MVP
        engine.registerStepRunner('ai', new AiStepRunner({
          generate: async (prompt) => {
            return JSON.stringify({ 
              summary: "This is a mock AI summary for the CLI demonstration.",
              riskLevel: "low",
              issues: []
            });
          }
        }));

        const spinner = !options.json ? ora(`Running workflow ${chalk.cyan(id)}...`).start() : null;
        const result = await engine.run(workflow);
        if (spinner) spinner.stop();

        if (options.json) {
          console.log(formatJson(result));
        } else {
          console.log(formatHuman(result));
        }

        process.exit(result.status === 'success' ? 0 : 1);
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}
