import {
  buildDeckUsabilityContext,
  deckCatalogIndexKey,
  isCatalogCardUsable,
  statForPowerTypeWithSpecialCases,
} from '../../tests/helpers/serverCandidateCharacterization';
import type { CatalogCard, CatalogType, DeckCardEntry } from '../../frontend/src/lib/api/types';

function charCard(
  id: string,
  name: string,
  stats: { energy: number; combat: number; brute_force: number; intelligence: number },
): CatalogCard {
  return { id, name, ...stats };
}

function deckCharacter(cardId: string): DeckCardEntry {
  return { type: 'character', cardId, quantity: 1 };
}

function deckMission(cardId: string): DeckCardEntry {
  return { type: 'mission', cardId, quantity: 1 };
}

function deckLocation(cardId: string): DeckCardEntry {
  return { type: 'location', cardId, quantity: 1 };
}

function deckBattleground(cardId: string): DeckCardEntry {
  return { type: 'battleground', cardId, quantity: 1 };
}

describe('deck usability', () => {
  const spiderMan = charCard('char-1', 'Spider-Man', {
    energy: 5,
    combat: 6,
    brute_force: 4,
    intelligence: 5,
  });
  const johnCarter = charCard('char-jc', 'John Carter of Mars', {
    energy: 2,
    combat: 3,
    brute_force: 4,
    intelligence: 4,
  });
  const timeTraveler = charCard('char-tt', 'Time Traveler', {
    energy: 2,
    combat: 3,
    brute_force: 4,
    intelligence: 5,
  });
  const glenn = charCard('char-glenn', 'Glenn', {
    energy: 2,
    combat: 3,
    brute_force: 3,
    intelligence: 5,
  });

  const catalogByType: Partial<Record<CatalogType, CatalogCard[]>> = {
    characters: [spiderMan, johnCarter, timeTraveler, glenn],
    missions: [
      { id: 'mission-1', name: 'M1', mission_set: 'The Call of Cthulhu' },
      { id: 'mission-2', name: 'M2', mission_set: 'King of the Jungle' },
    ],
    locations: [
      { id: 'loc-1', name: 'Avengers Mansion' },
    ],
    battlegrounds: [{ id: 'gda', name: 'Global Defense Agency' }],
  };

  describe('buildDeckUsabilityContext', () => {
    it('derives character stats and mission sets from deck + catalog', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1'), deckMission('mission-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);

      expect(ctx.characterNames).toEqual(['Spider-Man']);
      expect(ctx.characterStats[0].combat).toBe(6);
      expect(ctx.missionSets.has('The Call of Cthulhu')).toBe(true);
      expect(ctx.missionSets.size).toBe(1);
    });

    it('captures homebase from first location', () => {
      const deck: DeckCardEntry[] = [deckLocation('loc-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      expect(ctx.homebaseName).toBe('Avengers Mansion');
    });

    it('resolves deck characters from deckCatalogIndex when tab catalog is empty (Power tab)', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const powerTabCatalog = { 'power-cards': [] as CatalogCard[] };
      const deckCatalogIndex = new Map<string, CatalogCard>([
        [deckCatalogIndexKey('character', 'char-1'), spiderMan],
      ]);

      const ctx = buildDeckUsabilityContext(deck, powerTabCatalog, { deckCatalogIndex });

      expect(ctx.characterNames).toEqual(['Spider-Man']);
      expect(ctx.characterStats[0].combat).toBe(6);
    });
  });

  describe('isCatalogCardUsable — power cards', () => {
    it('allows power when a character meets the stat threshold', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      const card: CatalogCard = { id: 'p1', name: 'Combat 6', power_type: 'Combat', value: 6 };

      expect(isCatalogCardUsable(card, 'power-cards', ctx)).toBe(true);
    });

    it('rejects power when no character meets threshold', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      const card: CatalogCard = { id: 'p2', name: 'Combat 7', power_type: 'Combat', value: 7 };

      expect(isCatalogCardUsable(card, 'power-cards', ctx)).toBe(false);
    });

    it('treats Multi Power as always usable', () => {
      const ctx = buildDeckUsabilityContext([], catalogByType);
      const card: CatalogCard = { id: 'mp', name: 'MP', power_type: 'Multi Power', value: 8 };
      expect(isCatalogCardUsable(card, 'power-cards', ctx)).toBe(true);
    });

    it('John Carter: BF 8 usable, BF 9 not when base < 8', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-jc')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);

      expect(
        isCatalogCardUsable(
          { id: 'bf8', power_type: 'Brute Force', value: 8 },
          'power-cards',
          ctx,
        ),
      ).toBe(true);
      expect(
        isCatalogCardUsable(
          { id: 'bf9', power_type: 'Brute Force', value: 9 },
          'power-cards',
          ctx,
        ),
      ).toBe(false);
    });

    it('Time Traveler: INT 8 usable, INT 9 not when base < 8', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-tt')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);

      expect(
        isCatalogCardUsable(
          { id: 'int8', power_type: 'Intelligence', value: 8 },
          'power-cards',
          ctx,
        ),
      ).toBe(true);
      expect(
        isCatalogCardUsable(
          { id: 'int9', power_type: 'Intelligence', value: 9 },
          'power-cards',
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('isCatalogCardUsable — events', () => {
    it('allows all events when deck has no missions', () => {
      const ctx = buildDeckUsabilityContext([], catalogByType);
      const card: CatalogCard = {
        id: 'e1',
        name: 'Event',
        mission_set: 'The Call of Cthulhu',
      };
      expect(isCatalogCardUsable(card, 'events', ctx)).toBe(true);
    });

    it('allows event when mission set matches deck', () => {
      const deck: DeckCardEntry[] = [deckMission('mission-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      const card: CatalogCard = {
        id: 'e1',
        name: 'Cthulhu Event',
        mission_set: 'The Call of Cthulhu',
      };
      expect(isCatalogCardUsable(card, 'events', ctx)).toBe(true);
    });

    it('rejects event when mission set does not match deck missions', () => {
      const deck: DeckCardEntry[] = [deckMission('mission-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      const card: CatalogCard = {
        id: 'e2',
        name: 'Jungle Event',
        mission_set: 'King of the Jungle',
      };
      expect(isCatalogCardUsable(card, 'events', ctx)).toBe(false);
    });
  });

  describe('isCatalogCardUsable — Basic Universe cards', () => {
    const highGridCard: CatalogCard = {
      id: 'bu-1',
      card_name: 'Energy 8 or greater',
      type: 'Energy',
      value_to_use: '8 or greater',
    };

    it('rejects a Basic Universe card when the team does not meet its grid', () => {
      const ctx = buildDeckUsabilityContext([deckCharacter('char-1')], catalogByType);
      expect(isCatalogCardUsable(highGridCard, 'basic-universe', ctx)).toBe(false);
    });

    it('allows Glenn to ignore all Basic Universe grid requirements', () => {
      const ctx = buildDeckUsabilityContext([deckCharacter('char-glenn')], catalogByType);
      expect(isCatalogCardUsable(highGridCard, 'basic-universe', ctx)).toBe(true);
    });
  });

  describe('isCatalogCardUsable — special cards', () => {
    it('allows Any Character specials', () => {
      const ctx = buildDeckUsabilityContext([], catalogByType);
      const card: CatalogCard = { id: 's1', name: 'Wild', character: 'Any Character' };
      expect(isCatalogCardUsable(card, 'special-cards', ctx)).toBe(true);
    });

    it('requires Global Defense Agency for the full Skybound G.D.A. Any Character block', () => {
      const greenGhost: CatalogCard = {
        id: 'green-ghost',
        name: 'Green Ghost',
        character: 'Any Character',
        set: 'SKY',
        set_number: '349',
      };
      const assist: CatalogCard = {
        id: 'assist',
        name: 'Assist!',
        character: 'Any Character',
        set: 'SKY',
        set_number: '360',
      };

      const withoutGda = buildDeckUsabilityContext([], catalogByType);
      expect(isCatalogCardUsable(greenGhost, 'special-cards', withoutGda)).toBe(false);
      expect(isCatalogCardUsable(assist, 'special-cards', withoutGda)).toBe(false);

      const withGda = buildDeckUsabilityContext([deckBattleground('gda')], catalogByType);
      expect(isCatalogCardUsable(greenGhost, 'special-cards', withGda)).toBe(true);
      expect(isCatalogCardUsable(assist, 'special-cards', withGda)).toBe(true);
    });

    it('rejects candidate Any Character specials that would mix G.D.A. and non-G.D.A. cards', () => {
      const greenGhost: CatalogCard = {
        id: 'green-ghost', name: 'Green Ghost', character: 'Any Character', set: 'SKY', set_number: '349',
      };
      const wild: CatalogCard = { id: 'wild', name: 'Wild', character: 'Any Character', set: 'ERB' };
      const withDeckSpecials = {
        ...catalogByType,
        'special-cards': [greenGhost, wild],
      };

      const gdaDeck = buildDeckUsabilityContext(
        [deckBattleground('gda'), { type: 'special', cardId: 'green-ghost', quantity: 1 }],
        withDeckSpecials,
      );
      expect(isCatalogCardUsable(wild, 'special-cards', gdaDeck)).toBe(false);

      const nonGdaDeck = buildDeckUsabilityContext(
        [deckBattleground('gda'), { type: 'special', cardId: 'wild', quantity: 1 }],
        withDeckSpecials,
      );
      expect(isCatalogCardUsable(greenGhost, 'special-cards', nonGdaDeck)).toBe(false);
    });

    it('requires linked character in deck', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);

      expect(
        isCatalogCardUsable(
          { id: 's2', name: 'Spidey Special', character: 'Spider-Man' },
          'special-cards',
          ctx,
        ),
      ).toBe(true);
      expect(
        isCatalogCardUsable(
          { id: 's3', name: 'Other Special', character: 'Wolverine' },
          'special-cards',
          ctx,
        ),
      ).toBe(false);
    });

    it('matches linked character via alt-art base name in deck', () => {
      const heroAlt = charCard('char-alt', 'Hero (Alternate Art)', {
        energy: 5,
        combat: 5,
        brute_force: 5,
        intelligence: 5,
      });
      const deck: DeckCardEntry[] = [deckCharacter('char-alt')];
      const ctx = buildDeckUsabilityContext(deck, { characters: [heroAlt] });

      expect(
        isCatalogCardUsable(
          { id: 's4', name: 'Hero Special', character: 'Hero' },
          'special-cards',
          ctx,
        ),
      ).toBe(true);
    });
  });

  describe('isCatalogCardUsable — ally universe', () => {
    it('allows stat check with one character (legacy hide filter)', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const ctx = buildDeckUsabilityContext(deck, catalogByType);
      const card: CatalogCard = {
        id: 'ally-1',
        card_name: 'Ally',
        stat_to_use: '4 or less',
        stat_type_to_use: 'Combat',
      };
      expect(isCatalogCardUsable(card, 'ally-universe', ctx)).toBe(false);

      const usableCard: CatalogCard = {
        id: 'ally-2',
        card_name: 'Ally',
        stat_to_use: '7 or less',
        stat_type_to_use: 'Combat',
      };
      expect(isCatalogCardUsable(usableCard, 'ally-universe', ctx)).toBe(true);
    });

    it('checks stat when two or more characters', () => {
      const deck: DeckCardEntry[] = [
        deckCharacter('char-1'),
        { type: 'character', cardId: 'char-2', quantity: 1 },
      ];
      const catalog = {
        ...catalogByType,
        characters: [
          ...catalogByType.characters!,
          charCard('char-2', 'Iron Man', {
            energy: 4,
            combat: 3,
            brute_force: 5,
            intelligence: 6,
          }),
        ],
      };
      const ctx = buildDeckUsabilityContext(deck, catalog);
      const card: CatalogCard = {
        id: 'ally-1',
        card_name: 'Ally',
        stat_to_use: '4 or less',
        stat_type_to_use: 'Combat',
      };
      expect(isCatalogCardUsable(card, 'ally-universe', ctx)).toBe(true);
    });
  });

  describe('power tab hide unusables integration', () => {
    it('uses deckCatalogIndex when characters catalog is not loaded for active tab', () => {
      const deck: DeckCardEntry[] = [deckCharacter('char-1')];
      const deckCatalogIndex = new Map<string, CatalogCard>([
        [deckCatalogIndexKey('character', 'char-1'), spiderMan],
      ]);
      const ctx = buildDeckUsabilityContext(deck, { 'power-cards': [] }, { deckCatalogIndex });
      const usable: CatalogCard = { id: 'p1', power_type: 'Combat', value: 6 };
      const unusable: CatalogCard = { id: 'p2', power_type: 'Combat', value: 7 };

      expect(isCatalogCardUsable(usable, 'power-cards', ctx)).toBe(true);
      expect(isCatalogCardUsable(unusable, 'power-cards', ctx)).toBe(false);
    });
  });

  describe('statForPowerTypeWithSpecialCases', () => {
    it('applies John Carter brute force floor', () => {
      const stat = statForPowerTypeWithSpecialCases(
        { name: 'John Carter of Mars', energy: 0, combat: 0, brute_force: 4, intelligence: 0 },
        'Brute Force',
      );
      expect(stat).toBe(8);
    });
  });
});
