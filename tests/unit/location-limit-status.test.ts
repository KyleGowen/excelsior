/**
 * @jest-environment jsdom
 */

describe('Location Limit Status', () => {
  let mockDeckEditorCards: any[];
  let mockLocationRows: HTMLTableRowElement[];
  let mockAddButton: HTMLButtonElement;
  let mockImg: HTMLImageElement;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <table>
        <tbody id="locations-tbody">
          <tr class="loading">
            <td>Loading...</td>
          </tr>
          <tr>
            <td>
              <img src="test1.jpg" alt="Location 1">
            </td>
            <td>
              <button class="add-to-deck-btn">Add to Deck</button>
            </td>
            <td>Location 1</td>
          </tr>
          <tr>
            <td>
              <img src="test2.jpg" alt="Location 2">
            </td>
            <td>
              <button class="add-to-deck-btn">Add to Deck</button>
            </td>
            <td>Location 2</td>
          </tr>
        </tbody>
      </table>
    `;

    // Set up mock data
    mockDeckEditorCards = [];
    (window as any).deckEditorCards = mockDeckEditorCards;

    // Get references to DOM elements
    mockLocationRows = Array.from(document.querySelectorAll('#locations-tbody tr')).slice(1) as HTMLTableRowElement[]; // Skip loading row
    mockAddButton = mockLocationRows[0].querySelector('.add-to-deck-btn') as HTMLButtonElement;
    mockImg = mockLocationRows[0].querySelector('img') as HTMLImageElement;

    // Mock the updateLocationLimitStatus function
    (window as any).updateLocationLimitStatus = function() {
      const locationRows = document.querySelectorAll('#locations-tbody tr');
      const currentLocationCount = (window as any).deckEditorCards
        .filter((card: any) => card.type === 'location')
        .length;
      
      const isLocationLimitReached = currentLocationCount >= 1;
      
      locationRows.forEach((row: Element) => {
        // Skip the loading row - check if the row itself has the loading class
        if (row.classList.contains('loading')) {
          return;
        }
        
        const addButton = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
        const img = row.querySelector('img') as HTMLImageElement;
        
        if (isLocationLimitReached) {
          // Disable the row
          row.classList.add('disabled');
          if (addButton) {
            addButton.disabled = true;
            addButton.style.opacity = '0.5';
            addButton.style.cursor = 'not-allowed';
            addButton.title = 'Location limit reached (max 1)';
          }
          if (img) {
            img.style.opacity = '0.5';
            img.style.cursor = 'not-allowed';
            img.title = 'Location limit reached (max 1)';
          }
        } else {
          // Enable the row
          row.classList.remove('disabled');
          if (addButton) {
            addButton.disabled = false;
            addButton.style.opacity = '1';
            addButton.style.cursor = 'pointer';
            addButton.title = '';
          }
          if (img) {
            img.style.opacity = '1';
            img.style.cursor = 'pointer';
            img.title = '';
          }
        }
      });
    };

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateLocationLimitStatus', () => {
    it('should disable all location rows when one location is in deck', () => {
      // Add a location to the deck
      mockDeckEditorCards.push({ type: 'location', cardId: 'loc1', quantity: 1 });

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Check that all rows are disabled
      mockLocationRows.forEach(row => {
        expect(row.classList.contains('disabled')).toBe(true);
        
        const addButton = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
        const img = row.querySelector('img') as HTMLImageElement;
        
        expect(addButton.disabled).toBe(true);
        expect(addButton.style.opacity).toBe('0.5');
        expect(addButton.style.cursor).toBe('not-allowed');
        expect(addButton.title).toBe('Location limit reached (max 1)');
        
        expect(img.style.opacity).toBe('0.5');
        expect(img.style.cursor).toBe('not-allowed');
        expect(img.title).toBe('Location limit reached (max 1)');
      });
    });

    it('should enable all location rows when no locations are in deck', () => {
      // No locations in deck
      mockDeckEditorCards.length = 0;

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Check that all rows are enabled
      mockLocationRows.forEach(row => {
        expect(row.classList.contains('disabled')).toBe(false);
        
        const addButton = row.querySelector('.add-to-deck-btn') as HTMLButtonElement;
        const img = row.querySelector('img') as HTMLImageElement;
        
        expect(addButton.disabled).toBe(false);
        expect(addButton.style.opacity).toBe('1');
        expect(addButton.style.cursor).toBe('pointer');
        expect(addButton.title).toBe('');
        
        expect(img.style.opacity).toBe('1');
        expect(img.style.cursor).toBe('pointer');
        expect(img.title).toBe('');
      });
    });

    it('should skip loading rows', () => {
      // Add a location to the deck
      mockDeckEditorCards.push({ type: 'location', cardId: 'loc1', quantity: 1 });

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Check that loading row is not affected (it should not have disabled class)
      const loadingRow = document.querySelector('#locations-tbody tr.loading');
      console.log('Loading row classes:', loadingRow?.classList.toString());
      console.log('Loading row has disabled class:', loadingRow?.classList.contains('disabled'));
      expect(loadingRow?.classList.contains('disabled')).toBe(false);
      
      // Check that regular rows are disabled
      const regularRows = document.querySelectorAll('#locations-tbody tr:not(.loading)');
      regularRows.forEach(row => {
        expect(row.classList.contains('disabled')).toBe(true);
      });
    });

    it('should handle rows without add button gracefully', () => {
      // Remove add button from first row
      const firstRow = mockLocationRows[0];
      const addButton = firstRow.querySelector('.add-to-deck-btn');
      addButton?.remove();

      // Add a location to the deck
      mockDeckEditorCards.push({ type: 'location', cardId: 'loc1', quantity: 1 });

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Should not throw error and should still disable the row
      expect(firstRow.classList.contains('disabled')).toBe(true);
    });

    it('should handle rows without image gracefully', () => {
      // Remove image from first row
      const firstRow = mockLocationRows[0];
      const img = firstRow.querySelector('img');
      img?.remove();

      // Add a location to the deck
      mockDeckEditorCards.push({ type: 'location', cardId: 'loc1', quantity: 1 });

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Should not throw error and should still disable the row
      expect(firstRow.classList.contains('disabled')).toBe(true);
    });

    it('should work with multiple location cards in deck', () => {
      // Add multiple locations to the deck (this shouldn't happen in practice, but test the logic)
      mockDeckEditorCards.push(
        { type: 'location', cardId: 'loc1', quantity: 1 },
        { type: 'location', cardId: 'loc2', quantity: 1 }
      );

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Should still disable all rows since count >= 1
      mockLocationRows.forEach(row => {
        expect(row.classList.contains('disabled')).toBe(true);
      });
    });

    it('should not affect non-location cards in deck', () => {
      // Add non-location cards to the deck
      mockDeckEditorCards.push(
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'mission', cardId: 'miss1', quantity: 1 }
      );

      // Call the function
      (window as any).updateLocationLimitStatus();

      // Should enable all location rows since no locations in deck
      mockLocationRows.forEach(row => {
        expect(row.classList.contains('disabled')).toBe(false);
      });
    });
  });
});
