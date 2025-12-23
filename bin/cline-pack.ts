#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { listWorkflows, getWorkflow } from '../src/manifest';
import { installPack } from '../src/install';
import { runHeadless, runInteractive } from '../src/cline';
import { renderPrompt } from '../src/render';
import path from 'path';

const program = new Command();

program
  .name('cline-pack')
  .description('Standardized daily software engineering workflows powered by Cline')
  .version('1.0.0');

program
  .command('list')
  .description('List available workflows')
  .action(() => {
    const workflows = listWorkflows();
    console.log('\n🚀 Available Workflows:');
    workflows.forEach(w => {
      console.log(`- ${w.id.padEnd(15)}: ${w.name} (${w.mode})`);
      console.log(`  ${w.description}`);
    });
    console.log('');
  });

program
  .command('install')
  .description('Install the workflow pack into the current repository')
  .option('-f, --force', 'Overwrite existing files', false)
  .action(async (options) => {
    console.log('📦 Installing Cline Workflow Pack...');
    try {
      await installPack(process.cwd(), { overwrite: options.force });
      console.log('✨ Installation complete!');
    } catch (error: any) {
      console.error(`💥 Installation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('run <id>')
  .description('Run a specific workflow')
  .option('-i, --interactive', 'Run in interactive mode', false)
  .action(async (id, options) => {
    const workflow = getWorkflow(id);
    if (!workflow) {
      console.error(`❌ Workflow not found: ${id}`);
      process.exit(1);
    }

    console.log(`🎬 Running workflow: ${workflow.name}...`);
    
    // For MVP, we'll assume the script runner logic handles the specifics.
    // However, the CLI can also directly trigger the headless mode if it's a simple prompt.
    // Most workflows in our pack have dedicated scripts in pack/scripts.
    // Let's just delegate to those scripts for now via tsx.
    
    const scriptPath = path.join(__dirname, '../pack/scripts', `${id}.ts`);
    const { spawn } = require('child_process');
    
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit'
    });

    child.on('close', (code: number) => {
      process.exit(code);
    });
  });

program.parse();
