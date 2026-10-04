import { DeckDraftEvaluationService, DraftStructureError } from '../../../src/api/services/deckDraftEvaluationService';
import { EvaluateCandidatesRequestBody } from '../../../src/api/http/models/decks/EvaluateCandidatesRequestBody';
import { candidateInputKey } from '../../../src/services/deck-candidates/inputKey';
import { serviceScopeForOperation } from '../../../src/api/access/serviceOperations';
const characters = [
  { id: 'lancelot', name: 'Lancelot', energy: 2, combat: 7, brute_force: 5, intelligence: 4 },
  { id: 'john', name: 'John Carter of Mars', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'alpha', name: 'Alpha and the Whisperers', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'herd', name: 'Walkers: Herd', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'michonne', name: 'Michonne', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'rick', name: 'Rick Grimes', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'alexandria', name: 'Alexandria', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
  { id: 'mob', name: 'Angry Mob (Modern Age)', energy: 2, combat: 3, brute_force: 4, intelligence: 4 },
];
const catalog = new Map<string, Record<string, unknown>>(characters.map(c => ['character_' + c.id, c]));
const fixtures: Array<[string, string, Record<string, unknown>]> = [
 ['power', 'power-cards', { id: 'combat7', power_type: 'Combat', value: 7 }],
 ['power', 'power-cards', { id: 'energy8', power_type: 'Energy', value: 8 }],
 ['power', 'power-cards', { id: 'any7', power_type: 'Any-Power', value: 7 }],
 ['power', 'power-cards', { id: 'multi8', power_type: 'Multi-Power', value: 8 }],
 ['power', 'power-cards', { id: 'brute8', power_type: 'Brute Force', value: 8 }],
 ['power', 'power-cards', { id: 'int6', power_type: 'Intelligence', value: 6 }],
 ['power', 'power-cards', { id: 'combat8', power_type: 'Combat', value: 8 }],
 ['special', 'special-cards', { id: 'sword', character: 'Lancelot', one_per_deck: true }],
 ['special', 'special-cards', { id: 'other', character: 'Sherlock Holmes' }],
 ['special', 'special-cards', { id: 'gda-special', character: 'Any Character', set: 'SKY', set_number: '349' }],
 ['special', 'special-cards', { id: 'any-special', character: 'Any Character', set: 'ERB' }],
 ['special', 'special-cards', { id: 'mob-special', character: 'Angry Mob: Modern Ages' }],
 ['advanced-universe', 'advanced-universe', { id: 'advanced', character: 'Lancelot' }],
 ['teamwork', 'teamwork', { id: 'tw', to_use: '7 Any-Power' }],
 ['training', 'training', { id: 'train', type_1: 'Any-Power', type_2: 'Combat', value_to_use: '2 or less' }],
 ['basic-universe', 'basic-universe', { id: 'basic', basic_skill_type: 'Energy', value_to_use: '3 or greater' }],
 ['ally-universe', 'ally-universe', { id: 'ally', stat_type_to_use: 'Combat', stat_to_use: '7 or higher' }],
 ['event', 'events', { id: 'event', mission_set: 'Fictional set A' }],
 ['mission', 'missions', { id: 'mission', mission_set: 'Fictional set B' }],
 ['location', 'locations', { id: 'home', name: 'Fictional homebase' }],
 ['battleground', 'battlegrounds', { id: 'gda', name: 'Global Defense Agency' }],
 ['aspect', 'aspects', { id: 'aspect', location: 'Any Homebase' }],
];
for (const [type, , card] of fixtures) catalog.set(`${type.replace(/-/g, '_')}_${card.id}`, { ...card, type: type.replace(/-/g, '_') });
const service = new DeckDraftEvaluationService({ resolveCatalog: async () => new Map(catalog), validateResolvedDeck: jest.fn() });
const card = (type: string, cardId: string, quantity = 1) => ({ type, cardId, quantity });
const evaluate = async (type: string, id: string, cards = [card('character', 'lancelot')]) => {
  const input = EvaluateCandidatesRequestBody.parse({ schemaVersion: 1, revision: 9, cards, candidates: [{ catalogType: type, cardId: id }] });
  const result = await service.evaluateCandidates(input);
  expect(result.inputKey).toBe(candidateInputKey(input));
  expect(result.revision).toBe(9);
  expect(result.versions.catalog).toMatch(/^[0-9a-f]{64}$/);
  return result.candidates[0];
};
describe('Server Add Cards compatibility decisions', () => {
  it.each([['power-cards', 'combat7', true], ['power-cards', 'energy8', false], ['power-cards', 'any7', true], ['power-cards', 'multi8', true], ['special-cards', 'sword', true], ['special-cards', 'other', false], ['advanced-universe', 'advanced', true], ['teamwork', 'tw', true], ['training', 'train', true], ['basic-universe', 'basic', false], ['ally-universe', 'ally', true], ['events', 'event', true], ['aspects', 'aspect', false]] as const)('%s %s preserves usable=%s', async (type, id, usable) => {
    const decision = await evaluate(type, id);
    expect(decision.usable).toBe(usable);
    expect(decision.reasons.length).toBe(usable ? 0 : 1);
  });
  it('preserves Power overrides, Alpha exact levels, conditional Michonne, and Angry Mob variants', async () => {
    expect((await evaluate('power-cards', 'brute8', [card('character', 'john')])).usable).toBe(true);
    expect((await evaluate('power-cards', 'int6', [card('character', 'alpha')])).usable).toBe(false);
    expect((await evaluate('power-cards', 'int6', [card('character', 'alpha'), card('character', 'herd')])).usable).toBe(true);
    expect((await evaluate('power-cards', 'combat8', [card('character', 'michonne'), card('character', 'rick'), card('character', 'alexandria')])).usable).toBe(true);
    expect((await evaluate('special-cards', 'mob-special', [card('character', 'mob')])).usable).toBe(true);
  });
  it('requires matching event mission/homebase and GDA exclusions without treating Limited as permission', async () => {
    expect((await evaluate('events', 'event', [card('mission', 'mission')])).usable).toBe(false);
    expect((await evaluate('aspects', 'aspect', [card('location', 'home')])).usable).toBe(true);
    expect((await evaluate('special-cards', 'gda-special', [card('battleground', 'gda')])).usable).toBe(true);
    expect((await evaluate('special-cards', 'gda-special', [card('battleground', 'gda'), card('special', 'any-special')])).usable).toBe(false);
    expect((await evaluate('special-cards', 'any-special', [card('special', 'gda-special')])).usable).toBe(false);
  });
  it('keeps editor tile ceilings distinct from persistence rules; seven mission copies reach the existing UI limit', async () => {
    expect((await evaluate('special-cards', 'sword')).maxCopies).toBe(1);
    expect((await evaluate('power-cards', 'combat7')).maxCopies).toBe(99);
    const result = await service.evaluateCandidates(EvaluateCandidatesRequestBody.parse({ schemaVersion: 1, revision: 0, cards: [card('mission', 'mission', 7)], candidates: [] }));
    expect(result.missionLimitReached).toBe(true);
  });
  it.each(['unknown', 'duplicate', 'wrong-type'])('rejects %s without issuing fresh metadata', async kind => {
    const input = EvaluateCandidatesRequestBody.parse({ schemaVersion: 1, revision: 0, cards: [], candidates: [{ catalogType: 'characters', cardId: 'lancelot' }] });
    if (kind === 'unknown') input.cards.push(card('character', 'absent') as typeof input.cards[number]);
    if (kind === 'duplicate') input.cards.push(card('character', 'lancelot') as typeof input.cards[number], card('character', 'lancelot') as typeof input.cards[number]);
    if (kind === 'wrong-type') input.candidates[0].catalogType = 'power-cards';
    await expect(service.evaluateCandidates(input)).rejects.toBeInstanceOf(DraftStructureError);
  });
  it('rejects unbounded/forged catalog values and player privilege fields even in Guest drafts', () => {
    for (const patch of [{ role: 'ADMIN' }, { limited: true }, { candidates: Array(1501).fill({ catalogType: 'characters', cardId: 'lancelot' }) }, { cards: [{ type: 'character', cardId: 'lancelot', quantity: 1, energy: 10 }] }]) {
      expect(EvaluateCandidatesRequestBody.safeParse({ schemaVersion: 1, revision: 0, cards: [], candidates: [], ...patch }).success).toBe(false);
    }
    expect(serviceScopeForOperation('POST', '/api/v1/decks/candidates/evaluate')).toBe('decks:read');
    expect(serviceScopeForOperation('PUT', '/api/v1/decks/candidates/evaluate')).not.toBe('decks:read');
  });
});
