import { redactSensitive } from '../src/config';
import { Logger } from '../src/logging';
import { getExitCode, ValidationError, PrereqMissingError } from '../src/errors';

describe('Foundation Layer', () => {
  describe('Config Redaction', () => {
    it('should redact sensitive keys', () => {
      const config = {
        api_key: 'secret123',
        database_password: 'pass',
        normal_key: 'public'
      };
      const redacted: any = redactSensitive(config);
      expect(redacted.api_key).toBe('********');
      expect(redacted.database_password).toBe('********');
      expect(redacted.normal_key).toBe('public');
    });

    it('should redact custom secret keys', () => {
      const config = { my_token: 'abc' };
      const redacted: any = redactSensitive(config, ['MY_TOKEN']);
      expect(redacted.my_token).toBe('********');
    });
  });

  describe('Logging', () => {
    it('should maintain correlationId across child loggers', () => {
      const logger = new Logger();
      const child = logger.child();
      expect(child.getCorrelationId()).toBe(logger.getCorrelationId());
    });
  });

  describe('Errors', () => {
    it('should map errors to correct exit codes', () => {
      expect(getExitCode(new ValidationError('fail'))).toBe(2);
      expect(getExitCode(new PrereqMissingError('tool', 'hint'))).toBe(69);
      expect(getExitCode(new Error('unknown'))).toBe(1);
    });
  });
});
