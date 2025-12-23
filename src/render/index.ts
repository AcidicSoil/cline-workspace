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
