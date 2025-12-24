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
