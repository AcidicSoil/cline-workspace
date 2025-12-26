import path from 'path';
import fs from 'fs/promises';
import { buildConfigSource, buildIndexSource, buildManifest, buildPackageJson, buildTsconfig, LmStudioPluginOptions } from './scaffold';
import { buildToolsProviderSource } from './toolsGenerator';

export type GenerateLmStudioPluginOptions = LmStudioPluginOptions & {
  outputDir: string;
};

export async function generateLmStudioPlugin(options: GenerateLmStudioPluginOptions) {
  await fs.mkdir(options.outputDir, { recursive: true });
  await fs.mkdir(path.join(options.outputDir, 'src'), { recursive: true });

  const files: Array<{ path: string; content: string }> = [
    { path: path.join(options.outputDir, 'manifest.json'), content: buildManifest(options) },
    { path: path.join(options.outputDir, 'package.json'), content: buildPackageJson(options) },
    { path: path.join(options.outputDir, 'tsconfig.json'), content: buildTsconfig() },
    { path: path.join(options.outputDir, 'src', 'index.ts'), content: buildIndexSource() },
    { path: path.join(options.outputDir, 'src', 'config.ts'), content: buildConfigSource() },
    { path: path.join(options.outputDir, 'src', 'toolsProvider.ts'), content: buildToolsProviderSource() }
  ];

  for (const file of files) {
    await fs.writeFile(file.path, file.content, 'utf-8');
  }
}
