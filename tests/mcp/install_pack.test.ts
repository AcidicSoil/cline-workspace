import { handleInstallPack } from '../../src/mcp/tools';
import fs from 'fs/promises';
import path from 'path';
import * as fileOps from '../../src/utils/file-ops';

// Mock fs and fileOps
jest.mock('fs/promises');
jest.mock('../../src/utils/file-ops');

describe('MCP Install Pack', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockFs.readdir.mockResolvedValue(['wf1.yaml', 'wf2.yaml'] as any);
  });

  it('should install files when none exist', async () => {
    mockFs.access.mockRejectedValue(new Error('File not found')); // Simulate missing files

    const result = await handleInstallPack({
      targetPath: '/tmp/target',
      overwritePolicy: 'skip'
    });

    expect(result.status).toBe('success');
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].action).toBe('created');
    expect(fileOps.copyFile).toHaveBeenCalledTimes(2);
  });

  it('should skip existing files when policy is skip', async () => {
    mockFs.access.mockResolvedValue(undefined); // Simulate existing files

    const result = await handleInstallPack({
      targetPath: '/tmp/target',
      overwritePolicy: 'skip'
    });

    expect(result.actions[0].action).toBe('skipped');
    expect(fileOps.copyFile).not.toHaveBeenCalled();
  });

  it('should overwrite existing files when policy is overwrite', async () => {
    mockFs.access.mockResolvedValue(undefined); // Simulate existing files

    const result = await handleInstallPack({
      targetPath: '/tmp/target',
      overwritePolicy: 'overwrite'
    });

    expect(result.actions[0].action).toBe('overwritten');
    expect(fileOps.copyFile).toHaveBeenCalled();
  });

  it('should abort when file exists and policy is abort', async () => {
    mockFs.access.mockResolvedValue(undefined); // Simulate existing files

    const result = await handleInstallPack({
      targetPath: '/tmp/target',
      overwritePolicy: 'abort'
    });

    expect(result.status).toBe('failure');
  });
});
