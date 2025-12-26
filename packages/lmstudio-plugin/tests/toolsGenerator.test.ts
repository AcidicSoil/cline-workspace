import { buildToolsProviderSource } from '../src/toolsGenerator';

describe('lmstudio tools generator', () => {
  it('renders tools provider source', () => {
    const source = buildToolsProviderSource();
    expect(source).toContain('export async function toolsProvider');
    expect(source).toContain('tool({');
  });
});
