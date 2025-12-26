import { createConfigSchematics } from '@lmstudio/sdk';

export const configSchematics = createConfigSchematics()
  .field('workspaceRoot', 'string', {
    displayName: 'Workspace Root',
    hint: 'Path to the repository containing workflows.'
  }, '.')
  .field('autoApproveGates', 'boolean', {
    displayName: 'Auto-approve Gates',
    hint: 'Automatically approve gate steps.'
  }, false)
  .field('dryRun', 'boolean', {
    displayName: 'Dry Run',
    hint: 'Avoid executing side-effect shell commands.'
  }, false)
  .field('aiMode', 'string', {
    displayName: 'AI Mode',
    hint: 'mock | echo | disabled'
  }, 'mock')
  .build();
