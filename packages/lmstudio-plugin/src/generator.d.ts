import { LmStudioPluginOptions } from './scaffold';
export type GenerateLmStudioPluginOptions = LmStudioPluginOptions & {
    outputDir: string;
};
export declare function generateLmStudioPlugin(options: GenerateLmStudioPluginOptions): Promise<void>;
