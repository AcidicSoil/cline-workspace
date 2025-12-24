<source_code>
src/index.ts
```
import 'dotenv/config'; // Load environment variables
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

export const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.string().describe('Your name'),
    outputSchema: z.string().describe('A greeting'),
  },
  async (name) => {
    try {
      console.log('Running helloFlow for:', name);
      const response = await ai.generate(`Hello, ${name}! Say something nice back.`);
      console.log('Response generated');
      return response.text;
    } catch (e) {
      console.error('Error in helloFlow:', e);
      throw e;
    }
  }
);

// Define the schema for a task
const TaskSchema = z.object({
  title: z.string().describe('The title of the task'),
  description: z.string().describe('A brief description of what needs to be done'),
  priority: z.enum(['high', 'medium', 'low']).describe('The priority level of the task'),
});

// Create a flow that generates tasks based on a goal
export const taskGeneratorFlow = ai.defineFlow(
  {
    name: 'taskGeneratorFlow',
    inputSchema: z.string().describe('The goal or project to break down into tasks'),
    outputSchema: z.array(TaskSchema).describe('A list of actionable tasks'),
  },
  async (goal) => {
    try {
        const { output } = await ai.generate({
        prompt: `Break down the following goal into a list of concise, actionable tasks: "${goal}"`,
        output: { schema: z.array(TaskSchema) },
        });

        if (!output) {
        throw new Error('Failed to generate tasks');
        }

        return output;
    } catch (e) {
        console.error('Error in taskGeneratorFlow:', e);
        throw e;
    }
  }
);
```

src/cline/index.ts
```
import { spawn } from 'child_process';

export interface ClineOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

export interface ClineResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function runHeadless(prompt: string, opts: ClineOptions = {}): Promise<ClineResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'new', prompt], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (opts.timeout) {
      setTimeout(() => {
        child.kill();
        reject(new Error(`Cline task timed out after ${opts.timeout}ms`));
      }, opts.timeout);
    }

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function runInteractive(prompt: string, opts: ClineOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'new', prompt], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: 'inherit' // Inherit stdio for interaction
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cline exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function followTask(taskId: string, opts: ClineOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('cline', ['task', 'view', taskId], {
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, ...opts.env },
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cline view exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
```

src/gating/index.ts
```
export type Verdict = 'PASS' | 'FAIL' | 'ALLOW' | 'BLOCK' | 'UNKNOWN';

export interface GatingPolicy {
  failOnUnknown: boolean;
}

export function parseVerdict(text: string): Verdict {
  // Look for bold markers or standalone keywords
  // Priority: BLOCK/ALLOW (often used in gates) then FAIL/PASS
  const blockMatch = /\b(BLOCK)\b/i.exec(text);
  if (blockMatch) return 'BLOCK';

  const allowMatch = /\b(ALLOW)\b/i.exec(text);
  if (allowMatch) return 'ALLOW';

  const failMatch = /\b(FAIL)\b/i.exec(text);
  if (failMatch) return 'FAIL';

  const passMatch = /\b(PASS)\b/i.exec(text);
  if (passMatch) return 'PASS';

  return 'UNKNOWN';
}

export function shouldFail(verdict: Verdict, policy: GatingPolicy = { failOnUnknown: true }): boolean {
  switch (verdict) {
    case 'BLOCK':
    case 'FAIL':
      return true;
    case 'ALLOW':
    case 'PASS':
      return false;
    case 'UNKNOWN':
    default:
      return policy.failOnUnknown;
  }
}
```

src/gating/verdict.ts
```
export type VerdictStatus = 'PASS' | 'FAIL' | 'ALLOW' | 'BLOCK';

export interface Verdict {
  verdict: VerdictStatus;
  confidence: number;
  reasoning: string;
}

export interface ParseConfig {
  failOnUnknown: boolean;
  defaultVerdict: VerdictStatus;
}

const DEFAULT_CONFIG: ParseConfig = {
  failOnUnknown: true,
  defaultVerdict: 'BLOCK',
};

/**
 * Extracts the content within [VERDICT]...[/VERDICT] tags or looks for the headers if tags are missing.
 * For now, we'll assume a structured format like:
 * [VERDICT]
 * Status: PASS
 * Confidence: 0.95
 * Reasoning: ...
 * [/VERDICT]
 */
function extractVerdictSection(output: string): string | null {
  const match = output.match(/\[VERDICT\]([\s\S]*?)\[\/VERDICT\]/i);
  if (match) {
    return match[1].trim();
  }
  // Fallback: try to find "Status:" and "Reasoning:" if no tags
  if (output.match(/Status:/i) && output.match(/Reasoning:/i)) {
    return output;
  }
  return null;
}

function parseStatus(text: string): VerdictStatus | null {
  const match = text.match(/Status:\s*(PASS|FAIL|ALLOW|BLOCK)/i);
  if (match) {
    return match[1].toUpperCase() as VerdictStatus;
  }
  return null;
}

function parseConfidence(text: string): number {
  const match = text.match(/Confidence:\s*([0-9]*\.?[0-9]+)/i);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 0 : Math.min(Math.max(val, 0), 1);
  }
  return 0; // Default confidence
}

function parseReasoning(text: string): string {
  const match = text.match(/Reasoning:\s*([\s\S]*?)(?:$|Status:|Confidence:)/i);
  if (match) {
    return match[1].trim();
  }
  // If we extracted a section, maybe the whole thing (minus headers) is reasoning?
  // For now, let's just return "No specific reasoning found" or part of the text.
  return "No specific reasoning parsed.";
}

export function parseVerdict(modelOutput: string, config: ParseConfig = DEFAULT_CONFIG): Verdict {
  const section = extractVerdictSection(modelOutput);

  if (!section) {
    return {
      verdict: config.defaultVerdict,
      confidence: 0,
      reasoning: "Failed to extract verdict section from output.",
    };
  }

  const status = parseStatus(section);
  const confidence = parseConfidence(section);
  // Improved reasoning extraction: take everything after "Reasoning:" until end of string
  const reasoningMatch = section.match(/Reasoning:\s*([\s\S]*)/i);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "No reasoning provided.";

  if (!status) {
    return {
      verdict: config.defaultVerdict,
      confidence: 0,
      reasoning: `Found verdict section but failed to parse status. Extracted: ${section.substring(0, 50)}...`,
    };
  }

  return {
    verdict: status,
    confidence,
    reasoning,
  };
}
```

src/gemini_ext/commands.ts
```
import { handleListWorkflows, handleRunWorkflow } from '../mcp/tools';

async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'list') {
      const workflows = await handleListWorkflows({});
      console.log(JSON.stringify(workflows, null, 2));
    } else if (command === 'run') {
      const workflowId = process.argv[3];
      if (!workflowId) {
        throw new Error('Workflow ID required');
      }
      // Simple arg parsing for demo
      const result = await handleRunWorkflow({ workflow_id: workflowId });
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== 'success') {
        process.exit(1);
      }
    } else {
      console.error('Unknown command');
      process.exit(1);
    }
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

src/gemini_ext/gemini-extension.json
```
{
  "publisher": "gemini-flow",
  "name": "gemini-flow-pack",
  "version": "0.1.0",
  "description": "Workflow Pack extension for Gemini CLI",
  "commands": [
    {
      "name": "pack list",
      "description": "List available workflows",
      "executable": "dist/gemini_ext/commands.js",
      "arguments": ["list"]
    },
    {
      "name": "pack run",
      "description": "Run a workflow",
      "executable": "dist/gemini_ext/commands.js",
      "arguments": ["run"]
    }
  ]
}
```

src/git/index.ts
```
import { exec, ExecOptions } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const MAX_BUFFER = 10 * 1024 * 1024; // 10MB

export async function execGit(command: string, options: ExecOptions = {}): Promise<string> {
  try {
    const { stdout } = await execAsync(`git ${command}`, {
      maxBuffer: MAX_BUFFER,
      ...options
    });
    return (typeof stdout === 'string' ? stdout : stdout.toString()).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: git ${command}\n${error.message}`);
  }
}

export async function getCommitLog(count: number = 10): Promise<string> {
  // Format: "hash|author|date|message"
  const format = '%h|%an|%ad|%s';
  return execGit(`log -n ${count} --pretty=format:"${format}"`);
}

export async function getStagedDiff(): Promise<string> {
  return execGit('diff --cached');
}

export async function getRangeDiff(base: string, head: string): Promise<string> {
  return execGit(`diff ${base}..${head}`);
}
```

src/github/index.ts
```
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
}

export type ReviewEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';

async function execGh(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`gh ${command}`);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`GitHub CLI command failed: gh ${command}\n${error.message}`);
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    await execGh('auth status');
    return true;
  } catch {
    return false;
  }
}

export async function viewPr(prNumber: number): Promise<PullRequest> {
  const output = await execGh(`pr view ${prNumber} --json number,title,body,baseRefName,headRefName,headRefOid`);
  return JSON.parse(output);
}

export async function diffPr(prNumber: number): Promise<string> {
  return execGh(`pr diff ${prNumber}`);
}

export async function submitReview(prNumber: number, body: string, event: ReviewEvent): Promise<void> {
  let flag = '--comment';
  if (event === 'APPROVE') flag = '--approve';
  if (event === 'REQUEST_CHANGES') flag = '--request-changes';

  // Escaping quotes for shell
  const escapedBody = body.replace(/"/g, '\\"');
  await execGh(`pr review ${prNumber} ${flag} --body "${escapedBody}"`);
}
```

src/install/hooks.ts
```
import fs from 'fs/promises';
import path from 'path';

export async function installPreCommitHook(): Promise<void> {
  const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
  const hookPath = path.join(gitHooksDir, 'pre-commit');

  // The hook script invokes our pre-commit.ts runner via tsx (or node if compiled)
  // For development/MVP, we'll assume tsx is available or use a relative path to node_modules/.bin/tsx
  const hookContent = `#!/bin/sh
# Cline Workflow Pack: Pre-commit Risk Gate
npx tsx pack/scripts/pre-commit.ts
`;

  try {
    await fs.mkdir(gitHooksDir, { recursive: true });
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
    console.log(`✅ Pre-commit hook installed to ${hookPath}`);
  } catch (error: any) {
    throw new Error(`Failed to install pre-commit hook: ${error.message}`);
  }
}
```

src/install/index.ts
```
import fs from 'fs/promises';
import path from 'path';
import { installPreCommitHook } from './hooks';

export interface InstallAction {
  source: string;
  target: string;
  action: 'create' | 'overwrite' | 'skip';
}

export async function computePlan(targetDir: string): Promise<InstallAction[]> {
  const packDir = path.join(__dirname, '../../pack');
  const plan: InstallAction[] = [];

  // Workflows
  const workflowSrc = path.join(packDir, 'workflows');
  const workflowDest = path.join(targetDir, '.clinerules/workflows');
  
  const workflowFiles = await fs.readdir(workflowSrc).catch(() => []);
  for (const file of workflowFiles) {
    const destPath = path.join(workflowDest, file);
    const exists = await fs.access(destPath).then(() => true).catch(() => false);
    plan.push({
      source: path.join(workflowSrc, file),
      target: destPath,
      action: exists ? 'overwrite' : 'create' // Default policy
    });
  }

  // Scripts
  const scriptSrc = path.join(packDir, 'scripts');
  const scriptDest = path.join(targetDir, 'scripts/cline');
  
  const scriptFiles = await fs.readdir(scriptSrc).catch(() => []);
  for (const file of scriptFiles) {
    const destPath = path.join(scriptDest, file);
    const exists = await fs.access(destPath).then(() => true).catch(() => false);
    plan.push({
      source: path.join(scriptSrc, file),
      target: destPath,
      action: exists ? 'overwrite' : 'create'
    });
  }

  return plan;
}

export async function installPack(targetDir: string, options: { overwrite?: boolean } = {}): Promise<void> {
  const plan = await computePlan(targetDir);

  for (const item of plan) {
    if (item.action === 'skip') continue;
    if (item.action === 'overwrite' && options.overwrite === false) {
      console.log(`⏭️ Skipping existing file: ${path.relative(targetDir, item.target)}`);
      continue;
    }

    await fs.mkdir(path.dirname(item.target), { recursive: true });
    await fs.copyFile(item.source, item.target);
    console.log(`✅ ${item.action === 'create' ? 'Created' : 'Updated'}: ${path.relative(targetDir, item.target)}`);
  }

  // Install Git Hook
  await installPreCommitHook();
}
```

src/manifest/index.ts
```
import { WorkflowInfo, WorkflowRegistry } from './types';

const MVP_REGISTRY: WorkflowRegistry = {
  'pr-review': {
    id: 'pr-review',
    name: 'PR Review',
    description: 'Analyzes PR diffs and provides a pass/fail verdict with feedback.',
    mode: 'headless',
    inputs: [
      { name: 'prNumber', type: 'number', description: 'The Pull Request number', required: true }
    ],
    outputs: [
      { name: 'verdict', type: 'string', description: 'PASS or FAIL' },
      { name: 'report', type: 'string', description: 'Path to the review report artifact' }
    ]
  },
  'changelog': {
    id: 'changelog',
    name: 'Daily Changelog',
    description: 'Summarizes recent commits into a changelog entry.',
    mode: 'headless',
    inputs: [
      { name: 'since', type: 'string', description: 'Git revision or date to start from', required: false },
      { name: 'output', type: 'string', description: 'Output file path', required: false, defaultValue: 'CHANGELOG.md' }
    ],
    outputs: [
      { name: 'summary', type: 'string', description: 'The generated changelog text' }
    ]
  },
  'pre-commit': {
    id: 'pre-commit',
    name: 'Pre-commit Risk Gate',
    description: 'Blocks risky changes before commit.',
    mode: 'headless',
    inputs: [],
    outputs: [
      { name: 'status', type: 'string', description: 'ALLOW or BLOCK' }
    ]
  },
  'lint-sweep': {
    id: 'lint-sweep',
    name: 'Lint Sweep & Auto-Fix',
    description: 'Runs linters and attempts to fix errors using AI.',
    mode: 'headless',
    inputs: [
      { name: 'command', type: 'string', description: 'Lint command to run', required: true }
    ],
    outputs: [
      { name: 'fixedFiles', type: 'string', description: 'List of fixed files' }
    ]
  }
};

export async function loadManifest(): Promise<WorkflowRegistry> {
  // In the future, this could load from a file. For now, return the static registry.
  return MVP_REGISTRY;
}

export function listWorkflows(): WorkflowInfo[] {
  return Object.values(MVP_REGISTRY);
}

export function getWorkflow(id: string): WorkflowInfo | undefined {
  return MVP_REGISTRY[id];
}
```

src/manifest/types.ts
```
export type WorkflowMode = 'headless' | 'interactive';

export interface WorkflowInput {
  name: string;
  type: 'string' | 'boolean' | 'number';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  description: string;
}

export interface WorkflowPrerequisites {
  tools?: string[];
  env?: string[];
}

export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  mode: WorkflowMode;
  prerequisites?: WorkflowPrerequisites;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  // Path to the workflow definition file (e.g., relative to pack root)
  definitionPath?: string;
}

export type WorkflowRegistry = Record<string, WorkflowInfo>;
```

src/mcp/server.ts
```
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleListWorkflows, handleRunWorkflow, handleInstallPack, ListWorkflowsSchema, RunWorkflowSchema, InstallPackSchema } from './tools';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ServerConfig {
  name?: string;
  version?: string;
}

export class McpServer {
  private server: Server;

  constructor(config: ServerConfig = {}) {
    this.server = new Server(
      {
        name: config.name || 'gemini-flow-mcp',
        version: config.version || '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_workflows',
            description: 'List available workflows',
            inputSchema: zodToJsonSchema(ListWorkflowsSchema as any) as any,
          },
          {
            name: 'run_workflow',
            description: 'Run a specific workflow',
            inputSchema: zodToJsonSchema(RunWorkflowSchema as any) as any,
          },
          {
            name: 'install_pack',
            description: 'Install workflow pack',
            inputSchema: zodToJsonSchema(InstallPackSchema as any) as any,
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_workflows':
          const listResult = await handleListWorkflows(request.params.arguments);
          return {
            content: [{ type: 'text', text: JSON.stringify(listResult, null, 2) }],
          };
        case 'run_workflow':
            const runArgs = RunWorkflowSchema.parse(request.params.arguments);
            const runResult = await handleRunWorkflow(runArgs);
            return {
                content: [{ type: 'text', text: JSON.stringify(runResult, null, 2) }]
            };
        case 'install_pack':
            const installArgs = InstallPackSchema.parse(request.params.arguments);
            const installResult = await handleInstallPack(installArgs);
            return {
                content: [{ type: 'text', text: JSON.stringify(installResult, null, 2) }]
            };
        default:
          throw new Error(`Tool not found: ${request.params.name}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server started on stdio');
  }
}

export async function startServer(config?: ServerConfig) {
  const server = new McpServer(config);
  await server.start();
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal error running server:', err);
    process.exit(1);
  });
}
```

src/mcp/tools.ts
```
import { z } from 'zod';
import { listWorkflows, loadManifest } from '../manifest/index';
import { executeCommand } from '../utils/exec';
import { getWorkflow } from '../manifest/index';
import { parseVerdict, Verdict } from '../gating/verdict';
import path from 'path';
import fs from 'fs/promises';
import { copyFile, renderTemplate } from '../utils/file-ops';

export const ListWorkflowsSchema = z.object({});

export const RunWorkflowSchema = z.object({
  workflow_id: z.string(),
  inputs: z.record(z.string(), z.any()).optional(),
  mode: z.enum(['headless', 'interactive']).optional(),
  artifactDir: z.string().optional(),
});

export const InstallPackSchema = z.object({
  targetPath: z.string(),
  selection: z.array(z.string()).optional(), // specific files or 'all'
  overwritePolicy: z.enum(['overwrite', 'skip', 'abort']).default('skip'),
});

export interface RunResult {
  workflowId: string;
  status: 'success' | 'failure';
  verdict?: Verdict;
  output: string;
  artifacts: string[];
}

export interface InstallReport {
  status: 'success' | 'failure';
  actions: { file: string; action: 'created' | 'overwritten' | 'skipped' | 'error' }[];
  summary: string;
}

export async function handleListWorkflows(args: any) {
  // Ensure manifest is loaded (if dynamic)
  await loadManifest();
  return listWorkflows();
}

export async function handleRunWorkflow(args: z.infer<typeof RunWorkflowSchema>): Promise<RunResult> {
  const workflow = getWorkflow(args.workflow_id);
  if (!workflow) {
    throw new Error(`Workflow not found: ${args.workflow_id}`);
  }

  const command = `node`;
  const scriptPath = `scripts/cline/${args.workflow_id}.js`; // Convention
  
  const cliArgs = [scriptPath];
  if (args.inputs) {
      cliArgs.push('--inputs', JSON.stringify(args.inputs));
  }

  try {
    const result = await executeCommand(command, cliArgs);
    
    let verdict: Verdict | undefined;
    if (workflow.outputs.some(o => o.name === 'verdict' || o.name === 'status')) {
        verdict = parseVerdict(result.stdout);
    }

    return {
      workflowId: args.workflow_id,
      status: result.exitCode === 0 ? 'success' : 'failure',
      verdict,
      output: result.stdout + (result.stderr ? `\nSTDERR:\n${result.stderr}` : ''),
      artifacts: args.artifactDir ? [] : [], // Would list files in artifactDir
    };

  } catch (error: any) {
    return {
      workflowId: args.workflow_id,
      status: 'failure',
      output: `Execution failed: ${error.message}`,
      artifacts: [],
    };
  }
}

export async function handleInstallPack(args: z.infer<typeof InstallPackSchema>): Promise<InstallReport> {
    const report: InstallReport = { status: 'success', actions: [], summary: '' };
    // Hardcoded pack path for MVP
    const packSrc = path.join(__dirname, '../../pack');
    const workflowSrc = path.join(packSrc, 'workflows');
    
    // Check if pack exists (mock if running in minimal env)
    try {
        // Simplified: just install workflows
        const files = await fs.readdir(workflowSrc);
        
        for (const file of files) {
            if (args.selection && args.selection.length > 0 && !args.selection.includes(file)) {
                continue;
            }

            const srcFile = path.join(workflowSrc, file);
            const destFile = path.join(args.targetPath, '.clinerules/workflows', file);
            
            let action: 'created' | 'overwritten' | 'skipped' | 'error' = 'created';
            
            let fileExists = false;
            try {
                await fs.access(destFile);
                fileExists = true;
            } catch {
                fileExists = false;
            }

            if (fileExists) {
                if (args.overwritePolicy === 'abort') {
                    throw new Error(`File ${file} exists and policy is abort`);
                } else if (args.overwritePolicy === 'skip') {
                    action = 'skipped';
                } else {
                    action = 'overwritten';
                }
            } else {
                action = 'created';
            }

            if (action !== 'skipped') {
                // Determine if it needs template rendering (e.g. if it ends in .template)
                // For now, simple copy
                await copyFile(srcFile, destFile);
            }
            
            report.actions.push({ file, action });
        }

    } catch (e: any) {
        report.status = 'failure';
        report.summary = e.message;
        return report;
    }

    report.summary = `Installed ${report.actions.filter(a => a.action === 'created' || a.action === 'overwritten').length} files.`;
    return report;
}
```

src/render/index.ts
```
import fs from 'fs/promises';
import path from 'path';

export async function renderPrompt(templateId: string, data: Record<string, any>): Promise<string> {
  const templatePath = path.join(__dirname, 'templates', `${templateId}.md`);
  
  // Basic fallback if file doesn't exist (for testing or dynamic templates)
  // In a real scenario, we might want to throw or have default templates.
  // For MVP, let's assume the file must exist or we return a placeholder.
  let template: string;
  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    // If template file is missing, check if it was passed as a direct string (not typical for this signature, but defensive)
    // Or just throw customized error
    throw new Error(`Template not found: ${templateId}`);
  }

  return interpolate(template, data);
}

export function renderWorkflowMd(workflow: any): string {
  // Generates a markdown description of a workflow
  return `# ${workflow.name}

${workflow.description}

## Inputs
${workflow.inputs.map((i: any) => `- **${i.name}** (${i.type}): ${i.description}`).join('\n')}

## Outputs
${workflow.outputs.map((o: any) => `- **${o.name}** (${o.type}): ${o.description}`).join('\n')}
`;
}

function interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\w+\}\\/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
  });
}
```

src/report/index.ts
```
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ARTIFACTS_DIR = '.clinerules/artifacts';

export async function writeArtifact(relativePath: string, content: string): Promise<string> {
  const fullPath = path.join(process.cwd(), ARTIFACTS_DIR, relativePath);
  const dir = path.dirname(fullPath);

  await fs.mkdir(dir, { recursive: true });

  // Atomic write: write to temp file then rename
  const tempPath = `${fullPath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  
  try {
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, fullPath);
  } catch (err) {
    // Attempt cleanup if rename failed
    await fs.unlink(tempPath).catch(() => {});
    throw err;
  }

  return fullPath;
}

export function formatSummary(title: string, items: string[]): string {
  return `# ${title}\n\n${items.map(item => `- ${item}`).join('\n')}\n`;
}

export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}
```

src/taskbridge/exporter.ts
```
import fs from 'fs/promises';
import { GeminiFlowProvider, GeminiTaskStatus } from './provider';
import { TaskStatus } from './schemas';

export interface ExportOptions {
  provider: GeminiFlowProvider;
  idMap: Record<string, string>; // Internal ID -> Stable ID
  outputPath: string;
}

export interface TaskGraphSnapshot {
  timestamp: string;
  tasks: Record<string, { status: TaskStatus }>; // Internal ID -> Status
}

function mapExternalStatus(external: string): TaskStatus {
  switch (external) {
    case 'completed': return 'done';
    case 'failed': return 'blocked'; // Or failed? PRD says 'blocked' for dependencies? Let's use 'blocked' or keep 'pending' if failed?
    // Let's map 'failed' to 'blocked' for now to indicate intervention needed.
    case 'in-progress': return 'in-progress';
    default: return 'pending';
  }
}

export async function exportFromGeminiFlow(options: ExportOptions): Promise<TaskGraphSnapshot> {
  const externalStatuses = await options.provider.getTaskStatuses();
  const snapshot: TaskGraphSnapshot = {
    timestamp: new Date().toISOString(),
    tasks: {}
  };

  // Reverse ID map for lookup: Stable ID -> Internal ID
  const stableToInternal: Record<string, string> = {};
  for (const [internalId, stableId] of Object.entries(options.idMap)) {
    stableToInternal[stableId] = internalId;
  }

  for (const status of externalStatuses) {
    const internalId = stableToInternal[status.id];
    if (internalId) {
      snapshot.tasks[internalId] = {
        status: mapExternalStatus(status.status)
      };
    }
  }

  await fs.writeFile(options.outputPath, JSON.stringify(snapshot, null, 2));
  return snapshot;
}
```

src/taskbridge/importer.ts
```
import crypto from 'crypto';
import { TaskGraph, TaskNode } from './schemas';

export interface GeminiTask {
  id: string;
  name: string; // mapped from title
  description?: string;
  prerequisites: string[]; // mapped from dependencies
  metadata: {
    originalId: string;
    priority?: string;
    status: string;
  };
}

export interface ImportResult {
  tasks: GeminiTask[];
  idMap: Record<string, string>; // Internal ID -> Gemini Stable ID
}

export function generateStableId(task: TaskNode): string {
  const hash = crypto.createHash('sha256');
  hash.update(task.title);
  if (task.description) hash.update(task.description);
  return hash.digest('hex').substring(0, 12);
}

export function importToGeminiFlow(graph: TaskGraph): ImportResult {
  const idMap: Record<string, string> = {};
  const geminiTasks: GeminiTask[] = [];

  // First pass: generate stable IDs
  function processNodeIds(nodes: TaskNode[]) {
    for (const node of nodes) {
      if (!idMap[node.id]) {
        idMap[node.id] = generateStableId(node);
      }
      if (node.subtasks) {
        processNodeIds(node.subtasks);
      }
    }
  }
  processNodeIds(graph.tasks);

  // Second pass: generate tasks with mapped dependencies
  function processNodes(nodes: TaskNode[], parentId?: string) {
    for (const node of nodes) {
      const stableId = idMap[node.id];
      const prereqs: string[] = [];

      // Add declared dependencies
      if (node.dependencies) {
        for (const dep of node.dependencies) {
            const depStr = String(dep);
            if (idMap[depStr]) {
                prereqs.push(idMap[depStr]);
            }
        }
      }

      // If subtask, strict dependency on parent? 
      // Often subtasks just belong to parent. 
      // For now, let's treat them as separate tasks, maybe linking via metadata or implicit dependency if needed.
      // PRD doesn't specify strictly, but parent usually comes before child.
      if (parentId) {
          // Optional: Add parent as prerequisite?
          // prereqs.push(parentId);
      }

      geminiTasks.push({
        id: stableId,
        name: node.title,
        description: node.description,
        prerequisites: prereqs,
        metadata: {
            originalId: node.id,
            priority: node.priority,
            status: node.status || 'pending',
        }
      });

      if (node.subtasks) {
        processNodes(node.subtasks, stableId);
      }
    }
  }
  
  processNodes(graph.tasks);

  return {
    tasks: geminiTasks,
    idMap,
  };
}
```

src/taskbridge/loader.ts
```
import fs from 'fs/promises';
import { TaskGraph, TaskGraphSchema, TaskNode } from './schemas';

export class TaskLoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskLoaderError';
  }
}

export async function loadTasksJson(path: string): Promise<TaskGraph> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf-8');
  } catch (error) {
    throw new TaskLoaderError(`Failed to read task file at ${path}`);
  }

  let rawData: unknown;
  try {
    rawData = JSON.parse(content);
  } catch (error) {
    throw new TaskLoaderError('Failed to parse JSON content');
  }

  const result = TaskGraphSchema.safeParse(rawData);
  if (!result.success) {
    throw new TaskLoaderError(`Schema validation failed: ${result.error.message}`);
  }

  const graph = result.data;
  validateDependencies(graph.tasks);
  
  return graph;
}

function validateDependencies(tasks: TaskNode[]) {
  const taskMap = new Map<string, TaskNode>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Helper to flatten tasks for easier ID lookup
  function collectTasks(nodes: TaskNode[]) {
    for (const node of nodes) {
      if (taskMap.has(node.id)) {
        throw new TaskLoaderError(`Duplicate task ID found: ${node.id}`);
      }
      taskMap.set(node.id, node);
      if (node.subtasks) {
        collectTasks(node.subtasks);
      }
    }
  }

  collectTasks(tasks);

  function checkCycle(taskId: string) {
    visited.add(taskId);
    recursionStack.add(taskId);

    const node = taskMap.get(taskId);
    if (node && node.dependencies) {
      for (const depId of node.dependencies) {
        const depIdStr = String(depId);
        if (!taskMap.has(depIdStr)) {
          // Warning: Dependency on missing task? 
          // For strict validation we might throw, but let's assume it might be external or allow it for now unless strictly required.
          // PRD says "validate dependencies", so let's throw if missing.
          throw new TaskLoaderError(`Task ${taskId} depends on missing task ${depIdStr}`);
        }

        if (!visited.has(depIdStr)) {
          checkCycle(depIdStr);
        } else if (recursionStack.has(depIdStr)) {
          throw new TaskLoaderError(`Circular dependency detected: ${taskId} -> ${depIdStr}`);
        }
      }
    }

    recursionStack.delete(taskId);
  }

  for (const taskId of taskMap.keys()) {
    if (!visited.has(taskId)) {
      checkCycle(taskId);
    }
  }
}
```

src/taskbridge/provider.ts
```
export interface GeminiTaskStatus {
  id: string; // Stable ID
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface GeminiFlowProvider {
  getTaskStatuses(): Promise<GeminiTaskStatus[]>;
}

export class MockGeminiFlowProvider implements GeminiFlowProvider {
  private mockData: GeminiTaskStatus[] = [];

  constructor(data: GeminiTaskStatus[] = []) {
    this.mockData = data;
  }

  async getTaskStatuses(): Promise<GeminiTaskStatus[]> {
    return Promise.resolve(this.mockData);
  }
}
```

src/taskbridge/schemas.ts
```
import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'pending',
  'in-progress',
  'done',
  'review',
  'deferred',
  'cancelled',
  'blocked'
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const BaseTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional().default('pending'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dependencies: z.array(z.union([z.string(), z.number()])).optional().default([]),
  details: z.string().optional(),
});

export type TaskNode = z.infer<typeof BaseTaskSchema> & {
  subtasks?: TaskNode[];
};

export const TaskNodeSchema: z.ZodType<TaskNode> = BaseTaskSchema.extend({
  subtasks: z.lazy(() => z.array(TaskNodeSchema).optional()),
});

export const TaskGraphSchema = z.object({
  tasks: z.array(TaskNodeSchema),
  version: z.string().optional(),
});

export type TaskGraph = z.infer<typeof TaskGraphSchema>;
```

src/utils/exec.ts
```
import { spawn } from 'child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? -1,
      });
    });
  });
}
```

src/utils/file-ops.ts
```
import fs from 'fs/promises';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

export async function renderTemplate(src: string, dest: string, context: Record<string, string>): Promise<void> {
  await ensureDir(path.dirname(dest));
  let content = await fs.readFile(src, 'utf-8');
  
  for (const [key, value] of Object.entries(context)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(placeholder, value);
  }

  await fs.writeFile(dest, content);
}
```

</source_code>