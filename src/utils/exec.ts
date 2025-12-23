import { spawn } from 'child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? -1,
      });
    });
  });
}
