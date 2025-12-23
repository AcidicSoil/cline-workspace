import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
}

export type ReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

async function execGh(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`gh ${command}`);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`GitHub CLI command failed: gh ${command}\n${error.message}`);
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    await execGh('auth status');
    return true;
  } catch {
    return false;
  }
}

export async function viewPr(prNumber: number): Promise<PullRequest> {
  const output = await execGh(`pr view ${prNumber} --json number,title,body,baseRefName,headRefName,headRefOid`);
  return JSON.parse(output);
}

export async function diffPr(prNumber: number): Promise<string> {
  return execGh(`pr diff ${prNumber}`);
}

export async function submitReview(prNumber: number, body: string, event: ReviewEvent): Promise<void> {
  let flag = '--comment';
  if (event === 'APPROVE') flag = '--approve';
  if (event === 'REQUEST_CHANGES') flag = '--request-changes';

  // Escaping quotes for shell
  const escapedBody = body.replace(/"/g, '\\"');
  await execGh(`pr review ${prNumber} ${flag} --body "${escapedBody}"`);
}
