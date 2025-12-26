import { GeminiExtensionOptions } from './mapper';
import { WorkflowDefinition } from '@workflow-pack/workflow';
export type GenerateGeminiExtensionOptions = GeminiExtensionOptions & {
    outputDir: string;
    includeCommands?: boolean;
    contextFileContent?: string;
    workflows?: WorkflowDefinition[];
};
export declare function generateGeminiExtension(options: GenerateGeminiExtensionOptions): Promise<void>;
export declare function loadWorkflows(): Promise<WorkflowDefinition[]>;
