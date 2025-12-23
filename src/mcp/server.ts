import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleListWorkflows, handleRunWorkflow, handleInstallPack, ListWorkflowsSchema, RunWorkflowSchema, InstallPackSchema } from './tools';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ServerConfig {
  name?: string;
  version?: string;
}

export class McpServer {
  private server: Server;

  constructor(config: ServerConfig = {}) {
    this.server = new Server(
      {
        name: config.name || 'gemini-flow-mcp',
        version: config.version || '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_workflows',
            description: 'List available workflows',
            inputSchema: zodToJsonSchema(ListWorkflowsSchema as any) as any,
          },
          {
            name: 'run_workflow',
            description: 'Run a specific workflow',
            inputSchema: zodToJsonSchema(RunWorkflowSchema as any) as any,
          },
          {
            name: 'install_pack',
            description: 'Install workflow pack',
            inputSchema: zodToJsonSchema(InstallPackSchema as any) as any,
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_workflows':
          const listResult = await handleListWorkflows(request.params.arguments);
          return {
            content: [{ type: 'text', text: JSON.stringify(listResult, null, 2) }],
          };
        case 'run_workflow':
            const runArgs = RunWorkflowSchema.parse(request.params.arguments);
            const runResult = await handleRunWorkflow(runArgs);
            return {
                content: [{ type: 'text', text: JSON.stringify(runResult, null, 2) }]
            };
        case 'install_pack':
            const installArgs = InstallPackSchema.parse(request.params.arguments);
            const installResult = await handleInstallPack(installArgs);
            return {
                content: [{ type: 'text', text: JSON.stringify(installResult, null, 2) }]
            };
        default:
          throw new Error(`Tool not found: ${request.params.name}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server started on stdio');
  }
}

export async function startServer(config?: ServerConfig) {
  const server = new McpServer(config);
  await server.start();
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal error running server:', err);
    process.exit(1);
  });
}
