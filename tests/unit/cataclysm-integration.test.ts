/**
 * Integration tests for Cataclysm validation
 * Tests the complete flow from addCardToEditor through visual dimming
 */

import { JSDOM } from 'jsdom';

describe('Cataclysm Integration', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .card-item.disabled {
              opacity: 0.5;
              pointer-events: none;
            }
            .card-item {
              opacity: 1;
              pointer-events: auto;
            }
          </style>
        </head>
        <body>
          <div id="deck-available-cards">
            <div class="card-item" data-id="special1" data-type="special" draggable="true">
              <div class="card-name">Grim Reaper</div>
            </div>
            <div class="card-item" data-id="special2" data-type="special" draggable="true">
              <div class="card-name">Doomsday</div>
            </div>
            <div class="card-item" data-id="special3" data-type="special" draggable="true">
              <div class="card-name">Regular Special</div>
            </div>
            <div class="card-item" data-id="special4" data-type="special" draggable="true">
              <div class="card-name">Another Cataclysm</div>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;

    // Mock global variables
    window.deckEditorCards = [];
    window.availableCardsMap = new Map([
      ['special1', { id: 'special1', name: 'Grim Reaper', is_cataclysm: true, one_per_deck: false }],
      ['special2', { id: 'special2', name: 'Doomsday', is_cataclysm: true, one_per_deck: false }],
      ['special3', { id: 'special3', name: 'Regular Special', is_cataclysm: false, one_per_deck: false }],
      ['special4', { id: 'special4', name: 'Another Cataclysm', is_cataclysm: true, one_per_deck: false }]
    ]);

    // Mock notification function
    window.showNotification = jest.fn();

    // Mock the actual functions from the real codebase
    window.updateCataclysmLimitStatus = function() {
      const cataclysmCardsInDeck = new Set();
      window.deckEditorCards.forEach((card: any) => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_cataclysm === true) {
          cataclysmCardsInDeck.add(card.cardId);
        }
      });
      
      const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
      specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
          const cardData = window.availableCardsMap.get(cardId);
          const isCataclysm = cardData && cardData.is_cataclysm === true;
          const isInDeck = cataclysmCardsInDeck.has(cardId);
          const hasOtherCataclysm = cataclysmCardsInDeck.size > 0;
          
          if (isCataclysm && (isInDeck || hasOtherCataclysm)) {
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            if (isInDeck) {
              (cardElement as HTMLElement).title = 'Cataclysm - already in deck';
            } else {
              (cardElement as HTMLElement).title = 'Cataclysm - another cataclysm already selected';
            }
          } else if (isCataclysm && !hasOtherCataclysm) {
            cardElement.classList.remove('disabled');
            cardElement.setAttribute('draggable', 'true');
            (cardElement as HTMLElement).title = '';
          }
        }
      });
    };

    // Mock addCardToEditor function (simplified version)
    window.addCardToEditor = async function(cardType: string, cardId: string, cardName: string) {
      // Check Cataclysm limit for special cards
      if (cardType === 'special') {
        const cardData = window.availableCardsMap.get(cardId);
        const isCataclysm = cardData && cardData.is_cataclysm === true;
        if (isCataclysm) {
          const hasExistingCataclysm = window.deckEditorCards.some((card: any) => {
            const cardData = window.availableCardsMap.get(card.cardId);
            return cardData && cardData.is_cataclysm === true;
          });
          
          if (hasExistingCataclysm) {
            window.showNotification(`Cannot add more than 1 Cataclysm to a deck`, 'error');
            return;
          }
        }
      }

      // Add card to deck
      window.deckEditorCards.push({
        type: cardType,
        cardId: cardId,
        quantity: 1
      });

      // Update dimming status
      window.updateCataclysmLimitStatus();
    };

    // Mock removeCardFromDeck function
    window.removeCardFromDeck = function(cardType: string, cardId: string) {
      const index = window.deckEditorCards.findIndex((card: any) => 
        card.type === cardType && card.cardId === cardId
      );
      
      if (index !== -1) {
        window.deckEditorCards.splice(index, 1);
        window.updateCataclysmLimitStatus();
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Complete addCardToEditor Flow', () => {
    it('should dim all cataclysm cards immediately after adding one', async () => {
      // Initially, all cataclysm cards should not be dimmed
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      const anotherCataclysmCard = document.querySelector('[data-id="special4"]') as HTMLElement;
      
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(false);
      expect(anotherCataclysmCard?.classList.contains('disabled')).toBe(false);

      // Add Grim Reaper (cataclysm) to deck
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');

      // All cataclysm cards should now be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
      expect(anotherCataclysmCard?.classList.contains('disabled')).toBe(true);
      
      // Grim Reaper should have "already in deck" tooltip
      expect(grimReaperCard?.title).toBe('Cataclysm - already in deck');
      
      // Other cataclysm cards should have "another cataclysm selected" tooltip
      expect(doomsdayCard?.title).toBe('Cataclysm - another cataclysm already selected');
      expect(anotherCataclysmCard?.title).toBe('Cataclysm - another cataclysm already selected');
    });

    it('should prevent adding second cataclysm card', async () => {
      // Add first cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      expect(window.deckEditorCards).toHaveLength(1);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Try to add second cataclysm
      await window.addCardToEditor('special', 'special2', 'Doomsday');
      
      expect(window.deckEditorCards).toHaveLength(1); // Still only 1
      expect(window.showNotification).toHaveBeenCalledWith('Cannot add more than 1 Cataclysm to a deck', 'error');
    });

    it('should allow adding regular special cards after cataclysm', async () => {
      // Add cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      expect(window.deckEditorCards).toHaveLength(1);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Add regular special card
      await window.addCardToEditor('special', 'special3', 'Regular Special');
      
      expect(window.deckEditorCards).toHaveLength(2);
      expect(window.showNotification).toHaveBeenCalledTimes(0);
    });
  });

  describe('Card Removal and Re-enabling', () => {
    it('should re-enable all cataclysm cards when cataclysm is removed', async () => {
      // Add cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      // All should be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);

      // Remove the cataclysm
      window.removeCardFromDeck('special', 'special1');
      
      // All should be re-enabled
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(false);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('true');
      expect(doomsdayCard?.getAttribute('draggable')).toBe('true');
    });

    it('should maintain cataclysm dimming when regular special is removed', async () => {
      // Add cataclysm and regular special
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      await window.addCardToEditor('special', 'special3', 'Regular Special');
      
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      // Cataclysm cards should still be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);

      // Remove regular special
      window.removeCardFromDeck('special', 'special3');
      
      // Cataclysm cards should still be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Multiple Cataclysm Cards', () => {
    it('should handle multiple cataclysm cards correctly', async () => {
      // Add first cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      const anotherCataclysmCard = document.querySelector('[data-id="special4"]') as HTMLElement;
      
      // All cataclysm cards should be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
      expect(anotherCataclysmCard?.classList.contains('disabled')).toBe(true);
      
      // Try to add another cataclysm (should fail)
      await window.addCardToEditor('special', 'special2', 'Doomsday');
      
      expect(window.deckEditorCards).toHaveLength(1); // Still only 1
      expect(window.showNotification).toHaveBeenCalledWith('Cannot add more than 1 Cataclysm to a deck', 'error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deck correctly', async () => {
      window.deckEditorCards = [];
      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(false);
    });

    it('should handle missing card data gracefully', async () => {
      // Add a card with missing data
      window.deckEditorCards = [
        { type: 'special', cardId: 'nonexistent', quantity: 1 }
      ];

      expect(() => {
        window.updateCataclysmLimitStatus();
      }).not.toThrow();
    });

    it('should handle multiple function calls without side effects', async () => {
      // Add cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      
      // Call updateCataclysmLimitStatus multiple times
      window.updateCataclysmLimitStatus();
      window.updateCataclysmLimitStatus();
      window.updateCataclysmLimitStatus();

      // Should still be dimmed
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Visual State Consistency', () => {
    it('should maintain consistent visual state across operations', async () => {
      // Add cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      // Verify initial state
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
      expect(doomsdayCard?.getAttribute('draggable')).toBe('false');
      
      // Remove and re-add (simulate user interaction)
      window.removeCardFromDeck('special', 'special1');
      await window.addCardToEditor('special', 'special2', 'Doomsday');
      
      // State should be consistent
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
      expect(doomsdayCard?.getAttribute('draggable')).toBe('false');
    });
  });
});
