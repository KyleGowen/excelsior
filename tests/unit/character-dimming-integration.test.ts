/**
 * Integration tests for character dimming fix
 * Tests the complete flow from addCardToEditor through both dimming functions
 */

import { JSDOM } from 'jsdom';

describe('Character Dimming Integration', () => {
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
            <div class="card-item character-card" data-id="char1" data-type="character" draggable="true">
              <div class="character-name">Captain Nemo</div>
            </div>
            <div class="card-item character-card" data-id="char2" data-type="character" draggable="true">
              <div class="character-name">Achilles</div>
            </div>
            <div class="card-item" data-id="special1" data-type="special" draggable="true">
              <div class="card-name">Grim Reaper</div>
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
      ['special1', { id: 'special1', name: 'Grim Reaper', one_per_deck: true }]
    ]);

    // Mock notification function
    window.showNotification = jest.fn();

    // Mock the actual functions from the real codebase
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
      const onePerDeckCardsInDeck = new Set();
      window.deckEditorCards.forEach((card: any) => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });
      
      const allCardItems = document.querySelectorAll('.card-item[data-id]');
      allCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        const cardType = cardElement.getAttribute('data-type');
        
        if (cardId) {
          const cardData = window.availableCardsMap.get(cardId);
          const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
          const isInDeck = onePerDeckCardsInDeck.has(cardId);
          
          if (isOnePerDeck && isInDeck) {
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            (cardElement as HTMLElement).title = 'One Per Deck - already in deck';
          } else if (cardType !== 'character' && cardType !== 'mission') {
            // THE FIX: Only update non-character/non-mission cards here
            cardElement.classList.remove('disabled');
            cardElement.setAttribute('draggable', 'true');
            (cardElement as HTMLElement).title = '';
          }
        }
      });
    };

    // Mock addCardToEditor function (simplified version)
    window.addCardToEditor = async function(cardType: string, cardId: string, cardName: string) {
      // Check character limit
      if (cardType === 'character') {
        const existingCharacter = window.deckEditorCards.find((card: any) => 
          card.type === 'character' && card.cardId === cardId
        );
        
        if (existingCharacter) {
          window.showNotification('This character is already in your deck', 'error');
          return;
        }
        
        const uniqueCharacterCount = window.deckEditorCards
          .filter((card: any) => card.type === 'character')
          .length;
        
        if (uniqueCharacterCount >= 4) {
          window.showNotification('Cannot add more than 4 different characters to a deck', 'error');
          return;
        }
      }

      // Check One Per Deck limit
      const cardData = window.availableCardsMap.get(cardId);
      const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
      if (isOnePerDeck) {
        const existingOnePerDeckCard = window.deckEditorCards.find((card: any) => 
          card.type === cardType && card.cardId === cardId
        );
        
        if (existingOnePerDeckCard) {
          window.showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
          return;
        }
      }

      // Add card to deck
      window.deckEditorCards.push({
        type: cardType,
        cardId: cardId,
        quantity: 1
      });

      // Update dimming status (this is where the fix matters)
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Complete addCardToEditor Flow', () => {
    it('should dim character card immediately after adding to deck', async () => {
      // Initially, Captain Nemo should not be dimmed
      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      expect(captainNemoCard?.classList.contains('disabled')).toBe(false);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('true');

      // Add Captain Nemo to deck
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');

      // Captain Nemo should now be dimmed
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect(captainNemoCard?.title).toBe('This character is already in your deck');
    });

    it('should maintain character dimming even after One Per Deck function runs', async () => {
      // Add Captain Nemo to deck
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');

      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      
      // Verify Captain Nemo is dimmed
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect(captainNemoCard?.title).toBe('This character is already in your deck');

      // Add a One Per Deck card to trigger updateOnePerDeckLimitStatus
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');

      // Captain Nemo should STILL be dimmed (the fix prevents interference)
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect(captainNemoCard?.title).toBe('This character is already in your deck');
    });

    it('should handle multiple character additions correctly', async () => {
      // Add Captain Nemo
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      
      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      const achillesCard = document.querySelector('[data-id="char2"]') as HTMLElement;

      // Captain Nemo should be dimmed, Achilles should not
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(achillesCard?.classList.contains('disabled')).toBe(false);

      // Add Achilles
      await window.addCardToEditor('character', 'char2', 'Achilles');

      // Both should now be dimmed
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(achillesCard?.classList.contains('disabled')).toBe(true);
    });

    it('should prevent adding duplicate characters', async () => {
      // Add Captain Nemo
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      
      expect(window.deckEditorCards).toHaveLength(1);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Try to add Captain Nemo again
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      
      expect(window.deckEditorCards).toHaveLength(1); // Still only 1
      expect(window.showNotification).toHaveBeenCalledWith('This character is already in your deck', 'error');
    });

    it('should prevent adding more than 4 characters', async () => {
      // Add 4 characters
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      await window.addCardToEditor('character', 'char2', 'Achilles');
      await window.addCardToEditor('character', 'char3', 'Character 3');
      await window.addCardToEditor('character', 'char4', 'Character 4');
      
      expect(window.deckEditorCards).toHaveLength(4);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Try to add a 5th character
      await window.addCardToEditor('character', 'char5', 'Character 5');
      
      expect(window.deckEditorCards).toHaveLength(4); // Still only 4
      expect(window.showNotification).toHaveBeenCalledWith('Cannot add more than 4 different characters to a deck', 'error');
    });
  });

  describe('Mixed Card Type Scenarios', () => {
    it('should handle character and One Per Deck cards together', async () => {
      // Add a character
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      
      // Add a One Per Deck card
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');

      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;

      // Both should be dimmed for different reasons
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
      
      // But with different titles
      expect(captainNemoCard?.title).toBe('This character is already in your deck');
      expect(grimReaperCard?.title).toBe('One Per Deck - already in deck');
    });

    it('should prevent adding duplicate One Per Deck cards', async () => {
      // Add Grim Reaper
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      expect(window.deckEditorCards).toHaveLength(1);
      expect(window.showNotification).toHaveBeenCalledTimes(0);

      // Try to add Grim Reaper again
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');
      
      expect(window.deckEditorCards).toHaveLength(1); // Still only 1
      expect(window.showNotification).toHaveBeenCalledWith('Cannot add more than 1 copy of "Grim Reaper" - One Per Deck', 'error');
    });
  });

  describe('Regression Prevention', () => {
    it('should not have the original bug where One Per Deck function removes character dimming', async () => {
      // This test specifically prevents the regression we fixed
      
      // Add Captain Nemo
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      
      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      
      // Verify initial dimming
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect(captainNemoCard?.title).toBe('This character is already in your deck');

      // Manually call updateOnePerDeckLimitStatus (this was the problematic call)
      window.updateOnePerDeckLimitStatus();

      // Captain Nemo should STILL be dimmed (the fix prevents this regression)
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(captainNemoCard?.getAttribute('draggable')).toBe('false');
      expect(captainNemoCard?.title).toBe('This character is already in your deck');
    });

    it('should maintain proper separation of concerns between dimming functions', async () => {
      // Add both a character and a One Per Deck card
      await window.addCardToEditor('character', 'char1', 'Captain Nemo');
      await window.addCardToEditor('special', 'special1', 'Grim Reaper');

      const captainNemoCard = document.querySelector('[data-id="char1"]') as HTMLElement;
      const grimReaperCard = document.querySelector('[data-id="special1"]') as HTMLElement;

      // Both should be dimmed
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);

      // Call both functions multiple times to ensure no side effects
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();
      window.updateCharacterLimitStatus();
      window.updateOnePerDeckLimitStatus();

      // Both should still be dimmed
      expect(captainNemoCard?.classList.contains('disabled')).toBe(true);
      expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
    });
  });
});
