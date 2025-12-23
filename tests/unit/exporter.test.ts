import { exportFromGeminiFlow } from '../../src/taskbridge/exporter';
import { MockGeminiFlowProvider } from '../../src/taskbridge/provider';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('Task Exporter', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export statuses correctly', async () => {
    const idMap = { 'internal-1': 'stable-a', 'internal-2': 'stable-b' };
    const provider = new MockGeminiFlowProvider([
      { id: 'stable-a', status: 'completed' },
      { id: 'stable-b', status: 'in-progress' }
    ]);

    const snapshot = await exportFromGeminiFlow({
      provider,
      idMap,
      outputPath: 'snapshot.json'
    });

    expect(snapshot.tasks['internal-1'].status).toBe('done');
    expect(snapshot.tasks['internal-2'].status).toBe('in-progress');
    expect(mockFs.writeFile).toHaveBeenCalled();
  });

  it('should ignore unknown external IDs', async () => {
    const idMap = { 'internal-1': 'stable-a' };
    const provider = new MockGeminiFlowProvider([
      { id: 'unknown-stable', status: 'completed' }
    ]);

    const snapshot = await exportFromGeminiFlow({
      provider,
      idMap,
      outputPath: 'snapshot.json'
    });

    expect(Object.keys(snapshot.tasks)).toHaveLength(0);
  });
});
