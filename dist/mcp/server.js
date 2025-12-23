"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = void 0;
exports.startServer = startServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const tools_1 = require("./tools");
const zod_to_json_schema_1 = require("zod-to-json-schema");
class McpServer {
    server;
    constructor(config = {}) {
        this.server = new index_js_1.Server({
            name: config.name || 'gemini-flow-mcp',
            version: config.version || '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'list_workflows',
                        description: 'List available workflows',
                        inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(tools_1.ListWorkflowsSchema),
                    },
                    {
                        name: 'run_workflow',
                        description: 'Run a specific workflow',
                        inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(tools_1.RunWorkflowSchema),
                    },
                    {
                        name: 'install_pack',
                        description: 'Install workflow pack',
                        inputSchema: (0, zod_to_json_schema_1.zodToJsonSchema)(tools_1.InstallPackSchema),
                    }
                ],
            };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'list_workflows':
                    const listResult = await (0, tools_1.handleListWorkflows)(request.params.arguments);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(listResult, null, 2) }],
                    };
                case 'run_workflow':
                    const runArgs = tools_1.RunWorkflowSchema.parse(request.params.arguments);
                    const runResult = await (0, tools_1.handleRunWorkflow)(runArgs);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(runResult, null, 2) }]
                    };
                case 'install_pack':
                    const installArgs = tools_1.InstallPackSchema.parse(request.params.arguments);
                    const installResult = await (0, tools_1.handleInstallPack)(installArgs);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(installResult, null, 2) }]
                    };
                default:
                    throw new Error(`Tool not found: ${request.params.name}`);
            }
        });
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('MCP Server started on stdio');
    }
}
exports.McpServer = McpServer;
async function startServer(config) {
    const server = new McpServer(config);
    await server.start();
}
if (require.main === module) {
    startServer().catch((err) => {
        console.error('Fatal error running server:', err);
        process.exit(1);
    });
}
