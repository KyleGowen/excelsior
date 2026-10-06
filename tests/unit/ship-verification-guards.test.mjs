import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { testInputs, sameTestInputs, gitBlobHash } from '../../scripts/ship-test-inputs.mjs';
import { captureCandidate, verifyCandidateCommit } from '../../scripts/ship-candidate.mjs';
import { jestCounts, nodeTestCounts } from '../../scripts/verification-receipt.mjs';
import { runGateBatch } from '../../scripts/run-verification-gates.mjs';

const root = resolve(import.meta.dirname, '../..');
const watcher = join(root, '.agents/skills/ship/scripts/watch-actions.mjs');
const git = (dir, ...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'excelsior-receipt-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const path of ['src', 'frontend/node_modules', 'node_modules', 'bin']) mkdirSync(join(dir, path), { recursive: true });
  writeFileSync(join(dir, '.gitignore'), 'node_modules/\n.cache/\n');
  writeFileSync(join(dir, 'src/example.ts'), 'export const value = 1;\n');
  for (const path of ['node_modules/.package-lock.json', 'frontend/node_modules/.package-lock.json']) writeFileSync(join(dir, path), '{}');
  git(dir, 'init', '-q'); git(dir, 'config', 'user.name', 'Fixture'); git(dir, 'config', 'user.email', 'fixture@example.invalid'); git(dir, 'add', '.'); git(dir, 'commit', '-qm', 'Fixture');
  return dir;
}
test('content cache survives staging/commit and reviewed prose, but not unknown inputs or environment', t => {
  const dir = fixture(t);
  const fp = () => testInputs(dir, 'unit', { PATH: process.env.PATH }).fingerprint;
  const before = fp();
  mkdirSync(join(dir, '.agents/skills/ship'), { recursive: true });
  writeFileSync(join(dir, '.agents/skills/ship/SKILL.md'), 'report wording');
  assert.equal(fp(), before);
  writeFileSync(join(dir, 'src/example.ts'), 'export const value = 2;\n');
  const changed = fp(); assert.notEqual(changed, before);
  git(dir, 'add', 'src/example.ts'); assert.equal(fp(), changed);
  git(dir, 'commit', '-qm', 'Changed fixture'); assert.equal(fp(), changed);
  writeFileSync(join(dir, 'unknown-fixture.md'), 'unknown dependency'); assert.notEqual(fp(), changed);
  const unknown = fp(); mkdirSync(join(dir, '.agents/skills/unreviewed'), { recursive: true });
  writeFileSync(join(dir, '.agents/skills/unreviewed/SKILL.md'), 'unknown skill input'); assert.notEqual(fp(), unknown);
  assert.notEqual(testInputs(dir, 'unit', { PATH: process.env.PATH, DB_PORT: '1234' }).fingerprint, fp());
});
test('missing installed dependencies disables reuse and dotenv stays private in the receipt', t => {
  const dir = fixture(t); rmSync(join(dir, 'node_modules/.package-lock.json'));
  writeFileSync(join(dir, '.env.test'), 'DB_PASSWORD=fictional-run-only\n');
  const inputs = testInputs(dir, 'unit', {});
  assert.equal(inputs.cacheable, false); assert.ok(!JSON.stringify(inputs).includes('fictional-run-only'));
});
test('commit with the same file list but changed contents is rejected', t => {
  const dir = fixture(t); writeFileSync(join(dir, 'src/example.ts'), 'approved\n');
  const candidate = captureCandidate(dir, ['src/example.ts']);
  writeFileSync(join(dir, 'src/example.ts'), 'different\n'); git(dir, 'add', 'src/example.ts'); git(dir, 'commit', '-qm', 'Different fixture');
  assert.throws(() => verifyCandidateCommit(dir, git(dir, 'rev-parse', 'HEAD'), candidate), /contents differ/);
});
test('exact frozen contents and deletions verify without staging unrelated files', t => {
  const dir = fixture(t); rmSync(join(dir, 'src/example.ts')); writeFileSync(join(dir, 'src/new.ts'), 'new\n');
  const candidate = captureCandidate(dir, ['src/example.ts', 'src/new.ts']);
  git(dir, 'add', 'src/example.ts', 'src/new.ts'); git(dir, 'commit', '-qm', 'Deletion fixture');
  assert.doesNotThrow(() => verifyCandidateCommit(dir, git(dir, 'rev-parse', 'HEAD'), candidate));
});
test('Jest evidence rejects empty, absent and inconsistent counts', () => {
  assert.equal(jestCounts('green'), null);
  assert.equal(jestCounts('Test Suites: 1 passed, 1 total\nTests: 1 passed, 9 total\n'), null);
  assert.deepEqual(jestCounts('Test Suites: 2 passed, 2 total\nTests: 3 skipped, 5 passed, 8 total\n'), { suites: 2, tests: 8, passed: 5, failed: 0, skipped: 3, todo: 0 });
});
test('fixture acquisition cannot hide source/environment edits or replace a known image', () => {
  const before = { baseFingerprint: 'source-env', docker: 'version', imageIds: [null, 'known'] };
  assert.equal(sameTestInputs(before, { ...before, imageIds: ['acquired', 'known'] }), true);
  assert.equal(sameTestInputs(before, { ...before, baseFingerprint: 'changed' }), false);
  assert.equal(sameTestInputs(before, { ...before, imageIds: ['acquired', 'changed'] }), false);
});
test('Node test receipts reject empty/missing/cancelled execution', () => {
  assert.equal(nodeTestCounts('green'), null);
  assert.deepEqual(nodeTestCounts('# tests 2\n# suites 0\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n'), { tests: 2, suites: 0, passed: 2, failed: 0, cancelled: 0, skipped: 0, todo: 0 });
});
function gate(dir, extra = {}, tests = []) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', `import {runTestGate} from ${JSON.stringify(join(root, 'scripts/ship-test-gate.mjs'))}; process.exitCode=await runTestGate(process.argv[1], 'unit', ${JSON.stringify(tests)});`, dir], {
    encoding: 'utf8', env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, SHIP_TEST_CACHE_DIR: join(dir, '.cache'), ...extra }, timeout: 15000,
  });
}
test('focused unit receipts cannot cover a different selection or the full suite', t => {
  const dir = fixture(t), a = 'tests/unit/a.test.ts', b = 'tests/unit/b.test.ts';
  mkdirSync(join(dir, 'tests/unit'), { recursive: true });
  writeFileSync(join(dir, a), 'fixture'); writeFileSync(join(dir, b), 'fixture');
  writeFileSync(join(dir, 'bin/npm'), '#!/bin/sh\nprintf "Test Suites: 1 passed, 1 total\\nTests: 2 passed, 2 total\\n"\n', { mode: 0o755 });
  const first = gate(dir, {}, [a]); assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).status, 'passed');
  assert.deepEqual(JSON.parse(first.stdout).command.slice(-3), ['--runInBand', '--runTestsByPath', a]);
  assert.equal(JSON.parse(gate(dir, {}, [a]).stdout).status, 'reused');
  assert.equal(JSON.parse(gate(dir, {}, [b]).stdout).status, 'passed');
  assert.equal(JSON.parse(gate(dir).stdout).status, 'passed');
  assert.equal(gate(dir, {}, ['tests/unit/missing.test.ts']).status, 1);
  assert.equal(gate(dir, {}, ['tests/unit/../../outside.test.ts']).status, 1);
});
test('gate reuses confirmed counts, rejects forced and ordinary edits during execution, and never caches zero tests', t => {
  const dir = fixture(t);
  const npm = join(dir, 'bin/npm');
  writeFileSync(npm, '#!/bin/sh\nprintf "Test Suites: 1 passed, 1 total\\nTests: 2 passed, 2 total\\n"\n', { mode: 0o755 });
  const first = gate(dir); assert.equal(first.status, 0, first.stderr); assert.equal(JSON.parse(first.stdout).status, 'passed');
  const second = gate(dir); assert.equal(second.status, 0, second.stderr); assert.equal(JSON.parse(second.stdout).status, 'reused'); assert.equal(JSON.parse(second.stdout).executedTests, 0);
  writeFileSync(JSON.parse(second.stdout).evidence.log, 'tampered\n');
  assert.equal(JSON.parse(gate(dir).stdout).status, 'passed');
  for (const force of ['0', '1']) {
    writeFileSync(npm, '#!/bin/sh\nprintf "Test Suites: 1 passed, 1 total\\nTests: 2 passed, 2 total\\n"\nprintf "edited\\n" >> src/example.ts\n', { mode: 0o755 });
    const edited = gate(dir, { SHIP_TESTS_FORCE: force }); assert.equal(edited.status, 1, edited.stderr); assert.match(JSON.parse(edited.stdout).gaps.join(' '), /Inputs changed/);
  }
  rmSync(join(dir, '.cache'), { recursive: true });
  writeFileSync(npm, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  assert.equal(gate(dir).status, 1); assert.equal(existsSync(join(dir, '.cache/unit.v2.json')), false);
});
test('Actions replay suppresses duplicates and retains exact-SHA and stall failures', t => {
  const dir = fixture(t), sha = 'a'.repeat(40), replay = join(dir, 'states.json');
  const run = (states, extra = []) => { writeFileSync(replay, JSON.stringify(states)); return spawnSync(process.execPath, [watcher, '--run-id', '1', '--sha', sha, '--replay', replay, '--poll-seconds', '0', ...extra], { encoding: 'utf8', timeout: 5000 }); };
  const pending = { headSha: sha, status: 'in_progress', jobs: [] };
  const passed = run([pending, pending, { ...pending, status: 'completed', conclusion: 'success' }]);
  assert.equal(passed.status, 0, passed.stderr);
  const receipt = JSON.parse(readFileSync(JSON.parse(passed.stdout.trim().split('\n').at(-1)).receipt));
  assert.equal(receipt.pollCount, 3); assert.equal(receipt.unchangedStates, 1);
  assert.equal(run([{ ...pending, headSha: 'b'.repeat(40) }]).status, 3);
  assert.equal(run([pending], ['--stall-seconds', '0.02']).status, 4);
  assert.equal(run([pending], ['--deadline-seconds', '0.02']).status, 4);
  assert.equal(run([{ ...pending, status: 'completed', conclusion: 'failure' }]).status, 1);
});
test('live watcher rejects tight polling and times out a supplied local GitHub mock without retry', t => {
  const dir = fixture(t), counter = join(dir, 'calls'), mock = join(dir, 'mock-gh');
  writeFileSync(mock, `#!/usr/bin/env node\nrequire('node:fs').appendFileSync(${JSON.stringify(counter)}, 'called\\n');\nsetTimeout(() => {}, 10000);\n`, { mode: 0o755 });
  const args = [watcher, '--run-id', '1', '--sha', 'a'.repeat(40)];
  const env = { ...process.env, SHIP_GH_BIN: mock };
  assert.equal(spawnSync(process.execPath, [...args, '--poll-seconds', '0'], { encoding: 'utf8', env }).status, 2);
  assert.equal(existsSync(counter), false);
  const result = spawnSync(process.execPath, [...args, '--request-timeout-seconds', '3'], { encoding: 'utf8', env, timeout: 8000 });
  assert.equal(result.status, 2, result.stderr);
  assert.equal(readFileSync(counter, 'utf8').trim(), 'called');
});
test('gate plan dry-run never executes and an empty test command cannot pass', async t => {
  const dir = fixture(t), out = mkdtempSync(join(tmpdir(), 'excelsior-batch-test-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const plan = { gates: [{ name: 'empty', kind: 'jest', command: [process.execPath, '-e', 'process.exit(0)'] }] };
  assert.equal((await runGateBatch({ root: dir, plan, directory: join(out, 'dry'), dryRun: true })).status, 'dry-run');
  assert.equal(existsSync(join(out, 'dry/empty.log')), false);
  assert.equal((await runGateBatch({ root: dir, plan, directory: join(out, 'live') })).status, 'failed');
});

test('integration runner preserves discovery/counts/logs and refuses incomplete cleanup using offline tools', t => {
  const dir = fixture(t), docker = join(dir, 'bin/docker'), jest = join(dir, 'bin/jest');
  for (const folder of ['scripts', 'tests/integration']) mkdirSync(join(dir, folder), { recursive: true });
  for (const file of ['run-integration-shards.mjs', 'verification-receipt.mjs']) writeFileSync(join(dir, 'scripts', file), readFileSync(join(root, 'scripts', file)));
  for (const file of ['a.test.ts', 'b.test.ts']) writeFileSync(join(dir, 'tests/integration', file), '// fictional discovery fixture\n');
  writeFileSync(docker, `#!/usr/bin/env node
const fs=require('node:fs'), args=process.argv.slice(2);
if(args[0]==='inspect') console.log('running healthy');
if(args[0]==='port') console.log('127.0.0.1:'+ (args[1].endsWith('-1')?'15431':'15432'));
if(args[0]==='rm') { fs.appendFileSync(process.env.MOCK_REMOVALS,args.at(-1)+'\\n'); if(process.env.MOCK_CLEANUP_FAILURE) process.exit(1); }
`, { mode: 0o755 });
  writeFileSync(jest, `#!/usr/bin/env node
const args=process.argv.slice(2), shard=args.find(arg=>arg.startsWith('--shard='));
const output=args.find(arg=>arg.startsWith('--outputFile=')); if(output) require('node:fs').writeFileSync(output.slice(13), '{}');
if(args.includes('--listTests')) { const paths=['a.test.ts','b.test.ts'].map(file=>require('node:path').join(process.cwd(),'tests/integration',file)); console.log(shard?paths[Number(shard.split('=')[1].split('/')[0])-1]:paths.join('\\n')); }
else if(!process.env.MOCK_EMPTY_JEST) console.log('Test Suites: 1 passed, 1 total\\nTests: 3 passed, 3 total');
`, { mode: 0o755 });
  const run = (name, extra = {}) => {
    const reportDir = join(dir, name), removals = join(dir, `${name}.removals`);
    const result = spawnSync(process.execPath, [join(dir, 'scripts/run-integration-shards.mjs'), '--shards=2'], {
      encoding: 'utf8', timeout: 15000, killSignal: 'SIGKILL', env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`,
        INTEGRATION_SHARD_JEST_BIN: jest, INTEGRATION_REPORT_DIR: reportDir, MOCK_REMOVALS: removals, ...extra },
    });
    return { result, receipt: JSON.parse(readFileSync(join(reportDir, 'receipt.json'))), removals: readFileSync(removals, 'utf8').trim().split('\n') };
  };
  const normal = run('normal'); assert.equal(normal.result.status, 0, normal.result.stderr);
  assert.equal(normal.receipt.selectedFiles, 2); assert.equal(normal.receipt.counts.passed, 6); assert.equal(normal.receipt.cleanup, 'completed'); assert.equal(normal.removals.length, 2);
  assert.ok(existsSync(join(dir, 'normal/shard-1.log')));
  assert.ok(existsSync(join(dir, 'normal/shard-1.json')));
  assert.equal(run('empty', { MOCK_EMPTY_JEST: '1' }).result.status, 1);
  const cleanup = run('cleanup', { MOCK_CLEANUP_FAILURE: '1' }); assert.equal(cleanup.result.status, 1); assert.equal(cleanup.receipt.cleanup.status, 'blocked');
  writeFileSync(join(dir, 'tests/integration/omitted.test.ts'), '// omitted fictional test\n');
  const omitted = spawnSync(process.execPath, [join(dir, 'scripts/run-integration-shards.mjs'), '--plan-only'], {
    encoding: 'utf8', env: { ...process.env, INTEGRATION_SHARD_JEST_BIN: jest },
  });
  assert.equal(omitted.status, 1); assert.match(omitted.stderr, /Integration tests omitted by Jest configuration/);
});

// Compare against Git itself, including non-text evidence and both object formats.
test('in-process blob hashes match Git for empty, Unicode and large binary inputs', t => {
  for (const objectFormat of ['sha1', 'sha256']) {
    const dir = mkdtempSync(join(tmpdir(), 'excelsior-blob-test-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    git(dir, 'init', '-q', `--object-format=${objectFormat}`);
    for (const input of [Buffer.alloc(0), Buffer.from('catalog \u00e9 \u2660\n'), Buffer.from([0, 255, 128, 10]), Buffer.alloc(256 * 1024, 173)]) {
      const oracle = execFileSync('git', ['hash-object', '--stdin'], { cwd: dir, input, encoding: 'utf8', timeout: 5000 }).trim();
      assert.equal(gitBlobHash(input, objectFormat), oracle);
    }
  }
  assert.throws(() => gitBlobHash(Buffer.alloc(0), 'unsupported'), /Unsupported/);
});
