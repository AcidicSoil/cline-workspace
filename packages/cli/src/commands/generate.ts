import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import { generateGeminiExtension } from '@workflow-pack/gemini-extension';
import { generateLmStudioPlugin } from '@workflow-pack/lmstudio-plugin';
import { Logger } from '@workflow-pack/foundation';
import chalk from 'chalk';
import ora from 'ora';

export function makeGenerateCommand() {
  return new Command('generate')
    .description('Generate Gemini CLI and LM Studio artifacts from the workflow registry')
    .option('-o, --out <dir>', 'Output directory', 'artifacts')
    .option('--gemini', 'Generate Gemini extension artifacts', true)
    .option('--no-gemini', 'Skip Gemini extension output')
    .option('--lmstudio', 'Generate LM Studio plugin artifacts', true)
    .option('--no-lmstudio', 'Skip LM Studio plugin output')
    .option('--extension-name <name>', 'Extension/plugin name (default from package.json)')
    .option('--extension-version <version>', 'Extension/plugin version (default from package.json)')
    .option('--lmstudio-owner <owner>', 'LM Studio plugin owner (default: workflow-pack)')
    .option('--context-file-name <name>', 'Context file name for Gemini extension', 'GEMINI.md')
    .option('--context-file <path>', 'Path to context file content for Gemini extension')
    .option('--no-commands', 'Skip generating Gemini custom command TOML files')
    .option('--no-mcp', 'Do not include MCP server wiring in Gemini extension')
    .action(async (options) => {
      const logger = new Logger();
      const spinner = ora('Generating extension artifacts...').start();

      try {
        const meta = await loadPackageMeta();
        const extensionName = options.extensionName ?? meta.name ?? 'workflow-pack';
        const extensionVersion = options.extensionVersion ?? meta.version ?? '0.1.0';
        const outDir = path.resolve(process.cwd(), options.out);

        if (options.gemini) {
          const contextFileContent = options.contextFile
            ? await fs.readFile(path.resolve(process.cwd(), options.contextFile), 'utf-8')
            : undefined;

          const geminiOut = path.join(outDir, 'gemini-extension');
          await generateGeminiExtension({
            outputDir: geminiOut,
            name: extensionName,
            version: extensionVersion,
            contextFileName: options.contextFileName,
            contextFileContent,
            includeCommands: options.commands,
            includeCustomCommands: true,
            includeMcpServer: options.mcp,
            mcpServerUseExtensionPath: options.mcp,
            mcpServerName: 'workflow-pack'
          });
        }

        if (options.lmstudio) {
          const lmstudioOut = path.join(outDir, 'lmstudio-plugin');
          await generateLmStudioPlugin({
            outputDir: lmstudioOut,
            name: extensionName,
            owner: options.lmstudioOwner ?? 'workflow-pack',
            version: extensionVersion
          });
        }

        spinner.succeed('Generated extension artifacts.');
        logger.info(`Output directory: ${outDir}`);
      } catch (error: any) {
        spinner.fail('Failed to generate artifacts.');
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

async function loadPackageMeta() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
