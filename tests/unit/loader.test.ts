import { loadTasksJson, TaskLoaderError } from '../../src/taskbridge/loader';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
jest.mock('fs/promises');

describe('Task Loader', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and validate a valid task graph', async () => {
    const validJson = JSON.stringify({
      tasks: [
        { id: '1', title: 'Task 1', dependencies: [] },
        { id: '2', title: 'Task 2', dependencies: ['1'] }
      ]
    });
    mockFs.readFile.mockResolvedValue(validJson);

    const graph = await loadTasksJson('dummy.json');
    expect(graph.tasks).toHaveLength(2);
    expect(graph.tasks[1].dependencies).toContain('1');
  });

  it('should throw on circular dependency', async () => {
    const circularJson = JSON.stringify({
      tasks: [
        { id: '1', title: 'Task 1', dependencies: ['2'] },
        { id: '2', title: 'Task 2', dependencies: ['1'] }
      ]
    });
    mockFs.readFile.mockResolvedValue(circularJson);

    await expect(loadTasksJson('dummy.json')).rejects.toThrow(TaskLoaderError);
    await expect(loadTasksJson('dummy.json')).rejects.toThrow('Circular dependency');
  });

  it('should throw on missing dependency', async () => {
    const missingDepJson = JSON.stringify({
      tasks: [
        { id: '1', title: 'Task 1', dependencies: ['999'] }
      ]
    });
    mockFs.readFile.mockResolvedValue(missingDepJson);

    await expect(loadTasksJson('dummy.json')).rejects.toThrow('depends on missing task 999');
  });

  it('should throw on duplicate task IDs', async () => {
    const duplicateJson = JSON.stringify({
      tasks: [
        { id: '1', title: 'Task 1' },
        { id: '1', title: 'Duplicate Task 1' }
      ]
    });
    mockFs.readFile.mockResolvedValue(duplicateJson);

    await expect(loadTasksJson('dummy.json')).rejects.toThrow('Duplicate task ID');
  });

  it('should handle nested subtasks', async () => {
    const nestedJson = JSON.stringify({
      tasks: [
        { 
          id: '1', 
          title: 'Parent', 
          subtasks: [
            { id: '1.1', title: 'Child' }
          ] 
        }
      ]
    });
    mockFs.readFile.mockResolvedValue(nestedJson);

    const graph = await loadTasksJson('dummy.json');
    expect(graph.tasks[0].subtasks).toHaveLength(1);
    expect(graph.tasks[0].subtasks![0].id).toBe('1.1');
  });
});
