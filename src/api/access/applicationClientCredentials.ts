import { readFileSync, statSync } from 'fs';
import { z } from 'zod';
import type { ConfidentialClientCredentials } from './applicationAccessAdapter';

const schema = z.object({
  environment: z.enum(['development', 'production']),
  clients: z.array(z.object({ clientId: z.string().min(1).max(80), clientSecret: z.string().min(32).max(512) }).strict()).min(1).max(16),
}).strict();

/** Private host configuration is distinct from the API's hashed credential registry. */
export function readApplicationClientCredentials(clientId: string): ConfidentialClientCredentials {
  try {
    const file = process.env.APPLICATION_ACCESS_CREDENTIALS_FILE;
    if (!file) throw new Error('Missing file');
    const stat = statSync(file);
    if (!stat.isFile() || stat.size > 131072 || (process.platform !== 'win32' && stat.mode & 0o077)) throw new Error('Nonprivate file');
    const config = schema.parse(JSON.parse(readFileSync(file, 'utf8')));
    if (process.env.NODE_ENV === 'production' && config.environment !== 'production') throw new Error('Development fixture');
    if (new Set(config.clients.map(client => client.clientId)).size !== config.clients.length) throw new Error('Duplicate clients');
    const client = config.clients.find(client => client.clientId === clientId);
    if (client) return client;
  } catch { /* Never expose file contents, credentials, or parsing details. */ }
  throw new Error('Application credentials are unavailable');
}
