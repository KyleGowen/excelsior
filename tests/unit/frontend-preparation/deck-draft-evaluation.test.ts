import { evaluationInputKey } from '../../../src/services/deck-evaluation/draftInput';
import { DeckDraftEvaluationService, DraftStructureError } from '../../../src/api/services/deckDraftEvaluationService';
import { DeckValidationService } from '../../../src/services/deckValidationService';
import type { CardRepository } from '../../../src/repository/CardRepository';
import { EvaluateDraftRequestBody } from '../../../src/api/http/models/decks/EvaluateDraftRequestBody';
import { ThreatLevelRule } from '../../../src/services/deck-validation/rules/threat-level.rule';
import { DeckValidationRuleList } from '../../../src/services/deck-validation/deck-validation-rule-list';
import { DeckSizeRule } from '../../../src/services/deck-validation/rules/deck-size.rule';
const characters = [
    { id: 'victory', name: 'Victory Harben', energy: 6, combat: 6, brute_force: 3, intelligence: 8, threat_level: 26 },
    { id: 'john', name: 'John Carter of Mars', energy: 6, combat: 7, brute_force: 6, intelligence: 4, threat_level: 18 },
    { id: 'time', name: 'Time Traveler', energy: 7, combat: 3, brute_force: 2, intelligence: 7, threat_level: 17 },
    { id: 'lancelot', name: 'Lancelot', energy: 5, combat: 6, brute_force: 4, intelligence: 6, threat_level: 14 },
];
const catalog = new Map<string, Record<string, unknown>>(characters.map(c => ['character_' + c.id, c]));
catalog.set('location_home', { id: 'home', name: 'Fictional homebase', threat_level: 2 });
catalog.set('special_sword', { id: 'sword', name: 'Sword and Shield', character: 'Lancelot', icons: ['Combat'] });
catalog.set('power_combat', { id: 'combat', value: 5, power_type: 'Combat' });
const cards = [...characters.map(c => ({ type: 'character', cardId: c.id, quantity: 1 })), { type: 'location', cardId: 'home', quantity: 1 }, { type: 'special', cardId: 'sword', quantity: 3, exclude_from_draw: true }, { type: 'power', cardId: 'combat', quantity: 5 }];
const input = () => EvaluateDraftRequestBody.parse({ schemaVersion: 1, draftId: 'fictional-unsaved', revision: 7, cards, reserveCharacterId: 'victory' });
const rules = DeckValidationRuleList.of(new ThreatLevelRule(), new DeckSizeRule());
const validator = new DeckValidationService({} as CardRepository, rules);
const resolveCatalog = jest.fn(async () => new Map(catalog));
const service = new DeckDraftEvaluationService({ resolveCatalog, validateResolvedDeck: validator.validateResolvedDeck.bind(validator) });
describe('Authoritative draft evaluation compatibility', () => {
    it('preserves separate threat/count/icon/export and printed/effective grid meanings without persistence', async () => {
        const r = await service.evaluate(input());
        expect(r).toMatchObject({ draftId: 'fictional-unsaved', revision: 7, threat: { editor: 71, legality: 77 }, counts: { physicalPlayable: 8, drawPile: 7, prePlaced: 1, exportCards: 8 }, icons: { energy: 0, combat: 8, bruteForce: 0, intelligence: 0 }, capabilities: { drawHand: true }, legality: { valid: false, rawValid: false } });
        expect(r.grids.printedMaximums).toEqual({ energy: 7, combat: 7, bruteForce: 6, intelligence: 8 });
        expect(r.grids.editorMaximums).toEqual(r.grids.printedMaximums);
        expect(r.grids.effectiveMaximums).toEqual({ energy: 7, combat: 7, bruteForce: 8, intelligence: 8 });
        expect(r.versions.catalog).toMatch(/^[0-9a-f]{64}$/);
        expect(resolveCatalog).toHaveBeenCalled();
    });
    it('preserves KO overrides and starting team context while keeping reserve threat unchanged', async () => {
        const r = await service.evaluate({ ...input(), koCharacterIds: ['victory', 'time'] });
        expect(r.grids.editorMaximums).toEqual({ energy: 6, combat: 7, bruteForce: 8, intelligence: 6 });
        expect(r.grids.characters.find(c => c.cardId === 'victory')?.active).toBe(false);
        expect(r.threat.editor).toBe(71);
    });
    it('reports Limited separately from raw server validity and rules', async () => {
        const r = await service.evaluate({ ...input(), limited: true });
        expect(r.legality).toMatchObject({ valid: true, rawValid: false });
        expect(r.legality.reasons.length).toBeGreaterThan(0);
    });
    it('evaluates an empty unsaved/Guest draft rather than using a saved legal flag', async () => {
        const r = await service.evaluate({ ...input(), cards: [], reserveCharacterId: null });
        expect(r.counts.drawPile).toBe(0);
        expect(r.legality.valid).toBe(false);
    });
    it.each(['reserve', 'ko', 'unknown', 'duplicate'])('rejects structural %s before evaluation', async (kind) => {
        const i = input();
        if (kind === 'reserve')
            i.reserveCharacterId = 'absent';
        if (kind === 'ko')
            i.koCharacterIds = ['absent'];
        if (kind === 'unknown')
            i.cards[0].cardId = 'absent';
        if (kind === 'duplicate')
            i.cards.push({ ...i.cards[0] });
        await expect(service.evaluate(i)).rejects.toBeInstanceOf(DraftStructureError);
    });
    it('propagates unavailable catalog/rule evaluation rather than issuing a fresh legal result', async () => {
        const failing = new DeckDraftEvaluationService({ resolveCatalog: async () => { throw new Error('offline'); }, validateResolvedDeck: jest.fn() });
        await expect(failing.evaluate(input())).rejects.toThrow('offline');
    });
    it.each([0, -1, 1.5, 101])('rejects invalid quantity %s', quantity => expect(() => EvaluateDraftRequestBody.parse({ ...input(), cards: [{ type: 'special', cardId: 'sword', quantity }] })).toThrow());
    it('applies the structural quantity bound before saved validation after coalescing instances', async () => {
        const card = { id: 'instance', type: 'power' as const, cardId: 'combat', quantity: 60 };
        await expect(service.validateForPersistence([card, { ...card, id: 'second' }])).rejects.toBeInstanceOf(DraftStructureError);
        await expect(service.validateForPersistence([{ ...card, quantity: 50 }, { ...card, id: 'second', quantity: 50 }])).resolves.toBeInstanceOf(Array);
    });
    it('rejects client catalog values, admin flags and unsupported format', () => {
        for (const patch of [{ is_valid: true }, { role: 'ADMIN' }, { format: 'skirmish' }, { cards: [{ type: 'character', cardId: 'victory', quantity: 1, threat_level: 0 }] }])
            expect(EvaluateDraftRequestBody.safeParse({ ...input(), ...patch }).success).toBe(false);
    });
});

describe('Evaluation attached to a returned deck', () => {
    const view = () => ({ metadata: { id: 'fictional-response', is_limited: true, reserve_character: 'victory' }, cards: cards.map((c, i) => ({ ...c, id: String(i), type: c.type as import('../../../src/types').DeckCard['type'] })) });
    it('evaluates exactly the returned cards/settings and echoes a complete input identity', async () => {
        const response = await service.attach(view());
        expect(response.evaluation?.inputKey).toBe(evaluationInputKey({ ...input(), draftId: response.metadata.id, limited: true, koCharacterIds: [] }));
        expect(response.evaluation?.counts.drawPile).toBe(7);
        expect(response.evaluation?.legality).toMatchObject({ valid: true, rawValid: false });
    });
    it('clones session/repository state before awaiting the catalog', async () => {
        let resolve: (v: typeof catalog) => void = () => {};
        const delayed = new DeckDraftEvaluationService({ resolveCatalog: () => new Promise(r => { resolve = r; }), validateResolvedDeck: validator.validateResolvedDeck.bind(validator) });
        const source = view();
        const pending = delayed.attach(source);
        source.cards.length = 0;
        source.metadata.is_limited = false;
        resolve(catalog);
        const response = await pending;
        expect(response.cards).toHaveLength(cards.length);
        expect(response.metadata.is_limited).toBe(true);
        expect(response.evaluation?.counts.drawPile).toBe(7);
    });
    it('keeps the exact deck readable with explicit unchecked stats when the catalog is unavailable', async () => {
        const failed = new DeckDraftEvaluationService({ resolveCatalog: async () => { throw new Error('private internal detail'); }, validateResolvedDeck: jest.fn() });
        const source = view();
        const response = await failed.attach(source);
        expect(response.cards).toEqual(source.cards);
        expect(response.evaluation).toBeNull();
        expect(response.evaluationError).toBe('DRAFT_EVALUATION_UNAVAILABLE');
        expect(JSON.stringify(response)).not.toContain('private internal detail');
    });
    it('identifies every metric input, but not transport revision, and normalizes type/KO spellings', () => {
        const original = input();
        const key = evaluationInputKey(original);
        expect(evaluationInputKey({ ...original, revision: 999 } as typeof original)).toBe(key);
        for (const patch of [{ limited: true }, { reserveCharacterId: null }, { koCharacterIds: ['victory'] }, { draftId: 'other' }, { cards: original.cards.map((c, i) => i ? c : { ...c, quantity: 2 }) }, { cards: original.cards.map((c, i) => i === 5 ? { ...c, exclude_from_draw: false } : c) }]) {
            expect(evaluationInputKey({ ...original, ...patch })).not.toBe(key);
        }
        expect(evaluationInputKey({ ...original, koCharacterIds: ['time', 'victory'] })).toBe(evaluationInputKey({ ...original, koCharacterIds: ['victory', 'time', 'time'] }));
    });
});
