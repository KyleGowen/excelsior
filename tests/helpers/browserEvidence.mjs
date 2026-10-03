import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function blocked(message) {
  const error = new Error(message);
  error.browserResult = 'blocked';
  throw error;
}

// New files only: reruns cannot silently replace a screenshot or accepted baseline.
export async function captureBrowserEvidence(tab, directory, name) {
  check(/^[a-z0-9-]+$/.test(name), 'Unsafe evidence name');
  await mkdir(directory, { recursive: true });
  const screenshot = resolve(directory, `${name}.jpg`);
  const dom = resolve(directory, `${name}.txt`);
  const dimensions = await tab.playwright.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }));
  await writeFile(screenshot, await tab.screenshot({ fullPage: false }), { flag: 'wx' });
  await writeFile(dom, await tab.playwright.domSnapshot(), { flag: 'wx' });
  return { screenshot, dom, dimensions, url: await tab.url() };
}

export async function writeBrowserReport(directory, report) {
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, 'report.json');
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  return path;
}

export function summarizeBrowserReport(report) {
  return { status: report.status, environment: report.environment, sourceRevision: report.sourceRevision,
    deployedRevision: report.deployedRevision, scenarios: report.scenarios.map(({ id, status, reason }) => ({ id, status, reason })),
    counts: report.counts, durationSeconds: report.durationSeconds, evidence: report.reportPath, cleanup: report.cleanup,
    acceptance: report.acceptance, gaps: report.gaps };
}
