import { buildManifest, buildPackageJson } from '../src/scaffold';

describe('lmstudio scaffold', () => {
  it('builds manifest with required fields', () => {
    const manifest = JSON.parse(buildManifest({
      name: 'workflow-pack',
      owner: 'example',
      version: '0.1.0'
    }));

    expect(manifest.type).toBe('plugin');
    expect(manifest.runner).toBe('node');
    expect(manifest.entry).toBe('dist/index.js');
  });

  it('builds package.json with lmstudio sdk dependency', () => {
    const pkg = JSON.parse(buildPackageJson({
      name: 'workflow-pack',
      owner: 'example',
      version: '0.1.0'
    }));

    expect(pkg.dependencies['@lmstudio/sdk']).toBeTruthy();
  });
});
