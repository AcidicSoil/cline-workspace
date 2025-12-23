import fs from 'fs/promises';
import path from 'path';
import { installPreCommitHook } from './hooks';

export interface InstallAction {
  source: string;
  target: string;
  action: 'create' | 'overwrite' | 'skip';
}

export async function computePlan(targetDir: string): Promise<InstallAction[]> {
  const packDir = path.join(__dirname, '../../pack');
  const plan: InstallAction[] = [];

  // Workflows
  const workflowSrc = path.join(packDir, 'workflows');
  const workflowDest = path.join(targetDir, '.clinerules/workflows');
  
  const workflowFiles = await fs.readdir(workflowSrc).catch(() => []);
  for (const file of workflowFiles) {
    const destPath = path.join(workflowDest, file);
    const exists = await fs.access(destPath).then(() => true).catch(() => false);
    plan.push({
      source: path.join(workflowSrc, file),
      target: destPath,
      action: exists ? 'overwrite' : 'create' // Default policy
    });
  }

  // Scripts
  const scriptSrc = path.join(packDir, 'scripts');
  const scriptDest = path.join(targetDir, 'scripts/cline');
  
  const scriptFiles = await fs.readdir(scriptSrc).catch(() => []);
  for (const file of scriptFiles) {
    const destPath = path.join(scriptDest, file);
    const exists = await fs.access(destPath).then(() => true).catch(() => false);
    plan.push({
      source: path.join(scriptSrc, file),
      target: destPath,
      action: exists ? 'overwrite' : 'create'
    });
  }

  return plan;
}

export async function installPack(targetDir: string, options: { overwrite?: boolean } = {}): Promise<void> {
  const plan = await computePlan(targetDir);

  for (const item of plan) {
    if (item.action === 'skip') continue;
    if (item.action === 'overwrite' && options.overwrite === false) {
      console.log(`⏭️ Skipping existing file: ${path.relative(targetDir, item.target)}`);
      continue;
    }

    await fs.mkdir(path.dirname(item.target), { recursive: true });
    await fs.copyFile(item.source, item.target);
    console.log(`✅ ${item.action === 'create' ? 'Created' : 'Updated'}: ${path.relative(targetDir, item.target)}`);
  }

  // Install Git Hook
  await installPreCommitHook();
}
