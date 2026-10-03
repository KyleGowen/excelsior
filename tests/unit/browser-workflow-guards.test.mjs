import test from 'node:test';
import assert from 'node:assert/strict';
import { assertHealth, validateTarget } from '../../scripts/browser-test-target.mjs';
import { validateSelection, runMilestone1 } from '../browser/milestone1.mjs';

const revision = 'a'.repeat(40);
const local = { mode: 'local', frontend: 'http://localhost:5173', api: 'http://localhost:8085', expectedRevision: revision, expectedMigration: '365' };
const health = { status: 'OK', database: 'OK', revision, migration: '365' };

test('local target cannot point to production or expose credentials', () => {
  assert.doesNotThrow(() => validateTarget(local));
  assert.throws(() => validateTarget({ ...local, api: 'https://excelsior.cards' }));
  assert.throws(() => validateTarget({ ...local, api: 'http://secret@localhost:8085' }));
});
test('health gate rejects a stale deployment or wrong data migration', () => {
  assert.doesNotThrow(() => assertHealth(health, local));
  assert.throws(() => assertHealth({ ...health, revision: 'b'.repeat(40) }, local));
  assert.throws(() => assertHealth({ ...health, migration: '367' }, local));
});
test('production scenarios require exact healthy target, explicit selection, and Guest', () => {
  const target = { verified: true, environment: 'production', frontendUrl: 'https://excelsior.cards', health, expectedRevision: revision, expectedMigration: '365' };
  assert.doesNotThrow(() => validateSelection(target, ['database-search-detail'], 'guest'));
  assert.throws(() => validateSelection(target, [], 'guest'));
  assert.throws(() => validateSelection(target, ['account-save'], 'guest'));
  assert.throws(() => validateSelection(target, ['home-guest'], 'fictional-account'));
  assert.throws(() => validateSelection({ ...target, verified: false }, ['home-guest'], 'guest'));
});

test('before/after browser comparisons cannot suppress baseline screenshots', async () => {
  const target = { verified: true, environment: 'local', frontendUrl: local.frontend, health, expectedRevision: revision, expectedMigration: '365' };
  await assert.rejects(runMilestone1({ target, scenarioIds: ['database-search-detail'], actor: 'fictional-account', evidenceDir: '/unused', comparison: true, capturePolicy: 'failure' }), /comparisons require/);
  await assert.rejects(runMilestone1({ target, scenarioIds: ['database-search-detail'], actor: 'fictional-account', evidenceDir: '/unused', capturePolicy: 'unknown' }), /capture policy/);
});
