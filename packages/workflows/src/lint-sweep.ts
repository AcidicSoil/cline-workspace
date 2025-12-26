import { WorkflowDefinition } from '@workflow-pack/workflow';

export const LintSweepWorkflow: WorkflowDefinition = {
  id: 'lint-sweep',
  name: 'Lint Sweep',
  version: '1.0.0',
  description: 'Run linters, apply fixes, and summarize changes',
  steps: [
    {
      id: 'lint-check',
      name: 'Check Lint',
      type: 'shell',
      command: 'npm run lint',
      onFailure: 'lint-fix' // If check fails, try fix
    },
    {
      id: 'lint-fix',
      name: 'Apply Fixes',
      type: 'shell',
      command: 'npm run lint -- --fix',
      if: 'steps["lint-check"].status === "failure"' // Conditional execution
    },
    {
      id: 'verify-tests',
      name: 'Verify Tests',
      type: 'shell',
      command: 'npm test'
    },
    {
      id: 'summarize',
      name: 'Summarize Changes',
      type: 'ai',
      prompt: 'Summarize the linting fixes applied.',
      if: 'steps["lint-fix"].status === "success"'
    }
  ]
};