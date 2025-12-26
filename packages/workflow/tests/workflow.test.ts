import { parseWorkflow } from '../src/parser';
import { validateManifest } from '../src/manifest';
import { ValidationError } from '@workflow-pack/foundation'

describe('Workflow Package', () => {
  describe('Schema Validation', () => {
    it('should validate a valid workflow', () => {
      const validYaml = `
id: test-workflow
name: Test
version: 1.0.0
steps:
  - id: step1
    name: Shell Step
    type: shell
    command: echo hello
    dryRun: true
    onFailure: step2
`;
      const workflow = parseWorkflow(validYaml, 'yaml');
      expect(workflow.id).toBe('test-workflow');
      expect(workflow.steps[0].type).toBe('shell');
      expect((workflow.steps[0] as any).dryRun).toBe(true);
      expect(workflow.steps[0].onFailure).toBe('step2');
    });

    it('should reject invalid step types', () => {
      const invalidYaml = `
id: test-workflow
name: Test
version: 1.0.0
steps:
  - id: step1
    name: Bad Step
    type: unknown
`;
      expect(() => parseWorkflow(invalidYaml, 'yaml')).toThrow(ValidationError);
    });
  });

  describe('Manifest Validation', () => {
    it('should validate a compatible host version', () => {
      const manifest = {
        name: 'test-pack',
        version: '1.0.0',
        workflows: [],
        engines: { host: '>=1.0.0' }
      };
      expect(() => validateManifest(manifest, '1.2.0')).not.toThrow();
    });

    it('should reject an incompatible host version', () => {
      const manifest = {
        name: 'test-pack',
        version: '1.0.0',
        workflows: [],
        engines: { host: '>=2.0.0' }
      };
      expect(() => validateManifest(manifest, '1.5.0')).toThrow(ValidationError);
    });
  });
});
