import execa from 'execa';

export class Linter {
  constructor(private cwd: string = process.cwd()) {}

  async run(checkCommand: string, fixCommand?: string): Promise<{ fixed: boolean; output: string }> {
    let fixed = false;
    let output = '';

    if (fixCommand) {
      try {
        const result = await execa.command(fixCommand, { cwd: this.cwd });
        output += result.stdout;
        fixed = true;
      } catch (e: any) {
        output += e.stdout || e.message;
      }
    }

    try {
      const result = await execa.command(checkCommand, { cwd: this.cwd });
      output += result.stdout;
      return { fixed, output };
    } catch (e: any) {
      output += e.stdout || e.message;
      throw new Error(`Lint check failed:
${output}`);
    }
  }
}
