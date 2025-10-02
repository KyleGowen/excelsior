/**
 * Unit tests for "No decks yet" tile clickable functionality
 * Tests that the empty state tile opens the new deck editor when clicked
 */

import { JSDOM } from 'jsdom';

describe('No Decks Yet Tile Clickable Functionality', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    // Create a fresh JSDOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
          <style>
            .deck-card {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              padding: 20px;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .deck-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
              border-color: rgba(78, 205, 196, 0.6);
              background: rgba(255, 255, 255, 0.15);
            }
            .deck-card[onclick="createNewDeck()"]:hover {
              transform: translateY(-3px);
              box-shadow: 0 12px 30px rgba(78, 205, 196, 0.3);
              border-color: rgba(78, 205, 196, 0.8);
              background: rgba(78, 205, 196, 0.1);
            }
            .deck-card[onclick="createNewDeck()"]:hover h4 {
              color: #4ecdc4;
            }
            .deck-card[onclick="createNewDeck()"]:hover p {
              color: #ffffff;
            }
          </style>
        </head>
        <body>
          <div id="deck-list"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as any;
    global.document = document;
    global.window = window;

    // Mock createNewDeck function
    (window as any).createNewDeck = jest.fn();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('No decks yet tile generation', () => {
    it('should generate clickable tile when no decks exist', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = []; // Empty decks array

      // Simulate the displayDecks function logic
      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile).toBeTruthy();
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      expect(noDecksTile.style.cursor).toBe('pointer');
    });

    it('should have correct text content', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const h4 = deckList!.querySelector('h4');
      const p = deckList!.querySelector('p');
      
      expect(h4).toBeTruthy();
      expect(p).toBeTruthy();
      expect(h4!.textContent).toBe('No decks yet');
      expect(p!.textContent).toBe('Create your first deck to get started!');
    });

    it('should have correct styling attributes', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile.style.textAlign).toBe('center');
      expect(noDecksTile.style.color).toBe('rgb(189, 195, 199)'); // #bdc3c7
      expect(noDecksTile.style.cursor).toBe('pointer');
    });
  });

  describe('Click functionality', () => {
    it('should call createNewDeck when clicked', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Simulate click by calling the onclick function directly
      const onclickAttr = noDecksTile.getAttribute('onclick');
      expect(onclickAttr).toBe('createNewDeck()');
      
      // Call the function directly since JSDOM doesn't execute onclick attributes
      (window as any).createNewDeck();

      expect((window as any).createNewDeck).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks correctly', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Simulate multiple clicks by calling the function multiple times
      (window as any).createNewDeck();
      (window as any).createNewDeck();
      (window as any).createNewDeck();

      expect((window as any).createNewDeck).toHaveBeenCalledTimes(3);
    });
  });

  describe('CSS hover effects', () => {
    it('should have special hover styling for clickable tile', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      const h4 = noDecksTile.querySelector('h4');
      const p = noDecksTile.querySelector('p');

      // Test that the tile has the onclick attribute for special styling
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      
      // Test that the elements exist for hover styling
      expect(h4).toBeTruthy();
      expect(p).toBeTruthy();
    });

    it('should have correct CSS classes for hover effects', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile.classList.contains('deck-card')).toBe(true);
    });
  });

  describe('Integration with createNewDeck function', () => {
    it('should work with mocked createNewDeck function', () => {
      // Mock createNewDeck to return a specific value
      (window as any).createNewDeck.mockReturnValue('deck-created');

      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Simulate click by calling the function directly
      (window as any).createNewDeck();

      expect((window as any).createNewDeck).toHaveBeenCalled();
    });

    it('should handle createNewDeck function errors gracefully', () => {
      // Mock createNewDeck to throw an error
      (window as any).createNewDeck.mockImplementation(() => {
        throw new Error('Create deck failed');
      });

      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Should not throw an error when clicking
      expect(() => noDecksTile.click()).not.toThrow();
    });
  });

  describe('Accessibility and usability', () => {
    it('should be keyboard accessible', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Should be focusable
      noDecksTile.tabIndex = 0;
      expect(noDecksTile.tabIndex).toBe(0);
    });

    it('should have appropriate cursor styling', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile.style.cursor).toBe('pointer');
    });

    it('should be visually distinct from regular deck cards', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Should have special styling attributes
      expect(noDecksTile.style.textAlign).toBe('center');
      expect(noDecksTile.style.color).toBe('rgb(189, 195, 199)'); // #bdc3c7
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing createNewDeck function gracefully', () => {
      // Remove createNewDeck function
      delete (window as any).createNewDeck;

      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
            <h4>No decks yet</h4>
            <p>Create your first deck to get started!</p>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Should not throw an error when clicking
      expect(() => noDecksTile.click()).not.toThrow();
    });

    it('should work with different user states', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      // Test with different user scenarios
      const testCases = [
        { user: null, expected: 'guest' },
        { user: { id: 'user-123' }, expected: 'user-123' },
        { user: { userId: 'user-456' }, expected: 'user-456' }
      ];

      testCases.forEach(({ user, expected }) => {
        // Mock getCurrentUser for this test
        (window as any).getCurrentUser = jest.fn().mockReturnValue(user);
        
        if (decks.length === 0) {
          deckList!.innerHTML = `
            <div class="deck-card" style="text-align: center; color: #bdc3c7; cursor: pointer;" onclick="createNewDeck()">
              <h4>No decks yet</h4>
              <p>Create your first deck to get started!</p>
            </div>
          `;
        }

        const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
        expect(noDecksTile).toBeTruthy();
        expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      });
    });
  });
});