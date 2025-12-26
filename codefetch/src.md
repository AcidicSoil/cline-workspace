<source_code>
packages/cli/package.json
```
{
  "name": "@workflow-pack/cli",
  "version": "0.1.0",
  "bin": {
    "workflow-pack": "./dist/index.js"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "@workflow-pack/workflow": "workspace:*",
    "@workflow-pack/registry": "workspace:*",
    "@workflow-pack/runner": "workspace:*",
    "@workflow-pack/workflows": "workspace:*",
    "commander": "^11.0.0",
    "chalk": "^4.1.2",
    "ora": "^5.4.1",
    "cli-table3": "^0.6.3"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/cli/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" },
    { "path": "../workflow" },
    { "path": "../registry" },
    { "path": "../runner" },
    { "path": "../workflows" }
  ]
}
```

packages/foundation/package.json
```
{
  "name": "@workflow-pack/foundation",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

packages/foundation/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

packages/integrations/package.json
```
{
  "name": "@workflow-pack/integrations",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "execa": "^5.1.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/integrations/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" }
  ]
}
```

packages/mcp-server/package.json
```
{
  "name": "@workflow-pack/mcp-server",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "workflow-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@workflow-pack/foundation": "workspace:*",
    "@workflow-pack/workflow": "workspace:*",
    "@workflow-pack/registry": "workspace:*",
    "@workflow-pack/runner": "workspace:*",
    "@workflow-pack/workflows": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/mcp-server/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" },
    { "path": "../workflow" },
    { "path": "../registry" },
    { "path": "../runner" },
    { "path": "../workflows" }
  ]
}
```

packages/runner/package.json
```
{
  "name": "@workflow-pack/runner",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "@workflow-pack/workflow": "workspace:*",
    "safe-eval": "^0.4.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/runner/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" },
    { "path": "../workflow" }
  ]
}
```

packages/registry/package.json
```
{
  "name": "@workflow-pack/registry",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "@workflow-pack/workflow": "workspace:*",
    "fast-glob": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/registry/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" },
    { "path": "../workflow" }
  ]
}
```

packages/workflow/package.json
```
{
  "name": "@workflow-pack/workflow",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "zod": "^3.0.0",
    "js-yaml": "^4.1.0",
    "semver": "^7.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/js-yaml": "^4.0.0",
    "@types/semver": "^7.5.0"
  }
}
```

packages/workflow/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" }
  ]
}
```

packages/workflows/package.json
```
{
  "name": "@workflow-pack/workflows",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@workflow-pack/foundation": "workspace:*",
    "@workflow-pack/workflow": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

packages/workflows/tsconfig.json
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../foundation" },
    { "path": "../workflow" }
  ]
}
```

packages/cli/src/index.ts
```
#!/usr/bin/env node
import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { workflows as builtInWorkflows } from '@workflow-pack/workflows';
import { makeListCommand } from './commands/list';
import { makeRunCommand } from './commands/run';
import { Logger } from '@workflow-pack/foundation';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const logger = new Logger();
  const registry = new WorkflowRegistry(logger);

  // 1. Initialize registry with local workflows from .clinerules/workflows
  const localDir = path.join(process.cwd(), '.clinerules', 'workflows');
  const localDirs = [];
  try {
    await fs.access(localDir);
    localDirs.push(localDir);
  } catch {}

  await registry.initialize(localDirs, []);

  // 2. Register built-in workflows from the workflows package
  for (const wf of builtInWorkflows) {
    registry.registerWorkflow(wf, 'installed');
  }

  // 3. Setup CLI
  const program = new Command();
  program
    .name('workflow-pack')
    .description('A host-agnostic workflow execution tool')
    .version('0.1.0');

  program.addCommand(makeListCommand(registry));
  program.addCommand(makeRunCommand(registry));

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

packages/foundation/src/config.ts
```
export interface Config {
  jsonLogs?: boolean;
  verbose?: boolean;
  workdir?: string;
  env?: Record<string, string>;
  secrets?: string[]; // Keys to treat as secrets
}

// Strategy Question 7: Redaction logic
// We'll use a robust redaction strategy that checks for known secret keys AND patterns.

const DEFAULT_SECRET_KEYS = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'AUTH', 'CREDENTIALS'];

export function redactSensitive(obj: unknown, additionalSecrets: string[] = []): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, additionalSecrets));
  }

  const result: Record<string, unknown> = {};
  const secretKeys = [...DEFAULT_SECRET_KEYS, ...additionalSecrets].map(k => k.toUpperCase());

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const upperKey = key.toUpperCase();
    const isSecret = secretKeys.some(secret => upperKey.includes(secret));

    if (isSecret && typeof value === 'string') {
      result[key] = '********';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitive(value, additionalSecrets);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export async function loadConfig(overrides?: Partial<Config>): Promise<Config> {
  // 1. Defaults
  const defaults: Config = {
    jsonLogs: process.env.JSON_LOGS === 'true',
    verbose: false,
    workdir: process.cwd(),
    env: {},
    secrets: []
  };

  // 2. Load file (Mock implementation for now - normally would use cosmiconfig or fs)
  // const fileConfig = await loadFileConfig(); 
  const fileConfig = {}; 

  // 3. Env vars (Mapped manually or via pattern)
  const envConfig: Partial<Config> = {};
  if (process.env.WORKFLOW_VERBOSE) envConfig.verbose = process.env.WORKFLOW_VERBOSE === 'true';

  // 4. Overrides (CLI args)
  return {
    ...defaults,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
```

packages/foundation/src/errors.ts
```
export class PackError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends PackError {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR");
  }
}

export class PrereqMissingError extends PackError {
  constructor(public readonly toolName: string, public readonly fixHint: string) {
    super(`Missing prerequisite: ${toolName}. ${fixHint}`, "PREREQ_MISSING");
  }
}

export class ExecutionError extends PackError {
  constructor(message: string, public readonly exitCode: number, public readonly stepId?: string) {
    super(message, "EXECUTION_ERROR");
  }
}

// Strategy Question 12: Distinct codes for integrations
export class GitError extends ExecutionError {
  constructor(message: string) {
    super(message, 128); // Standard git error code often related to arguments or state
    this.name = "GitError";
  }
}

export class GhError extends ExecutionError {
  constructor(message: string) {
    super(message, 70); // EX_SOFTWARE or similar
    this.name = "GhError";
  }
}

export function getExitCode(error: unknown): number {
  if (error instanceof ExecutionError) {
    return error.exitCode;
  }
  if (error instanceof ValidationError) {
    return 2; // Usage/Data error
  }
  if (error instanceof PrereqMissingError) {
    return 69; // EX_UNAVAILABLE
  }
  if (error instanceof PackError) {
    return 1;
  }
  return 1; // Generic error
}
```

packages/foundation/src/index.ts
```
export * from './types';
export * from './errors';
export * from './config';
export * from './logging';
```

packages/foundation/src/logging.ts
```
import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  correlationId: string;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || randomUUID();
  }

  // Strategy Question 4: Ensure correlationId persists
  public getCorrelationId(): string {
    return this.correlationId;
  }

  public child(): Logger {
    return new Logger(this.correlationId);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (process.env.JSON_LOGS === 'true') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        correlationId: this.correlationId,
        message,
        context
      };
      console.log(JSON.stringify(entry));
    } else {
      const time = new Date().toISOString();
      const ctxStr = context ? JSON.stringify(context) : '';
      console.log(`[${time}] ${level.toUpperCase()} [${this.correlationId}]: ${message} ${ctxStr}`);
    }
  }

  public debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }
}
```

packages/foundation/src/types.ts
```
export enum HostKind {
  CLI = "CLI",
  MCP = "MCP",
  GEMINI_EXTENSION = "GEMINI_EXTENSION",
  LM_STUDIO = "LM_STUDIO"
}

export enum Severity {
  Info = "info",
  Warning = "warning",
  Error = "error"
}

export interface StepResult {
  stepId: string;
  status: "success" | "failure" | "skipped" | "cancelled";
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  artifacts?: string[];
  error?: Error;
}

export interface RunResult {
  runId: string;
  workflowId: string;
  status: "success" | "failure" | "cancelled";
  startedAt: Date;
  finishedAt?: Date;
  steps: StepResult[];
  artifacts: string[];
  warnings: string[];
}

export type StepType = "shell" | "ai" | "gate";

export interface BaseStep {
  id: string;
  name: string;
  type: StepType;
  if?: string; // Condition expression
  timeout?: number; // Milliseconds
}

export interface ShellStep extends BaseStep {
  type: "shell";
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  dryRun?: boolean; // Added based on Strategy Question 13
}

export interface AiStep extends BaseStep {
  type: "ai";
  prompt: string;
  model?: string;
  contextFiles?: string[];
  outputSchema?: Record<string, unknown>; // JSON Schema
}

export interface GateStep extends BaseStep {
  type: "gate";
  message: string;
  autoApprove?: boolean;
  requiredApprovals?: number; // Added based on Strategy Question 15
}

export type Step = ShellStep | AiStep | GateStep;

export interface Workflow {
  id: string;
  name: string;
  version: string;
  description?: string;
  params?: Record<string, { type: string; description?: string; default?: unknown }>;
  steps: Step[];
  outputs?: Record<string, string>;
}
```

packages/foundation/tests/foundation.test.ts
```
import { redactSensitive } from '../src/config';
import { Logger } from '../src/logging';
import { getExitCode, ValidationError, PrereqMissingError } from '../src/errors';

describe('Foundation Layer', () => {
  describe('Config Redaction', () => {
    it('should redact sensitive keys', () => {
      const config = {
        api_key: 'secret123',
        database_password: 'pass',
        normal_key: 'public'
      };
      const redacted: any = redactSensitive(config);
      expect(redacted.api_key).toBe('********');
      expect(redacted.database_password).toBe('********');
      expect(redacted.normal_key).toBe('public');
    });

    it('should redact custom secret keys', () => {
      const config = { my_token: 'abc' };
      const redacted: any = redactSensitive(config, ['MY_TOKEN']);
      expect(redacted.my_token).toBe('********');
    });
  });

  describe('Logging', () => {
    it('should maintain correlationId across child loggers', () => {
      const logger = new Logger();
      const child = logger.child();
      expect(child.getCorrelationId()).toBe(logger.getCorrelationId());
    });
  });

  describe('Errors', () => {
    it('should map errors to correct exit codes', () => {
      expect(getExitCode(new ValidationError('fail'))).toBe(2);
      expect(getExitCode(new PrereqMissingError('tool', 'hint'))).toBe(69);
      expect(getExitCode(new Error('unknown'))).toBe(1);
    });
  });
});
```

packages/integrations/src/git.ts
```
import execa from 'execa';
import { GitError } from '@workflow-pack/foundation';

export class Git {
  constructor(private cwd: string = process.cwd()) {}

  private async exec(args: string[]): Promise<string> {
    try {
      // Q5: Handle interactive prompts by ignoring stdin or setting specific env vars
      // We set GPG_TTY to empty to force non-interactive mode if possible, or just rely on stdio ignore
      const { stdout } = await execa('git', args, {
        cwd: this.cwd,
        env: { ...process.env, GPG_TTY: '' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      return stdout;
    } catch (error: any) {
      throw new GitError(error.message);
    }
  }

  async diff(target: string = 'HEAD'): Promise<string> {
    return this.exec(['diff', target]);
  }

  async status(): Promise<string> {
    return this.exec(['status', '--porcelain']);
  }

  async statusRaw(): Promise<string> {
    return this.exec(['status']);
  }

  async show(target: string): Promise<string> {
    return this.exec(['show', target]);
  }
}
```

packages/integrations/src/github.ts
```
import execa from 'execa';
import { GhError, PrereqMissingError } from '@workflow-pack/foundation';

export class GitHub {
  constructor(private cwd: string = process.cwd()) {}

  private async checkBinary() {
    try {
      await execa('gh', ['--version']);
    } catch {
      throw new PrereqMissingError('gh', 'Please install GitHub CLI.');
    }
  }

  private async exec(args: string[]): Promise<any> {
    await this.checkBinary();
    try {
      const { stdout } = await execa('gh', args, {
        cwd: this.cwd
      });
      try {
        return JSON.parse(stdout);
      } catch {
        return stdout;
      }
    } catch (error: any) {
      throw new GhError(error.message);
    }
  }

  async getPr(prId: string) {
    return this.exec(['pr', 'view', prId, '--json', 'title,body,number,state,url']);
  }

  async listPrs() {
    return this.exec(['pr', 'list', '--json', 'title,body,number,state,url']);
  }
  
  async diff(prId: string) {
      return this.exec(['pr', 'diff', prId]);
  }
}
```

packages/integrations/src/index.ts
```
export * from './git';
export * from './github';
export * from './test-runner';
export * from './linter';
```

packages/integrations/src/linter.ts
```
import execa from 'execa';

export class Linter {
  constructor(private cwd: string = process.cwd()) {}

  async run(checkCommand: string, fixCommand?: string): Promise<{ fixed: boolean; output: string }> {
    let fixed = false;
    let output = '';

    if (fixCommand) {
      try {
        const result = await execa.command(fixCommand, { cwd: this.cwd });
        output += result.stdout;
        fixed = true;
      } catch (e: any) {
        output += e.stdout || e.message;
      }
    }

    try {
      const result = await execa.command(checkCommand, { cwd: this.cwd });
      output += result.stdout;
      return { fixed, output };
    } catch (e: any) {
      output += e.stdout || e.message;
      throw new Error(`Lint check failed:
${output}`);
    }
  }
}
```

packages/integrations/src/test-runner.ts
```
import execa from 'execa';
import { ExecutionError } from '@workflow-pack/foundation'

export class TestRunner {
  constructor(private cwd: string = process.cwd()) {}

  async run(command: string): Promise<{ success: boolean; output: string; failures: string[] }> {
    try {
      const { stdout } = await execa.command(command, { cwd: this.cwd });
      return { success: true, output: stdout, failures: [] };
    } catch (error: any) {
      const output = error.stdout || error.stderr || error.message;
      const failures = this.parseFailures(output);
      return { success: false, output, failures };
    }
  }

  private parseFailures(output: string): string[] {
    // Simple parsing logic: match lines starting with "FAIL" or "Error:"
    const lines = output.split('\n');
    return lines.filter(line => 
      line.includes('FAIL') || 
      line.includes('Error:') || 
      line.includes('failed')
    ).map(l => l.trim());
  }
}
```

packages/integrations/tests/integrations.test.ts
```
import { Git } from '../src/git';
import { GitHub } from '../src/github';
import { TestRunner } from '../src/test-runner';
import { Linter } from '../src/linter';
import { GitError, GhError, PrereqMissingError } from '@workflow-pack/foundation'
import execa from 'execa';

jest.mock('execa');

describe('Integrations', () => {
  describe('Git', () => {
    it('should run status', async () => {
      (execa as any).mockResolvedValue({ stdout: 'M file.ts' });
      const git = new Git();
      const status = await git.status();
      expect(status).toBe('M file.ts');
    });

    it('should throw GitError', async () => {
      (execa as any).mockRejectedValue(new Error('fatal: not a git repository'));
      const git = new Git();
      await expect(git.status()).rejects.toThrow(GitError);
    });
  });

  describe('GitHub', () => {
    it('should list PRs', async () => {
      // Mocking execa for the sequence of calls
      // 1. checkBinary (execa('gh', ['--version']))
      // 2. listPrs (execa('gh', ['pr', 'list', ...]))
      
      // execa is mocked as a function (default export)
      (execa as unknown as jest.Mock)
        .mockResolvedValueOnce({ stdout: 'gh version 2.0.0' }) // for checkBinary
        .mockResolvedValueOnce({ stdout: '[{"number":1, "title": "test"}]' }); // for listPrs

      const gh = new GitHub();
      const prs = await gh.listPrs();
      expect(prs[0].number).toBe(1);
    });

    it('should fail if binary missing', async () => {
      (execa as unknown as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      const gh = new GitHub();
      await expect(gh.listPrs()).rejects.toThrow(PrereqMissingError);
    });
  });

  describe('TestRunner', () => {
    it('should parse failures', async () => {
      // execa.command is a separate function property
      (execa.command as jest.Mock).mockRejectedValue({ stdout: 'FAIL test.ts\nError: something broke' });
      const runner = new TestRunner();
      const result = await runner.run('npm test');
      expect(result.success).toBe(false);
      expect(result.failures).toContain('FAIL test.ts');
    });
  });

  describe('Linter', () => {
    it('should attempt fix', async () => {
      (execa.command as jest.Mock).mockResolvedValue({ stdout: 'fixed' });
      const linter = new Linter();
      const result = await linter.run('lint', 'lint --fix');
      expect(result.fixed).toBe(true);
    });
  });
});
```

packages/runner/src/context.ts
```
import { Logger } from '@workflow-pack/foundation';
import { redactSensitive } from '@workflow-pack/foundation';

export interface ContextData {
  vars: Record<string, any>;
  outputs: Record<string, any>;
  env: Record<string, string>;
  secrets: string[];
}

export class ExecutionContext {
  private vars: Record<string, any> = {};
  private outputs: Record<string, any> = {};
  private secrets: string[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly env: Record<string, string> = {},
    initialVars: Record<string, any> = {},
    secrets: string[] = []
  ) {
    this.vars = { ...initialVars };
    this.secrets = [...secrets];
  }

  // Q3: Host hooks isolation - methods to run hooks shouldn't expose 'this' directly or allow overwrite
  // For now, we just expose safe accessors

  public get(key: string): any {
    return this.vars[key] ?? this.outputs[key] ?? this.env[key];
  }

  public setVar(key: string, value: any) {
    this.vars[key] = value;
  }

  public setOutput(stepId: string, output: any) {
    this.outputs[stepId] = output;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getSnapshot(): ContextData {
    return {
      vars: { ...this.vars },
      outputs: { ...this.outputs },
      env: { ...this.env }, // Should be careful with env serialization if it's huge
      secrets: [...this.secrets]
    };
  }

  // Q14: Serialization for resumability
  public serialize(): string {
    const snapshot = this.getSnapshot();
    // Redact sensitive data before serialization? 
    // Usually state file should be encrypted or secure. 
    // For now we serialize as is, assuming secure storage.
    return JSON.stringify(snapshot);
  }

  public static deserialize(json: string, logger: Logger): ExecutionContext {
    const data: ContextData = JSON.parse(json);
    const ctx = new ExecutionContext(logger, data.env, data.vars, data.secrets);
    ctx.outputs = data.outputs;
    return ctx;
  }
}

export function buildContext(
  params: Record<string, any>, 
  env: Record<string, string>, 
  logger: Logger,
  secrets: string[] = []
): ExecutionContext {
  return new ExecutionContext(logger, env, params, secrets);
}
```

packages/runner/src/declarations.d.ts
```
declare module 'safe-eval' {
  export default function safeEval(code: string, context?: object, options?: object): any;
}
```

packages/runner/src/engine.ts
```
import { WorkflowDefinition, Step } from '@workflow-pack/workflow';
import { RunResult, StepResult } from '@workflow-pack/foundation';
import { ExecutionContext } from './context';
import { StepRunner, RunnerOptions } from './types';
import safeEval from 'safe-eval';
import { randomUUID } from 'crypto';

export class WorkflowEngine {
  private stepRunners: Map<string, StepRunner> = new Map();

  constructor(private context: ExecutionContext, private options: RunnerOptions = {}) {}

  public registerStepRunner(type: string, runner: StepRunner) {
    this.stepRunners.set(type, runner);
  }

  public async run(workflow: WorkflowDefinition): Promise<RunResult> {
    const runId = randomUUID();
    const results: StepResult[] = [];
    const startTime = new Date();

    this.context.getLogger().info(`Starting workflow run ${runId}`);

    try {
      for (const step of workflow.steps) {
        // 1. Check Condition
        if (step.if) {
          const shouldRun = this.evaluateCondition(step.if);
          if (!shouldRun) {
            results.push({
              stepId: step.id,
              status: 'skipped'
            });
            continue;
          }
        }

        // 2. Resolve Runner
        const runner = this.stepRunners.get(step.type);
        if (!runner) {
          throw new Error(`No runner registered for step type: ${step.type}`);
        }

        // 3. Execute with Timeout (Q6)
        try {
          const result = await this.executeStepWithTimeout(runner, step);
          results.push(result);
          this.context.setOutput(step.id, result.stdout || result.artifacts); // Simple output mapping

          if (result.status === 'failure') {
            if (this.options.stopOnFailure !== false) { // Default true
               this.context.getLogger().error(`Step ${step.id} failed. Stopping execution.`);
               break;
            }
          }
        } catch (error: any) {
             results.push({
              stepId: step.id,
              status: 'failure',
              error
            });
            if (this.options.stopOnFailure !== false) {
               break;
            }
        }
      }

      const hasFailure = results.some(r => r.status === 'failure');
      
      return {
        runId,
        workflowId: workflow.id,
        status: hasFailure ? 'failure' : 'success',
        startedAt: startTime,
        finishedAt: new Date(),
        steps: results,
        artifacts: [], // TODO: Collect artifacts
        warnings: []
      };

    } catch (error: any) {
      // Catastrophic failure
      return {
        runId,
        workflowId: workflow.id,
        status: 'failure',
        startedAt: startTime,
        finishedAt: new Date(),
        steps: results, // Q6: Return partial results
        artifacts: [],
        warnings: [error.message]
      };
    }
  }

  private evaluateCondition(expression: string): boolean {
    try {
      const snapshot = this.context.getSnapshot();
      // Expose vars, outputs, env directly to eval scope
      const scope = {
        vars: snapshot.vars,
        outputs: snapshot.outputs,
        env: snapshot.env
      };
      return !!safeEval(expression, scope);
    } catch (e) {
      this.context.getLogger().warn(`Failed to evaluate condition '${expression}': ${(e as Error).message}`);
      return false; // Fail safe
    }
  }

  private async executeStepWithTimeout(runner: StepRunner, step: Step): Promise<StepResult> {
    const timeoutMs = step.timeout ?? 60000; // Default 1 min
    
    // Q6: Timeout logic
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<StepResult>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Step ${step.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        runner.execute(step, this.context),
        timeoutPromise
      ]);
      clearTimeout(timer!);
      return result;
    } catch (error) {
      clearTimeout(timer!);
      throw error;
    }
  }
}
```

packages/runner/src/formatting.ts
```
import { RunResult } from '@workflow-pack/foundation';

export function formatJson(result: RunResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatHuman(result: RunResult): string {
  let output = `Workflow: ${result.workflowId} [${result.runId}]\n`;
  output += `Status: ${result.status.toUpperCase()}\n`;
  output += `Duration: ${result.finishedAt!.getTime() - result.startedAt.getTime()}ms\n\n`;

  output += 'Steps:\n';
  for (const step of result.steps) {
    const symbol = step.status === 'success' ? '✅' : step.status === 'failure' ? '❌' : '⏭️';
    output += `${symbol} ${step.stepId}: ${step.status.toUpperCase()}\n`;
    if (step.error) {
      output += `   Error: ${step.error.message}\n`;
    }
    if (step.stdout) {
      output += `   Stdout: ${step.stdout.slice(0, 100).replace(/\n/g, ' ')}...\n`;
    }
  }

  return output;
}
```

packages/runner/src/index.ts
```
export * from './context';
export * from './types';
export * from './engine';
export * from './formatting';
export * from './steps/shell';
export * from './steps/ai';
export * from './steps/gate';
```

packages/runner/src/types.ts
```
import { Step, StepResult } from '@workflow-pack/foundation'
import { ExecutionContext } from './context';

export interface StepRunner {
  canHandle(step: Step): boolean;
  execute(step: Step, context: ExecutionContext): Promise<StepResult>;
}

export interface RunnerOptions {
  stopOnFailure?: boolean;
  dryRun?: boolean;
}
```

packages/runner/tests/engine.test.ts
```
import { WorkflowEngine } from '../src/engine';
import { ExecutionContext } from '../src/context';
import { Logger } from '@workflow-pack/foundation'
import { StepRunner } from '../src/types';
import { WorkflowDefinition } from '@workflow-pack/workflow'

describe('WorkflowEngine', () => {
  let context: ExecutionContext;
  let engine: WorkflowEngine;
  let mockRunner: StepRunner;

  beforeEach(() => {
    context = new ExecutionContext(new Logger());
    engine = new WorkflowEngine(context, { stopOnFailure: true });
    
    mockRunner = {
      canHandle: () => true,
      execute: jest.fn().mockResolvedValue({ stepId: 'test', status: 'success' })
    };
    engine.registerStepRunner('shell', mockRunner);
  });

  it('should execute a simple workflow', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [{ id: 'step1', name: 'Step 1', type: 'shell', command: 'echo' }]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('success');
    expect(mockRunner.execute).toHaveBeenCalledTimes(1);
  });

  it('should stop on failure', async () => {
    (mockRunner.execute as jest.Mock).mockResolvedValueOnce({ stepId: 'step1', status: 'failure' });
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'fail' },
        { id: 'step2', name: 'Step 2', type: 'shell', command: 'skip me' }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('failure');
    expect(mockRunner.execute).toHaveBeenCalledTimes(1); // Should not run step 2
  });

  it('should skip steps based on condition', async () => {
    context.setVar('SKIP', true);
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'echo', if: '!vars.SKIP' }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.steps[0].status).toBe('skipped');
    expect(mockRunner.execute).not.toHaveBeenCalled();
  });

  it('should handle timeouts and return partial results (Q6)', async () => {
    (mockRunner.execute as jest.Mock).mockImplementation(() => new Promise(r => setTimeout(r, 100)));
    
    const workflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      steps: [
        { id: 'step1', name: 'Step 1', type: 'shell', command: 'echo', timeout: 10 }
      ]
    };

    const result = await engine.run(workflow);
    expect(result.status).toBe('failure'); // Catastrophic failure due to throw
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].status).toBe('failure');
    expect(result.steps[0].error?.message).toContain('timed out');
  });
});
```

packages/runner/tests/steps.test.ts
```
import { ShellStepRunner } from '../src/steps/shell';
import { AiStepRunner } from '../src/steps/ai';
import { GateStepRunner } from '../src/steps/gate';
import { ExecutionContext } from '../src/context';
import { Logger } from '@workflow-pack/foundation'
import { HostKind } from '@workflow-pack/foundation'

describe('Concrete Step Runners', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = new ExecutionContext(new Logger());
  });

  describe('ShellStepRunner', () => {
    it('should capture output', async () => {
      const runner = new ShellStepRunner();
      const result = await runner.execute({
        id: '1', name: 'echo', type: 'shell', command: 'echo "hello world"'
      }, context);
      
      expect(result.status).toBe('success');
      expect(result.stdout).toContain('hello world');
    });

    it('should respect dryRun', async () => {
      const runner = new ShellStepRunner();
      const result = await runner.execute({
        id: '1', name: 'rm', type: 'shell', command: 'rm -rf /', dryRun: true
      }, context);
      
      expect(result.status).toBe('success');
      expect(result.stdout).toContain('[DRY-RUN]');
    });
  });

  describe('AiStepRunner', () => {
    it('should validate JSON output', async () => {
      const mockAdapter = {
        generate: jest.fn().mockResolvedValue('{"answer": 42}')
      };
      const runner = new AiStepRunner(mockAdapter);
      
      const result = await runner.execute({
        id: '1', name: 'ai', type: 'ai', prompt: 'calc', outputSchema: {}
      }, context);

      expect(result.status).toBe('success');
    });

    it('should fail on malformed JSON', async () => {
      const mockAdapter = {
        generate: jest.fn().mockResolvedValue('not json')
      };
      const runner = new AiStepRunner(mockAdapter);
      
      const result = await runner.execute({
        id: '1', name: 'ai', type: 'ai', prompt: 'calc', outputSchema: {}
      }, context);

      expect(result.status).toBe('failure');
    });
  });

  describe('GateStepRunner', () => {
    it('should auto-approve', async () => {
      const runner = new GateStepRunner();
      const result = await runner.execute({
        id: '1', name: 'gate', type: 'gate', message: 'ok?', autoApprove: true
      }, context);
      
      expect(result.status).toBe('success');
    });

    it('should fail in headless mode without autoApprove', async () => {
      const runner = new GateStepRunner(HostKind.MCP);
      const result = await runner.execute({
        id: '1', name: 'gate', type: 'gate', message: 'ok?'
      }, context);
      
      expect(result.status).toBe('failure');
    });
  });
});
```

packages/registry/src/discovery.ts
```
import fg from 'fast-glob';
import fs from 'fs/promises';
import { parseWorkflow } from '@workflow-pack/workflow';
import { WorkflowDefinition } from '@workflow-pack/workflow';
import { Logger } from '@workflow-pack/foundation';

// Step 2: Discovery Implementation
// Scans for .yml/.json workflow files

export interface DiscoveredWorkflow {
  definition: WorkflowDefinition;
  path: string;
  source: 'local' | 'installed';
}

export async function scanForWorkflows(
  directories: string[], 
  source: 'local' | 'installed',
  logger?: Logger
): Promise<DiscoveredWorkflow[]> {
  const workflows: DiscoveredWorkflow[] = [];

  for (const dir of directories) {
    try {
      // Find all .yaml, .yml, .json files recursively
      const entries = await fg(['**/*.{yaml,yml,json}'], { 
        cwd: dir, 
        absolute: true,
        deep: 5 // Limit depth to prevent performance issues
      });

      for (const entry of entries) {
        try {
          const content = await fs.readFile(entry, 'utf-8');
          const ext = entry.endsWith('.json') ? 'json' : 'yaml';
          
          const definition = parseWorkflow(content, ext);
          workflows.push({ definition, path: entry, source });
        } catch (error: any) {
          // Log warning but don't crash
          if (logger) {
            logger.warn(`Failed to parse workflow at ${entry}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
       if (logger) {
        logger.warn(`Failed to scan directory ${dir}: ${error.message}`);
      }
    }
  }

  return workflows;
}
```

packages/registry/src/index.ts
```
export * from './discovery';
export * from './registry';
```

packages/registry/src/registry.ts
```
import { DiscoveredWorkflow, scanForWorkflows } from './discovery';
import { WorkflowDefinition } from '@workflow-pack/workflow';
import { PackError } from '@workflow-pack/foundation';
import { Logger } from '@workflow-pack/foundation';

export class RegistryError extends PackError {
  constructor(message: string) {
    super(message, "REGISTRY_ERROR");
  }
}

export class WorkflowRegistry {
  private workflows: Map<string, DiscoveredWorkflow> = new Map();

  constructor(private logger?: Logger) {}

  public async initialize(localDirs: string[] = [], installedDirs: string[] = []) {
    const local = await scanForWorkflows(localDirs, 'local', this.logger);
    const installed = await scanForWorkflows(installedDirs, 'installed', this.logger);

    this.resolveWorkflows([...local, ...installed]);
  }

  /**
   * Manually register a workflow object
   */
  public registerWorkflow(definition: WorkflowDefinition, source: 'local' | 'installed' = 'installed') {
    this.resolveWorkflows([{
      definition,
      path: 'memory://' + definition.id,
      source
    }]);
  }

  // Q2: Resolution logic - ID collision handling
  private resolveWorkflows(candidates: DiscoveredWorkflow[]) {
    for (const candidate of candidates) {
      const id = candidate.definition.id;
      const existing = this.workflows.get(id);

      if (!existing) {
        this.workflows.set(id, candidate);
        continue;
      }

      // Conflict resolution
      if (existing.source === 'local' && candidate.source === 'installed') {
        // Keep local (override)
        continue;
      } else if (existing.source === 'installed' && candidate.source === 'local') {
        // Replace installed with local
        this.workflows.set(id, candidate);
      } else if (existing.source === candidate.source) {
         // Collision in same source type
         if (existing.path !== candidate.path) {
            this.logger?.warn(`Duplicate workflow ID '${id}' found in ${existing.path} and ${candidate.path}. Keeping the first one.`);
         }
      }
    }
  }

  public getWorkflow(id: string): WorkflowDefinition {
    const wf = this.workflows.get(id);
    if (!wf) {
      throw new RegistryError(`Workflow not found: ${id}`);
    }
    return wf.definition;
  }

  // Q17: Support hiding workflows
  public listWorkflows(includeHidden = false): WorkflowDefinition[] {
    const list = Array.from(this.workflows.values())
      .map(w => w.definition)
      .filter(w => includeHidden || !(w as any).hidden);

    // Deterministic sort
    return list.sort((a, b) => a.id.localeCompare(b.id));
  }

  public searchWorkflows(query: string): WorkflowDefinition[] {
    const q = query.toLowerCase();
    return this.listWorkflows(true).filter(w => 
      w.id.toLowerCase().includes(q) || 
      w.name.toLowerCase().includes(q) || 
      w.description?.toLowerCase().includes(q)
    );
  }
}
```

packages/registry/tests/registry.test.ts
```
import { WorkflowRegistry } from '../src/registry';
import * as discovery from '../src/discovery';
import { WorkflowDefinition } from '@workflow-pack/workflow'

// Mocking the whole module is tricky with TS jest sometimes, let's use spyOn approach or manual mock if needed.
// But jest.mock should work if paths are correct.
jest.mock('../src/discovery');

const mockWorkflow = (id: string, name: string): WorkflowDefinition => ({
  id,
  name,
  version: '1.0.0',
  steps: []
});

describe('WorkflowRegistry', () => {
  let registry: WorkflowRegistry;

  beforeEach(() => {
    registry = new WorkflowRegistry();
    jest.clearAllMocks();
  });

  it('should resolve local workflows over installed ones', async () => {
    (discovery.scanForWorkflows as jest.Mock).mockImplementation((dirs, source) => {
      if (source === 'local') {
        return Promise.resolve([{
          definition: mockWorkflow('test-wf', 'Local Version'),
          path: '/local/test.yml',
          source: 'local'
        }]);
      } else {
        return Promise.resolve([{
          definition: mockWorkflow('test-wf', 'Installed Version'),
          path: '/installed/test.yml',
          source: 'installed'
        }]);
      }
    });

    await registry.initialize(['local'], ['installed']);
    const wf = registry.getWorkflow('test-wf');
    expect(wf.name).toBe('Local Version');
  });

  it('should list workflows deterministically', async () => {
     (discovery.scanForWorkflows as jest.Mock).mockResolvedValue([
      { definition: mockWorkflow('b-wf', 'B'), path: '/b.yml', source: 'local' },
      { definition: mockWorkflow('a-wf', 'A'), path: '/a.yml', source: 'local' }
    ]);

    await registry.initialize(['local']);
    const list = registry.listWorkflows();
    expect(list[0].id).toBe('a-wf');
    expect(list[1].id).toBe('b-wf');
  });

  it('should search workflows', async () => {
    (discovery.scanForWorkflows as jest.Mock).mockResolvedValue([
      { definition: mockWorkflow('find-me', 'Target'), path: '/t.yml', source: 'local' },
      { definition: mockWorkflow('ignore-me', 'Other'), path: '/o.yml', source: 'local' }
    ]);

    await registry.initialize(['local']);
    const results = registry.searchWorkflows('target');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('find-me');
  });
});
```

packages/workflow/src/index.ts
```
export * from './schema';
export * from './manifest';
export * from './parser';
```

packages/workflow/src/manifest.ts
```
import { z } from 'zod';
import semver from 'semver';
import { ValidationError } from '@workflow-pack/foundation';

// Step 3: Manifest Implementation
// Addressing Q8 (engines check)

export const PackManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  workflows: z.array(z.string()), // Paths to workflow files
  engines: z.object({
    host: z.string().optional(), // Semver range for the host CLI
  }).optional(),
});

export type PackManifest = z.infer<typeof PackManifestSchema>;

export function validateManifest(manifest: unknown, hostVersion: string): PackManifest {
  const result = PackManifestSchema.safeParse(manifest);
  
  if (!result.success) {
    throw new ValidationError(`Invalid manifest: ${result.error.message}`);
  }

  const data = result.data;

  // Q8: Enforce host version compatibility
  if (data.engines?.host) {
    if (!semver.satisfies(hostVersion, data.engines.host)) {
      throw new ValidationError(
        `Pack requires host version ${data.engines.host}, but current version is ${hostVersion}`
      );
    }
  }

  return data;
}
```

packages/workflow/src/parser.ts
```
import yaml from 'js-yaml';
import { WorkflowSchema, WorkflowDefinition } from './schema';
import { ValidationError } from '@workflow-pack/foundation';

// Step 4: Parser Implementation
// Validates JSON/YAML against schema with error reporting

export function parseWorkflow(content: string, format: 'yaml' | 'json' = 'yaml'): WorkflowDefinition {
  let parsed: unknown;

  try {
    if (format === 'json') {
      parsed = JSON.parse(content);
    } else {
      parsed = yaml.load(content);
    }
  } catch (error: any) {
    throw new ValidationError(`Failed to parse ${format.toUpperCase()}: ${error.message}`);
  }

  const result = WorkflowSchema.safeParse(parsed);

  if (!result.success) {
    // Format Zod errors to be human-readable
    const errorMessages = result.error.errors.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    }).join('\n');
    
    throw new ValidationError(`Workflow validation failed:\n${errorMessages}`);
  }

  // Q20: Could enforce strict workflow versioning here if needed
  // e.g., if (result.data.version !== '1.0') warn();

  return result.data;
}

export function validateWorkflow(obj: unknown): WorkflowDefinition {
  const result = WorkflowSchema.safeParse(obj);
  if (!result.success) {
    throw new ValidationError(`Invalid workflow object: ${result.error.message}`);
  }
  return result.data;
}
```

packages/workflow/src/schema.ts
```
import { z } from 'zod';
import { StepType, HostKind } from '@workflow-pack/foundation';

// Step 2: Schema Definition
// Addressing Q13 (dryRun) and Q18 (onFailure)

const BaseStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  if: z.string().optional(),
  timeout: z.number().optional(),
  onFailure: z.string().optional(), // Q18: Rollback/recovery step ID
});

export const ShellStepSchema = BaseStepSchema.extend({
  type: z.literal('shell'),
  command: z.string(),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  dryRun: z.boolean().optional(), // Q13: Safe preview support
});

export const AiStepSchema = BaseStepSchema.extend({
  type: z.literal('ai'),
  prompt: z.string(),
  model: z.string().optional(),
  contextFiles: z.array(z.string()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
});

export const GateStepSchema = BaseStepSchema.extend({
  type: z.literal('gate'),
  message: z.string(),
  autoApprove: z.boolean().optional(),
  requiredApprovals: z.number().optional(),
});

export const StepSchema = z.discriminatedUnion('type', [
  ShellStepSchema,
  AiStepSchema,
  GateStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;

export const ParamSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  default: z.unknown().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(), // Q20: Version checking will happen against this
  description: z.string().optional(),
  params: z.record(ParamSchema).optional(),
  steps: z.array(StepSchema),
  outputs: z.record(z.string()).optional(),
}).strict(); // Enforce no unknown fields

export type WorkflowDefinition = z.infer<typeof WorkflowSchema>;
```

packages/workflow/tests/workflow.test.ts
```
import { parseWorkflow } from '../src/parser';
import { validateManifest } from '../src/manifest';
import { ValidationError } from '@workflow-pack/foundation'

describe('Workflow Package', () => {
  describe('Schema Validation', () => {
    it('should validate a valid workflow', () => {
      const validYaml = `
id: test-workflow
name: Test
version: 1.0.0
steps:
  - id: step1
    name: Shell Step
    type: shell
    command: echo hello
    dryRun: true
    onFailure: step2
`;
      const workflow = parseWorkflow(validYaml, 'yaml');
      expect(workflow.id).toBe('test-workflow');
      expect(workflow.steps[0].type).toBe('shell');
      expect((workflow.steps[0] as any).dryRun).toBe(true);
      expect(workflow.steps[0].onFailure).toBe('step2');
    });

    it('should reject invalid step types', () => {
      const invalidYaml = `
id: test-workflow
name: Test
version: 1.0.0
steps:
  - id: step1
    name: Bad Step
    type: unknown
`;
      expect(() => parseWorkflow(invalidYaml, 'yaml')).toThrow(ValidationError);
    });
  });

  describe('Manifest Validation', () => {
    it('should validate a compatible host version', () => {
      const manifest = {
        name: 'test-pack',
        version: '1.0.0',
        workflows: [],
        engines: { host: '>=1.0.0' }
      };
      expect(() => validateManifest(manifest, '1.2.0')).not.toThrow();
    });

    it('should reject an incompatible host version', () => {
      const manifest = {
        name: 'test-pack',
        version: '1.0.0',
        workflows: [],
        engines: { host: '>=2.0.0' }
      };
      expect(() => validateManifest(manifest, '1.5.0')).toThrow(ValidationError);
    });
  });
});
```

packages/workflows/src/index.ts
```
import { PrReviewWorkflow } from './pr-review';
import { LintSweepWorkflow } from './lint-sweep';

export const workflows = [
  PrReviewWorkflow,
  LintSweepWorkflow
];
```

packages/workflows/src/lint-sweep.ts
```
import { WorkflowDefinition } from '@workflow-pack/workflow';

export const LintSweepWorkflow: WorkflowDefinition = {
  id: 'lint-sweep',
  name: 'Lint Sweep',
  version: '1.0.0',
  description: 'Run linters, apply fixes, and summarize changes',
  steps: [
    {
      id: 'lint-check',
      name: 'Check Lint',
      type: 'shell',
      command: 'npm run lint',
      onFailure: 'lint-fix' // If check fails, try fix
    },
    {
      id: 'lint-fix',
      name: 'Apply Fixes',
      type: 'shell',
      command: 'npm run lint -- --fix',
      if: 'steps["lint-check"].status === "failure"' // Conditional execution
    },
    {
      id: 'verify-tests',
      name: 'Verify Tests',
      type: 'shell',
      command: 'npm test'
    },
    {
      id: 'summarize',
      name: 'Summarize Changes',
      type: 'ai',
      prompt: 'Summarize the linting fixes applied.',
      if: 'steps["lint-fix"].status === "success"'
    }
  ]
};
```

packages/workflows/src/pr-review.ts
```
import { WorkflowDefinition } from '@workflow-pack/workflow';

export const PrReviewWorkflow: WorkflowDefinition = {
  id: 'pr-review',
  name: 'PR Review',
  version: '1.0.0',
  description: 'Analyze a PR diff and generate a review',
  params: {
    prNumber: { type: 'string', description: 'PR number to review' }
  },
  steps: [
    {
      id: 'fetch-pr',
      name: 'Fetch PR Data',
      type: 'shell',
      command: 'gh pr view ${vars.prNumber} --json title,body,headRefName,baseRefName > pr_data.json'
    },
    {
      id: 'fetch-diff',
      name: 'Fetch Diff',
      type: 'shell',
      command: 'gh pr diff ${vars.prNumber} > pr.diff'
    },
    {
      id: 'analyze',
      name: 'AI Analysis',
      type: 'ai',
      prompt: 'Analyze this PR diff and metadata. Identify risks, bugs, and style issues.',
      contextFiles: ['pr_data.json', 'pr.diff'],
      outputSchema: {
        riskLevel: 'high|medium|low',
        summary: 'string',
        issues: 'array'
      }
    },
    {
      id: 'approve-submit',
      name: 'Approve Submission',
      type: 'gate',
      message: 'Review the AI analysis. Submit to GitHub?'
    },
    {
      id: 'submit-review',
      name: 'Submit Review',
      type: 'shell',
      command: 'gh pr review ${vars.prNumber} --comment "${outputs.analyze.summary}"'
    }
  ]
};
```

packages/workflows/tests/workflows.test.ts
```
import { WorkflowEngine } from '@workflow-pack/runner'
import { ExecutionContext } from '@workflow-pack/runner'
import { Logger } from '@workflow-pack/foundation'
import { PrReviewWorkflow } from '../src/pr-review';
import { LintSweepWorkflow } from '../src/lint-sweep';

describe('Workflow Catalog Integration', () => {
  let logger: Logger;
  let context: ExecutionContext;
  let engine: WorkflowEngine;

  beforeEach(() => {
    logger = new Logger();
    context = new ExecutionContext(logger);
    engine = new WorkflowEngine(context, { stopOnFailure: true });
  });

  it('should validate pr-review workflow structure', () => {
    expect(PrReviewWorkflow.id).toBe('pr-review');
    expect(PrReviewWorkflow.steps.length).toBeGreaterThan(0);
  });

  it('should validate lint-sweep workflow structure', () => {
    expect(LintSweepWorkflow.id).toBe('lint-sweep');
    expect(LintSweepWorkflow.steps.length).toBeGreaterThan(0);
  });

  it('should simulate pr-review execution with mock runners', async () => {
    const mockShellRunner = {
      canHandle: (s: any) => s.type === 'shell',
      execute: jest.fn().mockResolvedValue({ status: 'success', stdout: 'mock output' })
    };
    const mockAiRunner = {
      canHandle: (s: any) => s.type === 'ai',
      execute: jest.fn().mockResolvedValue({ status: 'success', stdout: '{"summary": "looks good"}' })
    };
    const mockGateRunner = {
      canHandle: (s: any) => s.type === 'gate',
      execute: jest.fn().mockResolvedValue({ status: 'success' })
    };

    engine.registerStepRunner('shell', mockShellRunner as any);
    engine.registerStepRunner('ai', mockAiRunner as any);
    engine.registerStepRunner('gate', mockGateRunner as any);

    const result = await engine.run(PrReviewWorkflow);
    expect(result.status).toBe('success');
    expect(mockShellRunner.execute).toHaveBeenCalled();
    expect(mockAiRunner.execute).toHaveBeenCalled();
    expect(mockGateRunner.execute).toHaveBeenCalled();
  });
});
```

packages/cli/src/commands/list.ts
```
import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import Table from 'cli-table3';
import chalk from 'chalk';

export function makeListCommand(registry: WorkflowRegistry) {
  return new Command('list')
    .description('List available workflows')
    .option('--json', 'Output results as JSON')
    .action(async (options) => {
      const workflows = registry.listWorkflows();

      if (options.json) {
        console.log(JSON.stringify(workflows, null, 2));
        return;
      }

      if (workflows.length === 0) {
        console.log(chalk.yellow('No workflows found.'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Version'), chalk.cyan('Description')],
        colWidths: [20, 25, 10, 40]
      });

      for (const wf of workflows) {
        table.push([wf.id, wf.name, wf.version, wf.description || '']);
      }

      console.log(table.toString());
    });
}
```

packages/cli/src/commands/run.ts
```
import { Command } from 'commander';
import { WorkflowRegistry } from '@workflow-pack/registry';
import { WorkflowEngine, ExecutionContext, ShellStepRunner, GateStepRunner, AiStepRunner, formatHuman, formatJson } from '@workflow-pack/runner';
import { Logger } from '@workflow-pack/foundation';
import chalk from 'chalk';
import ora from 'ora';

export function makeRunCommand(registry: WorkflowRegistry) {
  return new Command('run')
    .description('Run a specific workflow')
    .argument('<id>', 'Workflow ID')
    .option('--json', 'Output results as JSON')
    .option('--dry-run', 'Run without executing side effects')
    .allowUnknownOption() // Important for dynamic params (Q9)
    .action(async (id, options, command) => {
      try {
        const workflow = registry.getWorkflow(id);
        const logger = new Logger();
        
        // Q9: Dynamic param parsing
        const params: Record<string, any> = {};
        const rawArgs = command.parent?.rawArgs || [];
        const runIndex = rawArgs.indexOf('run');
        const workflowArgs = rawArgs.slice(runIndex + 2); // after 'run' and '<id>'

        for (let i = 0; i < workflowArgs.length; i++) {
          if (workflowArgs[i].startsWith('--')) {
            const key = workflowArgs[i].slice(2);
            const nextArg = workflowArgs[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
              params[key] = nextArg;
              i++;
            } else {
              params[key] = true;
            }
          }
        }

        const context = new ExecutionContext(logger, process.env as any, params);
        if (options.dryRun) context.setVar('dryRun', true);

        const engine = new WorkflowEngine(context);
        engine.registerStepRunner('shell', new ShellStepRunner());
        engine.registerStepRunner('gate', new GateStepRunner());
        
        // Register a mock AI runner for the CLI MVP
        engine.registerStepRunner('ai', new AiStepRunner({
          generate: async (prompt) => {
            return JSON.stringify({ 
              summary: "This is a mock AI summary for the CLI demonstration.",
              riskLevel: "low",
              issues: []
            });
          }
        }));

        const spinner = !options.json ? ora(`Running workflow ${chalk.cyan(id)}...`).start() : null;
        const result = await engine.run(workflow);
        if (spinner) spinner.stop();

        if (options.json) {
          console.log(formatJson(result));
        } else {
          console.log(formatHuman(result));
        }

        process.exit(result.status === 'success' ? 0 : 1);
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}
```

packages/runner/src/steps/ai.ts
```
import { StepRunner } from '../types';
import { AiStep, StepResult } from '@workflow-pack/foundation';
import { ExecutionContext } from '../context';
import { ValidationError } from '@workflow-pack/foundation';

// Adapter interface for host AI capability
export interface AiAdapter {
  generate(prompt: string, contextFiles?: string[]): Promise<string>;
}

export class AiStepRunner implements StepRunner {
  constructor(private adapter: AiAdapter) {}

  canHandle(step: any): boolean {
    return step.type === 'ai';
  }

  async execute(step: AiStep, context: ExecutionContext): Promise<StepResult> {
    try {
      const response = await this.adapter.generate(step.prompt, step.contextFiles);
      
      let parsed: unknown;
      try {
        // Try parsing as JSON first if schema is present
        if (step.outputSchema) {
           parsed = JSON.parse(response);
           // Q11: In a real impl, we'd use AJV or Zod here to validate 'parsed' against 'step.outputSchema'
           // For now, simple check
           if (typeof parsed !== 'object' || parsed === null) {
             throw new Error("Response is not a valid JSON object");
           }
        } else {
          parsed = response;
        }
      } catch (e) {
        throw new ValidationError(`AI response validation failed: ${(e as Error).message}`);
      }

      return {
        stepId: step.id,
        status: 'success',
        stdout: typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2),
        artifacts: [] 
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'failure',
        error: error as Error
      };
    }
  }
}
```

packages/runner/src/steps/gate.ts
```
import { StepRunner } from '../types';
import { GateStep, StepResult, HostKind } from '@workflow-pack/foundation';
import { ExecutionContext } from '../context';
import readline from 'readline';

export class GateStepRunner implements StepRunner {
  constructor(private hostKind: HostKind = HostKind.CLI) {}

  canHandle(step: any): boolean {
    return step.type === 'gate';
  }

  async execute(step: GateStep, context: ExecutionContext): Promise<StepResult> {
    const logger = context.getLogger();

    if (step.autoApprove) {
      logger.info(`Auto-approving gate: ${step.message}`);
      return { stepId: step.id, status: 'success' };
    }

    // Q1: Host check
    if (this.hostKind !== HostKind.CLI) {
      // In non-interactive modes without autoApprove, we must fail or implement a different mechanism (e.g. MCP request)
      // For MVP, we fail safe
      return {
        stepId: step.id,
        status: 'failure',
        error: new Error(`Interactive gate required in non-interactive host (${this.hostKind}) without autoApprove.`)
      };
    }

    logger.info(`GATE: ${step.message}`);
    logger.info('Press "y" to approve, any other key to deny.');

    const answer = await this.promptUser();
    
    if (answer.toLowerCase() === 'y') {
      return { stepId: step.id, status: 'success' };
    } else {
      return { 
        stepId: step.id, 
        status: 'failure', 
        error: new Error('User denied gate.') 
      };
    }
  }

  private promptUser(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('> ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}
```

packages/runner/src/steps/shell.ts
```
import { spawn } from 'child_process';
import { StepRunner } from '../types';
import { ShellStep, StepResult } from '@workflow-pack/foundation';
import { ExecutionContext } from '../context';

export class ShellStepRunner implements StepRunner {
  canHandle(step: any): boolean {
    return step.type === 'shell';
  }

  async execute(step: ShellStep, context: ExecutionContext): Promise<StepResult> {
    const logger = context.getLogger();
    
    if (step.dryRun || context.get('dryRun')) {
      logger.info(`[DRY-RUN] Would execute: ${step.command}`);
      return { stepId: step.id, status: 'success', stdout: '[DRY-RUN]' };
    }

    return new Promise((resolve, reject) => {
      const child = spawn(step.command, {
        shell: true,
        cwd: step.cwd || process.cwd(),
        env: { ...process.env, ...step.env },
        stdio: ['ignore', 'pipe', 'pipe'] // Q5: Ignore stdin to prevent hanging on prompts
      });

      let stdout = '';
      let stderr = '';
      const MAX_BUFFER = 1024 * 1024; // 1MB

      child.stdout.on('data', (data) => {
        if (stdout.length < MAX_BUFFER) stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < MAX_BUFFER) stderr += data.toString();
      });

      child.on('error', (error) => {
        resolve({
          stepId: step.id,
          status: 'failure',
          error,
          stdout,
          stderr
        });
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stepId: step.id, status: 'success', stdout, stderr });
        } else {
          resolve({ 
            stepId: step.id, 
            status: 'failure', 
            exitCode: code || 1, 
            stdout, 
            stderr,
            error: new Error(`Command failed with exit code ${code}`)
          });
        }
      });
    });
  }
}
```

</source_code>