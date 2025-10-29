/** @jest-environment jsdom */
import { jest } from '@jest/globals';

// Provide minimal DOM for the component
document.body.innerHTML = `
  <div class="deck-editor-search-container">
    <input id="deckEditorSearchInput" />
    <div id="deckEditorSearchResults" style="display:none"></div>
  </div>
`;

// Attach globals (service first, then component)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../public/js/services/CardSearchService.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../public/js/components/DeckEditorSearch.js');

const input = document.getElementById('deckEditorSearchInput') as HTMLInputElement;
const results = document.getElementById('deckEditorSearchResults') as HTMLElement;
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('DeckEditorSearch component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn() as any;
    ((global as any).fetch as any).mockResolvedValue({ json: async () => ({ success: true, data: [] }) } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders empty state when no results', async () => {
    const component = new (window as any).DeckEditorSearch({ input, results, debounceMs: 0, minChars: 1 });
    component.render([]);
    expect(results.style.display).toBe('block');
    expect(results.innerHTML).toContain('No cards found');
  });

  test('renders results and calls onSelect on click', async () => {
    const onSelect = jest.fn();
    const component = new (window as any).DeckEditorSearch({ input, results, onSelect, debounceMs: 0, minChars: 1 });
    component.render([{ id: 'c1', name: 'King Arthur', type: 'character', image: 'ka.jpg', character: null }]);
    const item = results.querySelector('.deck-editor-search-result') as HTMLElement;
    expect(item).toBeTruthy();
    item.click();
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', type: 'character' }));
  });
});


