import { WorkflowDefinition } from '@workflow-pack/workflow';
export type GeminiMcpServerConfig = {
    command: string;
    args?: string[];
    cwd?: string;
};
export type GeminiCustomCommand = {
    description?: string;
    prompt: string;
};
export type GeminiExtensionConfig = {
    name: string;
    version: string;
    contextFileName?: string;
    mcpServers?: Record<string, GeminiMcpServerConfig>;
    customCommands?: Record<string, GeminiCustomCommand>;
};
export type GeminiExtensionOptions = {
    name: string;
    version: string;
    contextFileName?: string;
    includeMcpServer?: boolean;
    mcpServerName?: string;
    mcpServerCommand?: string;
    mcpServerArgs?: string[];
    mcpServerCwd?: string;
    mcpServerUseExtensionPath?: boolean;
    mcpServerEntryFile?: string;
    includeCustomCommands?: boolean;
};
export declare function buildGeminiExtensionConfig(workflows: WorkflowDefinition[], options: GeminiExtensionOptions): GeminiExtensionConfig;
export declare function buildCustomCommand(workflow: WorkflowDefinition): GeminiCustomCommand;
export declare function buildCustomCommandToml(workflow: WorkflowDefinition): string;
