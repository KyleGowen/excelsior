import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8'));

describe('automatic security release gate', () => {
  it('validates every push and schedules daily verification without scheduled deployment', () => {
    expect(workflow.on).toHaveProperty('push');
    expect(workflow.on.push?.branches).toBeUndefined();
    expect(workflow.on.schedule).toHaveLength(1);
    expect(workflow.jobs['integration-tests'].if).toBeUndefined();
    expect(workflow.jobs['frontend-build'].if).toBeUndefined();
    for (const job of ['build-docker', 'sync-images', 'run-migrations', 'deploy', 'post-production']) {
      expect(workflow.jobs[job].if).toContain("github.ref == 'refs/heads/main'");
      expect(workflow.jobs[job].if).toContain("github.event_name == 'push'");
      expect(workflow.jobs[job].if).not.toContain("github.event_name == 'schedule'");
    }
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
