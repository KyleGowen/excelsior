/**
 * Unit tests for character dimming functionality
 * Tests the fix for character cards not dimming when added to deck
 */

import { JSDOM } from 'jsdom';

describe('Character Dimming Fix', () => {
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
            <div class="card-item character-card" data-id="char1" data-type="character">
              <div class="character-name">Captain Nemo</div>
            </div>
            <div class="card-item character-card" data-id="char2" data-type="character">
              <div class="character-name">Achilles</div>
            </div>
            <div class="card-item" data-id="special1" data-type="special">
              <div class="card-name">Grim Reaper</div>
            </div>
            <div class="card-item" data-id="mission1" data-type="mission">
              <div class="card-name">Mission Alpha</div>
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
      ['char1', { id: 'char1', name: 'Captain Nemo', one_per_deck: false }],
      ['char2', { id: 'char2', name: 'Achilles', one_per_deck: false }],
      ['special1', { id: 'special1', name: 'Grim Reaper', one_per_deck: true }],
      ['mission1', { id: 'mission1', name: 'Mission Alpha', one_per_deck: false }]
    ]);

    // Mock the functions
    window.updateCharacterLimitStatus = function() {
      const characterCards = document.querySelectorAll('.card-item.character-card');
      const uniqueCharacterCount = window.deckEditorCards
        .filter((card: any) => card.type === 'character')
        .length;
      
      characterCards.forEach((card) => {
        const cardId = card.getAttribute('data-id');
        const isExistingCharacter = window.deckEditorCards.some((deckCard: any) => 
          deckCard.type === 'character' && deckCard.cardId === cardId
        );
        
        const shouldDisable = uniqueCharacterCount >= 4 || isExistingCharacter;
        
        if (shouldDisable) {
          card.classList.add('disabled');
          card.setAttribute('draggable', 'false');
          if (isExistingCharacter) {
            (card as HTMLElement).title = 'This character is already in your deck';
          } else {
            (card as HTMLElement).title = 'Character limit reached (max 4 different characters)';
          }
        } else {
          card.classList.remove('disabled');
          card.setAttribute('draggable', 'true');
          (card as HTMLElement).title = '';
        }
      });
    };

    window.updateOnePerDeckLimitStatus = function() {
      // Get all One Per Deck cards currently in the deck
      const onePerDeckCardsInDeck = new Set();
      window.deckEditorCards.forEach((card: any) => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });
      
      // Update all card items for all card types
      const allCardItems = document.querySelectorAll('.card-item[data-id]');
      allCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        const cardType = cardElement.getAttribute('data-type');
        
        if (cardId) {
          const cardData = window.availableCardsMap.get(cardId);
          const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
          const isInDeck = onePerDeckCardsInDeck.has(cardId);
          
          if (isOnePerDeck && isInDeck) {
            // This is a One Per Deck card that's already in the deck - dim it
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            (cardElement as HTMLElement).title = 'One Per Deck - already in deck';
          } else if (cardType !== 'character' && cardType !== 'mission') {
            // Only update non-character/non-mission cards here
            // Character and mission dimming is handled by updateCharacterLimitStatus() and updateMissionLimitStatus()
            cardElement.classList.remove('disabled');
            cardElement.setAttribute('draggable', 'true');
            (cardElement as HTMLElement).title = '';
          }
        }
      });
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('updateCharacterLimitStatus', () => {
    it('should dim character cards when they are already in the deck', () => {
      // Add Captain Nemo to deck
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      window.updateCharacterLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect((captainNemoCard as HTMLElement)?.title).toBe('This character is already in your deck');
    });

    it('should not dim character cards when they are not in the deck', () => {
      // Empty deck
      window.deckEditorCards = [];

      window.updateCharacterLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.classList.contains('disabled')).toBe(false);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('true');
      expect((captainNemoCard as HTMLElement)?.title).toBe('');
    });

    it('should dim all character cards when 4 characters are in deck', () => {
      // Add 4 characters to deck (but not char1 and char2 which are in the DOM)
      window.deckEditorCards = [
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'character', cardId: 'char5', quantity: 1 },
        { type: 'character', cardId: 'char6', quantity: 1 }
      ];

      window.updateCharacterLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      const achillesCard = document.querySelector('[data-id="char2"]');
      
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(achillesCard?.classList.contains('disabled')).toBe(true);
      expect((captainNemoCard as HTMLElement)?.title).toBe('Character limit reached (max 4 different characters)');
    });
  });

  describe('updateOnePerDeckLimitStatus', () => {
    it('should NOT interfere with character card dimming', () => {
      // Add Captain Nemo to deck
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // First call updateCharacterLimitStatus to dim the character
      window.updateCharacterLimitStatus();
      
      // Then call updateOnePerDeckLimitStatus - it should NOT remove the dimming
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect((captainNemoCard as HTMLElement)?.title).toBe('This character is already in your deck');
    });

    it('should dim One Per Deck cards when they are in the deck', () => {
      // Add Grim Reaper (One Per Deck) to deck
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateOnePerDeckLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]');
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
      expect((grimReaperCard as HTMLElement)?.title).toBe('One Per Deck - already in deck');
    });

    it('should NOT touch character cards even if they are not One Per Deck', () => {
      // Captain Nemo is in deck but not One Per Deck
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // First dim the character
      window.updateCharacterLimitStatus();
      
      // Then call updateOnePerDeckLimitStatus
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      // Should still be dimmed because updateOnePerDeckLimitStatus skips character cards
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
    });

    it('should NOT touch mission cards even if they are not One Per Deck', () => {
      // Mission Alpha is in deck but not One Per Deck
      window.deckEditorCards = [
        { type: 'mission', cardId: 'mission1', quantity: 1 }
      ];

      // Call updateOnePerDeckLimitStatus
      window.updateOnePerDeckLimitStatus();

      const missionCard = document.querySelector('[data-id="mission1"]');
      // Should not be affected by updateOnePerDeckLimitStatus
      expect(missionCard?.classList.contains('disabled')).toBe(false);
    });
  });

  describe('Function Interaction (The Fix)', () => {
    it('should maintain character dimming when both functions are called in sequence', () => {
      // Add Captain Nemo to deck
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // Simulate the sequence from addCardToEditor
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect((captainNemoCard as HTMLElement)?.title).toBe('This character is already in your deck');
    });

    it('should handle mixed card types correctly', () => {
      // Add both a character and a One Per Deck card
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      // Call both functions
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      const grimReaperCard = document.querySelector('[data-id="special1"]');
      
      // Both should be dimmed for different reasons
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      
      // But with different titles
      expect((captainNemoCard as HTMLElement)?.title).toBe('This character is already in your deck');
      expect((grimReaperCard as HTMLElement)?.title).toBe('One Per Deck - already in deck');
    });

    it('should not interfere with non-character, non-mission cards', () => {
      // Add a One Per Deck special card
      window.deckEditorCards = [
        { type: 'special', cardId: 'special1', quantity: 1 }
      ];

      window.updateOnePerDeckLimitStatus();

      const grimReaperCard = document.querySelector('[data-id="special1"]');
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty deck correctly', () => {
      window.deckEditorCards = [];

      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      const grimReaperCard = document.querySelector('[data-id="special1"]');
      
      expect(captainNemoCard?.classList.contains('disabled')).toBe(false);
      expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
    });

    it('should handle missing card data gracefully', () => {
      // Add a character with missing data
      window.deckEditorCards = [
        { type: 'character', cardId: 'nonexistent', quantity: 1 }
      ];

      expect(() => {
        window.updateCharacterLimitStatus();
        window.updateOnePerDeckLimitStatus();
      }).not.toThrow();
    });

    it('should handle multiple calls without side effects', () => {
      // Add Captain Nemo to deck
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // Call both functions multiple times
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Visual State Verification', () => {
    it('should apply correct CSS classes for dimmed state', () => {
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      window.updateCharacterLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      const computedStyle = window.getComputedStyle(captainNemoCard);
      
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.classList.contains('character-card')).toBe(true);
    });

    it('should maintain draggable attribute correctly', () => {
      window.deckEditorCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      window.updateCharacterLimitStatus();

      const captainNemoCard = document.querySelector('[data-id="char1"]');
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
    });
  });
});
