import { McpServer } from '../../src/mcp/server';

describe('MCP Server Skeleton', () => {
  it('should instantiate without error', () => {
    const server = new McpServer();
    expect(server).toBeDefined();
  });
});
