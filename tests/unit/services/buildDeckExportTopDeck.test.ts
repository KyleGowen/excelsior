import type { CatalogCard, DeckCardEntry } from '../../../src/services/deck-preview/types';
import { buildDeckExportTopDeck } from '../../../src/services/deck-preview/buildDeckExportTopDeck';
import { countCardsInDeck } from '../../../src/services/deck-evaluation/deckCounts';
import { calculateDeckTotalThreat } from '../../../src/services/deck-evaluation/deckThreat';

type Fixture = { type: string; catalog: CatalogCard; quantity?: number; placed?: boolean };

function input(fixtures: Fixture[], reserveCharacterId: string | null = null): Parameters<typeof buildDeckExportTopDeck>[0] {
  const cards = fixtures.map(({ type, catalog, quantity = 1, placed = false }) => ({
      type: type as DeckCardEntry['type'], cardId: catalog.id, quantity, exclude_from_draw: placed,
    }));
  const cardIndex = new Map(fixtures.map(f => [`${f.type.replace(/_/g, '-').toString()}:${f.catalog.id}`, f.catalog]));
  return {
    cards, cardIndex, totalCards: countCardsInDeck(cards),
    totalThreat: calculateDeckTotalThreat(cards, reserveCharacterId, (type, id) => cardIndex.get(`${type}:${id}`)),
    reserveCharacterId,
  };
}

describe('buildDeckExportTopDeck', () => {
  it('follows the observed grouped list with quantities, printing codes, and explicit reserve roles', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'character', catalog: { id: 'mob', name: 'Angry Mob (Middle Ages)', set: 'ERB' } },
      { type: 'character', catalog: { id: 'reserve', name: 'Cthulhu', set: 'ERB' } },
      { type: 'location', catalog: { id: 'base', name: 'The Round Table', set: 'ERB' } },
      { type: 'special', catalog: { id: 'special', name: 'Network of Fanatics', character: 'Cthulhu', set: 'ERB' }, quantity: 3 },
      { type: 'special', catalog: { id: 'any', name: 'Fairy Protection', character: 'Any Character', is_cataclysm: true, set: 'ERB' } },
      { type: 'power', catalog: { id: 'power', name: '8 - Energy', value: 8, power_type: 'Energy', set: 'SKY' }, quantity: 2 },
    ], 'reserve'));
    expect(result).toBe([
      'Cards: 6/51 | Threat: 0/76', '',
      '-- Characters --',
      '1x Angry Mob: Middle Ages [ERB] [Frontline]',
      '1x Cthulhu [ERB] [Reserve]',
      '', '-- Location --', '1x The Round Table [ERB] [Homebase]',
      '', '-- Special Cards --', '3x CTHULHU: Network of Fanatics [ERB]',
      '', '-- Any Character Cards --', '1x ANY CHARACTER: cata: Fairy Protection [ERB]',
      '', '-- Power Cards --', '2x 8 Energy [SKY]',
    ].join('\n'));
    expect(result).not.toContain('~Deck');
  });

  it('uses mission-set summaries and the recurring Modern Universe labels', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'mission', catalog: { id: 'm1', name: 'Mission One', mission_set: 'King of the Jungle' } },
      { type: 'mission', catalog: { id: 'm2', name: 'Mission Two', mission_set: 'King of the Jungle' }, quantity: 2 },
      { type: 'mission', catalog: { id: 'm3', name: 'Mission Three', mission_set: 'The Call of Cthulhu' } },
      { type: 'battleground', catalog: { id: 'bg', name: 'Arena' } },
      { type: 'event', catalog: { id: 'event', name: 'Desperate Gamble' } },
      { type: 'aspect', catalog: { id: 'aspect', card_name: 'Isis' } },
      { type: 'advanced_universe', catalog: { id: 'advanced', name: 'Divine Weapon', character: 'Ra' } },
      { type: 'teamwork', catalog: { id: 'teamwork', name: 'Teamwork', to_use: '7 Intelligence', acts_as: '4', follow_up_attack_types: 'Energy/Brute Force' } },
      { type: 'ally_universe', catalog: { id: 'ally', card_name: 'Hera', stat_to_use: '7 or higher', stat_type_to_use: 'Energy' } },
      { type: 'training', catalog: { id: 'training', card_name: 'Training', type_1: 'Combat', type_2: 'Intelligence', bonus: '+4' } },
      { type: 'basic_universe', catalog: { id: 'basic', card_name: 'Ray Gun', type: 'Energy', value_to_use: '6 or greater', bonus: '+2' } },
    ]));
    expect(result).toContain('-- Location --\n1x Arena [Battleground]');
    expect(result).not.toContain('-- Battlegrounds --');
    expect(result).toContain('King of the Jungle - Mission Set\nThe Call of Cthulhu - Mission Set');
    expect(result).not.toContain('1x Mission One');
    expect(result.match(/King of the Jungle - Mission Set/g)).toHaveLength(1);
    expect(result).toContain('1x RA: Divine Weapon');
    expect(result).toContain('1x Teamwork 7 Intelligence, acts as 4; Energy/Brute Force');
    expect(result).toContain('1x Hera');
    expect(result).toContain('1x Training Combat Intelligence');
    expect(result).toContain('1x Ray Gun');
    expect(result).not.toContain('to use');
    expect(result).toContain('-- Events --\n1x Desperate Gamble');
    expect(result).toContain('-- Other Cards --\n1x Isis');
    expect(result).not.toContain('[ERB]');
  });

  it('moves exactly one pre-placed copy beneath its eligible location without losing the other copies', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'location', catalog: { id: 'base', name: 'Spartan Training Ground', set: 'ERB' } },
      { type: 'training', catalog: { id: 'training', card_name: 'Training', set: 'ERB' }, quantity: 3, placed: true },
    ]));
    expect(result).toBe('Cards: 2/51 | Threat: 0/76\n\n-- Location --\n1x Spartan Training Ground [ERB] [Homebase]\n  → Training [ERB] (on location)\n\n-- Universe Cards --\n2x Training [ERB]');
  });

  it('keeps a placement annotation when the saved data cannot identify a unique location', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'location', catalog: { id: 'a', name: 'Spartan Training Ground' } },
      { type: 'location', catalog: { id: 'b', name: 'Teen Team Headquarters' } },
      { type: 'training', catalog: { id: 'training', card_name: 'Training' }, quantity: 2, placed: true },
      { type: 'special', catalog: { id: 'sword', name: 'Sword and Shield', character: 'Lancelot' }, quantity: 3, placed: true },
    ]));
    expect(result).toContain('1x Training [Pre-Placed]\n1x Training');
    expect(result).toContain('1x LANCELOT: Sword and Shield [Pre-Placed]\n2x LANCELOT: Sword and Shield');
    expect(result).not.toContain('(on location)');
  });

  it('combines repeated rows, preserves missing-catalog names, and does not mutate saved entries', () => {
    const value = input([
      { type: 'power', catalog: { id: 'p', name: '8 - Energy' } },
      { type: 'power', catalog: { id: 'p', name: '8 - Energy' }, quantity: 2 },
    ]);
    value.cards.push({ type: 'aspect', cardId: 'missing', name: 'Saved\nCard Name', quantity: 1, exclude_from_draw: false });
    const before = JSON.stringify(value.cards);
    const result = buildDeckExportTopDeck(value);
    expect(result).toContain('3x 8 Energy');
    expect(result).toContain('1x Saved Card Name');
    expect(result).not.toContain('[ERB]');
    expect(JSON.stringify(value.cards)).toBe(before);
  });

  it('does not fabricate cards or empty headings for an empty/zero-quantity deck', () => {
    expect(buildDeckExportTopDeck(input([]))).toBe('');
    expect(buildDeckExportTopDeck(input([{ type: 'power', catalog: { id: 'p', name: '8 Energy' }, quantity: 0 }]))).toBe('');
  });

  it('uses the saved draw count and threat, and the Modern minimum when events are present', () => {
    const value = input([
      { type: 'event', catalog: { id: 'event', name: 'The Giant Man of Mars' } },
      { type: 'power', catalog: { id: 'power', name: '8 - Energy' }, quantity: 55 },
    ]);
    value.totalThreat = 76;
    expect(buildDeckExportTopDeck(value)).toMatch(/^Cards: 56\/56 \| Threat: 76\/76\n/);
    value.cards[0]!.quantity = 0;
    value.totalCards = 55;
    expect(buildDeckExportTopDeck(value)).toMatch(/^Cards: 55\/51 \| Threat: 76\/76\n/);
  });

  it('nests only catalog-confirmed G.D.A. specials under their Battleground, preserving every copy', () => {
    const value = input([
      { type: 'battleground', catalog: { id: 'gda', name: 'Global Defense Agency', set: 'SKY' } },
      { type: 'location', catalog: { id: 'base', name: 'The Round Table', set: 'ERB' } },
      { type: 'special', catalog: { id: 'robot', name: 'Robot', character: 'Any Character', set: 'SKY', set_number: '365' }, quantity: 2 },
      { type: 'special', catalog: { id: 'other', name: 'Disorient Opponent', character: 'Any Character', set: 'ERB' } },
      { type: 'special', catalog: { id: 'character', name: 'Deploy Drones', character: 'Robot', set: 'SKY', set_number: '365' } },
    ]);
    const before = JSON.stringify(value.cards);
    const result = buildDeckExportTopDeck(value);
    expect(result).toContain('1x G.D.A. Battleground [SKY] [Battleground]\n  → 2x Robot [SKY] (battleground special)');
    expect(result).toContain('1x ANY CHARACTER: DB: Disorient Opponent [ERB]');
    expect(result).toContain('1x ROBOT: Deploy Drones [SKY]');
    expect(result).not.toContain('ANY CHARACTER: Robot');
    expect(JSON.stringify(value.cards)).toBe(before);
    value.cards = value.cards.filter(entry => entry.type !== 'battleground');
    expect(buildDeckExportTopDeck(value)).toContain('2x ANY CHARACTER: Robot [SKY]');
  });

  it('uses abbreviated subtypes, verified effect codes, and no invented code for an unknown special', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'special', catalog: { id: 'a', name: 'Draconic Leadership', character: 'Any Character', is_assist: true } },
      { type: 'special', catalog: { id: 'b', name: 'Bodhisattva: Enlightened One', character: 'Any Character', is_ambush: true } },
      { type: 'special', catalog: { id: 'c', name: "Merlin's Magic", character: 'Any Character' } },
      { type: 'special', catalog: { id: 'd', name: 'An Unknown Special', character: 'Any Character' } },
    ]));
    expect(result).toContain('ANY CHARACTER: assist: Draconic Leadership');
    expect(result).toContain('ANY CHARACTER: ambush: Bodhisattva: Enlightened One');
    expect(result).toContain("ANY CHARACTER: ZZ: Merlin's Magic");
    expect(result).toContain('1x ANY CHARACTER: An Unknown Special');
    expect(result).not.toContain('ANY CHARACTER::');
  });

  it('matches the compact power types and Any-Power teamwork convention', () => {
    const result = buildDeckExportTopDeck(input([
      { type: 'power', catalog: { id: 'a', name: '6 - Any-Power', value: 6, power_type: 'Any-Power' } },
      { type: 'power', catalog: { id: 'm', name: '5 - Multi Power', value: 5, power_type: 'Multi Power' } },
      { type: 'power', catalog: { id: 'b', name: '2 - Brute Force', value: 2, power_type: 'Brute Force' } },
      { type: 'teamwork', catalog: { id: 'tw', name: '6 Any-Power', to_use: '6 Any-Power', acts_as: '6 Attack', followup_attack_types: 'Any-Power / Any-Power' } },
      { type: 'teamwork', catalog: { id: 'tw2', name: '6 Energy', to_use: '6 Energy', acts_as: '4 Attack', followup_attack_types: 'Brute Force + Intelligence' } },
      { type: 'teamwork', catalog: { id: 'tw3', name: '6 Brute Force', to_use: '6 Brute Force', acts_as: '4 Attack', followup_attack_types: 'Energy + Intelligence' } },
    ]));
    expect(result).toContain('1x 6 Anypower');
    expect(result).toContain('1x 5 Multipower');
    expect(result).toContain('1x 2 Bruteforce');
    expect(result).toContain('1x Teamwork 6 Anypower');
    expect(result).not.toContain('acts as 6');
    expect(result).toContain('1x Teamwork 6 Energy, acts as 4; Brute Force/Intelligence');
    expect(result).toContain('1x Teamwork 6 Brute Force, acts as 4; Energy/Intelligence');
  });

  it('retains mission names when a missing catalog prevents a set summary', () => {
    const value = input([]);
    value.cards.push({ type: 'mission', cardId: 'missing', name: 'Unknown Mission', quantity: 1 });
    expect(buildDeckExportTopDeck(value)).toContain('-- Mission --\n1x Unknown Mission');
  });
});
