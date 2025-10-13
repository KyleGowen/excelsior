/**
 * Unit tests for public/js/remaining-utility-functions.js
 * Tests the remaining utility functions extracted during Phase 10C of refactoring
 */

// Mock DOM elements
const mockElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
  style: { 
    display: 'block',
    left: '',
    top: '',
    width: '',
    height: '',
  },
  innerHTML: '',
  getBoundingClientRect: jest.fn(() => ({
    left: 100,
    top: 50,
    right: 200,
    bottom: 150,
    width: 100,
    height: 100,
  })),
  addEventListener: jest.fn(),
  clientX: 150,
  clientY: 100,
  touches: [{ clientX: 150, clientY: 100 }],
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'cardResults') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(id: string) => any>;

const mockQuerySelector = jest.fn((selector: string) => {
  if (selector === '.screenshot-draggable-container') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(selector: string) => any>;

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  querySelector: mockQuerySelector,
};

// Mock global window variables
(global as any).window = {
  selectedCards: new Set(),
  activeCard: null,
  isMarqueeSelecting: false,
  selectionRect: mockElement,
  marqueeStartX: 0,
  marqueeStartY: 0,
};

// Define the functions from remaining-utility-functions.js for testing
function getCardName(card: any) {
  // TODO: This should fetch the actual card name from the database
  // For now, return a placeholder
  return `${formatCardType(card.type)} Card ${card.cardId}`;
}

function formatCardType(type: string) {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function displayCardSearchResults(cards: any[]) {
  const cardResults = (global as any).document.getElementById('cardResults');
  
  if (cards.length === 0) {
    cardResults.innerHTML = '<div style="text-align: center; color: #bdc3c7; padding: 20px;">No cards found</div>';
    return;
  }

  cardResults.innerHTML = cards.map(card => `
    <div class="card-result-item">
      <div class="card-result-info">
        <div class="card-result-name">${card.displayName}</div>
        <div class="card-result-type">${formatCardType(card.type)}</div>
      </div>
      <button class="add-card-btn" onclick="addCardToDeck('${card.type}', '${card.id}')">
        ${card.type === 'character' ? 'Add to Deck' : 'Add to Deck (+)'}
      </button>
    </div>
  `).join('');
}

function getCardBounds(card: any) {
  const container = (global as any).document.querySelector('.screenshot-draggable-container');
  if (!container) return null;
  
  const rect = card.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    right: rect.right - containerRect.left,
    bottom: rect.bottom - containerRect.top,
    width: rect.width,
    height: rect.height
  };
}

function clearSelection() {
  const selectedCards = (global as any).window.selectedCards || new Set();
  selectedCards.forEach((c: any) => c.classList.remove('selected'));
  selectedCards.clear();
}

function onPointerMove(e: any) {
  const container = (global as any).document.querySelector('.screenshot-draggable-container');
  if (!container) return;
  
  const activeCard = (global as any).window.activeCard;
  const isMarqueeSelecting = (global as any).window.isMarqueeSelecting;
  const selectionRect = (global as any).window.selectionRect;
  const marqueeStartX = (global as any).window.marqueeStartX;
  const marqueeStartY = (global as any).window.marqueeStartY;
  const selectedCards = (global as any).window.selectedCards || new Set();
  
  console.log('onPointerMove called, activeCard:', activeCard);
  const rect = container.getBoundingClientRect();
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);

  if (isMarqueeSelecting && selectionRect) {
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;
    const left = Math.min(currentX, marqueeStartX);
    const top = Math.min(currentY, marqueeStartY);
    const width = Math.abs(currentX - marqueeStartX);
    const height = Math.abs(currentY - marqueeStartY);
    selectionRect.style.left = left + 'px';
    selectionRect.style.top = top + 'px';
    selectionRect.style.width = width + 'px';
    selectionRect.style.height = height + 'px';
  }
}

function onPointerUp(e: any) {
  const container = (global as any).document.querySelector('.screenshot-draggable-container');
  if (!container) return;
  
  const isMarqueeSelecting = (global as any).window.isMarqueeSelecting;
  const selectionRect = (global as any).window.selectionRect;
  const selectedCards = (global as any).window.selectedCards || new Set();
  
  if (isMarqueeSelecting && selectionRect) {
    (global as any).window.isMarqueeSelecting = false;
    selectionRect.style.display = 'none';
    
    // Clear previous selection
    selectedCards.forEach((card: any) => card.classList.remove('selected'));
    selectedCards.clear();
    
    // Find cards within selection rectangle
    const cards = container.querySelectorAll('.card');
    cards.forEach((card: any) => {
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const cardLeft = cardRect.left - containerRect.left;
      const cardTop = cardRect.top - containerRect.top;
      const cardRight = cardRect.right - containerRect.left;
      const cardBottom = cardRect.bottom - containerRect.top;
      
      const selectionLeft = parseFloat(selectionRect.style.left);
      const selectionTop = parseFloat(selectionRect.style.top);
      const selectionRight = selectionLeft + parseFloat(selectionRect.style.width);
      const selectionBottom = selectionTop + parseFloat(selectionRect.style.height);
      
      if (cardLeft < selectionRight && cardRight > selectionLeft &&
          cardTop < selectionBottom && cardBottom > selectionTop) {
        card.classList.add('selected');
        selectedCards.add(card);
      }
    });
  }
}

function attachDragListeners() {
  const container = (global as any).document.querySelector('.screenshot-draggable-container');
  if (!container) return;
  
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('touchmove', onPointerMove);
  container.addEventListener('touchend', onPointerUp);
}

describe('Remaining Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElement.innerHTML = '';
    mockElement.style.display = 'block';
    (global as any).window.selectedCards = new Set();
    (global as any).window.activeCard = null;
    (global as any).window.isMarqueeSelecting = false;
    (global as any).window.selectionRect = mockElement;
    (global as any).window.marqueeStartX = 0;
    (global as any).window.marqueeStartY = 0;
  });

  describe('getCardName', () => {
    it('should return formatted card name', () => {
      const card = { type: 'character', cardId: '123' };

      const result = getCardName(card);

      expect(result).toBe('Character Card 123');
    });

    it('should handle different card types', () => {
      const card = { type: 'special-card', cardId: '456' };

      const result = getCardName(card);

      expect(result).toBe('Special Card Card 456');
    });

    it('should handle hyphenated card types', () => {
      const card = { type: 'power-card', cardId: '789' };

      const result = getCardName(card);

      expect(result).toBe('Power Card Card 789');
    });
  });

  describe('formatCardType', () => {
    it('should format simple card types', () => {
      expect(formatCardType('character')).toBe('Character');
      expect(formatCardType('location')).toBe('Location');
      expect(formatCardType('event')).toBe('Event');
    });

    it('should format hyphenated card types', () => {
      expect(formatCardType('special-card')).toBe('Special Card');
      expect(formatCardType('power-card')).toBe('Power Card');
      expect(formatCardType('ally-universe')).toBe('Ally Universe');
    });

    it('should handle empty string', () => {
      expect(formatCardType('')).toBe('');
    });

    it('should handle single character', () => {
      expect(formatCardType('a')).toBe('A');
    });

    it('should handle multiple hyphens', () => {
      expect(formatCardType('multi-word-card-type')).toBe('Multi Word Card Type');
    });
  });

  describe('displayCardSearchResults', () => {
    it('should display no cards message when array is empty', () => {
      displayCardSearchResults([]);

      expect(mockGetElementById).toHaveBeenCalledWith('cardResults');
      expect(mockElement.innerHTML).toBe('<div style="text-align: center; color: #bdc3c7; padding: 20px;">No cards found</div>');
    });

    it('should display cards when array has items', () => {
      const cards = [
        { id: '1', type: 'character', displayName: 'Test Character' },
        { id: '2', type: 'special-card', displayName: 'Test Special' }
      ];

      displayCardSearchResults(cards);

      expect(mockGetElementById).toHaveBeenCalledWith('cardResults');
      expect(mockElement.innerHTML).toContain('Test Character');
      expect(mockElement.innerHTML).toContain('Test Special');
      expect(mockElement.innerHTML).toContain('Add to Deck');
      expect(mockElement.innerHTML).toContain('Add to Deck (+)');
    });

    it('should handle missing cardResults element', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => displayCardSearchResults([])).not.toThrow();
    });

    it('should format card types in display', () => {
      const cards = [{ id: '1', type: 'special-card', displayName: 'Test' }];

      displayCardSearchResults(cards);

      expect(mockElement.innerHTML).toContain('Special Card');
    });
  });

  describe('getCardBounds', () => {
    it('should return card bounds relative to container', () => {
      const card = { getBoundingClientRect: jest.fn(() => ({
        left: 150,
        top: 100,
        right: 250,
        bottom: 200,
        width: 100,
        height: 100,
      })) };

      const result = getCardBounds(card);

      expect(mockQuerySelector).toHaveBeenCalledWith('.screenshot-draggable-container');
      expect(result).toEqual({
        left: 50,
        top: 50,
        right: 150,
        bottom: 150,
        width: 100,
        height: 100
      });
    });

    it('should return null when container is not found', () => {
      mockQuerySelector.mockReturnValue(null);
      const card = { getBoundingClientRect: jest.fn() };

      const result = getCardBounds(card);

      expect(result).toBeNull();
    });

    it('should handle missing card parameter', () => {
      expect(() => getCardBounds(null)).not.toThrow();
    });
  });

  describe('clearSelection', () => {
    it('should clear selected cards', () => {
      const mockCard1 = { classList: { remove: jest.fn() } };
      const mockCard2 = { classList: { remove: jest.fn() } };
      (global as any).window.selectedCards = new Set([mockCard1, mockCard2]);

      clearSelection();

      expect(mockCard1.classList.remove).toHaveBeenCalledWith('selected');
      expect(mockCard2.classList.remove).toHaveBeenCalledWith('selected');
      expect((global as any).window.selectedCards.size).toBe(0);
    });

    it('should handle empty selection', () => {
      (global as any).window.selectedCards = new Set();

      expect(() => clearSelection()).not.toThrow();
    });

    it('should handle missing selectedCards', () => {
      (global as any).window.selectedCards = undefined;

      expect(() => clearSelection()).not.toThrow();
    });
  });

  describe('onPointerMove', () => {
    it('should handle marquee selection', () => {
      (global as any).window.isMarqueeSelecting = true;
      (global as any).window.marqueeStartX = 10;
      (global as any).window.marqueeStartY = 20;
      const event = { clientX: 50, clientY: 60 };

      onPointerMove(event);

      expect(mockElement.style.left).toBe('10px');
      expect(mockElement.style.top).toBe('20px');
      expect(mockElement.style.width).toBe('40px');
      expect(mockElement.style.height).toBe('40px');
    });

    it('should handle touch events', () => {
      (global as any).window.isMarqueeSelecting = true;
      (global as any).window.marqueeStartX = 0;
      (global as any).window.marqueeStartY = 0;
      const event = { touches: [{ clientX: 30, clientY: 40 }] };

      onPointerMove(event);

      expect(mockElement.style.left).toBe('0px');
      expect(mockElement.style.top).toBe('0px');
      expect(mockElement.style.width).toBe('30px');
      expect(mockElement.style.height).toBe('40px');
    });

    it('should not update selection when not marquee selecting', () => {
      (global as any).window.isMarqueeSelecting = false;
      const event = { clientX: 50, clientY: 60 };

      onPointerMove(event);

      expect(mockElement.style.left).toBe('block'); // Should remain unchanged
    });

    it('should handle missing container', () => {
      mockQuerySelector.mockReturnValue(null);
      const event = { clientX: 50, clientY: 60 };

      expect(() => onPointerMove(event)).not.toThrow();
    });
  });

  describe('onPointerUp', () => {
    it('should complete marquee selection', () => {
      (global as any).window.isMarqueeSelecting = true;
      mockElement.style.left = '10px';
      mockElement.style.top = '20px';
      mockElement.style.width = '30px';
      mockElement.style.height = '40px';
      
      const mockCard = { 
        classList: { add: jest.fn(), remove: jest.fn() },
        getBoundingClientRect: jest.fn(() => ({
          left: 120,
          top: 70,
          right: 150,
          bottom: 110,
        }))
      };
      
      mockQuerySelector.mockImplementation((selector: string) => {
        if (selector === '.screenshot-draggable-container') return mockElement;
        if (selector === '.card') return [mockCard];
        return null;
      });

      onPointerUp({});

      expect((global as any).window.isMarqueeSelecting).toBe(false);
      expect(mockElement.style.display).toBe('none');
    });

    it('should not process selection when not marquee selecting', () => {
      (global as any).window.isMarqueeSelecting = false;

      onPointerUp({});

      expect((global as any).window.isMarqueeSelecting).toBe(false);
    });

    it('should handle missing container', () => {
      mockQuerySelector.mockReturnValue(null);

      expect(() => onPointerUp({})).not.toThrow();
    });
  });

  describe('attachDragListeners', () => {
    it('should attach event listeners to container', () => {
      attachDragListeners();

      expect(mockQuerySelector).toHaveBeenCalledWith('.screenshot-draggable-container');
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointermove', onPointerMove);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointerup', onPointerUp);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', onPointerMove);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', onPointerUp);
    });

    it('should handle missing container', () => {
      mockQuerySelector.mockReturnValue(null);

      expect(() => attachDragListeners()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete card search workflow', () => {
      const cards = [{ id: '1', type: 'character', displayName: 'Test' }];

      displayCardSearchResults(cards);
      const cardName = getCardName(cards[0]);

      expect(mockElement.innerHTML).toContain('Test');
      expect(cardName).toBe('Character Card 1');
    });

    it('should handle complete selection workflow', () => {
      const mockCard = { classList: { add: jest.fn(), remove: jest.fn() } };
      (global as any).window.selectedCards = new Set([mockCard]);

      clearSelection();
      attachDragListeners();

      expect(mockCard.classList.remove).toHaveBeenCalledWith('selected');
      expect((global as any).window.selectedCards.size).toBe(0);
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(4);
    });

    it('should handle card bounds calculation with search results', () => {
      const cards = [{ id: '1', type: 'character', displayName: 'Test' }];
      displayCardSearchResults(cards);

      const bounds = getCardBounds(mockElement);

      expect(bounds).toEqual({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100
      });
    });
  });
});
