import { WorkflowDefinition } from '@workflow-pack/workflow';
import { buildCustomCommandToml, buildGeminiExtensionConfig } from '../src/mapper';

describe('gemini extension mapper', () => {
  const workflows: WorkflowDefinition[] = [
    {
      id: 'pr-review',
      name: 'PR Review',
      version: '1.0.0',
      description: 'Review pull requests',
      params: {
        prNumber: { type: 'string', description: 'PR number' }
      },
      steps: []
    }
  ];

  it('builds extension config with custom commands', () => {
    const config = buildGeminiExtensionConfig(workflows, {
      name: 'workflow-pack',
      version: '0.1.0',
      includeCustomCommands: true
    });

    expect(config.customCommands?.['pr-review']).toBeTruthy();
    expect(config.customCommands?.['pr-review'].description).toBe('Review pull requests');
  });

  it('renders command TOML', () => {
    const toml = buildCustomCommandToml(workflows[0]);
    expect(toml).toContain('description = "Review pull requests"');
    expect(toml).toContain('prompt = """');
  });

  it('uses extensionPath for MCP server wiring when requested', () => {
    const config = buildGeminiExtensionConfig(workflows, {
      name: 'workflow-pack',
      version: '0.1.0',
      includeMcpServer: true,
      mcpServerUseExtensionPath: true
    });

    const server = config.mcpServers?.['workflow-pack'];
    expect(server?.command).toBe('node');
    expect(server?.args?.[0]).toContain('${extensionPath}');
  });
});
