import { getCommitLog } from '../../src/git';
import { runHeadless } from '../../src/cline';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    const count = parseInt(process.argv[2] || '20');
    console.log(`📜 Fetching last ${count} commits...`);
    const commits = await getCommitLog(count);

    if (!commits) {
      console.log('⚪ No commits found to summarize.');
      process.exit(0);
    }

    // Load template
    const templatePath = path.join(__dirname, '../workflows/changelog.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{commits}}', commits);

    console.log('✍️ Generating changelog summary...');
    const result = await runHeadless(prompt, { timeout: 90000 });

    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const date = new Date().toLocaleDateString();
    const entry = `
## [${date}]

${result.stdout}
`;

    // Append to CHANGELOG.md or create if not exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      existingContent = '# Changelog\n';
    }

    await fs.writeFile(changelogPath, existingContent + entry, 'utf-8');
    
    console.log(`✅ Changelog updated: ${changelogPath}`);
  } catch (error: any) {
    console.error('💥 Error generating changelog:', error.message);
    process.exit(1);
  }
}

main();
