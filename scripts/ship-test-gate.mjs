import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, createWriteStream, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { testInputs, sameTestInputs } from './ship-test-inputs.mjs';
import { createHash } from 'node:crypto';
import { sourceRevision, readReceipt, writeReceipt, jestCounts } from './verification-receipt.mjs';

export async function runTestGate(root, mode) {
  const started = Date.now();
  const before = testInputs(root, mode);
  const cacheFile = join(process.env.SHIP_TEST_CACHE_DIR ?? join(root, '.ship-test-cache.d'), `${mode}.v2.json`);
  const cache = readReceipt(cacheFile);
  const reportDir = process.env.SHIP_REPORT_DIR ?? mkdtempSync(join(tmpdir(), 'excelsior-test-gate-'));
  mkdirSync(reportDir, { recursive: true });
  const receiptFile = join(reportDir, `${mode}-${Date.now()}-${process.pid}.json`);
  const logPath = receiptFile.replace(/\.json$/, '.log');
  const force = ['1', 'true'].includes(process.env.SHIP_TESTS_FORCE);
  const logHash = path => { try { return createHash('sha256').update(readFileSync(path)).digest('hex'); } catch { return null; } };
  const current = { schema: 1, kind: 'test-gate', gate: mode, environment: 'local', sourceRevision: sourceRevision(root),
    inputs: before, command: ['npm', 'run', mode === 'integration' ? 'test:integration:sharded' : 'test:unit'],
    startedAt: new Date(started).toISOString(), evidence: { log: logPath }, cleanup: 'runner-owned fixtures only' };
  const validCache = cache?.schema === 1 && cache.status === 'passed' && cache.inputs?.fingerprint === before.fingerprint
    && cache.kind === 'test-gate' && cache.gate === mode && (mode !== 'integration' || cache.cleanup === 'completed')
    && cache.counts?.passed > 0 && cache.counts?.tests > 0 && cache.counts?.suites > 0 && cache.counts.failed === 0
    && Date.now() - Date.parse(cache.finishedAt) >= 0 && Date.now() - Date.parse(cache.finishedAt) < 24 * 60 * 60 * 1000
    && cache.evidence?.log && existsSync(cache.evidence.log) && cache.evidence.sha256 && logHash(cache.evidence.log) === cache.evidence.sha256;
  if (!force && before.cacheable && validCache) {
    const after = testInputs(root, mode);
    if (before.fingerprint !== after.fingerprint) throw new Error('Inputs changed during cache verification');
    const receipt = { ...current, status: 'reused', counts: cache.counts, executedTests: 0, reusedFrom: cacheFile,
      evidence: cache.evidence, cleanup: cache.cleanup, durationSeconds: (Date.now() - started) / 1000, finishedAt: new Date().toISOString(), gaps: before.gaps };
    writeReceipt(receiptFile, receipt); console.log(JSON.stringify({ ...receipt, receipt: receiptFile })); return 0;
  }
  const log = createWriteStream(logPath, { flags: 'wx', mode: 0o600 });
  let interrupted = false;
  const exitCode = await new Promise(resolveExit => {
    const child = spawn(current.command[0], current.command.slice(1), { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
    child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
    const send = signal => { try { process.platform !== 'win32' ? process.kill(-child.pid, signal) : child.kill(signal); } catch {} };
    let hardKill;
    const kill = () => { interrupted = true; send('SIGTERM'); hardKill = setTimeout(() => send('SIGKILL'), 5000); };
    const timer = setTimeout(kill, 30 * 60 * 1000);
    process.once('SIGINT', kill); process.once('SIGTERM', kill);
    let finished = false;
    const finish = code => { if (finished) return; finished = true; clearTimeout(timer); clearTimeout(hardKill); process.removeListener('SIGINT', kill); process.removeListener('SIGTERM', kill); log.end(() => resolveExit(code)); };
    child.once('error', () => finish(1)); child.once('close', code => finish(code ?? 1));
  });
  const after = testInputs(root, mode);
  const output = readFileSync(logPath, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const counts = jestCounts(output);
  const nested = output.split('\n').filter(line => line.startsWith('{')).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean).at(-1);
  current.cleanup = mode === 'integration' ? nested?.cleanup ?? 'unverified' : 'not applicable; no DB fixtures in unit gate';
  if (mode === 'integration') current.evidence.integrationReceipt = nested?.receipt ?? null;
  const changed = !sameTestInputs(before, after);
  current.evidence.sha256 = logHash(logPath);
  const gaps = [...before.gaps, ...(changed ? ['Inputs changed while tests ran; result cannot be cached or released'] : []), ...(!counts || !counts.passed || !counts.suites ? ['Actual executed test counts unavailable or empty'] : [])];
  if (interrupted) gaps.push('Execution interrupted or timed out; inspect fixture cleanup');
  const cleaned = mode !== 'integration' || current.cleanup === 'completed';
  if (!cleaned) gaps.push('Integration fixture cleanup not confirmed');
  const passed = exitCode === 0 && !interrupted && !changed && cleaned && counts?.passed > 0 && counts?.suites > 0 && counts.failed === 0;
  const receipt = { ...current, status: passed ? 'passed' : 'failed', subprocessExitCode: exitCode, counts, executedTests: counts?.passed ?? 0,
    durationSeconds: (Date.now() - started) / 1000, finishedAt: new Date().toISOString(), gaps };
  writeReceipt(receiptFile, receipt);
  if (passed && before.cacheable) writeReceipt(cacheFile, receipt);
  console.log(JSON.stringify({ ...receipt, receipt: receiptFile }));
  return passed ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  runTestGate(root, process.argv[2]).then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
