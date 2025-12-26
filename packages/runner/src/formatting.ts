import { RunResult } from '@workflow-pack/foundation';

export function formatJson(result: RunResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatHuman(result: RunResult): string {
  let output = `Workflow: ${result.workflowId} [${result.runId}]\n`;
  output += `Status: ${result.status.toUpperCase()}\n`;
  output += `Duration: ${result.finishedAt!.getTime() - result.startedAt.getTime()}ms\n\n`;

  output += 'Steps:\n';
  for (const step of result.steps) {
    const symbol = step.status === 'success' ? '✅' : step.status === 'failure' ? '❌' : '⏭️';
    output += `${symbol} ${step.stepId}: ${step.status.toUpperCase()}\n`;
    if (step.error) {
      output += `   Error: ${step.error.message}\n`;
    }
    if (step.stdout) {
      output += `   Stdout: ${step.stdout.slice(0, 100).replace(/\n/g, ' ')}...\n`;
    }
  }

  return output;
}