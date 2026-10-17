#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [revision, destination] = process.argv.slice(2);
if (!revision || !/^[a-f0-9]{40}$/.test(revision) || !destination?.endsWith('.tar.gz')) {
  throw new Error('Usage: node scripts/package-account-test-kit.mjs <full-commit-sha> <new-archive.tar.gz>');
}
const output = resolve(destination);
if (existsSync(output) || existsSync(output + '.json')) throw new Error('Refusing to replace an existing artifact');
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
if (git(['rev-parse', revision + '^{commit}']).trim() !== revision) throw new Error('Expected an immutable commit');
const paths = git(['ls-tree', '-rz', '--name-only', revision, '--',
  'src', 'migrations', 'scripts', 'tests/config', 'tests/helpers',
  'tests/setup-integration.ts', 'tests/teardown-integration.ts',
  'tests/integration/account-service.integration.test.ts',
  'package.json', 'package-lock.json', 'tsconfig.json', 'LICENSE',
  'docs/current/EXTERNAL_ACCOUNT_ACCESS.md',
]).split('\0').filter(Boolean).filter(path => !/^src\/resources\/(?:cards\/images|images|legacy)\//.test(path));
for (const required of ['src/api/http/middleware/accountAccess.ts', 'tests/integration/account-service.integration.test.ts', 'package-lock.json']) {
  if (!paths.includes(required)) throw new Error('Commit does not contain the account preparation contract');
}
if (paths.some(path => /(?:^|\/)(?:\.env(?:\.|$)|data|node_modules)(?:\/|$)/.test(path))) throw new Error('Private/runtime material in artifact path set');
git(['archive', '--format=tar.gz', '--prefix=excelsior-account-kit/', '--output=' + output, revision, '--', ...paths]);
const sha256 = createHash('sha256').update(readFileSync(output)).digest('hex');
writeFileSync(output + '.json', JSON.stringify({ schemaVersion: 1, source: 'KyleGowen/excelsior', revision, sha256, selectedTest: 'tests/integration/account-service.integration.test.ts', files: paths.length }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ revision, archive: output, sha256, files: paths.length }));
