import { execGit } from '../../src/git';
import { runHeadless } from '../../src/cline';
import { parseVerdict, shouldFail } from '../../src/gating';
import { writeArtifact } from '../../src/report';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    // 6.1 Environment Detection
    const isGitHubActions = !!process.env.GITHUB_ACTIONS;
    const baseRef = process.env.GITHUB_BASE_REF || 'main';
    const headRef = process.env.GITHUB_HEAD_REF || 'HEAD';

    console.log(`🌍 Environment: ${isGitHubActions ? 'GitHub Actions' : 'Generic CI'}`);
    console.log(`🌿 Comparing ${baseRef}..${headRef}`);

    // Hydrate history if needed (common in shallow clones)
    if (isGitHubActions) {
      console.log('💧 Hydrating git history...');
      await execGit(`fetch --depth=100 origin ${baseRef}`);
    }

    // 6.2 Diff Extraction
    const diff = await execGit(`diff origin/${baseRef}..${headRef}`);
    if (!diff) {
      console.log('⚪ No changes to review.');
      process.exit(0);
    }

    // Load Prompt
    const templatePath = path.join(__dirname, '../workflows/ci-pr-review.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{diff}}', diff);

    // 6.3 Headless Analysis
    console.log('🤖 Running AI PR analysis...');
    const result = await runHeadless(prompt, { timeout: 120000 });

    // 6.4 Verdict Enforcement
    const verdict = parseVerdict(result.stdout);
    const failed = shouldFail(verdict);

    const artifactPath = await writeArtifact(`ci-review/${Date.now()}.md`, result.stdout);
    
    if (failed) {
      if (isGitHubActions) {
        console.log(`::error title=PR Review Failed::${verdict} verdict from AI review.`);
      }
      console.error('❌ CI Gate: FAIL');
      console.error(`Full report: ${artifactPath}`);
      process.exit(1);
    } else {
      console.log('✅ CI Gate: PASS');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Error in CI review:', error.message);
    process.exit(1);
  }
}

main();
