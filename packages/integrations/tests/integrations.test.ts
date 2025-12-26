import { Git } from '../src/git';
import { GitHub } from '../src/github';
import { TestRunner } from '../src/test-runner';
import { Linter } from '../src/linter';
import { GitError, GhError, PrereqMissingError } from '@workflow-pack/foundation/dist/errors';
import execa from 'execa';

jest.mock('execa');

describe('Integrations', () => {
  describe('Git', () => {
    it('should run status', async () => {
      (execa as any).mockResolvedValue({ stdout: 'M file.ts' });
      const git = new Git();
      const status = await git.status();
      expect(status).toBe('M file.ts');
    });

    it('should throw GitError', async () => {
      (execa as any).mockRejectedValue(new Error('fatal: not a git repository'));
      const git = new Git();
      await expect(git.status()).rejects.toThrow(GitError);
    });
  });

  describe('GitHub', () => {
    it('should list PRs', async () => {
      // Mocking execa for the sequence of calls
      // 1. checkBinary (execa('gh', ['--version']))
      // 2. listPrs (execa('gh', ['pr', 'list', ...]))
      
      // execa is mocked as a function (default export)
      (execa as unknown as jest.Mock)
        .mockResolvedValueOnce({ stdout: 'gh version 2.0.0' }) // for checkBinary
        .mockResolvedValueOnce({ stdout: '[{"number":1, "title": "test"}]' }); // for listPrs

      const gh = new GitHub();
      const prs = await gh.listPrs();
      expect(prs[0].number).toBe(1);
    });

    it('should fail if binary missing', async () => {
      (execa as unknown as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      const gh = new GitHub();
      await expect(gh.listPrs()).rejects.toThrow(PrereqMissingError);
    });
  });

  describe('TestRunner', () => {
    it('should parse failures', async () => {
      // execa.command is a separate function property
      (execa.command as jest.Mock).mockRejectedValue({ stdout: 'FAIL test.ts\nError: something broke' });
      const runner = new TestRunner();
      const result = await runner.run('npm test');
      expect(result.success).toBe(false);
      expect(result.failures).toContain('FAIL test.ts');
    });
  });

  describe('Linter', () => {
    it('should attempt fix', async () => {
      (execa.command as jest.Mock).mockResolvedValue({ stdout: 'fixed' });
      const linter = new Linter();
      const result = await linter.run('lint', 'lint --fix');
      expect(result.fixed).toBe(true);
    });
  });
});
