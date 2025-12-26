import execa from 'execa';
import { GhError, PrereqMissingError } from '@workflow-pack/foundation/dist/errors';

export class GitHub {
  constructor(private cwd: string = process.cwd()) {}

  private async checkBinary() {
    try {
      await execa('gh', ['--version']);
    } catch {
      throw new PrereqMissingError('gh', 'Please install GitHub CLI.');
    }
  }

  private async exec(args: string[]): Promise<any> {
    await this.checkBinary();
    try {
      // Use --json only if arguments don't already include it or output raw text
      // For this simplified version, we assume JSON output is desired for API-like calls
      const { stdout } = await execa('gh', args, {
        cwd: this.cwd
      });
      // Try parse JSON, else return text (e.g. for diffs)
      try {
        return JSON.parse(stdout);
      } catch {
        return stdout;
      }
    } catch (error: any) {
      throw new GhError(error.message);
    }
  }

  async getPr(prId: string) {
    return this.exec(['pr', 'view', prId, '--json', 'title,body,number,state,url']);
  }

  async listPrs() {
    return this.exec(['pr', 'list', '--json', 'title,body,number,state,url']);
  }
  
  async diff(prId: string) {
      return this.exec(['pr', 'diff', prId]);
  }
}
