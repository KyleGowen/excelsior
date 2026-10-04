import { readFileSync, statSync } from 'fs';
import { z } from 'zod';

export const SERVICE_SCOPES = ['catalog:read', 'decks:read', 'decks:write', 'collections:read', 'collections:write', 'auth:session', 'guest:decks'] as const;
export type ServiceScope = typeof SERVICE_SCOPES[number];

const credentialSchema = z.object({
  version: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
  secretSha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const clientSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  enabled: z.boolean(),
  tokenEpoch: z.number().int().nonnegative(),
  scopes: z.array(z.enum(SERVICE_SCOPES)).min(1).max(SERVICE_SCOPES.length),
  credentials: z.array(credentialSchema).min(1).max(2),
  requestsPerMinute: z.number().int().min(1).max(600),
}).strict();
const configSchema = z.object({
  environment: z.enum(['development', 'production']),
  signingSecret: z.string().min(43).max(512),
  tokenTtlSeconds: z.number().int().min(30).max(300),
  clients: z.array(clientSchema).min(1).max(16),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.clients.map(c => c.id)).size !== value.clients.length) ctx.addIssue({ code: 'custom', message: 'Client IDs must be unique' });
  const digests = value.clients.flatMap(client => client.credentials.map(credential => credential.secretSha256));
  if (new Set(digests).size !== digests.length) ctx.addIssue({ code: 'custom', message: 'Service credentials must be distinct' });
  for (const client of value.clients) {
    if (new Set(client.credentials.map(c => c.version)).size !== client.credentials.length) ctx.addIssue({ code: 'custom', message: 'Credential versions must be unique' });
    if (new Set(client.scopes).size !== client.scopes.length) ctx.addIssue({ code: 'custom', message: 'Scopes must be unique' });
  }
});
export type ServiceAccessConfig = z.infer<typeof configSchema>;
export type ServiceClientConfig = ServiceAccessConfig['clients'][number];

/** Config is reread for every authentication: rotation/revocation take effect on the next request. */
export function readServiceAccessConfig(): ServiceAccessConfig | null {
  if (process.env.ENABLE_SERVICE_ACCESS !== '1') return null;
  const file = process.env.SERVICE_ACCESS_CONFIG_FILE;
  if (!file) throw new Error('Service access configuration is unavailable');
  const stat = statSync(file);
  if (!stat.isFile() || stat.size > 131072 || (process.platform !== 'win32' && (stat.mode & 0o077) !== 0)) throw new Error('Service access configuration must be private');
  const config = configSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  if (process.env.NODE_ENV === 'production' && config.environment !== 'production') throw new Error('Development service fixtures are forbidden in production');
  if (config.signingSecret === process.env.JWT_SECRET) throw new Error('Service and player signing secrets must differ');
  return config;
}

export function validateServiceAccessConfig(config: unknown): ServiceAccessConfig {
  return configSchema.parse(config);
}
