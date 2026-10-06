import { api } from '../../../frontend/src/lib/api/client';
import type { CatalogCard, DeckCardEntry, DeckListItem } from '../../../frontend/src/lib/api/types';
import { buildDeckCardIndex } from '../../../frontend/src/lib/decks/deckCardCatalog';
import { calculateDeckTotalThreat } from '../../../src/services/deck-preview/../deck-evaluation/deckThreat';
import { buildCharStatsById, deckMaxStats } from '../../../tests/helpers/serverGridCharacterization';
import { buildKoDimmingContext, calculateActiveTeamStats } from '../../../src/services/deck-preview/simulateKo';
import { countCardsInDeck, countPlayableCards, canDrawHand, buildDrawPile, drawRandomHand } from '../../../src/services/deck-preview/drawHand';
import { aggregateInstancesForSave, expandDeckToInstances } from '../../../frontend/src/lib/decks/deckInstances';
import { calculateDeckIconTotals } from '../../../src/services/deck-preview/../deck-evaluation/iconTotals';
import { buildDeckExportJson } from '../../../src/services/deck-preview/buildDeckExportJson';
import { buildDeckValidationContext } from '../../../src/services/deck-validation/deck-validation-context';
import { ThreatLevelRule } from '../../../src/services/deck-validation/rules/threat-level.rule';
import { importDeckFromJson } from '../../../frontend/src/lib/decks/importDeckFromJson';

// Fictional IDs and deliberately synthetic statistics isolate compatibility
// meanings from mutable catalog rows. They are not real printed card values.
const characters: CatalogCard[] = [
  { id: 'baseline-victory', name: 'Victory Harben', energy: 6, combat: 6, brute_force: 3, intelligence: 8, threat_level: 26 },
  { id: 'baseline-john', name: 'John Carter of Mars', energy: 6, combat: 7, brute_force: 6, intelligence: 4, threat_level: 18 },
  { id: 'baseline-time', name: 'Time Traveler', energy: 7, combat: 3, brute_force: 2, intelligence: 7, threat_level: 17 },
  { id: 'baseline-lancelot', name: 'Lancelot', energy: 5, combat: 6, brute_force: 4, intelligence: 6, threat_level: 14 },
];
const location: CatalogCard = { id: 'baseline-home', name: 'Fictional homebase', threat_level: 2 };
const sword: CatalogCard = { id: 'baseline-sword', name: 'Sword and Shield', character: 'Lancelot', icons: ['Combat'] };
const power: CatalogCard = { id: 'baseline-power', name: '5 - Combat', value: 5, power_type: 'Combat' };
const event: CatalogCard = { id: 'baseline-event', name: 'Fictional event' };
const index = buildDeckCardIndex(['character', 'location', 'special', 'power', 'event'], [characters, [location], [sword], [power], [event]]);
const cards: DeckCardEntry[] = [
  ...characters.map(c => ({ type: 'character' as const, cardId: c.id, quantity: 1 })),
  { type: 'location', cardId: location.id, quantity: 1 },
  { type: 'special', cardId: sword.id, quantity: 3, exclude_from_draw: true },
  { type: 'power', cardId: power.id, quantity: 5 },
];
const lookup = (_type: string, id: string) => index.get(id);

describe('Frontend preparation compatibility baseline', () => {
  it('records editor reserve threat separately from backend legality threat', () => {
    expect(calculateDeckTotalThreat(cards, 'baseline-victory', lookup)).toBe(71);
    expect(calculateDeckTotalThreat(cards, null, lookup)).toBe(77);
    const available = new Map(cards.map(c => [`${c.type}_${c.cardId}`, lookup(c.type, c.cardId) as Record<string, unknown>]));
    const serverCards = cards.map((c, i) => ({ ...c, id: `baseline-row-${i}` }));
    expect(new ThreatLevelRule().validate(buildDeckValidationContext(serverCards, available))).toEqual([
      { rule: 'threat_level', message: 'Deck threat level must be 76 or less (found 77)' },
    ]);
  });

  it('records ordinary printed-grid maxima separately from KO effective maxima', () => {
    const deck: DeckListItem = { metadata: { id: 'baseline-deck', name: 'Baseline', cardCount: 7, userId: 'baseline-owner', isOwner: true }, cards };
    expect(deckMaxStats(deck, buildCharStatsById(characters))).toEqual({ energy: 7, combat: 7, bruteForce: 6, intelligence: 8 });
    expect(calculateActiveTeamStats(buildKoDimmingContext(cards, index, new Set()))).toEqual({ energy: 7, combat: 7, bruteForce: 8, intelligence: 8 });
    expect(calculateActiveTeamStats(buildKoDimmingContext(cards, index, new Set(['baseline-victory', 'baseline-time'])))).toEqual({ energy: 6, combat: 7, bruteForce: 8, intelligence: 6 });
  });

  it('preserves one physical pre-placed copy through expansion, save aggregation, and redraw', () => {
    const instances = expandDeckToInstances(cards);
    expect(instances.filter(c => c.exclude_from_draw)).toHaveLength(1);
    expect(countPlayableCards(instances)).toBe(8);
    expect(countCardsInDeck(instances)).toBe(7);
    expect(canDrawHand(instances)).toBe(true);
    expect(buildDrawPile(instances)).toHaveLength(7);
    const saved = aggregateInstancesForSave(instances);
    expect(saved.find(c => c.cardId === sword.id)).toMatchObject({ quantity: 3, exclude_from_draw: true });
    expect(countCardsInDeck(expandDeckToInstances(saved))).toBe(7);
  });

  it('keeps pre-placed physical copies in icons and exported card lists', () => {
    const icons = calculateDeckIconTotals(cards, lookup);
    expect(icons).toEqual({ energy: 0, combat: 8, bruteForce: 0, intelligence: 0 });
    const exported = buildDeckExportJson({
      name: 'Fictional baseline', description: '', cards, cardIndex: index, reserveCharacterId: 'baseline-victory',
      maxStats: { energy: 7, combat: 7, bruteForce: 6, intelligence: 8 }, iconTotals: icons,
      totalThreat: 71, totalCards: countPlayableCards(cards), legal: false, limited: false, exportedBy: 'baseline-owner', exportTimestamp: '2026-10-03T00:00:00Z',
    });
    expect(exported).toMatchObject({ total_cards: 8, total_threat: 71, total_combat_icons: 8, reserve_character: 'Victory Harben', legal: false });
    expect(exported.cards.special_cards.Lancelot).toEqual(['Sword and Shield', 'Sword and Shield', 'Sword and Shield']);
    expect(exported.cards.power_cards).toHaveLength(5);
    expect(exported).not.toHaveProperty('exclude_from_draw');
  });

  it('retains the event-triggered ninth draw under a controlled random source', () => {
    const pile: DeckCardEntry[] = [{ type: 'event', cardId: event.id, quantity: 1 }, { type: 'power', cardId: power.id, quantity: 9 }];
    let slot = 0;
    expect(drawRandomHand(pile, { random: () => slot++ / 10 })).toHaveLength(9);
    expect(drawRandomHand([{ type: 'power', cardId: power.id, quantity: 9 }], { random: (() => { let i = 0; return () => i++ / 9; })() })).toHaveLength(8);
  });

  it('reports an atomic import rejection without starting another write', async () => {
    const post=jest.spyOn(api,'post').mockRejectedValue(new Error('Fixture save failed'));
    const result=await importDeckFromJson({exportData:{name:'Fixture import',cards:{characters:['Victory Harben']}},deckName:'Fixture import',isGuest:false});
    expect(result).toEqual({ok:false,code:'api',message:'Fixture save failed'});
    expect(post).toHaveBeenCalledTimes(1);
    post.mockRestore();
  });
});
