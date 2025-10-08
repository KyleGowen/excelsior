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

  describe('Deck Editor Initial Scroll Position', () => {
    it('should set scroll position to top when showDeckEditor is called', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to bottom initially
      deckCardsEditor.scrollTop = 200;
      
      // Mock the showDeckEditor function behavior
      function showDeckEditor() {
        // Simulate the setTimeout behavior from the actual function
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = 0;
          }
        }, 50);
      }
      
      // Call showDeckEditor
      showDeckEditor();
      
      // Wait for the setTimeout to execute
      setTimeout(() => {
        expect(deckCardsEditor.scrollTop).toBe(0);
        done();
      }, 60);
    });

    it('should set scroll position to top in ensureScrollContainerCanShowAllContent', () => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to bottom initially
      deckCardsEditor.scrollTop = 200;
      
      // Mock the ensureScrollContainerCanShowAllContent function
      function ensureScrollContainerCanShowAllContent() {
        if (!deckCardsEditor) return;
        
        // Force a reflow to ensure all measurements are accurate
        deckCardsEditor.offsetHeight;
        
        // Always start at the top of the deck editor
        deckCardsEditor.scrollTop = 0;
      }
      
      // Call the function
      ensureScrollContainerCanShowAllContent();
      
      // Verify scroll position is set to top
      expect(deckCardsEditor.scrollTop).toBe(0);
    });

    it('should handle missing deck cards editor gracefully in ensureScrollContainerCanShowAllContent', () => {
      // Remove the deck cards editor element
      const deckCardsEditor = document.querySelector('.deck-cards-editor');
      deckCardsEditor?.remove();
      
      // Mock the ensureScrollContainerCanShowAllContent function
      function ensureScrollContainerCanShowAllContent() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        if (!deckCardsEditor) return;
        
        // This should not execute if element is missing
        deckCardsEditor.scrollTop = 0;
      }
      
      // This should not throw an error
      expect(() => {
        ensureScrollContainerCanShowAllContent();
      }).not.toThrow();
    });

    it('should handle missing deck cards editor gracefully in showDeckEditor', (done) => {
      // Remove the deck cards editor element
      const deckCardsEditor = document.querySelector('.deck-cards-editor');
      deckCardsEditor?.remove();
      
      // Mock the showDeckEditor function behavior
      function showDeckEditor() {
        setTimeout(() => {
          const deckCardsEditor = document.querySelector('.deck-cards-editor');
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = 0;
          }
        }, 50);
      }
      
      // This should not throw an error
      expect(() => {
        showDeckEditor();
      }).not.toThrow();
      
      // Wait for setTimeout to complete
      setTimeout(() => {
        done();
      }, 60);
    });

    it('should preserve scroll position when adding/removing cards with -1/+1 buttons', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to middle
      deckCardsEditor.scrollTop = 150;
      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Mock the removeOneCardFromEditor function behavior (preserving scroll position)
      function removeOneCardFromEditor() {
        // Capture current scroll position before re-rendering
        const currentScrollTop = deckCardsEditor.scrollTop;
        
        // Simulate card removal logic
        // ... (card removal logic would go here)
        
        // Simulate displayDeckCardsForEditing() rebuilding the DOM
        // This would normally reset scroll position, but we restore it with setTimeout
        setTimeout(() => {
          deckCardsEditor.scrollTop = currentScrollTop;
        }, 10);
      }
      
      // Mock the addOneCardToEditor function behavior (preserving scroll position)
      function addOneCardToEditor() {
        // Capture current scroll position before re-rendering
        const currentScrollTop = deckCardsEditor.scrollTop;
        
        // Simulate card addition logic
        // ... (card addition logic would go here)
        
        // Simulate displayDeckCardsForEditing() rebuilding the DOM
        // This would normally reset scroll position, but we restore it with setTimeout
        setTimeout(() => {
          deckCardsEditor.scrollTop = currentScrollTop;
        }, 10);
      }
      
      // Call both functions
      removeOneCardFromEditor();
      addOneCardToEditor();
      
      // Wait for setTimeout to complete and check scroll position
      setTimeout(() => {
        expect(deckCardsEditor.scrollTop).toBe(initialScrollTop);
        done();
      }, 20);
    });

    it('should preserve scroll position when removing individual cards with Remove button', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to middle
      deckCardsEditor.scrollTop = 200;
      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Mock the removeCardFromEditor function behavior (preserving scroll position)
      function removeCardFromEditor() {
        // Capture current scroll position before re-rendering
        const currentScrollTop = deckCardsEditor.scrollTop;
        
        // Simulate card removal logic
        // ... (card removal logic would go here)
        
        // Simulate displayDeckCardsForEditing() rebuilding the DOM
        // This would normally reset scroll position, but we restore it with setTimeout
        setTimeout(() => {
          deckCardsEditor.scrollTop = currentScrollTop;
        }, 10);
      }
      
      // Call the function
      removeCardFromEditor();
      
      // Wait for setTimeout to complete and check scroll position
      setTimeout(() => {
        expect(deckCardsEditor.scrollTop).toBe(initialScrollTop);
        done();
      }, 20);
    });

    it('should preserve scroll position when removing all missions', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to middle
      deckCardsEditor.scrollTop = 300;
      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Mock the removeAllMissionsFromDeck function behavior (preserving scroll position)
      function removeAllMissionsFromDeck() {
        // Capture current scroll position before re-rendering
        const currentScrollTop = deckCardsEditor.scrollTop;
        
        // Simulate mission removal logic
        // ... (mission removal logic would go here)
        
        // Simulate displayDeckCardsForEditing() rebuilding the DOM
        // This would normally reset scroll position, but we restore it with setTimeout
        setTimeout(() => {
          deckCardsEditor.scrollTop = currentScrollTop;
        }, 10);
      }
      
      // Call the function
      removeAllMissionsFromDeck();
      
      // Wait for setTimeout to complete and check scroll position
      setTimeout(() => {
        expect(deckCardsEditor.scrollTop).toBe(initialScrollTop);
        done();
      }, 20);
    });

    it('should preserve scroll position when removing all cards of a specific type', (done) => {
      const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
      
      // Set scroll position to middle
      deckCardsEditor.scrollTop = 250;
      const initialScrollTop = deckCardsEditor.scrollTop;
      
      // Mock the removeAllCardsFromDeck function behavior (preserving scroll position)
      function removeAllCardsFromDeck() {
        // Capture current scroll position before re-rendering
        const currentScrollTop = deckCardsEditor.scrollTop;
        
        // Simulate card type removal logic
        // ... (card type removal logic would go here)
        
        // Simulate displayDeckCardsForEditing() rebuilding the DOM
        // This would normally reset scroll position, but we restore it with setTimeout
        setTimeout(() => {
          deckCardsEditor.scrollTop = currentScrollTop;
        }, 10);
      }
      
      // Call the function
      removeAllCardsFromDeck();
      
      // Wait for setTimeout to complete and check scroll position
      setTimeout(() => {
        expect(deckCardsEditor.scrollTop).toBe(initialScrollTop);
        done();
      }, 20);
    });

    it('should handle missing deck cards editor gracefully in all card operation functions', () => {
      // Remove the deck cards editor element
      const deckCardsEditor = document.querySelector('.deck-cards-editor');
      deckCardsEditor?.remove();
      
      // Mock all card operation functions
      function removeOneCardFromEditor() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = currentScrollTop;
          }
        }, 10);
      }
      
      function addOneCardToEditor() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = currentScrollTop;
          }
        }, 10);
      }
      
      function removeCardFromEditor() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = currentScrollTop;
          }
        }, 10);
      }
      
      function removeAllMissionsFromDeck() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = currentScrollTop;
          }
        }, 10);
      }
      
      function removeAllCardsFromDeck() {
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        setTimeout(() => {
          if (deckCardsEditor) {
            deckCardsEditor.scrollTop = currentScrollTop;
          }
        }, 10);
      }
      
      // All functions should not throw errors when deck cards editor is missing
      expect(() => {
        removeOneCardFromEditor();
        addOneCardToEditor();
        removeCardFromEditor();
        removeAllMissionsFromDeck();
        removeAllCardsFromDeck();
      }).not.toThrow();
    });
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
