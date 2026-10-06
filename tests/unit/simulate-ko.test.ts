import { isKoCharacter, pruneKoCharacterIds, toggleKoCharacterId } from '../../frontend/src/lib/decks/simulateKo';
import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import {
  buildKoDimmingContext,
  calculateActiveTeamStats,
  shouldDimDeckCard,
} from '../../src/services/deck-preview/simulateKo';

function deckEntry(
  type: DeckCardEntry['type'],
  cardId: string,
  quantity = 1,
): DeckCardEntry {
  return { type, cardId, quantity };
}

function catalogCard(id: string, overrides: Partial<CatalogCard> = {}): CatalogCard {
  return { id, ...overrides } as CatalogCard;
}

function buildCardIndex(
  entries: Array<{ deckType: string; cardId: string; card: CatalogCard }>,
): Map<string, CatalogCard> {
  const index = new Map<string, CatalogCard>();
  for (const { deckType, cardId, card } of entries) {
    index.set(`${deckType}:${cardId}`, card);
  }
  return index;
}

function dim(
  entry: DeckCardEntry,
  deckCards: DeckCardEntry[],
  cardIndex: Map<string, CatalogCard>,
  koIds: Set<string>,
): boolean {
  const catalog = cardIndex.get(`${entry.type}:${entry.cardId}`);
  const ctx = buildKoDimmingContext(deckCards, cardIndex, koIds);
  return shouldDimDeckCard(entry, catalog, ctx);
}

describe('simulateKo (v2)', () => {
  describe('state helpers', () => {
    it('toggleKoCharacterId adds and removes character ids', () => {
      let ids = new Set<string>();
      ids = toggleKoCharacterId(ids, 'char-1');
      expect(ids.has('char-1')).toBe(true);
      ids = toggleKoCharacterId(ids, 'char-1');
      expect(ids.has('char-1')).toBe(false);
    });

    it('pruneKoCharacterIds drops ids no longer in the deck', () => {
      const deck = [deckEntry('character', 'char-1'), deckEntry('character', 'char-2')];
      const pruned = pruneKoCharacterIds(new Set(['char-1', 'char-3']), deck);
      expect([...pruned]).toEqual(['char-1']);
    });

    it('isKoCharacter reflects membership', () => {
      expect(isKoCharacter(new Set(['a']), 'a')).toBe(true);
      expect(isKoCharacter(new Set(['a']), 'b')).toBe(false);
    });
  });

  describe('character cards', () => {
    it('dims KO\'d characters', () => {
      const deck = [deckEntry('character', 'char-1')];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 8 }),
        },
      ]);
      const ko = new Set(['char-1']);
      expect(dim(deck[0], deck, index, ko)).toBe(true);
    });

    it('does not dim non-KO\'d characters', () => {
      const deck = [deckEntry('character', 'char-1')];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 8 }),
        },
      ]);
      expect(dim(deck[0], deck, index, new Set())).toBe(false);
    });
  });

  describe('special cards', () => {
    const char1 = deckEntry('character', 'char-1');
    const special = deckEntry('special', 'special-1');
    const deck = [char1, special];
    const index = buildCardIndex([
      {
        deckType: 'character',
        cardId: 'char-1',
        card: catalogCard('char-1', { name: 'Leonidas', energy: 8 }),
      },
      {
        deckType: 'special',
        cardId: 'special-1',
        card: catalogCard('special-1', { character: 'Leonidas', name: 'Spartan Shield' }),
      },
    ]);

    it('dims specials tied to a KO\'d character', () => {
      expect(dim(special, deck, index, new Set(['char-1']))).toBe(true);
    });

    it('does not dim specials when character is active', () => {
      expect(dim(special, deck, index, new Set())).toBe(false);
    });

    it('never dims Any Character specials', () => {
      const anySpecial = deckEntry('special', 'special-any');
      const anyDeck = [char1, anySpecial];
      const anyIndex = buildCardIndex([
        ...Array.from(index.entries()).map(([key, card]) => {
          const [deckType, cardId] = key.split(':');
          return { deckType, cardId, card };
        }),
        {
          deckType: 'special',
          cardId: 'special-any',
          card: catalogCard('special-any', { character: 'Any Character', name: 'Generic' }),
        },
      ]);
      expect(dim(anySpecial, anyDeck, anyIndex, new Set(['char-1']))).toBe(false);
    });

    it.each([
      ['Angry Mob', true],
      ['Angry Mob: Middle Ages', true],
      ['Angry Mob - Middle Age', true],
      ['Angry Mob: Industrial Age', false],
    ])(
      'dims Angry Mob special ownership %s correctly after the matching variant is KO\'d',
      (specialCharacter, expected) => {
        const mob = deckEntry('character', 'angry-mob-middle-ages');
        const mobSpecial = deckEntry('special', 'mob-special');
        const mobDeck = [mob, mobSpecial];
        const mobIndex = buildCardIndex([
          {
            deckType: 'character',
            cardId: 'angry-mob-middle-ages',
            card: catalogCard('angry-mob-middle-ages', {
              name: 'Angry Mob (Middle Ages)',
            }),
          },
          {
            deckType: 'special',
            cardId: 'mob-special',
            card: catalogCard('mob-special', {
              character: specialCharacter,
              name: 'Mob Special',
            }),
          },
        ]);

        expect(dim(mobSpecial, mobDeck, mobIndex, new Set(['angry-mob-middle-ages']))).toBe(
          expected,
        );
      },
    );

    it('keeps shared Angry Mob specials active while another Angry Mob variant remains active', () => {
      const middleAges = deckEntry('character', 'angry-mob-middle-ages');
      const industrialAge = deckEntry('character', 'angry-mob-industrial-age');
      const sharedSpecial = deckEntry('special', 'shared-mob-special');
      const mobDeck = [middleAges, industrialAge, sharedSpecial];
      const mobIndex = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'angry-mob-middle-ages',
          card: catalogCard('angry-mob-middle-ages', {
            name: 'Angry Mob (Middle Ages)',
          }),
        },
        {
          deckType: 'character',
          cardId: 'angry-mob-industrial-age',
          card: catalogCard('angry-mob-industrial-age', {
            name: 'Angry Mob (Industrial Age)',
          }),
        },
        {
          deckType: 'special',
          cardId: 'shared-mob-special',
          card: catalogCard('shared-mob-special', {
            character: 'Angry Mob',
            name: 'Shared Mob Special',
          }),
        },
      ]);

      expect(
        dim(sharedSpecial, mobDeck, mobIndex, new Set(['angry-mob-middle-ages'])),
      ).toBe(false);
    });
  });

  describe('power cards', () => {
    it('dims when no active character meets the requirement after KO', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const power = deckEntry('power', 'power-1');
      const deck = [char1, char2, power];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 4, combat: 4 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'King Arthur', energy: 8, combat: 4 }),
        },
        {
          deckType: 'power',
          cardId: 'power-1',
          card: catalogCard('power-1', { power_type: 'Energy', value: 8 }),
        },
      ]);
      expect(dim(power, deck, index, new Set(['char-2']))).toBe(true);
    });

    it('handles Any-Power cards', () => {
      const char1 = deckEntry('character', 'char-1');
      const power = deckEntry('power', 'power-1');
      const deck = [char1, power];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 4, combat: 8 }),
        },
        {
          deckType: 'power',
          cardId: 'power-1',
          card: catalogCard('power-1', { power_type: 'Any-Power', value: 8 }),
        },
      ]);
      expect(dim(power, deck, index, new Set())).toBe(false);
    });

    it('uses sum of two highest stats for Multi-Power', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const power = deckEntry('power', 'power-1');
      const deck = [char1, char2, power];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', {
            name: 'Leonidas',
            energy: 8,
            combat: 4,
            brute_force: 3,
            intelligence: 2,
          }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', {
            name: 'King Arthur',
            energy: 10,
            combat: 10,
            brute_force: 10,
            intelligence: 10,
          }),
        },
        {
          deckType: 'power',
          cardId: 'power-1',
          card: catalogCard('power-1', { power_type: 'Multi-Power', value: 13 }),
        },
      ]);
      // KO the high-stat character; Leonidas sum(8,4)=12 < 13
      expect(dim(power, deck, index, new Set(['char-2']))).toBe(true);
      index.set('power:power-1', catalogCard('power-1', { power_type: 'Multi-Power', value: 12 }));
      expect(dim(power, deck, index, new Set(['char-2']))).toBe(false);
    });

    it('applies John Carter Brute Force override', () => {
      const char1 = deckEntry('character', 'char-1');
      const power = deckEntry('power', 'power-1');
      const deck = [char1, power];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', {
            name: 'John Carter',
            energy: 4,
            combat: 4,
            brute_force: 4,
            intelligence: 4,
          }),
        },
        {
          deckType: 'power',
          cardId: 'power-1',
          card: catalogCard('power-1', { power_type: 'Brute Force', value: 8 }),
        },
      ]);
      expect(dim(power, deck, index, new Set())).toBe(false);
    });
  });

  describe('teamwork and ally cards', () => {
    it('dims teamwork when team cannot meet requirement after KO', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const teamwork = deckEntry('teamwork', 'tw-1');
      const deck = [char1, char2, teamwork];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', combat: 4 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'King Arthur', combat: 8 }),
        },
        {
          deckType: 'teamwork',
          cardId: 'tw-1',
          card: catalogCard('tw-1', { to_use: '8 Combat' }),
        },
      ]);
      expect(dim(teamwork, deck, index, new Set(['char-2']))).toBe(true);
    });

    it('dims all teamwork when only one active character remains', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const char3 = deckEntry('character', 'char-3');
      const teamwork = deckEntry('teamwork', 'tw-1');
      const deck = [char1, char2, char3, teamwork];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Ra', combat: 8 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'Leonidas', combat: 8 }),
        },
        {
          deckType: 'character',
          cardId: 'char-3',
          card: catalogCard('char-3', { name: 'King Arthur', combat: 8 }),
        },
        {
          deckType: 'teamwork',
          cardId: 'tw-1',
          card: catalogCard('tw-1', { to_use: '4 Combat' }),
        },
      ]);
      expect(dim(teamwork, deck, index, new Set(['char-1', 'char-2']))).toBe(true);
    });

    it('dims ally when no active character meets stat requirement', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const ally = deckEntry('ally-universe', 'ally-1');
      const deck = [char1, char2, ally];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 4 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'King Arthur', energy: 8 }),
        },
        {
          deckType: 'ally-universe',
          cardId: 'ally-1',
          card: catalogCard('ally-1', {
            stat_to_use: '7 or higher',
            stat_type_to_use: 'Energy',
          }),
        },
      ]);
      expect(dim(ally, deck, index, new Set(['char-2']))).toBe(true);
    });
  });

  describe('training and basic universe', () => {
    it('keeps Any-Power Training playable when an active character has any stat at or below its cap', () => {
      const knockedOutCharacter = deckEntry('character', 'char-1');
      const activeCharacter = deckEntry('character', 'char-2');
      const training = deckEntry('training', 'train-any-power');
      const deck = [knockedOutCharacter, activeCharacter, training];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', {
            name: 'Doc Seismic',
            energy: 8,
            combat: 8,
            brute_force: 8,
            intelligence: 8,
          }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', {
            name: 'Spencer Dales',
            energy: 8,
            combat: 6,
            brute_force: 8,
            intelligence: 5,
          }),
        },
        {
          deckType: 'training',
          cardId: 'train-any-power',
          card: catalogCard('train-any-power', {
            type_1: 'Any-Power',
            type_2: 'Any-Power',
            value_to_use: '5 or less',
          }),
        },
      ]);

      expect(dim(training, deck, index, new Set(['char-1']))).toBe(false);
    });

    it('dims training when no active character can use it', () => {
      const char1 = deckEntry('character', 'char-1');
      const training = deckEntry('training', 'train-1');
      const deck = [char1, training];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', {
            name: 'Leonidas',
            energy: 8,
            combat: 8,
            brute_force: 8,
            intelligence: 8,
          }),
        },
        {
          deckType: 'training',
          cardId: 'train-1',
          card: catalogCard('train-1', {
            type_1: 'Energy',
            type_2: 'Combat',
            value_to_use: '4',
          }),
        },
      ]);
      expect(dim(training, deck, index, new Set(['char-1']))).toBe(true);
    });

    it('dims basic universe when requirement is not met', () => {
      const char1 = deckEntry('character', 'char-1');
      const char2 = deckEntry('character', 'char-2');
      const bu = deckEntry('basic-universe', 'bu-1');
      const deck = [char1, char2, bu];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 4 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'King Arthur', energy: 8 }),
        },
        {
          deckType: 'basic-universe',
          cardId: 'bu-1',
          card: catalogCard('bu-1', { type: 'Energy', value_to_use: '8 or greater' }),
        },
      ]);
      expect(dim(bu, deck, index, new Set(['char-2']))).toBe(true);
    });
  });

  describe('never-dim types and edge cases', () => {
    it('never dims locations, missions, events, or aspects', () => {
      const char1 = deckEntry('character', 'char-1');
      const location = deckEntry('location', 'loc-1');
      const mission = deckEntry('mission', 'mis-1');
      const event = deckEntry('event', 'evt-1');
      const aspect = deckEntry('aspect', 'asp-1');
      const deck = [char1, location, mission, event, aspect];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas' }),
        },
        { deckType: 'location', cardId: 'loc-1', card: catalogCard('loc-1', { name: 'Home' }) },
        { deckType: 'mission', cardId: 'mis-1', card: catalogCard('mis-1', { name: 'M1' }) },
        { deckType: 'event', cardId: 'evt-1', card: catalogCard('evt-1', { name: 'E1' }) },
        { deckType: 'aspect', cardId: 'asp-1', card: catalogCard('asp-1', { name: 'A1' }) },
      ]);
      const ko = new Set(['char-1']);
      expect(dim(location, deck, index, ko)).toBe(false);
      expect(dim(mission, deck, index, ko)).toBe(false);
      expect(dim(event, deck, index, ko)).toBe(false);
      expect(dim(aspect, deck, index, ko)).toBe(false);
    });

    it('returns false when no KOs are set', () => {
      const special = deckEntry('special', 'special-1');
      const deck = [deckEntry('character', 'char-1'), special];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas' }),
        },
        {
          deckType: 'special',
          cardId: 'special-1',
          card: catalogCard('special-1', { character: 'Leonidas' }),
        },
      ]);
      const ctx = buildKoDimmingContext(deck, index, new Set());
      expect(
        shouldDimDeckCard(special, index.get('special:special-1'), ctx),
      ).toBe(false);
    });

    it('calculateActiveTeamStats excludes KO\'d characters', () => {
      const deck = [
        deckEntry('character', 'char-1'),
        deckEntry('character', 'char-2'),
      ];
      const index = buildCardIndex([
        {
          deckType: 'character',
          cardId: 'char-1',
          card: catalogCard('char-1', { name: 'Leonidas', energy: 4, combat: 4 }),
        },
        {
          deckType: 'character',
          cardId: 'char-2',
          card: catalogCard('char-2', { name: 'King Arthur', energy: 8, combat: 6 }),
        },
      ]);
      const ctx = buildKoDimmingContext(deck, index, new Set(['char-2']));
      expect(calculateActiveTeamStats(ctx)).toEqual({
        energy: 4,
        combat: 4,
        bruteForce: 0,
        intelligence: 0,
      });
    });
  });
});
