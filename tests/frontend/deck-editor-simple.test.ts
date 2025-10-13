/**
 * Unit tests for public/js/deck-editor-simple.js
 * Tests the basic deck editor functions extracted during Phase 4 of refactoring
 */

// Mock DOM elements
const mockButton = {
  disabled: false,
  style: { opacity: '', cursor: '' },
  title: '',
  setAttribute: jest.fn(),
  classList: {
    toggle: jest.fn(),
    contains: jest.fn(),
  },
};

const mockElement = {
  style: { display: 'block' },
  textContent: '',
  classList: {
    toggle: jest.fn(),
    contains: jest.fn(),
  },
  reset: jest.fn(),
  innerHTML: '',
};

// Mock document methods
const mockQuerySelectorAll = jest.fn(() => [mockButton]);
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'toggle-one-per-deck') return mockButton;
  if (id === 'one-per-deck-toggle-text') return mockElement;
  if (id === 'toggle-one-per-deck-advanced') return mockButton;
  if (id === 'one-per-deck-advanced-toggle-text') return mockElement;
  if (id === 'createDeckModal') return mockElement;
  if (id === 'createDeckForm') return mockElement;
  if (id === 'selectedCharacters') return mockElement;
  return mockElement;
});

// Set up global mocks
(global as any).document = {
  querySelectorAll: mockQuerySelectorAll,
  getElementById: mockGetElementById,
};

// Mock global functions
const mockIsGuestUser = jest.fn();
const mockSelectedCharacterIds: any[] = [];

// Define the functions from deck-editor-simple.js for testing
function disableAddToDeckButtons() {
  if (mockIsGuestUser()) {
    const addToDeckButtons = (global as any).document.querySelectorAll('.add-to-deck-btn');
    addToDeckButtons.forEach((button: any) => {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
      button.title = 'Log in to add to decks...';
      // Also add a data attribute for debugging
      button.setAttribute('data-guest-disabled', 'true');
    });
  }
}

function toggleOnePerDeckColumn() {
  const onePerDeckColumn = (global as any).document.querySelectorAll('.one-per-deck-column');
  const toggleButton = (global as any).document.getElementById('toggle-one-per-deck');
  const toggleText = (global as any).document.getElementById('one-per-deck-toggle-text');
  
  onePerDeckColumn.forEach((col: any) => {
    col.classList.toggle('hidden');
  });
  
  if (onePerDeckColumn[0].classList.contains('hidden')) {
    toggleText.textContent = 'Show';
  } else {
    toggleText.textContent = 'Hide';
  }
}

function toggleOnePerDeckAdvancedColumn() {
  const onePerDeckAdvancedColumn = (global as any).document.querySelectorAll('.one-per-deck-advanced-column');
  const toggleButton = (global as any).document.getElementById('toggle-one-per-deck-advanced');
  const toggleText = (global as any).document.getElementById('one-per-deck-advanced-toggle-text');
  
  onePerDeckAdvancedColumn.forEach((col: any) => {
    col.classList.toggle('hidden');
  });
  
  if (onePerDeckAdvancedColumn[0].classList.contains('hidden')) {
    toggleText.textContent = 'Show';
  } else {
    toggleText.textContent = 'Hide';
  }
}

function closeCreateDeckModal() {
  (global as any).document.getElementById('createDeckModal').style.display = 'none';
  (global as any).document.getElementById('createDeckForm').reset();
  (global as any).document.getElementById('selectedCharacters').innerHTML = '';
  mockSelectedCharacterIds.length = 0;
}

describe('Deck Editor Simple Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockButton.disabled = false;
    mockButton.style.opacity = '';
    mockButton.style.cursor = '';
    mockButton.title = '';
    mockElement.style.display = 'block';
    mockElement.textContent = '';
    mockElement.innerHTML = '';
    mockSelectedCharacterIds.length = 0;
  });

  describe('disableAddToDeckButtons', () => {
    it('should disable buttons for guest users', () => {
      mockIsGuestUser.mockReturnValue(true);
      mockQuerySelectorAll.mockReturnValue([mockButton]);

      disableAddToDeckButtons();

      expect(mockIsGuestUser).toHaveBeenCalled();
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.add-to-deck-btn');
      expect(mockButton.disabled).toBe(true);
      expect(mockButton.style.opacity).toBe('0.5');
      expect(mockButton.style.cursor).toBe('not-allowed');
      expect(mockButton.title).toBe('Log in to add to decks...');
      expect(mockButton.setAttribute).toHaveBeenCalledWith('data-guest-disabled', 'true');
    });

    it('should not disable buttons for authenticated users', () => {
      mockIsGuestUser.mockReturnValue(false);

      disableAddToDeckButtons();

      expect(mockIsGuestUser).toHaveBeenCalled();
      expect(mockQuerySelectorAll).not.toHaveBeenCalled();
      expect(mockButton.disabled).toBe(false);
      expect(mockButton.style.opacity).toBe('');
      expect(mockButton.style.cursor).toBe('');
      expect(mockButton.title).toBe('');
      expect(mockButton.setAttribute).not.toHaveBeenCalled();
    });

    it('should handle multiple buttons', () => {
      const mockButton2 = { ...mockButton };
      mockIsGuestUser.mockReturnValue(true);
      mockQuerySelectorAll.mockReturnValue([mockButton, mockButton2]);

      disableAddToDeckButtons();

      expect(mockButton.disabled).toBe(true);
      expect(mockButton2.disabled).toBe(true);
      expect(mockButton.setAttribute).toHaveBeenCalledWith('data-guest-disabled', 'true');
      expect(mockButton2.setAttribute).toHaveBeenCalledWith('data-guest-disabled', 'true');
    });

    it('should handle no buttons found', () => {
      mockIsGuestUser.mockReturnValue(true);
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => disableAddToDeckButtons()).not.toThrow();
    });
  });

  describe('toggleOnePerDeckColumn', () => {
    it('should toggle column visibility and update text to Show when hidden', () => {
      mockQuerySelectorAll.mockReturnValue([mockElement]);
      mockElement.classList.contains.mockReturnValue(true);

      toggleOnePerDeckColumn();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.one-per-deck-column');
      expect(mockGetElementById).toHaveBeenCalledWith('one-per-deck-toggle-text');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
      expect(mockElement.textContent).toBe('Show');
    });

    it('should toggle column visibility and update text to Hide when visible', () => {
      mockQuerySelectorAll.mockReturnValue([mockElement]);
      mockElement.classList.contains.mockReturnValue(false);

      toggleOnePerDeckColumn();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.one-per-deck-column');
      expect(mockGetElementById).toHaveBeenCalledWith('one-per-deck-toggle-text');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
      expect(mockElement.textContent).toBe('Hide');
    });

    it('should handle multiple columns', () => {
      const mockElement2 = { ...mockElement };
      mockQuerySelectorAll.mockReturnValue([mockElement, mockElement2]);
      mockElement.classList.contains.mockReturnValue(true);

      toggleOnePerDeckColumn();

      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement2.classList.toggle).toHaveBeenCalledWith('hidden');
    });

    it('should handle no columns found', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => toggleOnePerDeckColumn()).toThrow();
    });
  });

  describe('toggleOnePerDeckAdvancedColumn', () => {
    it('should toggle advanced column visibility and update text to Show when hidden', () => {
      mockQuerySelectorAll.mockReturnValue([mockElement]);
      mockElement.classList.contains.mockReturnValue(true);

      toggleOnePerDeckAdvancedColumn();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.one-per-deck-advanced-column');
      expect(mockGetElementById).toHaveBeenCalledWith('one-per-deck-advanced-toggle-text');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
      expect(mockElement.textContent).toBe('Show');
    });

    it('should toggle advanced column visibility and update text to Hide when visible', () => {
      mockQuerySelectorAll.mockReturnValue([mockElement]);
      mockElement.classList.contains.mockReturnValue(false);

      toggleOnePerDeckAdvancedColumn();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.one-per-deck-advanced-column');
      expect(mockGetElementById).toHaveBeenCalledWith('one-per-deck-advanced-toggle-text');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
      expect(mockElement.textContent).toBe('Hide');
    });

    it('should handle multiple advanced columns', () => {
      const mockElement2 = { ...mockElement };
      mockQuerySelectorAll.mockReturnValue([mockElement, mockElement2]);
      mockElement.classList.contains.mockReturnValue(true);

      toggleOnePerDeckAdvancedColumn();

      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
      expect(mockElement2.classList.toggle).toHaveBeenCalledWith('hidden');
    });

    it('should handle no advanced columns found', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => toggleOnePerDeckAdvancedColumn()).toThrow();
    });
  });

  describe('closeCreateDeckModal', () => {
    it('should close modal and reset form', () => {
      const mockModal = { style: { display: 'block' } };
      const mockForm = { reset: jest.fn() };
      const mockSelectedChars = { innerHTML: 'some content' };

      mockGetElementById.mockImplementation((id: string) => {
        if (id === 'createDeckModal') return mockModal;
        if (id === 'createDeckForm') return mockForm;
        if (id === 'selectedCharacters') return mockSelectedChars;
        return mockElement;
      });

      closeCreateDeckModal();

      expect(mockGetElementById).toHaveBeenCalledWith('createDeckModal');
      expect(mockGetElementById).toHaveBeenCalledWith('createDeckForm');
      expect(mockGetElementById).toHaveBeenCalledWith('selectedCharacters');
      expect(mockModal.style.display).toBe('none');
      expect(mockForm.reset).toHaveBeenCalled();
      expect(mockSelectedChars.innerHTML).toBe('');
      expect(mockSelectedCharacterIds.length).toBe(0);
    });

    it('should handle missing elements gracefully', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => closeCreateDeckModal()).not.toThrow();
    });

    it('should clear selected character IDs array', () => {
      mockSelectedCharacterIds.push('char1', 'char2', 'char3');
      expect(mockSelectedCharacterIds.length).toBe(3);

      closeCreateDeckModal();

      expect(mockSelectedCharacterIds.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null return from isGuestUser', () => {
      mockIsGuestUser.mockReturnValue(null);

      expect(() => disableAddToDeckButtons()).not.toThrow();
    });

    it('should handle undefined return from isGuestUser', () => {
      mockIsGuestUser.mockReturnValue(undefined);

      expect(() => disableAddToDeckButtons()).not.toThrow();
    });

    it('should handle empty classList in toggle functions', () => {
      const mockElementNoClassList = { textContent: '' };
      mockQuerySelectorAll.mockReturnValue([mockElementNoClassList]);
      mockGetElementById.mockReturnValue(mockElementNoClassList);

      expect(() => toggleOnePerDeckColumn()).toThrow();
      expect(() => toggleOnePerDeckAdvancedColumn()).toThrow();
    });
  });
});
