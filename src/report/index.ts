import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ARTIFACTS_DIR = '.clinerules/artifacts';

export async function writeArtifact(relativePath: string, content: string): Promise<string> {
  const fullPath = path.join(process.cwd(), ARTIFACTS_DIR, relativePath);
  const dir = path.dirname(fullPath);

  await fs.mkdir(dir, { recursive: true });

  // Atomic write: write to temp file then rename
  const tempPath = `${fullPath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  
  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, fullPath);
  } catch (err) {
    // Attempt cleanup if rename failed
    await fs.unlink(tempPath).catch(() => {});
    throw err;
  }

  return fullPath;
}

export function formatSummary(title: string, items: string[]): string {
  return `# ${title}\n\n${items.map(item => `- ${item}`).join('\n')}\n`;
}

export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}
