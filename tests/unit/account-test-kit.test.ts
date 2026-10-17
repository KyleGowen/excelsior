import { execFileSync, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';

describe('immutable independent account fixture kit', () => {
  const script = resolve('scripts/package-account-test-kit.mjs');
  let directory: string; let revision: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'account-kit-test-'));
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    for (const path of ['src/api/http/middleware/accountAccess.ts', 'tests/integration/account-service.integration.test.ts', 'package-lock.json',
      'src/resources/cards/images/never-package.png', 'src/resources/legacy/never-package.txt', '.env', 'data/never-package.json']) {
      const file = join(directory, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, 'fictional-fixture\n');
    }
    execFileSync('git', ['add', '--', 'src', 'tests', 'package-lock.json', '.env', 'data'], { cwd: directory });
    execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'Fixture'], { cwd: directory });
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  it('packages only committed backend/test inputs with a source revision and verified archive digest', () => {
    writeFileSync(join(directory, 'src/api/http/middleware/accountAccess.ts'), 'uncommitted-must-not-ship\n');
    const archive = join(directory, 'kit.tar.gz');
    execFileSync(process.execPath, [script, revision, archive], { cwd: directory });
    const manifest = JSON.parse(readFileSync(archive + '.json', 'utf8'));
    expect(manifest.revision).toBe(revision);
    expect(manifest.sha256).toBe(createHash('sha256').update(readFileSync(archive)).digest('hex'));
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' });
    expect(entries).toContain('accountAccess.ts'); expect(entries).not.toMatch(/never-package|\.env/);
    const source = execFileSync('tar', ['-xOzf', archive, 'excelsior-account-kit/src/api/http/middleware/accountAccess.ts'], { encoding: 'utf8' });
    expect(source).toBe('fictional-fixture\n');
    const duplicate = spawnSync(process.execPath, [script, revision, archive], { cwd: directory, encoding: 'utf8' });
    expect(duplicate.status).not.toBe(0); expect(duplicate.stderr).toContain('Refusing to replace');
  });
  it.each(['main', 'a'.repeat(40), ''])('rejects unavailable or mutable source %s', ref => {
    const result = spawnSync(process.execPath, [script, ref, join(directory, 'kit.tar.gz')], { cwd: directory });
    expect(result.status).not.toBe(0);
  });
});
