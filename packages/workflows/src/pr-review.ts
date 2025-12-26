import { WorkflowDefinition } from '@workflow-pack/workflow/dist/schema';

export const PrReviewWorkflow: WorkflowDefinition = {
  id: 'pr-review',
  name: 'PR Review',
  version: '1.0.0',
  description: 'Analyze a PR diff and generate a review',
  params: {
    prNumber: { type: 'string', description: 'PR number to review' }
  },
  steps: [
    {
      id: 'fetch-pr',
      name: 'Fetch PR Data',
      type: 'shell',
      command: 'gh pr view ${vars.prNumber} --json title,body,headRefName,baseRefName > pr_data.json'
    },
    {
      id: 'fetch-diff',
      name: 'Fetch Diff',
      type: 'shell',
      command: 'gh pr diff ${vars.prNumber} > pr.diff'
    },
    {
      id: 'analyze',
      name: 'AI Analysis',
      type: 'ai',
      prompt: 'Analyze this PR diff and metadata. Identify risks, bugs, and style issues.',
      contextFiles: ['pr_data.json', 'pr.diff'],
      outputSchema: {
        riskLevel: 'high|medium|low',
        summary: 'string',
        issues: 'array'
      }
    },
    {
      id: 'approve-submit',
      name: 'Approve Submission',
      type: 'gate',
      message: 'Review the AI analysis. Submit to GitHub?'
    },
    {
      id: 'submit-review',
      name: 'Submit Review',
      type: 'shell',
      command: 'gh pr review ${vars.prNumber} --comment "${outputs.analyze.summary}"'
    }
  ]
};
