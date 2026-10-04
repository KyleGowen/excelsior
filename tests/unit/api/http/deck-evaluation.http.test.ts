import express from 'express';
import request from 'supertest';
import { registerDeckEvaluationV1HttpRoutes } from '../../../../src/api/http/deck-evaluation.http';
import { DeckDraftEvaluationService, DraftStructureError } from '../../../../src/api/services/deckDraftEvaluationService';
import { resetV1RateLimitBucketsForTests } from '../../../../src/api/http/middleware/v1RateLimit';
const body = { schemaVersion: 1, draftId: 'fictional-draft', revision: 1, cards: [] };
describe('Stateless draft evaluation HTTP', () => {
    const evaluate = jest.fn();
    const app = express();
    app.use(express.json());
    registerDeckEvaluationV1HttpRoutes(app, { evaluate } as unknown as DeckDraftEvaluationService);
    beforeEach(() => { evaluate.mockReset(); resetV1RateLimitBucketsForTests(); delete process.env.DISABLE_ZOD_V1; });
    afterEach(() => { delete process.env.DISABLE_ZOD_V1; });
    it('returns a no-store result for an unauthenticated unsaved draft', async () => {
        evaluate.mockResolvedValue({ draftId: body.draftId, revision: 1, legality: { valid: false } });
        const r = await request(app).post('/decks/evaluate').send(body).expect(200);
        expect(r.body.data.legality.valid).toBe(false);
        expect(r.headers['cache-control']).toBe('no-store');
        expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({ cards: [], limited: false, format: 'venture' }));
    });
    it('rejects malformed input without calling the domain service', async () => { await request(app).post('/decks/evaluate').send({ cards: 'bad' }).expect(400); expect(evaluate).not.toHaveBeenCalled(); });
    it('keeps contract validation active under the historical zod kill switch', async () => { process.env.DISABLE_ZOD_V1 = '1'; await request(app).post('/decks/evaluate').send({ cards: 'bad' }).expect(400); expect(evaluate).not.toHaveBeenCalled(); });
    it('distinguishes structure rejection from editable invalid legality', async () => { evaluate.mockRejectedValue(new DraftStructureError('Absent identity')); const r = await request(app).post('/decks/evaluate').send(body).expect(400); expect(r.body.errors[0].code).toBe('DRAFT_STRUCTURE_INVALID'); });
    it('returns unavailable rather than successful validation when catalog/rules fail', async () => { evaluate.mockRejectedValue(new Error('private internal detail')); const r = await request(app).post('/decks/evaluate').send(body).expect(503); expect(r.body.data).toBeNull(); expect(JSON.stringify(r.body)).not.toContain('private internal detail'); });
    it('limits repeated evaluation without persistence', async () => { evaluate.mockResolvedValue({}); for (let i = 0; i < 120; i++)
        await request(app).post('/decks/evaluate').send(body).expect(200); const r = await request(app).post('/decks/evaluate').send(body).expect(429); expect(r.headers['retry-after']).toBeDefined(); });
});
