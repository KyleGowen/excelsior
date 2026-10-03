#!/usr/bin/env node
// Read-only browser target evidence; this is not a browser test or release gate.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { writeReceipt } from './verification-receipt.mjs';
import { computeShipTreeFingerprint } from './ship-tree-fingerprint.mjs';

export function validateTarget(options) {
  const { mode, frontend, api, expectedRevision, expectedMigration } = options;
  if (!['local', 'production'].includes(mode)) throw new Error('Select local or production explicitly');
  if (!/^[a-f0-9]{40}$/.test(expectedRevision ?? '')) throw new Error('Expected revision must be a full Git SHA');
  if (!/^\d+$/.test(String(expectedMigration ?? ''))) throw new Error('Expected migration is required');
  for (const value of [frontend, api]) {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a bare origin without credentials');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (mode === 'local' && (!local || url.protocol !== 'http:')) throw new Error('Local mode requires loopback HTTP origins');
    if (mode === 'production' && (url.origin !== 'https://excelsior.cards')) throw new Error('Production mode requires the approved Excelsior origin');
  }
  return options;
}

export function summarizeHealth(body) {
  return {
    status: body.status,
    database: body.database?.status,
    revision: body.git?.commit,
    migration: String(body.database?.migrations?.latest?.version ?? ''),
  };
}

export function assertHealth(health, options) {
  if (health.status !== 'OK' || health.database !== 'OK') throw new Error('Application or database health is not OK');
  if (health.revision !== options.expectedRevision) throw new Error('Running revision differs from the intended revision');
  if (health.migration !== String(options.expectedMigration)) throw new Error('Database migration differs from the intended target');
}

export async function inspectTarget(options) {
  validateTarget(options);
  const sourceRoot = options.sourceRoot ?? process.cwd();
  const git = args => execFileSync('git', args, { cwd: sourceRoot, encoding: 'utf8' }).trim();
  const sourceRevision = git(['rev-parse', 'HEAD']);
  if (options.mode === 'local' && sourceRevision !== options.expectedRevision) throw new Error('Selected checkout differs from the intended local revision');
  const report = {
    schema: 1, kind: 'target-health',
    environment: options.mode, frontendUrl: new URL(options.frontend).origin,
    apiUrl: new URL(options.api).origin, sourceRoot,
    sourceRevision, sourceTreeFingerprint: computeShipTreeFingerprint(sourceRoot),
    expectedRevision: options.expectedRevision, expectedMigration: String(options.expectedMigration),
    branch: git(['branch', '--show-current']), verified: false,
    observedAt: new Date().toISOString(),
  };
  if (options.dryRun) return { ...report, status: 'dry-run; no HTTP requests or browser validation' };
  const readHealth = async origin => {
    const url = new URL('/health', origin);
    url.searchParams.set('browser_verify', String(Date.now()));
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' }, redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Health HTTP ${response.status}`);
    const health = summarizeHealth(await response.json());
    assertHealth(health, options);
    return health;
  };
  report.health = await readHealth(report.apiUrl);
  if (options.mode === 'local') report.frontendProxyHealth = await readHealth(report.frontendUrl);
  const frontend = await fetch(report.frontendUrl, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!frontend.ok || !(await frontend.text()).includes('<html')) throw new Error('Frontend HTML unavailable');
  return { ...report, frontendStatus: frontend.status, verified: true, status: 'target health verified; browser still required' };
}

async function main() {
  const args = process.argv.slice(2), values = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') { values.dryRun = true; continue; }
    const key = { '--mode': 'mode', '--frontend': 'frontend', '--api': 'api', '--expected-revision': 'expectedRevision', '--expected-migration': 'expectedMigration', '--source-root': 'sourceRoot', '--report': 'reportFile' }[args[i]];
    if (!key || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Unknown or incomplete argument ${args[i]}`);
    values[key] = args[++i];
  }
  const report = await inspectTarget(values);
  if (values.reportFile) {
    writeReceipt(values.reportFile, report);
    process.stdout.write(`${JSON.stringify({ status: report.status, verified: report.verified, environment: report.environment, sourceRevision: report.sourceRevision, deployedRevision: report.environment === 'production' ? report.health?.revision : null, receipt: values.reportFile })}\n`);
  } else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
