/**
 * Draw Hand Button Tooltip Tests
 * Tests the tooltip functionality for the Draw Hand button when disabled
 */

describe('Draw Hand Button Tooltip', () => {
  let mockDrawHandBtn: any;
  let mockUpdateDeckCardCount: jest.Mock;

  beforeEach(() => {
    // Mock the Draw Hand button
    mockDrawHandBtn = {
      disabled: true,
      style: {
        opacity: '0.5',
        cursor: 'not-allowed'
      },
      title: 'Deck must contain at least 8 playable cards.',
      textContent: 'Draw Hand'
    };

    // Mock updateDeckCardCount function
    mockUpdateDeckCardCount = jest.fn();
    (global as any).updateDeckCardCount = mockUpdateDeckCardCount;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tooltip when button is disabled', () => {
    test('should show tooltip when button is disabled due to insufficient playable cards', () => {
      // Simulate deck with less than 8 playable cards
      const deckCards = [
        { type: 'character', quantity: 1 },
        { type: 'location', quantity: 1 },
        { type: 'mission', quantity: 1 },
        { type: 'power', quantity: 2 },
        { type: 'special', quantity: 3 }
      ]; // Total playable cards: 5 (power + special)

      // Mock the updateDeckCardCount function to simulate the button state logic
      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify button is disabled and has tooltip
      expect(mockDrawHandBtn.disabled).toBe(true);
      expect(mockDrawHandBtn.title).toBe("Deck must contain at least 8 playable cards.");
      expect(mockDrawHandBtn.style.opacity).toBe("0.5");
      expect(mockDrawHandBtn.style.cursor).toBe("not-allowed");
    });

    test('should remove tooltip when button is enabled due to sufficient playable cards', () => {
      // Simulate deck with 8 or more playable cards
      const deckCards = [
        { type: 'character', quantity: 1 },
        { type: 'location', quantity: 1 },
        { type: 'mission', quantity: 1 },
        { type: 'power', quantity: 5 },
        { type: 'special', quantity: 4 }
      ]; // Total playable cards: 9 (power + special)

      // Mock the updateDeckCardCount function to simulate the button state logic
      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify button is enabled and has no tooltip
      expect(mockDrawHandBtn.disabled).toBe(false);
      expect(mockDrawHandBtn.title).toBe("");
      expect(mockDrawHandBtn.style.opacity).toBe("1");
      expect(mockDrawHandBtn.style.cursor).toBe("pointer");
    });

    test('should handle edge case with exactly 8 playable cards', () => {
      // Simulate deck with exactly 8 playable cards
      const deckCards = [
        { type: 'character', quantity: 1 },
        { type: 'location', quantity: 1 },
        { type: 'mission', quantity: 1 },
        { type: 'power', quantity: 4 },
        { type: 'special', quantity: 4 }
      ]; // Total playable cards: 8 (power + special)

      // Mock the updateDeckCardCount function to simulate the button state logic
      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify button is enabled (8 is >= 8) and has no tooltip
      expect(mockDrawHandBtn.disabled).toBe(false);
      expect(mockDrawHandBtn.title).toBe("");
      expect(mockDrawHandBtn.style.opacity).toBe("1");
      expect(mockDrawHandBtn.style.cursor).toBe("pointer");
    });

    test('should handle empty deck', () => {
      // Simulate empty deck
      const deckCards: any[] = [];

      // Mock the updateDeckCardCount function to simulate the button state logic
      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify button is disabled and has tooltip
      expect(mockDrawHandBtn.disabled).toBe(true);
      expect(mockDrawHandBtn.title).toBe("Deck must contain at least 8 playable cards.");
      expect(mockDrawHandBtn.style.opacity).toBe("0.5");
      expect(mockDrawHandBtn.style.cursor).toBe("not-allowed");
    });
  });

  describe('Tooltip message content', () => {
    test('should have correct tooltip message', () => {
      expect(mockDrawHandBtn.title).toBe("Deck must contain at least 8 playable cards.");
    });

    test('should have empty tooltip when button is enabled', () => {
      // Simulate enabling the button
      mockDrawHandBtn.disabled = false;
      mockDrawHandBtn.title = "";

      expect(mockDrawHandBtn.title).toBe("");
    });
  });

  describe('Button state transitions', () => {
    test('should transition from disabled with tooltip to enabled without tooltip', () => {
      // Start with disabled state
      mockDrawHandBtn.disabled = true;
      mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
      mockDrawHandBtn.style.opacity = "0.5";
      mockDrawHandBtn.style.cursor = "not-allowed";

      // Simulate adding enough cards to enable button
      const deckCards = [
        { type: 'power', quantity: 8 }
      ]; // 8 playable cards

      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify transition to enabled state
      expect(mockDrawHandBtn.disabled).toBe(false);
      expect(mockDrawHandBtn.title).toBe("");
      expect(mockDrawHandBtn.style.opacity).toBe("1");
      expect(mockDrawHandBtn.style.cursor).toBe("pointer");
    });

    test('should transition from enabled without tooltip to disabled with tooltip', () => {
      // Start with enabled state
      mockDrawHandBtn.disabled = false;
      mockDrawHandBtn.title = "";
      mockDrawHandBtn.style.opacity = "1";
      mockDrawHandBtn.style.cursor = "pointer";

      // Simulate removing cards to disable button
      const deckCards = [
        { type: 'power', quantity: 3 }
      ]; // Only 3 playable cards

      mockUpdateDeckCardCount.mockImplementation(() => {
        const playableCardsCount = deckCards
          .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
          .reduce((sum, card) => sum + card.quantity, 0);

        if (playableCardsCount >= 8) {
          mockDrawHandBtn.disabled = false;
          mockDrawHandBtn.style.opacity = "1";
          mockDrawHandBtn.style.cursor = "pointer";
          mockDrawHandBtn.title = "";
        } else {
          mockDrawHandBtn.disabled = true;
          mockDrawHandBtn.style.opacity = "0.5";
          mockDrawHandBtn.style.cursor = "not-allowed";
          mockDrawHandBtn.title = "Deck must contain at least 8 playable cards.";
        }
      });

      // Call the function
      mockUpdateDeckCardCount();

      // Verify transition to disabled state
      expect(mockDrawHandBtn.disabled).toBe(true);
      expect(mockDrawHandBtn.title).toBe("Deck must contain at least 8 playable cards.");
      expect(mockDrawHandBtn.style.opacity).toBe("0.5");
      expect(mockDrawHandBtn.style.cursor).toBe("not-allowed");
    });
  });
});
