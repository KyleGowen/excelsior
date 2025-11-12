/** @jest-environment jsdom */

describe('Deck Import - Power Cards - Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="importJsonContent"></textarea>
      <div id="importErrorMessages" style="display: none;"></div>
      <button id="importJsonButton"></button>
      <select id="viewMode">
        <option value="card" selected>Card</option>
        <option value="list">List</option>
      </select>
    `;

    (window as any).availableCardsMap = new Map();
    (window as any).deckEditorCards = [];
    (window as any).addCardToEditor = jest.fn(async (type: string, cardId: string, cardName: string) => {
      const existing = (window as any).deckEditorCards.find((c: any) => c.type === type && c.cardId === cardId);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        (window as any).deckEditorCards.push({ type, cardId, cardName, quantity: 1 });
      }
    });
    (window as any).showNotification = jest.fn();
    (window as any).closeImportOverlay = jest.fn();
    (window as any).validateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
    (window as any).loadAvailableCards = jest.fn().mockResolvedValue(undefined);
    (window as any).renderDeckCardsCardView = jest.fn();
    (window as any).renderDeckCardsListView = jest.fn();

    // Load real implementation to attach functions to window
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../public/js/components/deck-import.js');

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    delete (window as any).availableCardsMap;
    delete (window as any).deckEditorCards;
    delete (window as any).addCardToEditor;
    delete (window as any).showNotification;
    delete (window as any).closeImportOverlay;
    delete (window as any).validateDeck;
    delete (window as any).loadAvailableCards;
    delete (window as any).renderDeckCardsCardView;
    delete (window as any).renderDeckCardsListView;
  });

  function seedPowerCards() {
    const map: Map<string, any> = (window as any).availableCardsMap;
    const cards = [
      { id: 'power_energy_1', value: 1, power_type: 'Energy', image: 'power/1_energy.webp' },
      { id: 'power_energy_2', value: 2, power_type: 'Energy', image: 'power/2_energy.webp' },
      { id: 'power_energy_3', value: 3, power_type: 'Energy', image: 'power/3_energy.webp' },
      { id: 'power_combat_4', value: 4, power_type: 'Combat', image: 'power/4_combat.webp' },
      { id: 'power_multi_3', value: 3, power_type: 'Multi Power', image: 'power/3_multi.webp' },
      { id: 'power_any_5', value: 5, power_type: 'Any-Power', image: 'power/5_any.webp' },
      { id: 'power_brute_6', value: 6, power_type: 'Brute Force', image: 'power/6_brute.webp' },
      { id: 'power_int_6', value: 6, power_type: 'Intelligence', image: 'power/6_int.webp' },
      { id: 'power_combat_8', value: 8, power_type: 'Combat', image: 'power/8_combat.webp' }
    ];
    cards.forEach(c => map.set(c.id, { ...c, cardType: 'power', name: `${c.value} - ${c.power_type}` }));
  }

  describe('extractCardsFromImportData - power_cards', () => {
    it('parses power cards in "<value> - <type>" format', () => {
      const fn = (window as any).extractCardsFromImportData as (d: any) => any[];
      const result = fn({ power_cards: ['1 - Combat', '3 - Multi Power', '5 - Any-Power'] });
      expect(result).toEqual([
        { name: '1 - Combat', type: 'power' },
        { name: '3 - Multi Power', type: 'power' },
        { name: '5 - Any-Power', type: 'power' }
      ]);
    });

    it('tolerates extra whitespace and missing hyphen fallback', () => {
      const fn = (window as any).extractCardsFromImportData as (d: any) => any[];
      const result = fn({ power_cards: [' 2  -  Energy ', '7 Any-Power'] });
      expect(result[0]).toEqual({ name: '2 - Energy', type: 'power' });
      expect(result[1]).toEqual({ name: '7 Any-Power', type: 'power' });
    });
  });

  describe('findCardIdByName - power parsing', () => {
    it('finds by parsed value and power_type', () => {
      seedPowerCards();
      const find = (window as any).findCardIdByName as (n: string, t?: string) => string | null;
      expect(find('3 - Multi Power', 'power')).toBe('power_multi_3');
      expect(find('5 - Any-Power', 'power')).toBe('power_any_5');
      expect(find('6 - Intelligence', 'power')).toBe('power_int_6');
    });
  });

  describe('processImportDeck - Power import', () => {
    it('imports multiple power cards and allows duplicates', async () => {
      seedPowerCards();
      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({
        cards: {
          power_cards: ['2 - Energy', '2 - Energy', '4 - Combat', '3 - Multi Power', '5 - Any-Power']
        }
      });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      const added = (window as any).deckEditorCards.filter((c: any) => c.type === 'power');
      expect(added.length).toBeGreaterThan(0);
      // Ensure duplicates were added (quantity increments)
      const energy2 = added.find((c: any) => c.cardId === 'power_energy_2');
      expect(energy2?.quantity).toBe(2);
      // Verify calls (note: addCardToEditor no longer takes a 4th parameter for alternate images)
      expect((window as any).addCardToEditor).toHaveBeenCalledWith('power', 'power_energy_2', '2 - Energy');
      expect((window as any).addCardToEditor).toHaveBeenCalledWith('power', 'power_combat_4', '4 - Combat');
      expect((window as any).addCardToEditor).toHaveBeenCalledWith('power', 'power_multi_3', '3 - Multi Power');
      expect((window as any).addCardToEditor).toHaveBeenCalledWith('power', 'power_any_5', '5 - Any-Power');
    });

    it('preserves Card View after power import', async () => {
      seedPowerCards();
      const select = document.getElementById('viewMode') as HTMLSelectElement;
      select.value = 'card';

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({ cards: { power_cards: ['3 - Energy'] } });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
      expect((window as any).renderDeckCardsListView).not.toHaveBeenCalled();
    });

    it('preserves List View after power import', async () => {
      seedPowerCards();
      const select = document.getElementById('viewMode') as HTMLSelectElement;
      select.value = 'list';

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({ cards: { power_cards: ['3 - Energy'] } });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      expect((window as any).renderDeckCardsListView).toHaveBeenCalled();
      expect((window as any).renderDeckCardsCardView).not.toHaveBeenCalled();
    });

    it('defaults to Card View when viewMode is missing', async () => {
      seedPowerCards();
      const view = document.getElementById('viewMode');
      view?.parentElement?.removeChild(view);

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({ cards: { power_cards: ['4 - Combat'] } });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
    });
  });
});


