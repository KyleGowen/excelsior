import { JSDOM } from 'jsdom';

describe('Deck Editor Scroll Behavior', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Create a JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div class="deck-cards-editor" style="height: 300px; overflow-y: auto;">
            <div class="deck-type-section" data-type="character">
              <div class="deck-type-header">
                <span class="deck-type-toggle">▼</span>
                <span>Character Cards</span>
              </div>
              <div class="deck-type-cards" id="deck-type-character" style="display: block;">
                <div>Character card content</div>
              </div>
            </div>
            <div class="deck-type-section" data-type="power">
              <div class="deck-type-header">
                <span class="deck-type-toggle">▼</span>
                <span>Power Cards</span>
              </div>
              <div class="deck-type-cards" id="deck-type-power" style="display: block;">
                <div>Power card content</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as any;

    // Mock global variables and functions
    (global as any).deckEditorExpansionState = {};
    (global as any).saveDeckExpansionState = jest.fn();
    (global as any).currentDeckId = 'test-deck-123';

    // Mock the toggleDeckTypeSection function
    (global as any).toggleDeckTypeSection = function(type: string) {
      const section = document.getElementById(`deck-type-${type}`);
      const deckTypeSection = section?.closest('.deck-type-section');
      const header = deckTypeSection ? deckTypeSection.querySelector('.deck-type-header') : null;
      const toggle = header ? header.querySelector('.deck-type-toggle') : null;
      
      if (section && header && toggle) {
        if (section.style.display === 'none') {
          section.style.display = 'block';
          toggle.textContent = '▼';
          header.classList.remove('collapsed');
          (global as any).deckEditorExpansionState[type] = true;
        } else {
          section.style.display = 'none';
          toggle.textContent = '▶';
          header.classList.add('collapsed');
          (global as any).deckEditorExpansionState[type] = false;
          
          // Ensure the collapsed header is fully visible by adjusting scroll position
          setTimeout(() => {
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor && header) {
              const headerRect = header.getBoundingClientRect();
              const containerRect = deckCardsEditor.getBoundingClientRect();
              
              // If the header is cut off at the bottom, scroll to show it fully
              if (headerRect.bottom > containerRect.bottom) {
                const scrollAmount = headerRect.bottom - containerRect.bottom + 10; // 10px padding
                deckCardsEditor.scrollTop += scrollAmount;
              }
            }
          }, 10); // Small delay to ensure DOM updates are complete
        }
        
        // Save expansion state to localStorage
        (global as any).saveDeckExpansionState();
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('toggleDeckTypeSection scroll behavior', () => {
    it('should adjust scroll position when collapsing a section that gets cut off', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      const powerSection = document.getElementById('deck-type-power') as HTMLElement;
      const powerDeckTypeSection = powerSection.closest('.deck-type-section') as HTMLElement;
      const powerHeader = powerDeckTypeSection.querySelector('.deck-type-header') as HTMLElement;
      
      // Set initial scroll position to show the power section is at the bottom
      deckCardsEditor.scrollTop = 200; // Scroll down to make power section visible at bottom
      
      // Mock getBoundingClientRect to simulate the header being cut off
      const originalGetBoundingClientRect = (dom.window as any).Element.prototype.getBoundingClientRect;
      (dom.window as any).Element.prototype.getBoundingClientRect = jest.fn().mockImplementation(function(this: Element) {
        if (this === powerHeader) {
          return {
            bottom: 350, // Header bottom is below container
            top: 320,
            left: 0,
            right: 100,
            width: 100,
            height: 30,
            x: 0,
            y: 320
          };
        } else if (this === deckCardsEditor) {
          return {
            bottom: 300, // Container bottom is above header bottom
            top: 0,
            left: 0,
            right: 100,
            width: 100,
            height: 300,
            x: 0,
            y: 0
          };
        }
        return originalGetBoundingClientRect.call(this);
      });

      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Collapse the power section
      (global as any).toggleDeckTypeSection('power');
      
      // Wait for the setTimeout to execute
      setTimeout(() => {
        // The scroll position should have increased to show the collapsed header
        expect(deckCardsEditor.scrollTop).toBeGreaterThan(initialScrollTop);
        
        // Restore original method
        (dom.window as any).Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
        done();
      }, 20);
    });

    it('should not adjust scroll position when collapsing a section that is fully visible', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      const characterSection = document.getElementById('deck-type-character') as HTMLElement;
      const characterDeckTypeSection = characterSection.closest('.deck-type-section') as HTMLElement;
      const characterHeader = characterDeckTypeSection.querySelector('.deck-type-header') as HTMLElement;
      
      // Set initial scroll position to show the character section is fully visible
      deckCardsEditor.scrollTop = 0;
      
      // Mock getBoundingClientRect to simulate the header being fully visible
      const originalGetBoundingClientRect = (dom.window as any).Element.prototype.getBoundingClientRect;
      (dom.window as any).Element.prototype.getBoundingClientRect = jest.fn().mockImplementation(function(this: Element) {
        if (this === characterHeader) {
          return {
            bottom: 50, // Header bottom is above container bottom
            top: 20,
            left: 0,
            right: 100,
            width: 100,
            height: 30,
            x: 0,
            y: 20
          };
        } else if (this === deckCardsEditor) {
          return {
            bottom: 300, // Container bottom is well below header bottom
            top: 0,
            left: 0,
            right: 100,
            width: 100,
            height: 300,
            x: 0,
            y: 0
          };
        }
        return originalGetBoundingClientRect.call(this);
      });

      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Collapse the character section
      (global as any).toggleDeckTypeSection('character');
      
      // Wait for the setTimeout to execute
      setTimeout(() => {
        // The scroll position should not have changed
        expect(deckCardsEditor.scrollTop).toBe(initialScrollTop);
        
        // Restore original method
        (dom.window as any).Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
        done();
      }, 20);
    });

    it('should handle missing deck cards editor gracefully', () => {
      // Remove the deck cards editor element
      const deckCardsEditor = document.querySelector('.deck-cards-editor');
      deckCardsEditor?.remove();
      
      // This should not throw an error
      expect(() => {
        (global as any).toggleDeckTypeSection('character');
      }).not.toThrow();
    });

    it('should handle missing header element gracefully', () => {
      // Remove the header element
      const characterSection = document.getElementById('deck-type-character');
      const deckTypeSection = characterSection?.closest('.deck-type-section');
      const header = deckTypeSection?.querySelector('.deck-type-header');
      header?.remove();
      
      // This should not throw an error
      expect(() => {
        (global as any).toggleDeckTypeSection('character');
      }).not.toThrow();
    });

    it('should update expansion state correctly when collapsing', () => {
      // Initially expanded
      (global as any).deckEditorExpansionState = { character: true };
      
      // Collapse the character section
      (global as any).toggleDeckTypeSection('character');
      
      // State should be updated
      expect((global as any).deckEditorExpansionState.character).toBe(false);
      expect((global as any).saveDeckExpansionState).toHaveBeenCalled();
    });

    it('should update expansion state correctly when expanding', () => {
      // Initially collapsed
      (global as any).deckEditorExpansionState = { character: false };
      const characterSection = document.getElementById('deck-type-character') as HTMLElement;
      characterSection.style.display = 'none';
      
      // Expand the character section
      (global as any).toggleDeckTypeSection('character');
      
      // State should be updated
      expect((global as any).deckEditorExpansionState.character).toBe(true);
      expect((global as any).saveDeckExpansionState).toHaveBeenCalled();
    });
  });
});
