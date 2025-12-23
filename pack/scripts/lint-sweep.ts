import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import { runHeadless } from '../../src/cline';

const execAsync = util.promisify(exec);

// 8.1 Linter Execution Harness
async function runLint(command: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout + stderr };
  } catch (error: any) {
    return { success: false, output: error.stdout + error.stderr };
  }
}

// 8.3 AI Response Parsing and Patching Logic
function applyPatches(fileContent: string, aiOutput: string): string {
  const blocks = aiOutput.split('<<<<SEARCH');
  let newContent = fileContent;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const parts = block.split('====');
    if (parts.length < 2) continue;

    const search = parts[0].trim();
    const replaceParts = parts[1].split('>>>>REPLACE');
    if (replaceParts.length < 1) continue;

    const replace = replaceParts[0].trim();

    if (newContent.includes(search)) {
      newContent = newContent.replace(search, replace);
    } else {
      console.warn('⚠️ Could not find exact search block in file.');
    }
  }

  return newContent;
}

// 8.4 Implement Retry Loop and Verification Orchestrator
async function main() {
  const lintCommand = process.argv[2] || 'npm run lint';
  const maxRetries = 3;
  let attempt = 0;

  try {
    while (attempt < maxRetries) {
      attempt++;
      console.log(`🧹 Attempt ${attempt}/${maxRetries}: Running "${lintCommand}"...`);
      const { success, output } = await runLint(lintCommand);

      if (success) {
        console.log('✅ Lint pass successful!');
        process.exit(0);
      }

      console.log('❌ Lint errors found. Invoking AI to fix...');
      
      // For MVP, we'll try to find the first file with an error in the output
      // Simple heuristic: look for absolute or relative paths
      const fileMatch = output.match(/(\/[\w\-\.\/]+\.(ts|js|tsx|jsx))/);
      if (!fileMatch) {
        console.error('Could not identify file to fix from error log.');
        process.exit(1);
      }

      const filePath = fileMatch[0];
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      let fileContent: string;
      try {
        fileContent = await fs.readFile(absolutePath, 'utf-8');
      } catch {
        console.error(`Could not read file: ${absolutePath}`);
        process.exit(1);
      }

      // Load Template
      const templatePath = path.join(__dirname, '../workflows/lint-fix.md');
      const template = await fs.readFile(templatePath, 'utf-8');
      const prompt = template
        .replace('{{errorLog}}', output)
        .replace('{{filePath}}', filePath)
        .replace('{{fileContent}}', fileContent);

      const result = await runHeadless(prompt, { timeout: 120000 });
      const patchedContent = applyPatches(fileContent, result.stdout);

      if (patchedContent !== fileContent) {
        await fs.writeFile(absolutePath, patchedContent, 'utf-8');
        console.log(`🛠️ Applied AI patches to ${filePath}`);
      } else {
        console.warn('AI did not suggest any applicable patches.');
        break; // Stop to avoid infinite loop if no changes
      }
    }

    console.error('❌ Failed to fix all lint errors after max retries.');
    process.exit(1);
  } catch (error: any) {
    console.error('💥 Error in lint-sweep:', error.message);
    process.exit(1);
  }
}

main();
