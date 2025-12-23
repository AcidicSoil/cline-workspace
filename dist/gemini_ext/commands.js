"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("../mcp/tools");
async function main() {
    const command = process.argv[2];
    try {
        if (command === 'list') {
            const workflows = await (0, tools_1.handleListWorkflows)({});
            console.log(JSON.stringify(workflows, null, 2));
        }
        else if (command === 'run') {
            const workflowId = process.argv[3];
            if (!workflowId) {
                throw new Error('Workflow ID required');
            }
            // Simple arg parsing for demo
            const result = await (0, tools_1.handleRunWorkflow)({ workflow_id: workflowId });
            console.log(JSON.stringify(result, null, 2));
            if (result.status !== 'success') {
                process.exit(1);
            }
        }
        else {
            console.error('Unknown command');
            process.exit(1);
        }
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
