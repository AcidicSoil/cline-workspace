import execa from 'execa';
import { GitError } from '@workflow-pack/foundation';

export class Git {
  constructor(private cwd: string = process.cwd()) {}

  private async exec(args: string[]): Promise<string> {
    try {
      // Q5: Handle interactive prompts by ignoring stdin or setting specific env vars
      // We set GPG_TTY to empty to force non-interactive mode if possible, or just rely on stdio ignore
      const { stdout } = await execa('git', args, {
        cwd: this.cwd,
        env: { ...process.env, GPG_TTY: '' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      return stdout;
    } catch (error: any) {
      throw new GitError(error.message);
    }
  }

  async diff(target: string = 'HEAD'): Promise<string> {
    return this.exec(['diff', target]);
  }

  async status(): Promise<string> {
    return this.exec(['status', '--porcelain']);
  }

  async statusRaw(): Promise<string> {
    return this.exec(['status']);
  }

  async show(target: string): Promise<string> {
    return this.exec(['show', target]);
  }
}