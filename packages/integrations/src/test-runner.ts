import execa from 'execa';
import { ExecutionError } from '@workflow-pack/foundation/dist/errors';

export class TestRunner {
  constructor(private cwd: string = process.cwd()) {}

  async run(command: string): Promise<{ success: boolean; output: string; failures: string[] }> {
    try {
      const { stdout } = await execa.command(command, { cwd: this.cwd });
      return { success: true, output: stdout, failures: [] };
    } catch (error: any) {
      const output = error.stdout || error.stderr || error.message;
      const failures = this.parseFailures(output);
      return { success: false, output, failures };
    }
  }

  private parseFailures(output: string): string[] {
    // Simple parsing logic: match lines starting with "FAIL" or "Error:"
    const lines = output.split('\n');
    return lines.filter(line => 
      line.includes('FAIL') || 
      line.includes('Error:') || 
      line.includes('failed')
    ).map(l => l.trim());
  }
}
