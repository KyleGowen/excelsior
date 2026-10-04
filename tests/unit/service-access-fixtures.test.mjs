import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'scripts/create-service-access-fixtures.mjs');
const run = (args, env = {}) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: { ...process.env, NODE_ENV: 'test', ...env } });
test('private local fixture generation and no-op dry run', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'm2-fixture-helper-'));
  try {
    const output = path.join(dir, 'fixture'); const args = ['--output', output, '--api', 'http://127.0.0.1:8088'];
    const dry = run([...args, '--dry-run']); assert.equal(dry.status, 0); assert.equal(JSON.parse(dry.stdout).filesWritten, 0); assert.equal(fs.existsSync(output), false);
    const result = run(args); assert.equal(result.status, 0);
    const registry = JSON.parse(fs.readFileSync(path.join(output, 'service-registry.json'))); const host = JSON.parse(fs.readFileSync(path.join(output, 'application-credentials.json')));
    assert.notEqual(host.clients[0].clientSecret, host.clients[1].clientSecret);
    for (const client of host.clients) {
      assert.equal(result.stdout.includes(client.clientSecret), false); assert.equal(fs.readFileSync(path.join(output, 'service-registry.json'), 'utf8').includes(client.clientSecret), false);
      assert.equal(registry.clients.find(c => c.id === client.clientId).credentials[0].secretSha256, createHash('sha256').update(client.clientSecret).digest('hex'));
    }
    assert.equal(result.stdout.includes(registry.signingSecret), false);
    if (process.platform !== 'win32') { assert.equal(fs.statSync(output).mode & 0o777, 0o700); for (const file of fs.readdirSync(output)) assert.equal(fs.statSync(path.join(output, file)).mode & 0o777, 0o600); }
    assert.notEqual(run(args).status, 0);
    assert.notEqual(run(['--output', path.join(dir, 'remote'), '--api', 'https://excelsior.cards']).status, 0);
    assert.notEqual(run(['--output', path.join(dir, 'production')], { NODE_ENV: 'production' }).status, 0);
    assert.notEqual(run(['--output', path.join(root, 'must-not-create-m2-fixtures')]).status, 0);
    assert.equal(fs.existsSync(path.join(root, 'must-not-create-m2-fixtures')), false);
    const other = path.join(dir, 'other-repository'); fs.mkdirSync(other); assert.equal(spawnSync('git', ['init', other], { encoding: 'utf8' }).status, 0);
    assert.notEqual(run(['--output', path.join(other, 'private-fixtures')]).status, 0);
    assert.equal(fs.existsSync(path.join(other, 'private-fixtures')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
