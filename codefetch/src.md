<source_code>
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

pack/scripts/ci-review.ts
```
import { execGit } from '../../src/git';
import { runHeadless } from '../../src/cline';
import { parseVerdict, shouldFail } from '../../src/gating';
import { writeArtifact } from '../../src/report';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    // 6.1 Environment Detection
    const isGitHubActions = !!process.env.GITHUB_ACTIONS;
    const baseRef = process.env.GITHUB_BASE_REF || 'main';
    const headRef = process.env.GITHUB_HEAD_REF || 'HEAD';

    console.log(`🌍 Environment: ${isGitHubActions ? 'GitHub Actions' : 'Generic CI'}`);
    console.log(`🌿 Comparing ${baseRef}..${headRef}`);

    // Hydrate history if needed (common in shallow clones)
    if (isGitHubActions) {
      console.log('💧 Hydrating git history...');
      await execGit(`fetch --depth=100 origin ${baseRef}`);
    }

    // 6.2 Diff Extraction
    const diff = await execGit(`diff origin/${baseRef}..${headRef}`);
    if (!diff) {
      console.log('⚪ No changes to review.');
      process.exit(0);
    }

    // Load Prompt
    const templatePath = path.join(__dirname, '../workflows/ci-pr-review.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{diff}}', diff);

    // 6.3 Headless Analysis
    console.log('🤖 Running AI PR analysis...');
    const result = await runHeadless(prompt, { timeout: 120000 });

    // 6.4 Verdict Enforcement
    const verdict = parseVerdict(result.stdout);
    const failed = shouldFail(verdict);

    const artifactPath = await writeArtifact(`ci-review/${Date.now()}.md`, result.stdout);
    
    if (failed) {
      if (isGitHubActions) {
        console.log(`::error title=PR Review Failed::${verdict} verdict from AI review.`);
      }
      console.error('❌ CI Gate: FAIL');
      console.error(`Full report: ${artifactPath}`);
      process.exit(1);
    } else {
      console.log('✅ CI Gate: PASS');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Error in CI review:', error.message);
    process.exit(1);
  }
}

main();
```

pack/scripts/generate-changelog.ts
```
import { getCommitLog } from '../../src/git';
import { runHeadless } from '../../src/cline';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    const count = parseInt(process.argv[2] || '20');
    console.log(`📜 Fetching last ${count} commits...`);
    const commits = await getCommitLog(count);

    if (!commits) {
      console.log('⚪ No commits found to summarize.');
      process.exit(0);
    }

    // Load template
    const templatePath = path.join(__dirname, '../workflows/changelog.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{commits}}', commits);

    console.log('✍️ Generating changelog summary...');
    const result = await runHeadless(prompt, { timeout: 90000 });

    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const date = new Date().toLocaleDateString();
    const entry = `
## [${date}]

${result.stdout}
`;

    // Append to CHANGELOG.md or create if not exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      existingContent = '# Changelog\n';
    }

    await fs.writeFile(changelogPath, existingContent + entry, 'utf-8');
    
    console.log(`✅ Changelog updated: ${changelogPath}`);
  } catch (error: any) {
    console.error('💥 Error generating changelog:', error.message);
    process.exit(1);
  }
}

main();
```

pack/scripts/lint-sweep.ts
```
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import { runHeadless } from '../../src/cline';

const execAsync = util.promisify(exec);

// 8.1 Linter Execution Harness
async function runLint(command: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout + stderr };
  } catch (error: any) {
    return { success: false, output: error.stdout + error.stderr };
  }
}

// 8.3 AI Response Parsing and Patching Logic
function applyPatches(fileContent: string, aiOutput: string): string {
  const blocks = aiOutput.split('<<<<SEARCH');
  let newContent = fileContent;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const parts = block.split('====');
    if (parts.length < 2) continue;

    const search = parts[0].trim();
    const replaceParts = parts[1].split('>>>>REPLACE');
    if (replaceParts.length < 1) continue;

    const replace = replaceParts[0].trim();

    if (newContent.includes(search)) {
      newContent = newContent.replace(search, replace);
    } else {
      console.warn('⚠️ Could not find exact search block in file.');
    }
  }

  return newContent;
}

// 8.4 Implement Retry Loop and Verification Orchestrator
async function main() {
  const lintCommand = process.argv[2] || 'npm run lint';
  const maxRetries = 3;
  let attempt = 0;

  try {
    while (attempt < maxRetries) {
      attempt++;
      console.log(`🧹 Attempt ${attempt}/${maxRetries}: Running "${lintCommand}"...`);
      const { success, output } = await runLint(lintCommand);

      if (success) {
        console.log('✅ Lint pass successful!');
        process.exit(0);
      }

      console.log('❌ Lint errors found. Invoking AI to fix...');
      
      // For MVP, we'll try to find the first file with an error in the output
      // Simple heuristic: look for absolute or relative paths
      const fileMatch = output.match(/(\/[\w\-\.\/]+\.(ts|js|tsx|jsx))/);
      if (!fileMatch) {
        console.error('Could not identify file to fix from error log.');
        process.exit(1);
      }

      const filePath = fileMatch[0];
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      let fileContent: string;
      try {
        fileContent = await fs.readFile(absolutePath, 'utf-8');
      } catch {
        console.error(`Could not read file: ${absolutePath}`);
        process.exit(1);
      }

      // Load Template
      const templatePath = path.join(__dirname, '../workflows/lint-fix.md');
      const template = await fs.readFile(templatePath, 'utf-8');
      const prompt = template
        .replace('{{errorLog}}', output)
        .replace('{{filePath}}', filePath)
        .replace('{{fileContent}}', fileContent);

      const result = await runHeadless(prompt, { timeout: 120000 });
      const patchedContent = applyPatches(fileContent, result.stdout);

      if (patchedContent !== fileContent) {
        await fs.writeFile(absolutePath, patchedContent, 'utf-8');
        console.log(`🛠️ Applied AI patches to ${filePath}`);
      } else {
        console.warn('AI did not suggest any applicable patches.');
        break; // Stop to avoid infinite loop if no changes
      }
    }

    console.error('❌ Failed to fix all lint errors after max retries.');
    process.exit(1);
  } catch (error: any) {
    console.error('💥 Error in lint-sweep:', error.message);
    process.exit(1);
  }
}

main();
```

pack/scripts/pre-commit.ts
```
import { getStagedDiff } from '../../src/git';
import { renderPrompt } from '../../src/render';
import { runHeadless } from '../../src/cline';
import { parseVerdict, shouldFail } from '../../src/gating';
import { writeArtifact, formatSummary } from '../../src/report';

async function main() {
  try {
    const diff = await getStagedDiff();
    if (!diff) {
      process.exit(0);
    }

    // Since renderPrompt looks in __dirname/templates, we might need a workaround or symlink
    // For now, let's assume it can find it or we provide a more robust pathing.
    // Actually, src/render/index.ts uses path.join(__dirname, 'templates', `${templateId}.md`).
    // If we run this from pack/scripts, __dirname is .../pack/scripts.
    // We should probably update src/render to support a base path or use process.cwd().
    
    // Quick hack for MVP: manually interpolate for now or use relative path if we know it.
    // Better: update src/render/index.ts to take a custom base path.
    
    // For this runner, let's just use a simple template string or relative read.
    const fs = require('fs/promises');
    const path = require('path');
    const templatePath = path.join(__dirname, '../workflows/pre-commit-review.md');
    const template = await fs.readFile(templatePath, 'utf-8');
    const prompt = template.replace('{{diff}}', diff);

    console.log('🔍 Running pre-commit risk review...');
    const result = await runHeadless(prompt, { timeout: 60000 });

    const verdict = parseVerdict(result.stdout);
    const failed = shouldFail(verdict);

    const artifactPath = await writeArtifact(`pre-commit/${Date.now()}.md`, result.stdout);
    
    if (failed) {
      console.error('❌ Risk Gate: BLOCK');
      console.error(`Reasoning: ${result.stdout.slice(0, 500)}...`);
      console.error(`Full report: ${artifactPath}`);
      process.exit(1);
    } else {
      console.log('✅ Risk Gate: ALLOW');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Error in pre-commit hook:', error.message);
    // Fail open or closed? GEMINI.md says "defaulting to Fail Closed in CI".
    // For pre-commit, maybe fail open to not block dev if AI is down? 
    // Let's stick to fail closed for security.
    process.exit(1);
  }
}

main();
```

pack/workflows/ci-pr-review.md
```
# CI PR Review

You are a senior engineer performing a critical PR review. Your goal is to identify bugs, security flaws, or major architectural regressions.

## Criteria for FAIL:
- **Critical Bugs**: Logic errors that will lead to crashes or incorrect data.
- **Security Vulnerabilities**: Injection flaws, insecure storage, or broken access control.
- **Performance Regressions**: Obvious O(n^2) logic on hot paths or resource leaks.
- **Missing Tests**: New complex logic added without corresponding unit tests.

## Criteria for PASS:
- Code is well-structured, follows best practices, and includes sufficient tests.
- Minor stylistic issues should be noted but do NOT constitute a FAIL.

## Instructions:
- Provide a clear, structured review.
- Start with a summary of changes.
- Use a bulleted list for specific findings.
- You MUST conclude with a verdict in bold: **PASS** or **FAIL**.

## PR Diff:
{{diff}}

## Verdict:
(Provide your reasoning here and end with **PASS** or **FAIL**)
```

pack/workflows/lint-fix.md
```
# AI Lint Fixer

You are an expert developer specializing in code quality. Your goal is to fix the provided lint errors in the given file context.

## Instructions:
- Analyze the error log and the file content.
- Generate a patch to fix ONLY the reported errors.
- You MUST provide the fix in a strict **SEARCH/REPLACE** block format for each change.

## Format:
<<<<SEARCH
(exact original code)
====
(fixed code)
>>>>REPLACE

## Error Log:
{{errorLog}}

## File Context ({{filePath}}):
{{fileContent}}

## Fixed Patches:
(Provide SEARCH/REPLACE blocks)
```

pack/workflows/pre-commit-review.md
```
# Pre-commit Risk Review

You are a senior security and stability auditor. Your goal is to analyze the provided staged git diff and determine if it contains high-risk changes that should be blocked before commit.

## Categories of High-Risk Changes:
1. **Hardcoded Secrets**: API keys, passwords, private keys, or credentials.
2. **Massive Deletions**: Unintentional or dangerous removal of critical logic or documentation.
3. **Complex Logic**: Highly complex changes without corresponding test updates.
4. **Breaking Changes**: Obvious regressions or breaking API changes without a major version intent.

## Instructions:
- Analyze the diff carefully.
- Be concise but specific in your reasoning.
- You MUST conclude with a verdict in bold: **ALLOW** or **BLOCK**.

## Git Diff:
{{diff}}

## Verdict:
(Provide your reasoning here and end with **ALLOW** or **BLOCK**)
```

bin/cline-pack.ts
```
#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { listWorkflows, getWorkflow } from '../src/manifest';
import { installPack } from '../src/install';
import { runHeadless, runInteractive } from '../src/cline';
import { renderPrompt } from '../src/render';
import path from 'path';

const program = new Command();

program
  .name('cline-pack')
  .description('Standardized daily software engineering workflows powered by Cline')
  .version('1.0.0');

program
  .command('list')
  .description('List available workflows')
  .action(() => {
    const workflows = listWorkflows();
    console.log('\n🚀 Available Workflows:');
    workflows.forEach(w => {
      console.log(`- ${w.id.padEnd(15)}: ${w.name} (${w.mode})`);
      console.log(`  ${w.description}`);
    });
    console.log('');
  });

program
  .command('install')
  .description('Install the workflow pack into the current repository')
  .option('-f, --force', 'Overwrite existing files', false)
  .action(async (options) => {
    console.log('📦 Installing Cline Workflow Pack...');
    try {
      await installPack(process.cwd(), { overwrite: options.force });
      console.log('✨ Installation complete!');
    } catch (error: any) {
      console.error(`💥 Installation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('run <id>')
  .description('Run a specific workflow')
  .option('-i, --interactive', 'Run in interactive mode', false)
  .action(async (id, options) => {
    const workflow = getWorkflow(id);
    if (!workflow) {
      console.error(`❌ Workflow not found: ${id}`);
      process.exit(1);
    }

    console.log(`🎬 Running workflow: ${workflow.name}...`);
    
    // For MVP, we'll assume the script runner logic handles the specifics.
    // However, the CLI can also directly trigger the headless mode if it's a simple prompt.
    // Most workflows in our pack have dedicated scripts in pack/scripts.
    // Let's just delegate to those scripts for now via tsx.
    
    const scriptPath = path.join(__dirname, '../pack/scripts', `${id}.ts`);
    const { spawn } = require('child_process');
    
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit'
    });

    child.on('close', (code: number) => {
      process.exit(code);
    });
  });

program.parse();
```

</source_code>