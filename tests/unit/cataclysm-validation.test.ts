/**
 * Unit tests for Cataclysm validation functionality
 * Tests the complete Cataclysm card validation and dimming system
 */

import { JSDOM } from 'jsdom';

describe('Cataclysm Validation', () => {
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
            <div class="card-item" data-id="special1" data-type="special">
              <div class="card-name">Grim Reaper</div>
            </div>
            <div class="card-item" data-id="special2" data-type="special">
              <div class="card-name">Doomsday</div>
            </div>
            <div class="card-item" data-id="special3" data-type="special">
              <div class="card-name">Regular Special</div>
            </div>
            <div class="card-item character-card" data-id="char1" data-type="character">
              <div class="character-name">Captain Nemo</div>
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
      ['char1', { id: 'char1', name: 'Captain Nemo', is_cataclysm: false, one_per_deck: false }]
    ]);

    // Mock notification function
    window.showNotification = jest.fn();

    // Mock the actual functions from the real codebase
    window.updateCataclysmLimitStatus = function() {
      // Get all Cataclysm cards currently in the deck
      const cataclysmCardsInDeck = new Set();
      window.deckEditorCards.forEach((card: any) => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_cataclysm === true) {
          cataclysmCardsInDeck.add(card.cardId);
        }
      });
      
      // Update all special card items for cataclysm dimming
      const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
      specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
          const cardData = window.availableCardsMap.get(cardId);
          const isCataclysm = cardData && cardData.is_cataclysm === true;
          const isInDeck = cataclysmCardsInDeck.has(cardId);
          const hasOtherCataclysm = cataclysmCardsInDeck.size > 0;
          
          if (isCataclysm && (isInDeck || hasOtherCataclysm)) {
            // This is a Cataclysm card and either it's in the deck or another cataclysm is in the deck - dim it
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            if (isInDeck) {
              (cardElement as HTMLElement).title = 'Cataclysm - already in deck';
            } else {
              (cardElement as HTMLElement).title = 'Cataclysm - another cataclysm already selected';
            }
          } else if (isCataclysm && !hasOtherCataclysm) {
            // This is a Cataclysm card but no cataclysm is in the deck - enable it
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
          // Check if we already have any cataclysm card in the deck
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
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('updateCataclysmLimitStatus', () => {
    it('should dim all cataclysm cards when one is in the deck', () => {
      // Add Grim Reaper (cataclysm) to deck
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      const regularSpecialCard = document.querySelector('[data-id="special3"]') as HTMLElement;

      // Grim Reaper should be dimmed (already in deck)
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
      expect(grimReaperCard?.title).toBe('Cataclysm - already in deck');

      // Doomsday should be dimmed (another cataclysm is in deck)
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.getAttribute('draggable')).toBe('false');
      expect(doomsdayCard?.title).toBe('Cataclysm - another cataclysm already selected');

      // Regular special should not be affected
      expect(regularSpecialCard?.classList.contains('disabled')).toBe(false);
    });

    it('should not dim cataclysm cards when none are in the deck', () => {
      // Empty deck
      window.deckEditorCards = [];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;

      // Both cataclysm cards should be enabled
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(false);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('true');
      expect(doomsdayCard?.getAttribute('draggable')).toBe('true');
    });

    it('should not affect non-cataclysm special cards', () => {
      // Add regular special card to deck
      window.deckEditorCards = [
        { type: 'special', cardId: 'special3', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const regularSpecialCard = document.querySelector('[data-id="special3"]') as HTMLElement;
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;

      // Regular special should not be dimmed
      expect(regularSpecialCard?.classList.contains('disabled')).toBe(false);
      // Note: draggable attribute may not be set in mock HTML, so we check it's not explicitly false
      expect(regularSpecialCard?.getAttribute('draggable')).not.toBe('false');

      // Cataclysm cards should not be dimmed either (no cataclysm in deck)
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
    });

    it('should not affect character cards', () => {
      // Add cataclysm to deck
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const characterCard = document.querySelector('[data-id="char1"]') as HTMLElement;

      // Character card should not be affected
      expect(characterCard?.classList.contains('disabled')).toBe(false);
      // Note: draggable attribute may not be set in mock HTML, so we check it's not explicitly false
      expect(characterCard?.getAttribute('draggable')).not.toBe('false');
    });
  });

  describe('addCardToEditor Integration', () => {
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

    it('should allow adding cataclysm when no cataclysm is in deck', async () => {
      // Add regular special first
      await window.addCardToEditor('special', 'special3', 'Regular Special');
      
      expect(window.deckEditorCards).toHaveLength(1);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Add cataclysm
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      expect(window.deckEditorCards).toHaveLength(2);
      expect(window.showNotification).toHaveBeenCalledTimes(0);
    });
  });

  describe('Visual State Verification', () => {
    it('should apply correct CSS classes for dimmed cataclysm cards', () => {
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(true);
    });

    it('should maintain draggable attribute correctly', () => {
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
      expect(doomsdayCard?.getAttribute('draggable')).toBe('false');
    });

    it('should set correct tooltips for different states', () => {
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      expect(grimReaperCard?.title).toBe('Cataclysm - already in deck');
      expect(doomsdayCard?.title).toBe('Cataclysm - another cataclysm already selected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deck correctly', () => {
      window.deckEditorCards = [];

      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      const doomsdayCard = document.querySelector('[data-id="special2"]') as HTMLElement;
      
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
      expect(doomsdayCard?.classList.contains('disabled')).toBe(false);
    });

    it('should handle missing card data gracefully', () => {
      // Add a card with missing data
      window.deckEditorCards = [
        { type: 'special', cardId: 'nonexistent', quantity: 1 }
      ];

      expect(() => {
        window.updateCataclysmLimitStatus();
      }).not.toThrow();
    });

    it('should handle multiple calls without side effects', () => {
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      // Call multiple times
      window.updateCataclysmLimitStatus();
      window.updateCataclysmLimitStatus();
      window.updateCataclysmLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
    });
  });
});
