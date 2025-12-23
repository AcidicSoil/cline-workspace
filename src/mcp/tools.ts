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
