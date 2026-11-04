import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';

const url = new URL(process.env.DATABASE_URL ?? 'missing:');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !/^\/lrg_test_[a-zA-Z0-9_]+$/.test(url.pathname) || !process.env.LRG_DISPOSABLE_TEST_RUN_ID) throw new Error('Account tests require an owned disposable database');
const pool = new Pool({ connectionString: url.toString() });
const marker = await pool.query('SELECT nonce::text FROM lrg_test_guard.marker');
assert.deepEqual(marker.rows, [{ nonce: process.env.LRG_DISPOSABLE_TEST_RUN_ID }]);
process.env.NODE_ENV = 'test'; process.env.LOG_LEVEL = 'silent'; process.env.DEBUG_AUTH = '0'; process.env.DISABLE_PINO = '1';
process.env.JWT_SECRET = 'synthetic-account-deck-jwt-' + randomBytes(24).toString('hex');
const directory = mkdtempSync(join(tmpdir(), 'account-deck-proof-'));
const secret = randomBytes(32).toString('base64url');
const scopes = ['account:self', 'decks:read', 'decks:write'];
const registry = { environment: 'development', signingSecret: randomBytes(48).toString('base64url'), tokenTtlSeconds: 300, clients: [
 { id: 'account-deck-proof', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes, credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret).digest('hex') }] },
 { id: 'account-only-proof', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['account:self'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret + '2').digest('hex') }] },
] };
const file = join(directory, 'registry.json'); writeFileSync(file, JSON.stringify(registry), { mode: 0o600 });
Object.assign(process.env, { ENABLE_SERVICE_ACCESS: '1', SERVICE_ACCESS_CONFIG_FILE: file, ENABLE_ACCOUNT_SERVICE_GATEWAY: '1', ENABLE_ACCOUNT_DECK_GATEWAY: '1' });
const require = createRequire(import.meta.url);
const { app } = require('../../dist/index.js');
const { DataSourceConfig } = require('../../dist/config/DataSourceConfig.js');
const prefix = '/api/service/account/v1'; const sessionHeader = 'x-excelsior-account-session';
const password = 'Synthetic-deck-fixture-123!';
const users = [];
let token, limitedToken, first, second, sessionA, sessionB, nativeCookie, card, initialDeckCount;
const call = (method, path, session, access = token) => { const r = request(app)[method](prefix + path).set('X-Excelsior-Service-Authorization', 'Bearer ' + access); return session ? r.set(sessionHeader, session) : r; };
const login = async user => (await call('post', '/auth/login').send({ username: user.username, password }).expect(200)).headers[sessionHeader];
const saveInput = () => ({ operationId: randomUUID(), deckId: null, expectedUpdatedAt: null, name: 'Synthetic shared draft', cards: [{ type: 'power', cardId: card, quantity: 2, exclude_from_draw: true }], reserveCharacterId: null, limited: false });
before(async () => {
 const issue = async (clientId, clientSecret, scope) => (await request(app).post('/api/v1/service-auth/token').send({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope }).expect(200)).body.data.accessToken;
 token = await issue('account-deck-proof', secret, scopes.join(' ')); limitedToken = await issue('account-only-proof', secret + '2', 'account:self');
 const signup = async () => {
  const username = 'fixture_' + randomUUID().slice(0, 8);
  const r = await call('post', '/auth/signup').send({ username, email: username + '@example.com', password }).expect(201);
  const id = r.body.data.userId; users.push(id); return { id, username };
 };
 first = await signup(); second = await signup(); sessionA = await login(first); sessionB = await login(second);
 nativeCookie = (await request(app).post('/api/auth/login').send({ username: first.username, password }).expect(200)).headers['set-cookie'][0].split(';')[0];
 initialDeckCount = (await call('get', '/decks', sessionA).expect(200)).body.data.length;
 card = (await pool.query('SELECT id FROM power_cards ORDER BY id LIMIT 1')).rows[0].id;
});
after(async () => {
 if (users.length) await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [users]);
 await pool.end(); await DataSourceConfig.getInstance().close(); rmSync(directory, { recursive: true, force: true });
});
test('production router derives the current player and keeps the native session independent', async () => {
 await call('get', '/decks').set('Cookie', nativeCookie).expect(401);
 await call('get', '/decks', sessionA, limitedToken).expect(403);
 await request(app).get('/api/account-decks').set('Cookie', nativeCookie).expect(403);
 await call('post', '/decks/save', sessionA).send({ ...saveInput(), userId: second.id, role: 'ADMIN' }).expect(400);
 delete process.env.ENABLE_ACCOUNT_DECK_GATEWAY; await call('get', '/decks', sessionA).expect(403); process.env.ENABLE_ACCOUNT_DECK_GATEWAY = '1';
 await request(app).get('/api/auth/me').set('Cookie', nativeCookie).expect(200);
 const guest = await call('post', '/auth/signup').send({ username: 'guest_' + randomUUID().slice(0,8), email: 'guest_' + randomUUID() + '@example.com', password }).expect(201);
 const guestId = guest.body.data.userId; users.push(guestId); await pool.query("UPDATE users SET role='GUEST' WHERE id=$1", [guestId]);
 await call('post', '/decks/save', guest.headers[sessionHeader]).send(saveInput()).expect(403);
});
test('atomic create, concurrent retry, list/load, optimistic update and rollback preserve complete snapshots', async () => {
 const input = saveInput();
 const responses = await Promise.all(Array.from({ length: 5 }, () => call('post', '/decks/save', sessionA).send(input).expect(200)));
 const saved = responses[0].body.data; assert.ok(saved.metadata.isOwner); assert.equal(saved.metadata.userId, first.id); assert.equal(saved.cards[0].quantity, 2); assert.equal(saved.cards[0].exclude_from_draw, true);
 for (const r of responses) { assert.equal(r.body.data.metadata.id, saved.metadata.id); assert.equal(r.headers['set-cookie'], undefined); assert.equal(r.headers['cache-control'], 'no-store'); }
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM decks WHERE user_id=$1', [first.id])).rows[0].n, initialDeckCount + 1);
 assert.equal((await call('get', '/decks', sessionA).expect(200)).body.data.length, initialDeckCount + 1);
 assert.equal((await call('get', '/decks', sessionB).expect(200)).body.data.some(deck => deck.id === saved.metadata.id), false);
 const shared = (await call('get', '/decks/' + saved.metadata.id + '/full', sessionB).expect(200)).body.data; assert.equal(shared.metadata.isOwner, false);
 await call('post', '/decks/save', sessionA).send({ ...input, name: 'Changed retry payload' }).expect(409);
 const update = { ...input, operationId: randomUUID(), deckId: saved.metadata.id, expectedUpdatedAt: saved.updatedAt, name: 'Updated complete snapshot', cards: [{ ...input.cards[0], quantity: 3, exclude_from_draw: false }] };
 await call('post', '/decks/save', sessionB).send(update).expect(403);
 const updated = (await call('post', '/decks/save', sessionA).send(update).expect(200)).body.data; assert.equal(updated.cards[0].quantity, 3); assert.notEqual(updated.updatedAt, saved.updatedAt);
 await call('post', '/decks/save', sessionA).send({ ...update, operationId: randomUUID() }).expect(409);
 await call('post', '/decks/save', sessionA).send({ ...update, operationId: randomUUID(), expectedUpdatedAt: updated.updatedAt, cards: [{ ...input.cards[0], cardId: randomUUID() }] }).expect(400);
 const after = (await call('get', '/decks/' + saved.metadata.id + '/full', sessionA).expect(200)).body.data; assert.equal(after.metadata.name, updated.metadata.name); assert.equal(after.cards[0].quantity, 3); assert.equal(after.updatedAt, updated.updatedAt);
 const beforeCount = (await pool.query('SELECT count(*)::int AS n FROM decks WHERE user_id=$1', [first.id])).rows[0].n;
 await call('post', '/decks/save', sessionA).send({ ...saveInput(), cards: [{ ...input.cards[0], cardId: randomUUID() }] }).expect(400);
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM decks WHERE user_id=$1', [first.id])).rows[0].n, beforeCount);
 await call('post', '/users/topdeck', sessionA).send({ topdeckHandle: '@Synthetic_Player' }).expect(200);
 assert.equal((await call('get', '/auth/me', sessionA).expect(200)).body.data.topdeckHandle, 'Synthetic_Player');
 await call('post', '/auth/logout', sessionA).expect(200); await call('get', '/decks', sessionA).expect(401); await request(app).get('/api/auth/me').set('Cookie', nativeCookie).expect(200);
});

test('repository transaction rolls back replaced metadata/cards and orphan creates on a storage-stage failure', async () => {
 const { PostgreSQLAccountDeckRepository } = require('../../dist/database/PostgreSQLAccountDeckRepository.js');
 const repository = new PostgreSQLAccountDeckRepository(pool, async () => {});
 const metrics = { valid: false, cardCount: 2, threat: 0 };
 const initial = await repository.save(first.id, saveInput(), metrics);
 const invalid = { ...saveInput(), deckId: initial.metadata.id, expectedUpdatedAt: initial.updatedAt, name: 'Must roll back', cards: [{ type: 'power', cardId: randomUUID(), quantity: 1 }] };
 await assert.rejects(repository.save(first.id, invalid, metrics), error => error.code === 'INVALID_DECK_CARD');
 const otherZone=new Pool({connectionString:url.toString(),options:'-c timezone=Pacific/Honolulu'});
 try { const elsewhere=new PostgreSQLAccountDeckRepository(otherZone,async()=>{}); assert.equal((await elsewhere.load(initial.metadata.id,first.id)).updatedAt,initial.updatedAt); } finally { await otherZone.end(); }
 const after = await repository.load(initial.metadata.id, first.id); assert.equal(after.metadata.name, initial.metadata.name); assert.deepEqual(after.cards, initial.cards); assert.equal(after.updatedAt, initial.updatedAt);
 const before = (await repository.list(first.id)).length;
 await assert.rejects(repository.save(first.id, { ...invalid, operationId: randomUUID(), deckId: null, expectedUpdatedAt: null }, metrics));
 assert.equal((await repository.list(first.id)).length, before);
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM external_deck_save_receipts WHERE user_id=$1 AND operation_id=$2', [first.id, invalid.operationId])).rows[0].n, 0);
});
