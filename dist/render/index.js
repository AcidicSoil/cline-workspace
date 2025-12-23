"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPrompt = renderPrompt;
exports.renderWorkflowMd = renderWorkflowMd;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function renderPrompt(templateId, data) {
    const templatePath = path_1.default.join(__dirname, 'templates', `${templateId}.md`);
    // Basic fallback if file doesn't exist (for testing or dynamic templates)
    // In a real scenario, we might want to throw or have default templates.
    // For MVP, let's assume the file must exist or we return a placeholder.
    let template;
    try {
        template = await promises_1.default.readFile(templatePath, 'utf-8');
    }
    catch (error) {
        // If template file is missing, check if it was passed as a direct string (not typical for this signature, but defensive)
        // Or just throw customized error
        throw new Error(`Template not found: ${templateId}`);
    }
    return interpolate(template, data);
}
function renderWorkflowMd(workflow) {
    // Generates a markdown description of a workflow
    return `# ${workflow.name}

${workflow.description}

## Inputs
${workflow.inputs.map((i) => `- **${i.name}** (${i.type}): ${i.description}`).join('\n')}

## Outputs
${workflow.outputs.map((o) => `- **${o.name}** (${o.type}): ${o.description}`).join('\n')}
`;
}
function interpolate(template, data) {
    return template.replace(/\{\{\w+\}\\/g, (_, key) => {
        return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
    });
}
