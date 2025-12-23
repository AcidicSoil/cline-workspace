import { handleListWorkflows, handleRunWorkflow } from '../mcp/tools';

async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'list') {
      const workflows = await handleListWorkflows({});
      console.log(JSON.stringify(workflows, null, 2));
    } else if (command === 'run') {
      const workflowId = process.argv[3];
      if (!workflowId) {
        throw new Error('Workflow ID required');
      }
      // Simple arg parsing for demo
      const result = await handleRunWorkflow({ workflow_id: workflowId });
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== 'success') {
        process.exit(1);
      }
    } else {
      console.error('Unknown command');
      process.exit(1);
    }
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
