import { getStagedDiff } from '../../src/git';
import { renderPrompt } from '../../src/render';
import { runHeadless } from '../../src/cline';
import { parseVerdict, shouldFail } from '../../src/gating';
import { writeArtifact, formatSummary } from '../../src/report';

async function main() {
  try {
    const diff = await getStagedDiff();
    if (!diff) {
      process.exit(0);
    }

    // Since renderPrompt looks in __dirname/templates, we might need a workaround or symlink
    // For now, let's assume it can find it or we provide a more robust pathing.
    // Actually, src/render/index.ts uses path.join(__dirname, 'templates', `${templateId}.md`).
    // If we run this from pack/scripts, __dirname is .../pack/scripts.
    // We should probably update src/render to support a base path or use process.cwd().
    
    // Quick hack for MVP: manually interpolate for now or use relative path if we know it.
    // Better: update src/render/index.ts to take a custom base path.
    
    // For this runner, let's just use a simple template string or relative read.
    const fs = require('fs/promises');
    const path = require('path');
    const templatePath = path.join(__dirname, '../workflows/pre-commit-review.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{diff}}', diff);

    console.log('🔍 Running pre-commit risk review...');
    const result = await runHeadless(prompt, { timeout: 60000 });

    const verdict = parseVerdict(result.stdout);
    const failed = shouldFail(verdict);

    const artifactPath = await writeArtifact(`pre-commit/${Date.now()}.md`, result.stdout);
    
    if (failed) {
      console.error('❌ Risk Gate: BLOCK');
      console.error(`Reasoning: ${result.stdout.slice(0, 500)}...`);
      console.error(`Full report: ${artifactPath}`);
      process.exit(1);
    } else {
      console.log('✅ Risk Gate: ALLOW');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Error in pre-commit hook:', error.message);
    // Fail open or closed? GEMINI.md says "defaulting to Fail Closed in CI".
    // For pre-commit, maybe fail open to not block dev if AI is down? 
    // Let's stick to fail closed for security.
    process.exit(1);
  }
}

main();
