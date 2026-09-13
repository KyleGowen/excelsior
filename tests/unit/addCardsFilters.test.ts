import type { CatalogCard } from '../../frontend/src/lib/api/types';
import { buildCharacterStacks } from '../../frontend/src/lib/catalog/characterStacks';
import {
  buildDeckUsabilityContext,
  deckCatalogIndexKey,
  effectiveHideUnusablesForTab,
} from '../../frontend/src/lib/deck-usability';
import {
  filterAndSortTypeCardsWithOptions,
  filterCharacterStacksWithOptions,
  type AddCardsFilterOptions,
} from '../../frontend/src/features/deck-editor/addCardsFilters';
import { isAnyCharacterSpecialCard } from '../../frontend/src/lib/catalog/catalogTypeMap';

describe('addCardsFilters hide unusables', () => {
  const spiderMan: CatalogCard = {
    id: 'char-1',
    name: 'Spider-Man',
    energy: 5,
    combat: 6,
    brute_force: 4,
    intelligence: 5,
  };

  it('does not wipe power cards when hideUnusables uses deckCatalogIndex on empty tab catalog', () => {
    const deckCatalogIndex = new Map<string, CatalogCard>([
      [deckCatalogIndexKey('character', 'char-1'), spiderMan],
    ]);
    const ctx = buildDeckUsabilityContext(
      [{ type: 'character', cardId: 'char-1', quantity: 1 }],
      {},
      { deckCatalogIndex },
    );
    const powerCards: CatalogCard[] = [
      { id: 'p1', name: 'Combat 6', power_type: 'Combat', value: 6 },
      { id: 'p2', name: 'Combat 7', power_type: 'Combat', value: 7 },
      { id: 'mp', name: 'MP', power_type: 'Multi Power', value: 8 },
    ];
    const options: AddCardsFilterOptions = {
      searchQuery: '',
      setFilter: '',
      hideUnusables: true,
      usabilityCtx: ctx,
    };

    const filtered = filterAndSortTypeCardsWithOptions(powerCards, 'power-cards', options);

    expect(filtered.map((c) => c.id)).toEqual(['p1', 'mp']);
  });

  it('effectiveHideUnusablesForTab is false on stacks even when checkbox state is on', () => {
    expect(effectiveHideUnusablesForTab('stacks', true)).toBe(false);
    expect(effectiveHideUnusablesForTab('power-cards', true)).toBe(true);
  });

  it('does not hide unusable specials inside stacks when hideUnusables is inactive', () => {
    const spiderManChar: CatalogCard = {
      id: 'char-1',
      name: 'Spider-Man',
      energy: 5,
      combat: 6,
      brute_force: 4,
      intelligence: 5,
    };
    const unusableSpecial: CatalogCard = {
      id: 's1',
      name: 'High Combat',
      character: 'Spider-Man',
      to_use: '6 Combat',
    };
    const deckCatalogIndex = new Map<string, CatalogCard>([
      [deckCatalogIndexKey('character', 'char-1'), spiderManChar],
    ]);
    const ctx = buildDeckUsabilityContext(
      [{ type: 'character', cardId: 'char-1', quantity: 1 }],
      {},
      { deckCatalogIndex },
    );
    const stacks = buildCharacterStacks({
      characters: [spiderManChar],
      specials: [unusableSpecial],
      advancedUniverse: [],
    });
    const stacksOptions: AddCardsFilterOptions = {
      searchQuery: '',
      setFilter: '',
      hideUnusables: effectiveHideUnusablesForTab('stacks', true),
      usabilityCtx: ctx,
    };

    const filtered = filterCharacterStacksWithOptions(stacks, stacksOptions, {
      characterNameSearchOnly: true,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].specials.map((c) => c.id)).toEqual(['s1']);
  });
});

describe('addCardsFilters special scopes', () => {
  const baseOptions: AddCardsFilterOptions = {
    searchQuery: '',
    setFilter: '',
    hideUnusables: false,
    usabilityCtx: buildDeckUsabilityContext([], {}),
  };

  it('detects true Any Character specials from linked character fields only', () => {
    expect(
      isAnyCharacterSpecialCard({ id: 's1', name: 'Merlin', character: 'Any Character' }),
    ).toBe(true);
    expect(
      isAnyCharacterSpecialCard({
        id: 's2',
        name: 'The Gemini',
        character_name: 'any character',
      }),
    ).toBe(true);
    expect(
      isAnyCharacterSpecialCard({
        id: 's3',
        name: 'Set Loose',
        character: 'Mr. Hyde',
        card_text: 'Opponent may not use Any Character Special cards.',
      }),
    ).toBe(false);
  });

  it('keeps text-only Any Character matches out of the Any-Char tab', () => {
    const cards: CatalogCard[] = [
      {
        id: 'hyde',
        name: 'Set Loose',
        character: 'Mr. Hyde',
        card_text: 'Opponent may not use Any Character Special cards.',
      },
      { id: 'any', name: 'Merlin Magic', character: 'Any Character' },
      { id: 'char', name: 'Web Swing', character: 'Spider-Man' },
    ];

    const anyCharacter = filterAndSortTypeCardsWithOptions(cards, 'special-cards', {
      ...baseOptions,
      searchQuery: 'Any Character',
      specialScope: 'any-character',
    });
    const characterSpecific = filterAndSortTypeCardsWithOptions(cards, 'special-cards', {
      ...baseOptions,
      searchQuery: 'Any Character',
      specialScope: 'character-specific',
    });

    expect(anyCharacter.map((c) => c.id)).toEqual(['any']);
    expect(characterSpecific.map((c) => c.id)).toEqual(['hyde']);
  });

  it('sorts Any-Char specials by set number before function fallback', () => {
    const cards: CatalogCard[] = [
      {
        id: 'assist',
        name: 'Assist',
        character: 'Any Character',
        set: 'ERB',
        set_number: '003',
        is_assist: true,
      },
      {
        id: 'cataclysm',
        name: 'Cataclysm',
        character: 'Any Character',
        set: 'ERB',
        set_number: '001',
        is_cataclysm: true,
      },
      {
        id: 'ambush',
        name: 'Ambush',
        character: 'Any Character',
        set: 'ERB',
        set_number: '002',
        is_ambush: true,
      },
    ];

    const result = filterAndSortTypeCardsWithOptions(cards, 'special-cards', {
      ...baseOptions,
      specialScope: 'any-character',
    });

    expect(result.map((c) => c.id)).toEqual(['cataclysm', 'ambush', 'assist']);
  });

  it('groups Any-Char specials by function when set numbers tie', () => {
    const cards: CatalogCard[] = [
      { id: 'normal', name: 'Normal', character: 'Any Character', set: 'ERB' },
      {
        id: 'assist',
        name: 'Assist',
        character: 'Any Character',
        set: 'ERB',
        is_assist: true,
      },
      {
        id: 'ambush',
        name: 'Ambush',
        character: 'Any Character',
        set: 'ERB',
        is_ambush: true,
      },
      {
        id: 'cataclysm',
        name: 'Cataclysm',
        character: 'Any Character',
        set: 'ERB',
        is_cataclysm: true,
      },
    ];

    const result = filterAndSortTypeCardsWithOptions(cards, 'special-cards', {
      ...baseOptions,
      specialScope: 'any-character',
    });

    expect(result.map((c) => c.id)).toEqual(['cataclysm', 'ambush', 'assist', 'normal']);
  });
});
