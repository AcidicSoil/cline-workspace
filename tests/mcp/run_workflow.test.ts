import { handleRunWorkflow } from '../../src/mcp/tools';
import * as manifest from '../../src/manifest/index';
import * as exec from '../../src/utils/exec';

jest.mock('../../src/manifest/index');
jest.mock('../../src/utils/exec');

describe('MCP Run Workflow', () => {
  it('should run a workflow and parse verdict', async () => {
    const mockWorkflow = { id: 'test-wf', outputs: [{ name: 'verdict' }] };
    (manifest.getWorkflow as jest.Mock).mockReturnValue(mockWorkflow);
    (exec.executeCommand as jest.Mock).mockResolvedValue({
      stdout: '[VERDICT] Status: PASS [/VERDICT]',
      stderr: '',
      exitCode: 0
    });

    const result = await handleRunWorkflow({ workflow_id: 'test-wf' });
    
    expect(result.status).toBe('success');
    expect(result.verdict?.verdict).toBe('PASS');
    expect(exec.executeCommand).toHaveBeenCalled();
  });

  it('should handle failures', async () => {
    (manifest.getWorkflow as jest.Mock).mockReturnValue({ id: 'test-wf', outputs: [] });
    (exec.executeCommand as jest.Mock).mockRejectedValue(new Error('Script missing'));

    const result = await handleRunWorkflow({ workflow_id: 'test-wf' });
    expect(result.status).toBe('failure');
    expect(result.output).toContain('Script missing');
  });
});
