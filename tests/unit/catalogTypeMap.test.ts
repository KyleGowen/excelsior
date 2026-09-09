import type { CatalogCard } from '../../frontend/src/lib/api/types';
import {
  ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB,
  ADD_CARDS_TAB_ORDER,
  ADD_CARDS_TYPE_TABS,
  addCardsCatalogTypeForTab,
  cardMatchesSearchQuery,
  compareCatalogCards,
  parseSearchTokens,
} from '../../frontend/src/lib/catalog/catalogTypeMap';

describe('cardMatchesSearchQuery foil keyword', () => {
  const foilCard: CatalogCard = {
    id: 'foil-1',
    name: 'Tarzan',
    is_foil: true,
  };
  const baseCard: CatalogCard = {
    id: 'base-1',
    name: 'Tarzan',
    is_foil: false,
  };

  it('parseSearchTokens detects foil keyword and strips it', () => {
    expect(parseSearchTokens('foil')).toEqual({ textQuery: '', requireFoil: true });
    expect(parseSearchTokens('foil tarzan')).toEqual({ textQuery: 'tarzan', requireFoil: true });
    expect(parseSearchTokens('tarzan foil')).toEqual({ textQuery: 'tarzan', requireFoil: true });
    expect(parseSearchTokens('tarzan')).toEqual({ textQuery: 'tarzan', requireFoil: false });
  });

  it('matches all foil cards when query is foil only', () => {
    expect(cardMatchesSearchQuery(foilCard, 'foil')).toBe(true);
    expect(cardMatchesSearchQuery(baseCard, 'foil')).toBe(false);
  });

  it('combines foil keyword with text search', () => {
    expect(cardMatchesSearchQuery(foilCard, 'foil tarzan')).toBe(true);
    expect(cardMatchesSearchQuery(baseCard, 'foil tarzan')).toBe(false);
    expect(cardMatchesSearchQuery(foilCard, 'foil batman')).toBe(false);
  });

  it('does not require foil for plain text queries', () => {
    expect(cardMatchesSearchQuery(baseCard, 'tarzan')).toBe(true);
    expect(cardMatchesSearchQuery(foilCard, 'tarzan')).toBe(true);
  });

  it('matches mission and event cards by mission-set name', () => {
    const mission: CatalogCard = {
      id: 'mission-1',
      name: 'Professor Angell\'s Investigation',
      mission_set: 'The Call of Cthulhu',
    };
    const event: CatalogCard = {
      id: 'event-1',
      name: 'Stars Align',
      mission_set: 'The Call of Cthulhu',
    };

    expect(cardMatchesSearchQuery(mission, 'cthul')).toBe(true);
    expect(cardMatchesSearchQuery(event, 'CALL OF CTHULHU')).toBe(true);
    expect(cardMatchesSearchQuery(mission, 'king of the jungle')).toBe(false);
  });
});

describe('compareCatalogCards power-cards', () => {
  const card = (id: string, power_type: string, value: number): CatalogCard => ({
    id,
    name: `${value} - ${power_type}`,
    power_type,
    value,
  });

  it('sorts by power type order then ascending value', () => {
    const unsorted: CatalogCard[] = [
      card('any7', 'Any-Power', 7),
      card('int3', 'Intelligence', 3),
      card('combat2', 'Combat', 2),
      card('energy1', 'Energy', 1),
      card('bf4', 'Brute Force', 4),
      card('mp5', 'Multi-Power', 5),
      card('energy3', 'Energy', 3),
      card('combat6', 'Combat', 6),
    ];

    const sorted = [...unsorted].sort((a, b) => compareCatalogCards(a, b, 'power-cards'));

    expect(sorted.map((c) => c.id)).toEqual([
      'energy1',
      'energy3',
      'combat2',
      'combat6',
      'bf4',
      'int3',
      'mp5',
      'any7',
    ]);
  });

  it('treats hyphen and space power type spellings as equivalent', () => {
    const a = card('mp1', 'Multi Power', 3);
    const b = card('mp2', 'Multi-Power', 4);
    expect(compareCatalogCards(a, b, 'power-cards')).toBeLessThan(0);
    expect(compareCatalogCards(b, a, 'power-cards')).toBeGreaterThan(0);
  });
});

describe('Add Cards tab metadata', () => {
  it('places Any-Char immediately after Special', () => {
    const specialIndex = ADD_CARDS_TAB_ORDER.indexOf('special-cards');

    expect(ADD_CARDS_TAB_ORDER[specialIndex + 1]).toBe(ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB);
    expect(ADD_CARDS_TYPE_TABS[specialIndex + 1]).toMatchObject({
      tab: ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB,
      shortLabel: 'Any-Char',
    });
  });

  it('resolves the Any-Char virtual tab to the special catalog type', () => {
    expect(addCardsCatalogTypeForTab(ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB)).toBe('special-cards');
    expect(addCardsCatalogTypeForTab('special-cards')).toBe('special-cards');
    expect(addCardsCatalogTypeForTab('all')).toBeNull();
    expect(addCardsCatalogTypeForTab('stacks')).toBeNull();
  });
});
