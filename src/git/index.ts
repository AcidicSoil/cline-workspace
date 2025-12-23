import { exec, ExecOptions } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const MAX_BUFFER = 10 * 1024 * 1024; // 10MB

export async function execGit(command: string, options: ExecOptions = {}): Promise<string> {
  try {
    const { stdout } = await execAsync(`git ${command}`, {
      maxBuffer: MAX_BUFFER,
      ...options
    });
    return (typeof stdout === 'string' ? stdout : stdout.toString()).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: git ${command}\n${error.message}`);
  }
}

export async function getCommitLog(count: number = 10): Promise<string> {
  // Format: "hash|author|date|message"
  const format = '%h|%an|%ad|%s';
  return execGit(`log -n ${count} --pretty=format:"${format}"`);
}

export async function getStagedDiff(): Promise<string> {
  return execGit('diff --cached');
}

export async function getRangeDiff(base: string, head: string): Promise<string> {
  return execGit(`diff ${base}..${head}`);
}
