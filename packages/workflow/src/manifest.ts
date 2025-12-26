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