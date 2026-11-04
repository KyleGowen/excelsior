import { execFileSync, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';

const packager = resolve('scripts/package-account-test-kit.mjs');
const required = ['src/api/http/middleware/accountAccess.ts', 'src/api/http/account-decks.http.ts',
  'src/database/PostgreSQLAccountDeckRepository.ts', 'migrations/V376__external_account_deck_save_receipts.sql',
  'tests/integration/account-service.integration.test.ts', 'tests/production/account-decks.test.mjs', 'package-lock.json',
  'tools/jest-deepmerge/package.json', 'tools/jest-deepmerge/index.cjs', 'tools/jest-deepmerge/index.d.ts'];
const owned: string[] = [];
function fixture(omit?: string, extra: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'synthetic-account-kit-')); owned.push(root);
  for (const name of [...required, ...extra].filter(name => name !== omit)) {
    const file = join(root, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, 'synthetic fixture only\n');
  }
  // These commits belong only to a disposable synthetic repository, never the application checkout.
  const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init', '--quiet']); git(['add', '--', '.']);
  git(['-c', 'user.name=Synthetic Kit Fixture', '-c', 'user.email=kit@example.invalid', 'commit', '--quiet', '-m', 'Synthetic packaging input']);
  return { root, revision: git(['rev-parse', 'HEAD']), output: join(root, 'candidate.tar.gz') };
}
function pack(f: ReturnType<typeof fixture>, revision = f.revision, output = f.output) {
  return spawnSync(process.execPath, [packager, revision, output], { cwd: f.root, encoding: 'utf8' });
}
afterEach(() => { for (const path of owned.splice(0)) rmSync(path, { recursive: true, force: true }); });
describe('immutable sanitized account/deck kit packaging', () => {
  it('includes both contract tests and the additive migration, hashes exact bytes and omits runtime/artwork', () => {
    const f = fixture(undefined, ['.env', 'data/users.json', 'src/resources/cards/images/example.png', 'src/resources/legacy/example.txt']);
    expect(pack(f).status).toBe(0);
    const manifest = JSON.parse(readFileSync(f.output + '.json', 'utf8'));
    expect(manifest).toMatchObject({ schemaVersion: 2, source: 'KyleGowen/excelsior', revision: f.revision, contract: 'account-decks-snapshot-v1' });
    expect(manifest.sha256).toBe(createHash('sha256').update(readFileSync(f.output)).digest('hex'));
    const members = execFileSync('tar', ['-tzf', f.output], { encoding: 'utf8' });
    for (const path of required) expect(members).toContain('excelsior-account-kit/' + path + '\n');
    expect(members).not.toMatch(/\.env|data\/|resources\/(?:cards\/images|legacy)\//);
    expect(manifest.selectedTests).toContain('tests/production/account-decks.test.mjs');
  });
  it.each(required)('rejects an incomplete committed contract missing %s', missing => {
    const f = fixture(missing); expect(pack(f).status).not.toBe(0); expect(existsSync(f.output)).toBe(false);
  });
  it('rejects a moving ref, invalid revision and wrong output extension', () => {
    const f = fixture();
    for (const revision of ['HEAD', 'main', 'bad', 'f'.repeat(40)]) expect(pack(f, revision).status).not.toBe(0);
    expect(pack(f, f.revision, join(f.root, 'wrong.zip')).status).not.toBe(0); expect(existsSync(f.output)).toBe(false);
  });
  it('never replaces an existing archive or its provenance file', () => {
    const f = fixture(); writeFileSync(f.output, 'retained artifact');
    expect(pack(f).status).not.toBe(0); expect(readFileSync(f.output, 'utf8')).toBe('retained artifact');
    rmSync(f.output); writeFileSync(f.output + '.json', 'retained manifest');
    expect(pack(f).status).not.toBe(0); expect(readFileSync(f.output + '.json', 'utf8')).toBe('retained manifest'); expect(existsSync(f.output)).toBe(false);
  });
  it.each(['src/.env.local', 'src/data/users.json', 'src/node_modules/private.js'])('rejects private/runtime material selected by the source whitelist: %s', path => {
    const f = fixture(undefined, [path]); expect(pack(f).status).not.toBe(0); expect(existsSync(f.output)).toBe(false);
  });
});
