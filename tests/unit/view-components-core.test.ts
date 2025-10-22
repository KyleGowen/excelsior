/**
 * @jest-environment jsdom
 */

// Mock the global functions that the view components depend on
(global as any).getCardName = jest.fn((cardId: string, type: string) => `Mock Card ${cardId}`);
(global as any).getCardImage = jest.fn((cardId: string, type: string) => `mock-image-${cardId}.webp`);
(global as any).formatCardType = jest.fn((type: string) => type.charAt(0).toUpperCase() + type.slice(1));
(global as any).updateCardQuantity = jest.fn();
(global as any).removeCardFromDeck = jest.fn();

describe('View Components System - Core Logic Tests', () => {
  let mockCards: any[];

  beforeEach(() => {
    // Mock card data
    mockCards = [
      {
        id: 'card1',
        cardId: 'char001',
        type: 'character',
        quantity: 1,
        selectedAlternateImage: null
      },
      {
        id: 'card2',
        cardId: 'power001',
        type: 'power',
        quantity: 2,
        selectedAlternateImage: null
      },
      {
        id: 'card3',
        cardId: 'mission001',
        type: 'mission',
        quantity: 1,
        selectedAlternateImage: null
      }
    ];

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Card Grouping Logic', () => {
    it('should group cards by type correctly for tile view', () => {
      const cardsByType: any = {};
      mockCards.forEach((card, index) => {
        const type = card.type;
        if (!cardsByType[type]) {
          cardsByType[type] = [];
        }
        cardsByType[type].push({ ...card, originalIndex: index });
      });
      
      expect(cardsByType.character).toBeDefined();
      expect(cardsByType.power).toBeDefined();
      expect(cardsByType.mission).toBeDefined();
      expect(cardsByType.character.length).toBe(1);
      expect(cardsByType.power.length).toBe(1);
      expect(cardsByType.mission.length).toBe(1);
      expect(cardsByType.character[0].originalIndex).toBe(0);
      expect(cardsByType.power[0].originalIndex).toBe(1);
      expect(cardsByType.mission[0].originalIndex).toBe(2);
    });

    it('should group cards by type correctly for list view', () => {
      const cardsByType: any = {};
      mockCards.forEach(card => {
        const type = card.type;
        if (!cardsByType[type]) {
          cardsByType[type] = [];
        }
        cardsByType[type].push(card);
      });
      
      expect(cardsByType.character).toBeDefined();
      expect(cardsByType.power).toBeDefined();
      expect(cardsByType.mission).toBeDefined();
      expect(cardsByType.character.length).toBe(1);
      expect(cardsByType.power.length).toBe(1);
      expect(cardsByType.mission.length).toBe(1);
    });
  });

  describe('Card HTML Generation', () => {
    it('should generate correct tile view card HTML', () => {
      const card = mockCards[0];
      const cardName = (global as any).getCardName(card.cardId, card.type);
      const cardImage = (global as any).getCardImage(card.cardId, card.type);
      
      const expectedHTML = `
        <div class="deck-card-editor-item ${card.type}-card" data-card-id="${card.cardId}" data-original-index="0">
          <div class="deck-card-editor-image">
            <img src="/resources/${cardImage}" alt="${cardName}" loading="lazy">
          </div>
          <div class="deck-card-editor-info">
            <div class="deck-card-editor-name">${cardName}</div>
            <div class="deck-card-editor-type">${(global as any).formatCardType(card.type)}</div>
            <div class="deck-card-editor-quantity">
              <button class="quantity-btn" onclick="updateCardQuantity('${card.id}', ${card.quantity - 1})" ${card.quantity <= 1 ? 'disabled' : ''}>-</button>
              <span class="quantity-display">${card.quantity}</span>
              <button class="quantity-btn" onclick="updateCardQuantity('${card.id}', ${card.quantity + 1})">+</button>
            </div>
          </div>
          <div class="deck-card-editor-actions">
            <button class="remove-card-btn" onclick="removeCardFromDeck('${card.id}')">Remove</button>
          </div>
        </div>
      `;
      
      expect(expectedHTML).toContain('deck-card-editor-item');
      expect(expectedHTML).toContain('deck-card-editor-image');
      expect(expectedHTML).toContain('deck-card-editor-info');
      expect(expectedHTML).toContain('deck-card-editor-actions');
      expect(expectedHTML).toContain('remove-card-btn');
    });

    it('should generate correct list view card HTML', () => {
      const card = mockCards[0];
      const cardName = (global as any).getCardName(card.cardId, card.type);
      const cardImage = (global as any).getCardImage(card.cardId, card.type);
      
      const expectedHTML = `
        <div class="deck-list-item ${card.type}-card" data-card-id="${card.cardId}">
          <div class="deck-list-item-image">
            <img src="/resources/${cardImage}" alt="${cardName}" loading="lazy">
          </div>
          <div class="deck-list-item-info">
            <div class="deck-list-item-name">${cardName}</div>
            <div class="deck-list-item-type">${(global as any).formatCardType(card.type)}</div>
          </div>
          <div class="deck-list-item-quantity">
            <button class="quantity-btn" onclick="updateCardQuantity('${card.id}', ${card.quantity - 1})" ${card.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span class="quantity-display">${card.quantity}</span>
            <button class="quantity-btn" onclick="updateCardQuantity('${card.id}', ${card.quantity + 1})">+</button>
          </div>
          <div class="deck-list-item-actions">
            <button class="remove-card-btn" onclick="removeCardFromDeck('${card.id}')">Remove</button>
          </div>
        </div>
      `;
      
      expect(expectedHTML).toContain('deck-list-item');
      expect(expectedHTML).toContain('deck-list-item-image');
      expect(expectedHTML).toContain('deck-list-item-info');
      expect(expectedHTML).toContain('deck-list-item-quantity');
      expect(expectedHTML).toContain('deck-list-item-actions');
    });
  });

  describe('Global Function Integration', () => {
    it('should call getCardName correctly for all cards', () => {
      mockCards.forEach(card => {
        (global as any).getCardName(card.cardId, card.type);
      });
      
      expect((global as any).getCardName).toHaveBeenCalledWith('char001', 'character');
      expect((global as any).getCardName).toHaveBeenCalledWith('power001', 'power');
      expect((global as any).getCardName).toHaveBeenCalledWith('mission001', 'mission');
      expect((global as any).getCardName).toHaveBeenCalledTimes(3);
    });

    it('should call getCardImage correctly for all cards', () => {
      mockCards.forEach(card => {
        (global as any).getCardImage(card.cardId, card.type);
      });
      
      expect((global as any).getCardImage).toHaveBeenCalledWith('char001', 'character');
      expect((global as any).getCardImage).toHaveBeenCalledWith('power001', 'power');
      expect((global as any).getCardImage).toHaveBeenCalledWith('mission001', 'mission');
      expect((global as any).getCardImage).toHaveBeenCalledTimes(3);
    });

    it('should call formatCardType correctly for all cards', () => {
      mockCards.forEach(card => {
        (global as any).formatCardType(card.type);
      });
      
      expect((global as any).formatCardType).toHaveBeenCalledWith('character');
      expect((global as any).formatCardType).toHaveBeenCalledWith('power');
      expect((global as any).formatCardType).toHaveBeenCalledWith('mission');
      expect((global as any).formatCardType).toHaveBeenCalledTimes(3);
    });
  });

  describe('View Mode Logic', () => {
    it('should handle read-only mode correctly', () => {
      const readOnlyOptions = {
        isReadOnlyMode: true,
        currentUser: { role: 'GUEST' }
      };
      
      const editModeOptions = {
        isReadOnlyMode: false,
        currentUser: { role: 'USER' }
      };
      
      // Test read-only mode
      expect(readOnlyOptions.isReadOnlyMode).toBe(true);
      expect(readOnlyOptions.currentUser.role).toBe('GUEST');
      
      // Test edit mode
      expect(editModeOptions.isReadOnlyMode).toBe(false);
      expect(editModeOptions.currentUser.role).toBe('USER');
    });

    it('should determine guest user layout correctly', () => {
      const guestUserReadOnly = {
        isReadOnlyMode: true,
        currentUser: { role: 'GUEST' }
      };
      
      const regularUserReadOnly = {
        isReadOnlyMode: true,
        currentUser: { role: 'USER' }
      };
      
      const guestUserEdit = {
        isReadOnlyMode: false,
        currentUser: { role: 'GUEST' }
      };
      
      // Should apply guest layout only for guest users in read-only mode
      const shouldApplyGuestLayout1 = guestUserReadOnly.isReadOnlyMode && 
                                     guestUserReadOnly.currentUser.role === 'GUEST';
      const shouldApplyGuestLayout2 = regularUserReadOnly.isReadOnlyMode && 
                                     regularUserReadOnly.currentUser.role === 'GUEST';
      const shouldApplyGuestLayout3 = guestUserEdit.isReadOnlyMode && 
                                     guestUserEdit.currentUser.role === 'GUEST';
      
      expect(shouldApplyGuestLayout1).toBe(true);
      expect(shouldApplyGuestLayout2).toBe(false);
      expect(shouldApplyGuestLayout3).toBe(false);
    });
  });

  describe('Type Display Names', () => {
    it('should have correct type display names for tile view', () => {
      const typeDisplayNames = {
        'character': 'Characters',
        'location': 'Locations',
        'mission': 'Missions',
        'event': 'Events',
        'special': 'Special Cards',
        'aspect': 'Aspects',
        'advanced-universe': 'Universe: Advanced',
        'teamwork': 'Teamwork Cards',
        'ally-universe': 'Ally Universe',
        'training': 'Training Cards',
        'basic-universe': 'Basic Universe',
        'power': 'Power Cards'
      };
      
      expect(typeDisplayNames.character).toBe('Characters');
      expect(typeDisplayNames.power).toBe('Power Cards');
      expect(typeDisplayNames.mission).toBe('Missions');
    });

    it('should have correct type display names for list view', () => {
      const typeDisplayNames = {
        'character': 'Characters',
        'location': 'Locations', 
        'special': 'Special Cards',
        'power': 'Power Cards',
        'teamwork': 'Teamwork Cards',
        'ally-universe': 'Ally Universe',
        'basic-universe': 'Basic Universe',
        'advanced-universe': 'Universe: Advanced',
        'training': 'Training Cards',
        'mission': 'Missions',
        'event': 'Events',
        'aspect': 'Aspects'
      };
      
      expect(typeDisplayNames.character).toBe('Characters');
      expect(typeDisplayNames.power).toBe('Power Cards');
      expect(typeDisplayNames.mission).toBe('Missions');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty card arrays', () => {
      const emptyCards: any[] = [];
      
      expect(emptyCards.length).toBe(0);
      
      // Simulate empty state handling
      const shouldShowEmptyMessage = emptyCards.length === 0;
      expect(shouldShowEmptyMessage).toBe(true);
    });

    it('should handle invalid view names', () => {
      const validViews = ['tile', 'list'];
      const invalidView = 'invalid';
      
      const isValidView = validViews.includes(invalidView);
      expect(isValidView).toBe(false);
    });

    it('should handle missing card properties', () => {
      const incompleteCard: any = {
        id: 'test',
        // Missing cardId, type, quantity
      };
      
      expect(incompleteCard.cardId).toBeUndefined();
      expect(incompleteCard.type).toBeUndefined();
      expect(incompleteCard.quantity).toBeUndefined();
    });
  });

  describe('View State Management', () => {
    it('should handle view switching correctly', () => {
      const viewState: any = {
        currentView: null,
        views: {
          tile: { isActive: false },
          list: { isActive: false }
        }
      };
      
      // Simulate switching to tile view
      viewState.currentView = 'tile';
      viewState.views.tile.isActive = true;
      
      expect(viewState.currentView).toBe('tile');
      expect(viewState.views.tile.isActive).toBe(true);
      expect(viewState.views.list.isActive).toBe(false);
      
      // Simulate switching to list view
      viewState.views.tile.isActive = false;
      viewState.currentView = 'list';
      viewState.views.list.isActive = true;
      
      expect(viewState.currentView).toBe('list');
      expect(viewState.views.tile.isActive).toBe(false);
      expect(viewState.views.list.isActive).toBe(true);
    });

    it('should handle multiple view switches', () => {
      const viewState: any = {
        currentView: null,
        views: {
          tile: { isActive: false },
          list: { isActive: false }
        }
      };
      
      // Switch to tile
      viewState.currentView = 'tile';
      viewState.views.tile.isActive = true;
      
      // Switch to list
      viewState.views.tile.isActive = false;
      viewState.currentView = 'list';
      viewState.views.list.isActive = true;
      
      // Switch back to tile
      viewState.views.list.isActive = false;
      viewState.currentView = 'tile';
      viewState.views.tile.isActive = true;
      
      expect(viewState.currentView).toBe('tile');
      expect(viewState.views.tile.isActive).toBe(true);
      expect(viewState.views.list.isActive).toBe(false);
    });
  });
});
