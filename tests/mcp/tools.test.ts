import { handleListWorkflows } from '../../src/mcp/tools';
import * as manifest from '../../src/manifest/index';

jest.mock('../../src/manifest/index');

describe('MCP Tools', () => {
  it('handleListWorkflows should return workflows', async () => {
    const mockWorkflows = [{ id: 'test', name: 'Test Workflow' }];
    (manifest.listWorkflows as jest.Mock).mockReturnValue(mockWorkflows);
    (manifest.loadManifest as jest.Mock).mockResolvedValue({});

    const result = await handleListWorkflows({});
    expect(result).toEqual(mockWorkflows);
    expect(manifest.loadManifest).toHaveBeenCalled();
  });
});
