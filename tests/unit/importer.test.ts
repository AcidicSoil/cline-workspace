import { importToGeminiFlow, generateStableId } from '../../src/taskbridge/importer';
import { TaskGraph, TaskNode } from '../../src/taskbridge/schemas';

describe('Task Importer', () => {
  const createMockTask = (overrides: Partial<TaskNode>): TaskNode => ({
    id: '0',
    title: 'Default Title',
    status: 'pending',
    dependencies: [],
    ...overrides
  });

  it('should generate stable IDs based on content', () => {
    const task1 = createMockTask({ id: '1', title: 'Task One', description: 'Desc' });
    const task2 = createMockTask({ id: '2', title: 'Task One', description: 'Desc' }); // Same content
    const task3 = createMockTask({ id: '3', title: 'Task Two', description: 'Desc' });

    expect(generateStableId(task1)).toBe(generateStableId(task2));
    expect(generateStableId(task1)).not.toBe(generateStableId(task3));
  });

  it('should transform graph to flat list with mapped dependencies', () => {
    const graph: TaskGraph = {
      tasks: [
        createMockTask({ id: '1', title: 'Root', dependencies: [] }),
        createMockTask({ id: '2', title: 'Child', dependencies: ['1'] })
      ]
    };

    const result = importToGeminiFlow(graph);
    
    expect(result.tasks).toHaveLength(2);
    
    const rootTask = result.tasks.find(t => t.name === 'Root');
    const childTask = result.tasks.find(t => t.name === 'Child');
    
    expect(rootTask).toBeDefined();
    expect(childTask).toBeDefined();
    
    // Check dependency mapping
    expect(childTask?.prerequisites).toContain(rootTask?.id);
  });

  it('should handle subtasks', () => {
    const graph: TaskGraph = {
        tasks: [
          createMockTask({ 
            id: '1', 
            title: 'Parent', 
            subtasks: [
                createMockTask({ id: '1.1', title: 'Subtask' })
            ]
          })
        ]
      };
  
      const result = importToGeminiFlow(graph);
      expect(result.tasks).toHaveLength(2);
  });
});