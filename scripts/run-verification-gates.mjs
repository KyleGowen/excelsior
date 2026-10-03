#!/usr/bin/env node
// Execute only a main-agent-selected plan. This helper selects no release coverage.
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, createWriteStream, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeShipTreeFingerprint } from './ship-tree-fingerprint.mjs';
import { writeReceipt, sourceRevision, jestCounts, nodeTestCounts } from './verification-receipt.mjs';

export function validatePlan(plan) {
  if (!Array.isArray(plan.gates) || !plan.gates.length) throw new Error('Select explicit gates');
  const names = new Set();
  for (const gate of plan.gates) {
    if (!/^[a-z0-9-]+$/.test(gate.name) || names.has(gate.name)) throw new Error('Gate names must be unique and safe');
    names.add(gate.name);
    if (!['check', 'jest', 'node-test', 'test-gate'].includes(gate.kind)) throw new Error('Select check, jest, node-test, or test-gate kind');
    if (!Array.isArray(gate.command) || !gate.command.length || gate.command.some(arg => typeof arg !== 'string' || !arg || arg.includes('\0'))) throw new Error('Use a command argument array');
    if (gate.timeoutSeconds !== undefined && (!Number.isFinite(gate.timeoutSeconds) || gate.timeoutSeconds <= 0 || gate.timeoutSeconds > 3600)) throw new Error('Invalid gate timeout');
  }
}

export async function runGateBatch({ root = process.cwd(), plan, directory, dryRun = false }) {
  validatePlan(plan);
  root = resolve(root);
  directory ??= mkdtempSync(join(tmpdir(), 'excelsior-verification-'));
  mkdirSync(directory, { recursive: true });
  const report = { kind: 'gate-batch', environment: 'local', sourceRevision: sourceRevision(root),
    fingerprint: computeShipTreeFingerprint(root), status: dryRun ? 'dry-run' : 'pending', gates: [], selected: plan.gates.map(gate => gate.name),
    gaps: ['Gate coverage and release acceptance require main-agent review'], cleanup: 'no application fixtures created by this wrapper' };
  if (!dryRun) report.gates = await Promise.all(plan.gates.map(async gate => {
    const started = Date.now(); const logPath = join(directory, `${gate.name}.log`);
    const log = createWriteStream(logPath, { flags: 'wx', mode: 0o600 });
    const result = await new Promise(resolveResult => {
      let finished = false, timedOut = false;
      const child = spawn(gate.command[0], gate.command.slice(1), { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
      const kill = signal => { try { process.platform !== 'win32' ? process.kill(-child.pid, signal) : child.kill(signal); } catch {} };
      const cancel = () => { timedOut = true; kill('SIGTERM'); };
      process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
      child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
      let hardKill;
      const timer = setTimeout(() => { timedOut = true; kill('SIGTERM'); hardKill = setTimeout(() => kill('SIGKILL'), 5000); }, (gate.timeoutSeconds ?? 1800) * 1000);
      const finish = exitCode => { if (finished) return; finished = true; clearTimeout(timer); clearTimeout(hardKill); process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); log.end(() => resolveResult({ exitCode, timedOut })); };
      child.once('error', () => finish(1)); child.once('close', code => finish(code ?? 1));
    });
    const text = readFileSync(logPath, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
    const childReceipt = text.split('\n').filter(line => line.startsWith('{')).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean).at(-1);
    const counts = gate.kind === 'jest' ? jestCounts(text) : gate.kind === 'node-test' ? nodeTestCounts(text) : gate.kind === 'test-gate' ? childReceipt?.counts : null;
    const testsConfirmed = gate.kind === 'check' || counts?.passed > 0 && (gate.kind === 'node-test' ? counts.suites >= 0 && counts.cancelled === 0 : counts.suites > 0) && counts.failed === 0;
    const outcomeConfirmed = gate.kind !== 'test-gate' || childReceipt?.kind === 'test-gate' && ['passed', 'reused'].includes(childReceipt.status);
    return { name: gate.name, command: gate.command, status: result.exitCode === 0 && !result.timedOut && testsConfirmed && outcomeConfirmed ? 'passed' : 'failed',
      ...result, counts, executedTests: childReceipt?.status === 'reused' ? 0 : counts ? counts.passed + counts.failed : null,
      reused: childReceipt?.status === 'reused', durationSeconds: (Date.now() - started) / 1000, evidence: { log: logPath, receipt: childReceipt?.receipt ?? null },
      gaps: testsConfirmed && outcomeConfirmed ? [] : ['Test execution or reusable evidence not confirmed'] };
  }));
  if (!dryRun) {
    const changed = report.fingerprint !== computeShipTreeFingerprint(root);
    report.status = !changed && report.gates.every(gate => gate.status === 'passed') ? 'passed' : 'failed';
    if (changed) report.gaps.push('Checkout changed during batch; review and rerun affected checks');
  }
  const receipt = writeReceipt(join(directory, 'receipt.json'), report);
  const summary = { status: report.status, gates: report.gates.map(({ name, status, counts, reused }) => ({ name, status, counts, reused })), receipt };
  console.log(JSON.stringify(summary));
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options = {};
  try {
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg === '--dry-run') options.dryRun = true;
      else if (['--plan', '--report-dir', '--repo'].includes(arg) && process.argv[i + 1]) options[{ '--plan': 'planPath', '--report-dir': 'directory', '--repo': 'root' }[arg]] = process.argv[++i];
      else throw new Error(`Unknown/incomplete argument ${arg}`);
    }
    options.plan = JSON.parse(readFileSync(options.planPath, 'utf8'));
    runGateBatch(options).then(report => { process.exitCode = ['passed', 'dry-run'].includes(report.status) ? 0 : 1; }).catch(error => { console.error(error.message); process.exitCode = 1; });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
