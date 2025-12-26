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