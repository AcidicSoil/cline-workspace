export type LmStudioPluginOptions = {
  name: string;
  owner: string;
  version: string;
  description?: string;
  revision?: number;
};

export function buildManifest(options: LmStudioPluginOptions): string {
  const manifest = {
    type: 'plugin',
    runner: 'node',
    owner: options.owner,
    name: options.name,
    version: options.version,
    revision: options.revision ?? 1,
    description: options.description ?? 'Workflow pack plugin',
    entry: 'dist/index.js'
  };
  return JSON.stringify(manifest, null, 2);
}

export function buildPackageJson(options: LmStudioPluginOptions): string {
  const pkg = {
    name: options.name,
    version: options.version,
    description: options.description ?? 'Workflow pack plugin',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'lms dev',
      push: 'lms push'
    },
    dependencies: {
      '@lmstudio/sdk': '^1.5.0',
      'zod': '^3.24.1',
      '@workflow-pack/foundation': '^0.1.0',
      '@workflow-pack/workflow': '^0.1.0',
      '@workflow-pack/registry': '^0.1.0',
      '@workflow-pack/runner': '^0.1.0',
      '@workflow-pack/workflows': '^0.1.0'
    },
    devDependencies: {
      typescript: '^5.0.0',
      '@types/node': '^20.0.0'
    }
  };

  return JSON.stringify(pkg, null, 2);
}

export function buildTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: './dist',
        rootDir: './src',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true
      },
      include: ['src/**/*']
    },
    null,
    2
  );
}

export function buildIndexSource(): string {
  return `import { type PluginContext } from '@lmstudio/sdk';
import { toolsProvider } from './toolsProvider';
import { configSchematics } from './config';

export async function main(context: PluginContext) {
  context.withConfigSchematics(configSchematics);
  context.withToolsProvider(toolsProvider);
}
`;
}

export function buildConfigSource(): string {
  return `import { createConfigSchematics } from '@lmstudio/sdk';

export const configSchematics = createConfigSchematics()
  .field('workspaceRoot', 'string', {
    displayName: 'Workspace Root',
    hint: 'Path to the repository containing workflows.'
  }, '.')
  .field('autoApproveGates', 'boolean', {
    displayName: 'Auto-approve Gates',
    hint: 'Automatically approve gate steps.'
  }, false)
  .field('dryRun', 'boolean', {
    displayName: 'Dry Run',
    hint: 'Avoid executing side-effect shell commands.'
  }, false)
  .field('aiMode', 'string', {
    displayName: 'AI Mode',
    hint: 'mock | echo | disabled'
  }, 'mock')
  .build();
`;
}
