/**
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';

function execFrontendScript(relPathFromRepoRoot: string) {
  const scriptPath = path.join(__dirname, '../..', relPathFromRepoRoot);
  const code = fs.readFileSync(scriptPath, 'utf8');
  // Execute in window context (scripts attach APIs to window and/or define globals)
  new Function(code)();
}

function loadAlphabetization() {
  execFrontendScript('public/js/alphabetization.js');
  return (window as any).Alphabetization;
}

function ensureMinimalImageHelpers() {
  // Used by card display templates at render time.
  (globalThis as any).mapImagePathToActualFile = (p: string) => p;
}

describe('Card Database frontend sorting (All/Special/Locations)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete (window as any).Alphabetization;
    delete (window as any).loadAllCards;
    delete (window as any).displaySpecialCards;
    delete (window as any).displayLocations;
    delete (globalThis as any).fetch;
    delete (globalThis as any).mapImagePathToActualFile;
  });

  it('All tab sorting: sorts by character/group name using Alphabetization ("The" ignored) and forces "Any Character" last', async () => {
    const Alphabetization = loadAlphabetization();
    expect(typeof Alphabetization?.compare).toBe('function');

    // Silence the performance logs in tests.
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    // Load All tab implementation (defines window.loadAllCards)
    execFrontendScript('public/js/all-cards-display.js');
    expect(typeof (window as any).loadAllCards).toBe('function');

    const characters = [
      { id: 'c1', name: 'Tarzan', set: 'MA', set_number: '2', image: 'tarzan.webp' },
      { id: 'c2', name: 'The Mummy', set: 'MA', set_number: '1', image: 'mummy.webp' },
      { id: 'c3', name: 'Morgan le Fay', set: 'MA', set_number: '3', image: 'morgan.webp' }
    ];

    const specials = [
      {
        id: 's1',
        name: 'Ancient Wisdom',
        character: 'The Mummy',
        universe: 'MA',
        set_number: '10',
        image: 'ancient.webp',
        card_effect: ''
      },
      {
        id: 's2',
        name: 'Wildcard Heal',
        character: 'Any Character',
        universe: 'MA',
        set_number: '11',
        image: 'any.webp',
        card_effect: ''
      }
    ];

    // Mock fetch for all card-type endpoints
    (globalThis as any).fetch = jest.fn(async (url: string) => {
      const dataByUrl: Record<string, any[]> = {
        '/api/characters': characters,
        '/api/special-cards': specials
      };
      return {
        async json() {
          return { success: true, data: dataByUrl[url] || [] };
        }
      } as any;
    });

    const loaded = await (window as any).loadAllCards();
    expect(Array.isArray(loaded)).toBe(true);

    // Derive group name the same way the All tab does.
    const groupName = (card: any) => {
      if (card?.character) return String(card.character).trim();
      if (card?.character_name) return String(card.character_name).trim();
      if (card?.cardType === 'character' && card?.name) return String(card.name).trim();
      return String(card?.name || card?.card_name || card?.card_type || '').trim();
    };

    const groupsInOrder: string[] = [];
    for (const c of loaded) {
      const g = groupName(c);
      if (g && groupsInOrder[groupsInOrder.length - 1] !== g) groupsInOrder.push(g);
    }

    // Sanity: our test data is present
    expect(groupsInOrder).toEqual(expect.arrayContaining(['Morgan le Fay', 'The Mummy', 'Tarzan', 'Any Character']));

    // "Any Character" forced last (for character/group sort)
    expect(groupsInOrder[groupsInOrder.length - 1]).toBe('Any Character');

    // "The Mummy" should be treated like "Mummy", so it should appear after Morgan and before Tarzan.
    expect(groupsInOrder.indexOf('Morgan le Fay')).toBeLessThan(groupsInOrder.indexOf('The Mummy'));
    expect(groupsInOrder.indexOf('The Mummy')).toBeLessThan(groupsInOrder.indexOf('Tarzan'));

    // Within The Mummy group, "Ancient Wisdom" (A) should sort before "The Mummy" (T)
    const mummyCards = loaded.filter((c: any) => groupName(c) === 'The Mummy');
    expect(mummyCards.map((c: any) => c.name)).toEqual(['Ancient Wisdom', 'The Mummy']);
  });

  it('Special Cards tab: groups remain intact but are ordered by character name (Alphabetization, "The" ignored) and "Any Character" last', () => {
    loadAlphabetization();
    ensureMinimalImageHelpers();

    execFrontendScript('public/js/card-display.js');
    expect(typeof (window as any).displaySpecialCards).toBe('function');

    document.body.innerHTML = `<table><tbody id="special-cards-tbody"></tbody></table>`;

    const specialCards = [
      { id: 's1', name: '3 Quick Strokes', character: 'Zorro', universe: 'MA', image_path: 'a.webp', card_effect: '' },
      { id: 's2', name: 'Ancient Wisdom', character: 'The Mummy', universe: 'MA', image_path: 'b.webp', card_effect: '' },
      { id: 's3', name: 'A Jealous God', character: 'Zeus', universe: 'MA', image_path: 'c.webp', card_effect: '' },
      { id: 's4', name: 'Mob Mentality', character: 'Angry Mob (Middle Ages)', universe: 'MA', image_path: 'd.webp', card_effect: '' },
      { id: 's5', name: 'Preternatural Healing', character: 'Any Character', universe: 'MA', image_path: 'e.webp', card_effect: '' }
    ];

    (window as any).displaySpecialCards(specialCards);

    const rows = Array.from(document.querySelectorAll('#special-cards-tbody tr'));
    expect(rows.length).toBe(5);

    const rowData = rows.map((tr) => {
      const cells = tr.querySelectorAll('td');
      return {
        name: (cells[2]?.textContent || '').trim(),
        character: (cells[3]?.textContent || '').trim()
      };
    });

    const charactersInOrder = rowData.map((r) => r.character);

    // "Any Character" forced last
    expect(charactersInOrder[charactersInOrder.length - 1]).toBe('Any Character');

    // "The Mummy" should sort under M, after Angry Mob (A...) and before Zeus/Zorro (Z...)
    expect(charactersInOrder.indexOf('Angry Mob (Middle Ages)')).toBeLessThan(charactersInOrder.indexOf('The Mummy'));
    expect(charactersInOrder.indexOf('The Mummy')).toBeLessThan(charactersInOrder.indexOf('Zeus'));
    expect(charactersInOrder.indexOf('The Mummy')).toBeLessThan(charactersInOrder.indexOf('Zorro'));
  });

  it('Locations tab: sorts location names using Alphabetization (leading "The" ignored)', () => {
    loadAlphabetization();
    ensureMinimalImageHelpers();

    execFrontendScript('public/js/card-display.js');
    expect(typeof (window as any).displayLocations).toBe('function');

    document.body.innerHTML = `<table><tbody id="locations-tbody"></tbody></table>`;

    const locations = [
      { id: 'l1', name: 'The Round Table', threat_level: 0, special_ability: '', image: 'rt.webp' },
      { id: 'l2', name: 'Spartan Training Ground', threat_level: 0, special_ability: '', image: 'stg.webp' },
      { id: 'l3', name: 'Event Horizon: The Future', threat_level: 0, special_ability: '', image: 'eh.webp' },
      { id: 'l4', name: 'Barsoom', threat_level: 0, special_ability: '', image: 'bar.webp' }
    ];

    (window as any).displayLocations(locations);

    const names = Array.from(document.querySelectorAll('#locations-tbody tr td:nth-child(3)')).map((td) =>
      (td.textContent || '').trim()
    );

    // Expected alpha order using our global scheme:
    // Barsoom (B), Event Horizon (E), The Round Table (R...), Spartan (S)
    expect(names).toEqual(['Barsoom', 'Event Horizon: The Future', 'The Round Table', 'Spartan Training Ground']);
  });

  it('Characters tab: sorts character names using Alphabetization (leading "The" ignored)', () => {
    loadAlphabetization();
    ensureMinimalImageHelpers();

    execFrontendScript('public/js/card-display.js');
    expect(typeof (window as any).displayCharacters).toBe('function');

    document.body.innerHTML = `<table><tbody id="characters-tbody"></tbody></table><div id="characters-tab" style="display:block;"></div>`;

    const characters = [
      { id: 'c1', name: 'Tarzan', universe: 'MA', threat_level: 10, energy: 1, combat: 1, brute_force: 1, intelligence: 1, image: 't.webp' },
      { id: 'c2', name: 'The Mummy', universe: 'MA', threat_level: 10, energy: 1, combat: 1, brute_force: 1, intelligence: 1, image: 'm.webp' },
      { id: 'c3', name: 'Morgan le Fay', universe: 'MA', threat_level: 10, energy: 1, combat: 1, brute_force: 1, intelligence: 1, image: 'mlf.webp' },
      { id: 'c4', name: 'Zebra', universe: 'MA', threat_level: 10, energy: 1, combat: 1, brute_force: 1, intelligence: 1, image: 'z.webp' }
    ];

    (window as any).displayCharacters(characters);

    const names = Array.from(document.querySelectorAll('#characters-tbody tr td:nth-child(3)')).map((td) =>
      (td.textContent || '').trim()
    );

    // Alphabetization ignores leading "The " for sorting:
    // Morgan (Morg...), The Mummy (Mummy...), Tarzan (T...), Zebra (Z...)
    expect(names).toEqual(['Morgan le Fay', 'The Mummy', 'Tarzan', 'Zebra']);
  });
});

