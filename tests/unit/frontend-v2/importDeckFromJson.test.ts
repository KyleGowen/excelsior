import { api } from '../../../frontend/src/lib/api/client';
import type { CatalogCard } from '../../../frontend/src/lib/api/types';
import { extractCardsFromImportJson } from '../../../src/services/deck-preview/extractCardsFromImportJson';
import {
  DEFAULT_IMPORTED_DECK_NAME,
  deckNameFromImportJson,
  importDeckFromJson,
  parseImportDeckJson,
  parseImportDeckInput,
} from '../../../frontend/src/lib/decks/importDeckFromJson';
import type { ImportDeckJson } from '../../../frontend/src/lib/decks/importTypes';
import {
  buildImportCatalogMap,
  resolveImportCardIds,
} from '../../../src/services/deck-preview/resolveImportCardIds';

describe('extractCardsFromImportJson', () => {
  it('flattens v2.0 export cards into typed entries', () => {
    const entries = extractCardsFromImportJson({
      characters: ['Dracula', 'Dracula'],
      locations: ['Castle Dracula'],
      power_cards: ['3 - Energy', '5 - Combat'],
      teamwork: ['6 Combat - Brute Force + Intelligence'],
      aspects: ['Hidden Resources'],
    });

    expect(entries).toEqual(
      expect.arrayContaining([
        { name: 'Dracula', type: 'character' },
        { name: 'Dracula', type: 'character' },
        { name: 'Castle Dracula', type: 'location' },
        { name: '3 - Energy', type: 'power' },
        { name: '5 - Combat', type: 'power' },
        {
          name: '6 Combat',
          type: 'teamwork',
          followup_attack_types: 'Brute Force + Intelligence',
        },
        { name: 'Hidden Resources', type: 'aspect' },
      ]),
    );
    expect(entries).toHaveLength(7);
  });

  it('extracts grouped special cards', () => {
    const entries = extractCardsFromImportJson({
      special_cards: {
        Dracula: ['Hypnosis'],
      },
    });
    expect(entries).toEqual([{ name: 'Hypnosis', type: 'special' }]);
  });

  it('extracts Battlegrounds and upgrades legacy G.D.A. location exports', () => {
    expect(extractCardsFromImportJson({
      locations: ['Global Defense Agency'],
      battlegrounds: ['Future Battleground'],
    })).toEqual([
      { name: 'Global Defense Agency', type: 'battleground' },
      { name: 'Future Battleground', type: 'battleground' },
    ]);
  });
});

describe('resolveImportCardIds', () => {
  const catalogMap = buildImportCatalogMap({
    characters: [{ id: 'c1', name: 'Dracula' } as CatalogCard],
    'power-cards': [
      { id: 'p1', name: '3 - Energy', value: 3, power_type: 'Energy' } as CatalogCard,
    ],
    teamwork: [
      {
        id: 't1',
        to_use: '6 Combat',
        followup_attack_types: 'Brute Force + Intelligence',
      } as CatalogCard,
    ],
  });

  it('resolves names to ids and aggregates quantities', () => {
    const { resolved, unresolved } = resolveImportCardIds(catalogMap, [
      { name: 'Dracula', type: 'character' },
      { name: 'Dracula', type: 'character' },
      { name: '3 - Energy', type: 'power' },
      {
        name: '6 Combat',
        type: 'teamwork',
        followup_attack_types: 'Brute Force + Intelligence',
      },
    ]);

    expect(unresolved).toHaveLength(0);
    expect(resolved).toEqual(
      expect.arrayContaining([
        { cardType: 'character', cardId: 'c1', quantity: 2 },
        { cardType: 'power', cardId: 'p1', quantity: 1 },
        { cardType: 'teamwork', cardId: 't1', quantity: 1 },
      ]),
    );
  });

  it('returns unresolved entries when names do not match', () => {
    const { resolved, unresolved } = resolveImportCardIds(catalogMap, [
      { name: 'Missing Character', type: 'character' },
    ]);

    expect(resolved).toHaveLength(0);
    expect(unresolved).toEqual([{ name: 'Missing Character', type: 'character' }]);
  });
});

describe('importDeckFromJson helpers', () => {
  it('parseImportDeckJson rejects missing cards section', () => {
    expect(() => parseImportDeckJson('{"name":"Test"}')).toThrow(/cards/i);
  });

  it('deckNameFromImportJson prefers override then JSON name then default', () => {
    const data: ImportDeckJson = { name: 'From JSON', cards: {} };
    expect(deckNameFromImportJson(data, 'Override')).toBe('Override');
    expect(deckNameFromImportJson(data)).toBe('From JSON');
    expect(deckNameFromImportJson({ cards: {} })).toBe(DEFAULT_IMPORTED_DECK_NAME);
  });
});

describe('importDeckFromJson atomic transport', () => {
  it('sends one complete import request to the selected endpoint', async () => {
    const post=jest.spyOn(api,'post').mockResolvedValue({ok:true,deckId:'fictional-deck',userId:'fictional-actor',cardsAdded:2});
    const exportData={cards:{characters:['Zeus'],power_cards:['1 - Energy']}};
    expect(await importDeckFromJson({exportData,deckName:'Fixture',isGuest:true})).toMatchObject({ok:true,cardsAdded:2});
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/api/v1/guest/decks/import',{exportData,name:'Fixture'});
    post.mockRestore();
  });
  it('reports transport failure without attempting a second write', async () => {
    const post=jest.spyOn(api,'post').mockRejectedValue(new Error('Fixture unavailable'));
    expect(await importDeckFromJson({exportData:{cards:{}},deckName:'Fixture',isGuest:false})).toEqual({ok:false,code:'api',message:'Fixture unavailable'});
    expect(post).toHaveBeenCalledTimes(1);
    post.mockRestore();
  });
});

describe('automatic JSON or TopDeck detection', () => {
 it('keeps existing JSON parsing and rejects malformed JSON', () => {expect(parseImportDeckInput('{"cards":{}}')).toEqual({cards:{}});expect(() => parseImportDeckInput('{"cards":')).toThrow();expect(() => parseImportDeckInput('[]')).toThrow();});
 it('passes TopDeck text intact to the server instead of resolving names in the browser', async () => {const text='-- Other Cards --\n1x Cheshire Cat [ERB]';expect(parseImportDeckInput(text)).toBe(text);const post=jest.spyOn(api,'post').mockResolvedValue({ok:true,deckId:'fictional',userId:'fictional',cardsAdded:1});try {await importDeckFromJson({exportData:text,deckName:'Text deck',isGuest:false});expect(post).toHaveBeenCalledWith('/api/v1/decks/import',{exportData:text,name:'Text deck'});}finally {post.mockRestore();}});
 it('rejects empty input', () => {expect(() => parseImportDeckInput('  ')).toThrow(/paste/);});
});

describe('explicit import format selection', () => {
  const text = '-- Other Cards --\n1x Cheshire Cat [ERB]';
  it('honors each selected format', () => {
    expect(parseImportDeckInput(text, 'topdeck')).toBe(text);
    expect(parseImportDeckInput('{"cards":{}}', 'json')).toEqual({ cards: {} });
  });
  it('points to the correct selector when formats do not match', () => {
    expect(() => parseImportDeckInput(text, 'json')).toThrow(/Select TopDeck/);
    expect(() => parseImportDeckInput('{"cards":{}}', 'topdeck')).toThrow(/Select JSON/);
  });
  it('rejects empty or malformed selected input', () => {
    expect(() => parseImportDeckInput('  ', 'topdeck')).toThrow(/paste/);
    expect(() => parseImportDeckInput('{"cards":', 'json')).toThrow();
  });
});
