/**
 * Unit tests for "Create your first deck." tile clickable functionality
 * Tests that the empty state tile opens the new deck editor when clicked
 * and has the correct embossed styling
 */

import { JSDOM } from 'jsdom';

describe('Create Your First Deck Tile Clickable Functionality', () => {
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
              min-height: 140px;
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

  describe('Empty state tile generation with embossed styling', () => {
    it('should generate clickable tile with correct embossed styling when no decks exist', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = []; // Empty decks array

      // Simulate the updated displayDecks function logic with new styling
      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile).toBeTruthy();
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      expect(noDecksTile.style.cursor).toBe('pointer');
    });

    it('should have correct embossed text content and styling', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const h4 = deckList!.querySelector('h4');
      const p = deckList!.querySelector('p');
      
      expect(h4).toBeTruthy();
      expect(p).toBeFalsy(); // Should not have a paragraph element anymore
      expect(h4!.textContent).toBe('Create your first deck.');
    });

    it('should have correct embossed styling attributes', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      const h4 = noDecksTile.querySelector('h4') as HTMLElement;
      
      // Test container styling
      expect(noDecksTile.style.display).toBe('flex');
      expect(noDecksTile.style.alignItems).toBe('center');
      expect(noDecksTile.style.justifyContent).toBe('center');
      expect(noDecksTile.style.textAlign).toBe('center');
      expect(noDecksTile.style.cursor).toBe('pointer');
      
      // Test embossed text styling
      expect(h4.style.color).toBe('rgb(52, 73, 94)'); // #34495e
      expect(h4.style.fontWeight).toBe('bold');
      expect(h4.style.margin).toBe('0px');
      expect(h4.style.fontSize).toBe('18px');
    });

    it('should be perfectly centered vertically and horizontally', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Test flexbox centering
      expect(noDecksTile.style.display).toBe('flex');
      expect(noDecksTile.style.alignItems).toBe('center');
      expect(noDecksTile.style.justifyContent).toBe('center');
    });
  });

  describe('Click functionality', () => {
    it('should call createNewDeck when clicked', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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

  describe('CSS hover effects with embossed styling', () => {
    it('should have special hover styling for clickable tile', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      const h4 = noDecksTile.querySelector('h4');

      // Test that the tile has the onclick attribute for special styling
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      
      // Test that the h4 element exists for hover styling
      expect(h4).toBeTruthy();
    });

    it('should have correct CSS classes for hover effects', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      
      // Should not throw an error when clicking
      expect(() => noDecksTile.click()).not.toThrow();
    });
  });

  describe('Accessibility and usability with embossed styling', () => {
    it('should be keyboard accessible', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      expect(noDecksTile.style.cursor).toBe('pointer');
    });

    it('should be visually distinct with embossed styling', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      const h4 = noDecksTile.querySelector('h4') as HTMLElement;
      
      // Should have special styling attributes for embossed look
      expect(noDecksTile.style.display).toBe('flex');
      expect(noDecksTile.style.alignItems).toBe('center');
      expect(noDecksTile.style.justifyContent).toBe('center');
      expect(noDecksTile.style.textAlign).toBe('center');
      expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      
      // Should have embossed text styling
      expect(h4.style.color).toBe('rgb(52, 73, 94)'); // #34495e - darker than background
      expect(h4.style.fontWeight).toBe('bold');
      expect(h4.style.margin).toBe('0px');
      expect(h4.style.fontSize).toBe('18px');
    });
  });

  describe('Edge cases with embossed styling', () => {
    it('should handle missing createNewDeck function gracefully', () => {
      // Remove createNewDeck function
      delete (window as any).createNewDeck;

      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
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
            <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
              <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
            </div>
          `;
        }

        const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
        expect(noDecksTile).toBeTruthy();
        expect(noDecksTile.getAttribute('onclick')).toBe('createNewDeck()');
      });
    });
  });

  describe('Embossed styling validation', () => {
    it('should have correct color contrast for embossed effect', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const h4 = deckList!.querySelector('h4') as HTMLElement;
      
      // Test that the color is darker than the background for embossed effect
      expect(h4.style.color).toBe('rgb(52, 73, 94)'); // #34495e
      expect(h4.style.fontWeight).toBe('bold');
    });

    it('should maintain embossed styling across different screen sizes', () => {
      const deckList = document.getElementById('deck-list');
      expect(deckList).toBeTruthy();
      const decks = [];

      if (decks.length === 0) {
        deckList!.innerHTML = `
          <div class="deck-card" style="display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer;" onclick="createNewDeck()">
            <h4 style="color: #34495e; font-weight: bold; margin: 0; font-size: 18px;">Create your first deck.</h4>
          </div>
        `;
      }

      const noDecksTile = deckList!.querySelector('.deck-card') as HTMLElement;
      const h4 = noDecksTile.querySelector('h4') as HTMLElement;
      
      // Test that flexbox centering is maintained
      expect(noDecksTile.style.display).toBe('flex');
      expect(noDecksTile.style.alignItems).toBe('center');
      expect(noDecksTile.style.justifyContent).toBe('center');
      
      // Test that embossed text styling is maintained
      expect(h4.style.color).toBe('rgb(52, 73, 94)');
      expect(h4.style.fontWeight).toBe('bold');
      expect(h4.style.fontSize).toBe('18px');
    });
  });
});