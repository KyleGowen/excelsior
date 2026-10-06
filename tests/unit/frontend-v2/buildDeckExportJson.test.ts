import type { CatalogCard, DeckCardEntry } from '../../../frontend/src/lib/api/types';
import {
  buildDeckCardIndex,
  type DeckCardIndex,
} from '../../../frontend/src/lib/decks/deckCardCatalog';
import {
  buildDeckExportJson,
  type BuildDeckExportJsonInput,
} from '../../../src/services/deck-preview/buildDeckExportJson';

function makeIndex(
  deckType: string,
  cards: CatalogCard[],
): DeckCardIndex {
  return buildDeckCardIndex([deckType], [cards]);
}

function baseInput(
  overrides: Partial<BuildDeckExportJsonInput> = {},
): BuildDeckExportJsonInput {
  return {
    name: 'Test Deck',
    description: 'A test deck',
    cards: [],
    cardIndex: new Map(),
    reserveCharacterId: null,
    maxStats: { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 },
    iconTotals: { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 },
    totalThreat: 0,
    totalCards: 0,
    legal: true,
    limited: false,
    exportedBy: 'testuser',
    exportTimestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildDeckExportJson', () => {
  it('includes root metadata fields', () => {
    const result = buildDeckExportJson(
      baseInput({
        name: 'My Deck',
        description: 'Notes',
        totalCards: 12,
        maxStats: { energy: 6, combat: 7, bruteForce: 5, intelligence: 4 },
        iconTotals: { energy: 2, combat: 3, bruteForce: 1, intelligence: 0 },
        totalThreat: 40,
        legal: false,
        limited: true,
        exportedBy: 'kyle',
      }),
    );

    expect(result.name).toBe('My Deck');
    expect(result.description).toBe('Notes');
    expect(result.total_cards).toBe(12);
    expect(result.max_energy).toBe(6);
    expect(result.max_combat).toBe(7);
    expect(result.max_brute_force).toBe(5);
    expect(result.max_intelligence).toBe(4);
    expect(result.total_energy_icons).toBe(2);
    expect(result.total_combat_icons).toBe(3);
    expect(result.total_brute_force_icons).toBe(1);
    expect(result.total_intelligence_icons).toBe(0);
    expect(result.total_threat).toBe(40);
    expect(result.legal).toBe(false);
    expect(result.limited).toBe(true);
    expect(result.exported_by).toBe('kyle');
    expect(result.export_timestamp).toBe('2026-01-01T00:00:00.000Z');
  });

  it('formats teamwork cards with followup_attack_types using to_use base name', () => {
    const teamworkCard: CatalogCard = {
      id: 'tw1',
      to_use: '7 Combat',
      followup_attack_types: 'Intelligence + Energy',
    };
    const cards: DeckCardEntry[] = [
      { type: 'teamwork', cardId: 'tw1', quantity: 1, instanceId: 'a' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('teamwork', [teamworkCard]),
      }),
    );

    expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy']);
  });

  it('formats teamwork cards without followup suffix', () => {
    const teamworkCard: CatalogCard = {
      id: 'tw1',
      to_use: '6 Combat',
    };
    const cards: DeckCardEntry[] = [
      { type: 'teamwork', cardId: 'tw1', quantity: 1, instanceId: 'a' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('teamwork', [teamworkCard]),
      }),
    );

    expect(result.cards.teamwork).toEqual(['6 Combat']);
  });

  it('formats ally-universe cards with stat fields', () => {
    const allyCard: CatalogCard = {
      id: 'ally1',
      card_name: 'Little John',
      stat_to_use: 3,
      stat_type_to_use: 'Combat',
    };
    const cards: DeckCardEntry[] = [
      { type: 'ally-universe', cardId: 'ally1', quantity: 1, instanceId: 'a' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('ally-universe', [allyCard]),
      }),
    );

    expect(result.cards.allies).toEqual(['Little John - 3 Combat']);
  });

  it('sorts power cards by value then type', () => {
    const powerCards: CatalogCard[] = [
      { id: 'p3', name: '5 - Combat', power_type: 'Combat', value: 5 },
      { id: 'p1', name: '1 - Combat', power_type: 'Combat', value: 1 },
      { id: 'p2', name: '3 - Energy', power_type: 'Energy', value: 3 },
    ];
    const cards: DeckCardEntry[] = [
      { type: 'power', cardId: 'p3', quantity: 1, instanceId: 'a' },
      { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'b' },
      { type: 'power', cardId: 'p2', quantity: 1, instanceId: 'c' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('power', powerCards),
      }),
    );

    expect(result.cards.power_cards).toEqual(['1 - Combat', '3 - Energy', '5 - Combat']);
  });

  it('groups missions by mission set', () => {
    const missions: CatalogCard[] = [
      { id: 'm1', name: 'Mission A', mission_set: 'Battle at Olympus' },
      { id: 'm2', name: 'Mission B', mission_set: 'Battle at Olympus' },
    ];
    const cards: DeckCardEntry[] = [
      { type: 'mission', cardId: 'm1', quantity: 1, instanceId: 'a' },
      { type: 'mission', cardId: 'm2', quantity: 1, instanceId: 'b' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('mission', missions),
      }),
    );

    expect(result.cards.missions).toEqual({
      'Battle at Olympus': ['Mission A', 'Mission B'],
    });
  });

  it('exports Battlegrounds separately from Locations', () => {
    const cards: DeckCardEntry[] = [
      { type: 'location', cardId: 'loc', quantity: 1, instanceId: 'a' },
      { type: 'battleground', cardId: 'gda', quantity: 1, instanceId: 'b' },
    ];
    const result = buildDeckExportJson(baseInput({
      cards,
      cardIndex: buildDeckCardIndex(
        ['location', 'battleground'],
        [[{ id: 'loc', name: 'Spartan Training Ground' }], [{ id: 'gda', name: 'Global Defense Agency' }]],
      ),
    }));

    expect(result.cards.locations).toEqual(['Spartan Training Ground']);
    expect(result.cards.battlegrounds).toEqual(['Global Defense Agency']);
  });

  it('groups special cards by character and sets reserve_character', () => {
    const specials: CatalogCard[] = [
      {
        id: 's1',
        name: 'Nautilus',
        character_name: 'Captain Nemo',
      },
      {
        id: 's2',
        name: 'Cataclysm Blast',
        character_name: 'Any Character',
        is_cataclysm: true,
      },
    ];
    const characters: CatalogCard[] = [
      { id: 'c1', name: 'Captain Nemo', energy: 6, combat: 5, brute_force: 4, intelligence: 5 },
    ];
    const cards: DeckCardEntry[] = [
      { type: 'character', cardId: 'c1', quantity: 1, instanceId: 'a' },
      { type: 'special', cardId: 's1', quantity: 1, instanceId: 'b' },
      { type: 'special', cardId: 's2', quantity: 1, instanceId: 'c' },
    ];
    const cardIndex = buildDeckCardIndex(
      ['character', 'special'],
      [characters, specials],
    );

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex,
        reserveCharacterId: 'c1',
      }),
    );

    expect(result.reserve_character).toBe('Captain Nemo');
    expect(result.cataclysm_special).toBe('Cataclysm Blast');
    expect(result.cards.special_cards).toEqual({
      'Captain Nemo': ['Nautilus'],
      'Any Character': ['Cataclysm Blast'],
    });
  });

  it('formats training cards with type and bonus suffix', () => {
    const trainingCard: CatalogCard = {
      id: 'tr1',
      name: 'Training (Leonidas)',
      type_1: 'Energy',
      type_2: 'Combat',
      bonus: '+4',
    };
    const cards: DeckCardEntry[] = [
      { type: 'training', cardId: 'tr1', quantity: 1, instanceId: 'a' },
    ];

    const result = buildDeckExportJson(
      baseInput({
        cards,
        cardIndex: makeIndex('training', [trainingCard]),
      }),
    );

    expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
  });
});
