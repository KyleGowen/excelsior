import { mkdirSync, writeFileSync, renameSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

export function sourceRevision(root) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}

export function writeReceipt(file, receipt) {
  mkdirSync(dirname(resolve(file)), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ schema: 1, ...receipt }, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, file);
  return resolve(file);
}

export function readReceipt(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

// Jest's complete summary is required; a green subprocess without tests is not proof.
export function jestCounts(text) {
  const totals = { suites: 0, tests: 0, passed: 0, failed: 0, skipped: 0, todo: 0 };
  const suiteLines = [...text.matchAll(/^Test Suites:\s*(.*)$/gm)];
  const testLines = [...text.matchAll(/^Tests:\s*(.*)$/gm)];
  if (!suiteLines.length || suiteLines.length !== testLines.length) return null;
  for (const [, line] of suiteLines) totals.suites += Number(line.match(/(\d+) total/)?.[1] ?? 0);
  for (const [, line] of testLines) {
    for (const key of ['passed', 'failed', 'skipped', 'todo']) totals[key] += Number(line.match(new RegExp(`(\\d+) ${key}`))?.[1] ?? 0);
    totals.tests += Number(line.match(/(\d+) total/)?.[1] ?? 0);
  }
  return totals.tests === totals.passed + totals.failed + totals.skipped + totals.todo ? totals : null;
}

export function nodeTestCounts(text) {
  const value = key => Number([...text.matchAll(new RegExp(`^# ${key} (\\d+)$`, 'gm'))].at(-1)?.[1] ?? NaN);
  const counts = { suites: value('suites'), tests: value('tests'), passed: value('pass'), failed: value('fail'), skipped: value('skipped'), todo: value('todo'), cancelled: value('cancelled') };
  return Object.values(counts).every(Number.isFinite) && counts.tests === counts.passed + counts.failed + counts.skipped + counts.todo + counts.cancelled ? counts : null;
}
