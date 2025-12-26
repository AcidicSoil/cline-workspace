import { WorkflowRegistry } from '../src/registry';
import * as discovery from '../src/discovery';
import { WorkflowDefinition } from '@workflow-pack/workflow/dist/schema';

// Mocking the whole module is tricky with TS jest sometimes, let's use spyOn approach or manual mock if needed.
// But jest.mock should work if paths are correct.
jest.mock('../src/discovery');

const mockWorkflow = (id: string, name: string): WorkflowDefinition => ({
  id,
  name,
  version: '1.0.0',
  steps: []
});

describe('WorkflowRegistry', () => {
  let registry: WorkflowRegistry;

  beforeEach(() => {
    registry = new WorkflowRegistry();
    jest.clearAllMocks();
  });

  it('should resolve local workflows over installed ones', async () => {
    (discovery.scanForWorkflows as jest.Mock).mockImplementation((dirs, source) => {
      if (source === 'local') {
        return Promise.resolve([{
          definition: mockWorkflow('test-wf', 'Local Version'),
          path: '/local/test.yml',
          source: 'local'
        }]);
      } else {
        return Promise.resolve([{
          definition: mockWorkflow('test-wf', 'Installed Version'),
          path: '/installed/test.yml',
          source: 'installed'
        }]);
      }
    });

    await registry.initialize(['local'], ['installed']);
    const wf = registry.getWorkflow('test-wf');
    expect(wf.name).toBe('Local Version');
  });

  it('should list workflows deterministically', async () => {
     (discovery.scanForWorkflows as jest.Mock).mockResolvedValue([
      { definition: mockWorkflow('b-wf', 'B'), path: '/b.yml', source: 'local' },
      { definition: mockWorkflow('a-wf', 'A'), path: '/a.yml', source: 'local' }
    ]);

    await registry.initialize(['local']);
    const list = registry.listWorkflows();
    expect(list[0].id).toBe('a-wf');
    expect(list[1].id).toBe('b-wf');
  });

  it('should search workflows', async () => {
    (discovery.scanForWorkflows as jest.Mock).mockResolvedValue([
      { definition: mockWorkflow('find-me', 'Target'), path: '/t.yml', source: 'local' },
      { definition: mockWorkflow('ignore-me', 'Other'), path: '/o.yml', source: 'local' }
    ]);

    await registry.initialize(['local']);
    const results = registry.searchWorkflows('target');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('find-me');
  });
});
