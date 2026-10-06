import type { CatalogCard } from '../../frontend/src/lib/api/types';
import {
  buildCharacterStacks,
  filterCharacterStacks,
  specialCardMatchesCharacter,
  stackCardsInAddOrder,
  stackTotalCardCount,
} from '../../tests/helpers/presentedCatalogCharacterization';

function card(id: string, name: string, extra: Partial<CatalogCard> = {}): CatalogCard {
  return { id, name, ...extra } as CatalogCard;
}

describe('characterStacks', () => {
  describe('specialCardMatchesCharacter', () => {
    it('matches exact character name', () => {
      expect(
        specialCardMatchesCharacter(card('s1', 'Thunderbolt', { character: 'Zeus' }), 'Zeus'),
      ).toBe(true);
    });

    it('excludes Any Character specials', () => {
      expect(
        specialCardMatchesCharacter(
          card('s1', 'Generic', { character: 'Any Character' }),
          'Zeus',
        ),
      ).toBe(false);
    });

    it('matches Angry Mob base special to any Angry Mob character', () => {
      expect(
        specialCardMatchesCharacter(card('s1', 'Mob Rule', { character: 'Angry Mob' }), 'Angry Mob (Farmers)'),
      ).toBe(true);
    });

    it('matches Angry Mob variant special to character with same variant', () => {
      expect(
        specialCardMatchesCharacter(
          card('s1', 'Pitchforks', { character: 'Angry Mob: Farmers' }),
          'Angry Mob (Farmers)',
        ),
      ).toBe(true);
    });

    it('rejects mismatched Angry Mob variants', () => {
      expect(
        specialCardMatchesCharacter(
          card('s1', 'Pitchforks', { character: 'Angry Mob: Farmers' }),
          'Angry Mob (Soldiers)',
        ),
      ).toBe(false);
    });
  });

  describe('buildCharacterStacks', () => {
    it('groups characters by display name and attaches linked cards', () => {
      const stacks = buildCharacterStacks({
        characters: [
          card('c-erb', 'Zeus', { set: 'ERB' }),
          card('c-erbp', 'Zeus', { set: 'ERBP', image_path: 'alternate/zeus.webp' }),
        ],
        specials: [
          card('s1', 'Thunderbolt', { character: 'Zeus' }),
          card('s2', 'Any Power', { character: 'Any Character' }),
        ],
        advancedUniverse: [card('u1', 'Divine Wrath', { character: 'Zeus' })],
      });

      expect(stacks).toHaveLength(1);
      expect(stacks[0].characterName).toBe('Zeus');
      expect(stacks[0].character.id).toBe('c-erb');
      expect(stacks[0].specials.map((c) => c.id)).toEqual(['s1']);
      expect(stacks[0].advancedUniverse.map((c) => c.id)).toEqual(['u1']);
    });

    it('excludes Any Character from stacks', () => {
      const stacks = buildCharacterStacks({
        characters: [card('c1', 'Any Character')],
        specials: [],
        advancedUniverse: [],
      });
      expect(stacks).toHaveLength(0);
    });
  });

  describe('filterCharacterStacks', () => {
    const stacks = buildCharacterStacks({
      characters: [card('c1', 'Zeus'), card('c2', 'Anubis')],
      specials: [card('s1', 'Thunderbolt', { character: 'Zeus' })],
      advancedUniverse: [],
    });

    it('returns all stacks when search is empty', () => {
      expect(filterCharacterStacks(stacks, '')).toHaveLength(2);
    });

    it('filters by character name', () => {
      expect(filterCharacterStacks(stacks, 'anubis')).toHaveLength(1);
      expect(filterCharacterStacks(stacks, 'anubis')[0].characterName).toBe('Anubis');
    });

    it('does not filter by special card name', () => {
      expect(filterCharacterStacks(stacks, 'thunderbolt')).toHaveLength(0);
    });
  });

  describe('stackCardsInAddOrder', () => {
    it('orders character then specials then UA', () => {
      const stack = buildCharacterStacks({
        characters: [card('c1', 'Zeus')],
        specials: [card('s1', 'Thunderbolt', { character: 'Zeus' })],
        advancedUniverse: [card('u1', 'Divine Wrath', { character: 'Zeus' })],
      })[0];

      expect(stackTotalCardCount(stack)).toBe(3);
      expect(stackCardsInAddOrder(stack).map((e) => e.catalogType)).toEqual([
        'characters',
        'special-cards',
        'advanced-universe',
      ]);
    });
  });
});
