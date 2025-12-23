import { spawn } from 'child_process';

export interface ClineOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

export interface ClineResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function runHeadless(prompt: string, opts: ClineOptions = {}): Promise<ClineResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'new', prompt], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (opts.timeout) {
      setTimeout(() => {
        child.kill();
        reject(new Error(`Cline task timed out after ${opts.timeout}ms`));
      }, opts.timeout);
    }

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function runInteractive(prompt: string, opts: ClineOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'new', prompt], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: 'inherit' // Inherit stdio for interaction
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cline exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function followTask(taskId: string, opts: ClineOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'view', taskId], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cline view exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}