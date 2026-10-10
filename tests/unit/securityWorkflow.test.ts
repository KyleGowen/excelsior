import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8'));
const productionJobs = ['build-docker', 'sync-images', 'run-migrations', 'deploy', 'post-production'];

function evaluateCondition(expression: string, event: string, audit = false, ref = 'refs/heads/main') {
  const substituted = expression.replace(/^\$\{\{\s*|\s*\}\}$/g, '')
    .replace(/github\.event_name/g, JSON.stringify(event))
    .replace(/github\.ref/g, JSON.stringify(ref))
    .replace(/inputs\.security_audit/g, JSON.stringify(audit));
  return Function(`return (${substituted});`)();
}

describe('automatic security release gate', () => {
  it('validates every push and schedules daily verification without scheduled deployment', () => {
    expect(workflow.on).toHaveProperty('push');
    expect(workflow.on.push?.branches).toBeUndefined();
    expect(workflow.on.schedule).toHaveLength(1);
    expect(workflow.jobs['integration-tests'].if).toBeUndefined();
    expect(workflow.jobs['frontend-build'].if).toBeUndefined();
    for (const job of productionJobs) {
      expect(workflow.jobs[job].if).toContain("github.ref == 'refs/heads/main'");
      expect(workflow.jobs[job].if).toContain("github.event_name == 'push'");
      expect(workflow.jobs[job].if).not.toContain("github.event_name == 'schedule'");
    }
  });

  it('runs manual audits with full history and prevents every production mutation', () => {
    expect(workflow.on.workflow_dispatch.inputs.security_audit).toMatchObject({ type: 'boolean', default: false });
    expect(workflow['run-name']).toContain('Daily security audit');
    expect(workflow['run-name']).toContain('Manual security audit');
    const checkout = workflow.jobs['soc2-compliance'].steps.find((step: any) => step.name === 'Checkout code');
    expect(evaluateCondition(checkout.with['fetch-depth'], 'schedule')).toBe(0);
    expect(evaluateCondition(checkout.with['fetch-depth'], 'workflow_dispatch', true)).toBe(0);
    expect(evaluateCondition(checkout.with['fetch-depth'], 'workflow_dispatch')).toBe(2);
    for (const job of productionJobs) {
      const condition = workflow.jobs[job].if;
      expect(evaluateCondition(condition, 'workflow_dispatch', true)).toBe(false);
      expect(evaluateCondition(condition, 'schedule')).toBe(false);
      expect(evaluateCondition(condition, 'push')).toBe(true);
      expect(evaluateCondition(condition, 'workflow_dispatch')).toBe(true);
      expect(evaluateCondition(condition, 'push', false, 'refs/heads/candidate')).toBe(false);
      expect(evaluateCondition(condition, 'pull_request')).toBe(false);
    }
  });

  it('limits secret-scanner exceptions to exact historical findings', () => {
    const fingerprints = fs.readFileSync(path.join(root, '.gitleaksignore'), 'utf8').split('\n')
      .filter(line => line.trim() && !line.startsWith('#'));
    for (const fingerprint of fingerprints) {
      expect(fingerprint).toMatch(/^[a-f0-9]{40}:[^:]+:[a-z-]+:\d+$/);
    }
    const evidence = fingerprints.filter(line => line.startsWith('2a9120aec71f13fa9a6a58ab86a54cc4aea33093:'));
    expect(evidence).toHaveLength(15);
    expect(evidence.every(line => line.includes(':docs/evidence/frontend-preparation/m6/completion/runtime-inputs.json:'))).toBe(true);
  });

  it('blocks release if any required validation fails, cancels, or is skipped', () => {
    const job = workflow.jobs['security-gate'];
    expect(job.if).toBe('always()');
    expect(job.needs).toEqual(expect.arrayContaining([
      'unit-tests', 'unit-coverage', 'integration-tests', 'semgrep', 'trivy', 'soc2-compliance', 'frontend-build'
    ]));
    const run = job.steps[0].run;
    for (const result of ['failure', 'cancelled', 'skipped']) {
      const process = spawnSync('bash', ['-eo', 'pipefail', '-c', run], {
        env: { ...global.process.env, RESULTS: JSON.stringify({ unit: { result: 'success' }, security: { result } }) }
      });
      expect(process.status).not.toBe(0);
    }
    expect(spawnSync('bash', ['-eo', 'pipefail', '-c', run], {
      env: { ...process.env, RESULTS: JSON.stringify({ security: { result: 'success' } }) }
    }).status).toBe(0);
    expect(workflow.jobs['build-docker'].needs).toEqual(['security-gate']);
    expect(workflow.jobs['sync-images'].needs).toEqual(['security-gate']);
  });

  it('propagates the actual test failure instead of the logging command status', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'security-gate-test-'));
    try {
      fs.writeFileSync(path.join(directory, 'npx'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
      const step = workflow.jobs['integration-tests'].steps.find((entry: any) => entry.name === 'Run integration tests');
      const command = step.run.replace('${{ matrix.shard }}', '1');
      expect(workflow.defaults.run.shell).toBe('bash');
      const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', command], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` }
      });
      expect(result.status).toBe(1);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });

  it('rejects missing, invalid, and expired vulnerability exception dates', () => {
    const script = path.join(root, 'scripts/check-security-exceptions.mjs');
    for (const text of ['CVE-2026-1', 'CVE-2026-1 exp:2026-02-30', 'CVE-2026-1 exp:2026-09-01']) {
      const code = `import { validateExceptions } from ${JSON.stringify(script)}; validateExceptions(${JSON.stringify(text)}, '2026-09-26');`;
      expect(spawnSync(process.execPath, ['--input-type=module', '-e', code]).status).not.toBe(0);
    }
    const code = `import { validateExceptions } from ${JSON.stringify(script)}; validateExceptions('CVE-2026-1 exp:2026-10-26', '2026-09-26');`;
    expect(spawnSync(process.execPath, ['--input-type=module', '-e', code]).status).toBe(0);
  });
});
