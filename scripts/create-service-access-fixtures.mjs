#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Development only. The raw host credentials never enter the API registry or stdout.
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const value = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const allowed = new Set(['--dry-run', '--output', '--api']);
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error('Unknown fixture argument');
  if (args[i] !== '--dry-run') { if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Missing fixture argument'); i++; }
}
const api = new URL(value('--api') || 'http://127.0.0.1:8087');
if (process.env.NODE_ENV === 'production' || api.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(api.hostname) || api.username || api.password || api.pathname !== '/' || api.search || api.hash) throw new Error('Fixtures require a non-production loopback API origin');
const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const output = value('--output');
if (!output) throw new Error('Choose a fresh private output directory outside the checkout');
const destination = path.resolve(output);
const parent = fs.realpathSync(path.dirname(destination));
const actual = path.join(parent, path.basename(destination));
const checkout = spawnSync('git', ['-C', parent, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' });
if (checkout.error) throw new Error('Cannot establish a safe fixture destination');
if (checkout.stdout.trim() === 'true') throw new Error('Fixtures must remain outside all Git checkouts');
if (actual === root || actual.startsWith(root + path.sep) || fs.existsSync(actual)) throw new Error('Fixture directory must be fresh and outside the checkout');
const scopes = ['catalog:read', 'decks:read', 'decks:write', 'collections:read', 'collections:write', 'auth:session', 'guest:decks'];
const clients = ['excelsior-web', 'lrg-web'];
if (dryRun) {
  console.log(JSON.stringify({ mode: 'dry-run', environment: 'development', api: api.origin, clientIds: clients, scopes, tokenTtlSeconds: 60, filesWritten: 0 }));
} else {
  const secrets = clients.map(clientId => ({ clientId, clientSecret: randomBytes(32).toString('base64url') }));
  const registry = { environment: 'development', signingSecret: randomBytes(48).toString('base64url'), tokenTtlSeconds: 60, clients: secrets.map(client => ({ id: client.clientId, enabled: true, tokenEpoch: 0, scopes, credentials: [{ version: 'local-v1', secretSha256: createHash('sha256').update(client.clientSecret).digest('hex') }], requestsPerMinute: 600 })) };
  fs.mkdirSync(actual, { mode: 0o700 });
  const save = (name, data) => fs.writeFileSync(path.join(actual, name), JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  save('service-registry.json', registry);
  save('application-credentials.json', { environment: 'development', clients: secrets });
  save('insomnia-private-environments.json', { _type: 'export', __export_format: 4, resources: secrets.map((client, i) => ({ _id: 'env_m2_private_' + i, _type: 'environment', parentId: 'env_excelsior_preparation_local', name: 'M2 local private ' + client.clientId, data: { base_url: api.origin, service_client_id: client.clientId, service_client_secret: client.clientSecret, service_access_token: '', access_token: '', refresh_token: '' }, dataPropertyOrder: null, color: null, isPrivate: true })) });
  console.log(JSON.stringify({ environment: 'development', api: api.origin, clientIds: clients, configFile: path.join(actual, 'service-registry.json'), credentialsFile: path.join(actual, 'application-credentials.json'), insomniaFile: path.join(actual, 'insomnia-private-environments.json'), tokenTtlSeconds: 60 }));
}
