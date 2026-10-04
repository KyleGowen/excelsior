import request from 'supertest';
import { evaluationInputKey } from '../../../src/services/deck-evaluation/draftInput';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';
const base = { schemaVersion: 1 as const, draftId: 'fictional-unsaved', revision: 10, cards: [], reserveCharacterId: null, limited: false, format: 'venture' as const, koCharacterIds: [] };
describe('Production-composed stateless deck evaluation', () => {
    it('evaluates an unsaved Guest draft without authentication, creating no deck or player records', async () => {
        const pool = DataSourceConfig.getInstance().getPool();
        const before = await pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users');
        const r = await request(app).post('/api/v1/decks/evaluate').send(base).expect(200);
        expect(r.body.data).toMatchObject({ draftId: base.draftId, revision: 10, legality: { valid: false }, counts: { drawPile: 0 } });
        expect(r.headers['cache-control']).toBe('no-store');
        const after = await pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users');
        expect(after.rows).toEqual(before.rows);
    });
    it('resolves catalog values, quantities and one pre-placed copy independently of browser fields', async () => {
        const pool = DataSourceConfig.getInstance().getPool();
        const cards = await pool.query('SELECT id, power_type FROM power_cards ORDER BY id LIMIT 1');
        const card = cards.rows[0];
        const r = await request(app).post('/api/v1/decks/evaluate').send({ ...base, cards: [{ type: 'power', cardId: card.id, quantity: 8, exclude_from_draw: true }] }).expect(200);
        expect(r.body.data.counts).toEqual({ physicalPlayable: 8, drawPile: 7, prePlaced: 1, exportCards: 8 });
        expect(r.body.data.capabilities.drawHand).toBe(true);
        await request(app).post('/api/v1/decks/evaluate').send({ ...base, cards: [{ type: 'power', cardId: card.id, quantity: 8, power_type: 'Energy' }] }).expect(400);
    });
    it('rejects malformed identities, quantities, forged validity and unsupported format without persistence', async () => {
        for (const patch of [{ cards: [{ type: 'power', cardId: 'absent', quantity: 1 }] }, { cards: [{ type: 'power', cardId: 'absent', quantity: 1.5 }] }, { is_valid: true }, { format: 'skirmish' }])
            await request(app).post('/api/v1/decks/evaluate').send({ ...base, ...patch }).expect(400);
    });
    it('saves editable invalid owned drafts with the same raw validity as preview and ignores client is_valid', async () => {
        const user = await integrationTestUtils.createTestUser({ name: 'M3FictionalOwner', email: 'm3-owner@example.test', password: 'Fictional-test-only-123' });
        const login = await request(app).post('/api/auth/login').send({ username: user.username, password: 'Fictional-test-only-123' }).expect(200);
        const cookie = (login.headers['set-cookie'] as unknown as string[]).map(v => v.split(';')[0]).join('; ');
        const created = await request(app).post('/api/v1/decks').set('Cookie', cookie).send({ name: 'M3 invalid draft' }).expect(201);
        const id = created.body.data.id;
        integrationTestUtils.trackTestDeck(id);
        const saved = await request(app).put('/api/v1/decks/' + id + '/cards').set('Cookie', cookie).send({ cards: [] }).expect(200);
        const preview = await request(app).post('/api/v1/decks/evaluate').send(base).expect(200);
        expect(saved.body.data.metadata.is_valid).toBe(preview.body.data.legality.rawValid);
        await request(app).put('/api/v1/decks/' + id).set('Cookie', cookie).send({ is_valid: true, is_limited: true }).expect(200);
        const full = await request(app).get('/api/v1/decks/' + id + '/full').expect(200);
        expect(full.body.data.metadata.is_valid).toBe(false);
        expect(full.body.data.metadata.is_limited).toBe(true);
        const limited = await request(app).post('/api/v1/decks/evaluate').send({ ...base, limited: true }).expect(200);
        expect(limited.body.data.legality).toMatchObject({ valid: true, rawValid: false });
    });
});

async function assertResponseEvaluation(response: request.Response) {
    const deck = response.body.data;
    const groups = new Map<string, { type: string; cardId: string; quantity: number; exclude_from_draw: boolean }>();
    for (const c of deck.cards) {
        const key = c.type + '_' + c.cardId;
        const prev = groups.get(key);
        if (prev) { prev.quantity += c.quantity; prev.exclude_from_draw ||= c.exclude_from_draw === true; }
        else groups.set(key, { type: c.type, cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true });
    }
    const input = { ...base, draftId: deck.metadata.id, revision: 0, cards: [...groups.values()], limited: deck.metadata.is_limited ?? false, reserveCharacterId: deck.metadata.reserve_character ?? null };
    const expected = await request(app).post('/api/v1/decks/evaluate').send(input).expect(200);
    expect(deck.evaluation).toEqual(expected.body.data);
    expect(deck.evaluation.inputKey).toBe(evaluationInputKey(input));
    expect(response.headers['cache-control']).toBe('no-store');
}

describe('Deck response evaluation through real HTTP/service/repository wiring', () => {
    it('attaches exact stats to owned creation, GET/full, metadata, add, replace and remove responses', async () => {
        const user = await integrationTestUtils.createTestUser({ name: 'M3ResponseOwner', email: 'm3-response@example.test', password: 'Fictional-response-test-123' });
        const login = await request(app).post('/api/auth/login').send({ username: user.username, password: 'Fictional-response-test-123' }).expect(200);
        const cookie = (login.headers['set-cookie'] as unknown as string[]).map(v => v.split(';')[0]).join('; ');
        const characterId = (await DataSourceConfig.getInstance().getPool().query('SELECT id FROM characters WHERE energy >= 1 ORDER BY id LIMIT 1')).rows[0].id;
        const created = await request(app).post('/api/v1/decks').set('Cookie', cookie).send({ name: 'Response stats fixture', characters: [characterId] }).expect(201);
        const id = created.body.data.id;
        integrationTestUtils.trackTestDeck(id);
        // Creation remains a flat compatible Deck with additional detail/evaluation fields.
        const preview = await request(app).post('/api/v1/decks/evaluate').send({ ...base, draftId: id, revision: 0, cards: created.body.data.cards.map((c: { type: string; cardId: string; quantity: number }) => ({ type: c.type, cardId: c.cardId, quantity: c.quantity })) }).expect(200);
        expect(created.body.data.cards).toHaveLength(1);
        expect(created.body.data.evaluation).toEqual(preview.body.data);
        await assertResponseEvaluation(await request(app).get('/api/v1/decks/' + id).expect(200));
        await assertResponseEvaluation(await request(app).get('/api/v1/decks/' + id + '/full').expect(200));
        const powerId = (await DataSourceConfig.getInstance().getPool().query("SELECT id FROM power_cards WHERE value = 1 AND power_type = 'Energy' ORDER BY id LIMIT 1")).rows[0].id;
        const row = { cardType: 'power', cardId: powerId, quantity: 2 };
        await assertResponseEvaluation(await request(app).post('/api/v1/decks/' + id + '/cards').set('Cookie', cookie).send(row).expect(200));
        const metadata = await request(app).put('/api/v1/decks/' + id).set('Cookie', cookie).send({ is_limited: true }).expect(200);
        expect(metadata.body.data.cards.length).toBeGreaterThan(0);
        await assertResponseEvaluation(metadata);
        await assertResponseEvaluation(await request(app).put('/api/v1/decks/' + id + '/cards').set('Cookie', cookie).send({ cards: [{ ...row, quantity: 8, exclude_from_draw: true }] }).expect(200));
        await assertResponseEvaluation(await request(app).delete('/api/v1/decks/' + id + '/cards').set('Cookie', cookie).send({ ...row, quantity: 1 }).expect(200));
    });
    it('attaches exact stats to session-scoped Guest creation, read, metadata, replacement and addition', async () => {
        const user = await integrationTestUtils.createTestUser({ name: 'M3ResponseGuest', email: 'm3-response-guest@example.test', role: 'GUEST', password: 'test-password' });
        const login = await request(app).post('/api/auth/login').send({ username: user.username, password: 'test-password' }).expect(200);
        const cookie = (login.headers['set-cookie'] as unknown as string[]).map(v => v.split(';')[0]).join('; ');
        const path = '/api/v1/guest/decks';
        const created = await request(app).post(path).set('Cookie', cookie).send({ name: 'Session response fixture' }).expect(201);
        const id = created.body.data.id;
        try {
            await assertResponseEvaluation(created);
            await assertResponseEvaluation(await request(app).get(path + '/' + id).set('Cookie', cookie).expect(200));
            const powerId = (await DataSourceConfig.getInstance().getPool().query("SELECT id FROM power_cards WHERE value = 1 AND power_type = 'Energy' ORDER BY id LIMIT 1")).rows[0].id;
            const characterId = (await DataSourceConfig.getInstance().getPool().query('SELECT id FROM characters WHERE energy >= 1 ORDER BY id LIMIT 1')).rows[0].id;
            const row = { cardType: 'power', cardId: powerId, quantity: 8, exclude_from_draw: true };
            await assertResponseEvaluation(await request(app).put(path + '/' + id + '/cards').set('Cookie', cookie).send({ cards: [{ cardType: 'character', cardId: characterId, quantity: 1 }, row] }).expect(200));
            await assertResponseEvaluation(await request(app).put(path + '/' + id).set('Cookie', cookie).send({ name: 'Renamed fixture' }).expect(200));
            await assertResponseEvaluation(await request(app).post(path + '/' + id + '/cards').set('Cookie', cookie).send({ cardType: 'power', cardId: powerId, quantity: 1 }).expect(200));
        } finally {
            await request(app).delete(path + '/' + id).set('Cookie', cookie).expect(200);
        }
    });
});
