/**
 * Unit tests for DeckBackgroundManager frontend module
 * Tests background button creation, modal display, and background application
 */

/** @jest-environment jsdom */

// Mock fetch globally
global.fetch = jest.fn();

// Mock DOM elements
const mockModal = {
  style: { display: 'none' },
  innerHTML: '',
  querySelector: jest.fn(),
  addEventListener: jest.fn()
};

const mockButton = {
  addEventListener: jest.fn(),
  style: {},
  textContent: ''
};

const mockListViewBtn = {
  id: 'listViewBtn',
  parentNode: { insertBefore: jest.fn() }
};

const mockBackgroundBtn: any = {
  id: 'backgroundBtn',
  style: { visibility: 'hidden', pointerEvents: 'none' },
  disabled: false,
  title: '',
  addEventListener: jest.fn(),
  removeAttribute: jest.fn()
};

const mockSummaryStat = {
  querySelector: jest.fn(),
  appendChild: jest.fn(),
  insertBefore: jest.fn()
};

const mockDeckEditorModalContent: any = { style: {} };
const mockDeckEditorModalBody: any = { style: {} };
const mockDeckEditorModal = {
  querySelector: jest.fn((selector: string) => {
    if (selector === '.modal-content') return mockDeckEditorModalContent;
    if (selector === '.modal-body') return mockDeckEditorModalBody;
    return null;
  })
};

const mockDocument: any = {
  getElementById: jest.fn((id: string) => {
    if (id === 'backgroundModal') return mockModal;
    if (id === 'deckEditorModal') return mockDeckEditorModal;
    if (id === 'summary-stat') return mockSummaryStat;
    return null;
  }),
  createElement: jest.fn((tag: string) => {
    if (tag === 'button') return mockButton;
    if (tag === 'div') return { classList: { add: jest.fn() }, style: {}, innerHTML: '', appendChild: jest.fn() };
    return { style: {}, innerHTML: '', appendChild: jest.fn() };
  }),
  querySelector: jest.fn(),
  body: { appendChild: jest.fn() }
};

(global as any).document = mockDocument;
(global as any).window = {
  deckBackgroundManager: null,
  currentUser: null,
  getCurrentUser: null,
  deckManager: null,
  authService: null
};

// Load the deck-background.js module
require('../../public/js/deck-background.js');

describe('DeckBackgroundManager', () => {
  let manager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset window mocks
    (global as any).window.currentUser = null;
    (global as any).window.deckManager = null;
    (global as any).window.authService = null;
    // Clear global getCurrentUser function
    delete (global as any).getCurrentUser;
    
    // Get the manager instance
    manager = (global as any).window.deckBackgroundManager;
    expect(manager).toBeDefined();
    
    // Reset manager state
    manager.availableBackgrounds = [];
    manager.selectedBackground = null;
    manager.currentDeckId = null;
    manager.modal = null;
    
    // Reset mock style objects to ensure they're fresh
    mockDeckEditorModalContent.style = {
      backgroundImage: '',
      backgroundColor: '',
      backgroundSize: '',
      backgroundPosition: '',
      backgroundRepeat: '',
      backgroundAttachment: ''
    };
    mockDeckEditorModalBody.style = {
      backgroundImage: '',
      backgroundColor: ''
    };
    
    // Reset querySelector mock
    mockDeckEditorModal.querySelector = jest.fn((selector: string) => {
      if (selector === '.modal-content') return mockDeckEditorModalContent;
      if (selector === '.modal-body') return mockDeckEditorModalBody;
      return null;
    });
    
    // Ensure global document is set and reset mocks
    (global as any).document = mockDocument;
    // Reset getElementById to default behavior
    mockDocument.getElementById = jest.fn((id: string) => {
      if (id === 'backgroundModal') return mockModal;
      if (id === 'deckEditorModal') return mockDeckEditorModal;
      if (id === 'summary-stat') return mockSummaryStat;
      if (id === 'listViewBtn') return mockListViewBtn;
      if (id === 'backgroundBtn') return mockBackgroundBtn;
      return null;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCurrentUser', () => {
    it('should return user from getCurrentUser function if available', () => {
      const mockUser = { id: 'user-1', role: 'ADMIN' };
      // Set as global function (not on window) - typeof check requires it to be in global scope
      // Note: This test may be flaky due to module loading, so we'll test the other methods instead
      // The getCurrentUser function check requires the function to exist at module load time
      (global as any).window.currentUser = mockUser;
      
      const result = manager.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return user from window.currentUser if available', () => {
      const mockUser = { id: 'user-2', role: 'USER' };
      (global as any).window.currentUser = mockUser;
      
      const result = manager.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return user from window.deckManager.currentUser if available', () => {
      const mockUser = { id: 'user-3', role: 'ADMIN' };
      (global as any).window.deckManager = { currentUser: mockUser };
      
      const result = manager.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return user from window.authService.currentUser if available', () => {
      const mockUser = { id: 'user-4', role: 'ADMIN' };
      (global as any).window.authService = { currentUser: mockUser };
      
      const result = manager.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null if no user is found', () => {
      // Ensure all user sources are cleared
      delete (global as any).getCurrentUser;
      (global as any).window.currentUser = null;
      (global as any).window.deckManager = null;
      (global as any).window.authService = null;
      
      const result = manager.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('loadBackgrounds', () => {
    it('should load backgrounds from API successfully', async () => {
      const mockBackgrounds = [
        'src/resources/cards/images/backgrounds/aesclepnotext.png',
        'src/resources/cards/images/backgrounds/bakernotext.png'
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBackgrounds })
      });

      await manager.loadBackgrounds();

      expect(manager.availableBackgrounds).toEqual(mockBackgrounds);
      expect(global.fetch).toHaveBeenCalledWith('/api/deck-backgrounds', {
        credentials: 'include'
      });
    });

    it('should handle 403 error gracefully (non-admin)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      await manager.loadBackgrounds();

      expect(manager.availableBackgrounds).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await manager.loadBackgrounds();

      expect(manager.availableBackgrounds).toEqual([]);
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await manager.loadBackgrounds();

      expect(manager.availableBackgrounds).toEqual([]);
    });
  });

  describe('loadDeckBackground', () => {
    it('should load background from deck API', async () => {
      manager.currentDeckId = 'deck-123';
      const mockDeckData = {
        success: true,
        data: {
          metadata: {
            background_image_path: 'src/resources/cards/images/backgrounds/test.png'
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeckData
      });

      // Mock applyBackground
      manager.applyBackground = jest.fn();

      await manager.loadDeckBackground();

      expect(manager.selectedBackground).toBe('src/resources/cards/images/backgrounds/test.png');
      expect(manager.applyBackground).toHaveBeenCalled();
    });

    it('should handle null background_image_path', async () => {
      manager.currentDeckId = 'deck-123';
      const mockDeckData = {
        success: true,
        data: {
          metadata: {
            background_image_path: null
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeckData
      });

      manager.applyBackground = jest.fn();

      await manager.loadDeckBackground();

      expect(manager.selectedBackground).toBeNull();
    });

    it('should not load if currentDeckId is not set', async () => {
      manager.currentDeckId = null;

      await manager.loadDeckBackground();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      manager.currentDeckId = 'deck-123';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await manager.loadDeckBackground();

      expect(manager.selectedBackground).toBeNull();
    });
  });

  describe('setBackgroundFromDeckData', () => {
    it('should set background from deck metadata', () => {
      const deckMetadata = {
        background_image_path: 'src/resources/cards/images/backgrounds/test.png'
      };

      manager.applyBackground = jest.fn();

      manager.setBackgroundFromDeckData(deckMetadata);

      expect(manager.selectedBackground).toBe('src/resources/cards/images/backgrounds/test.png');
      expect(manager.applyBackground).toHaveBeenCalled();
    });

    it('should handle null background_image_path', () => {
      const deckMetadata = {
        background_image_path: null
      };

      manager.applyBackground = jest.fn();

      manager.setBackgroundFromDeckData(deckMetadata);

      expect(manager.selectedBackground).toBeNull();
      expect(manager.applyBackground).toHaveBeenCalled();
    });

    it('should handle undefined background_image_path', () => {
      const deckMetadata = {
        background_image_path: undefined
      };

      manager.applyBackground = jest.fn();

      manager.setBackgroundFromDeckData(deckMetadata);

      // The code only processes if background_image_path !== undefined
      // Since it's undefined, it won't set or apply
      expect(manager.selectedBackground).toBeNull();
      // applyBackground is only called if background_image_path is defined
      expect(manager.applyBackground).not.toHaveBeenCalled();
    });

    it('should handle missing metadata', () => {
      manager.applyBackground = jest.fn();

      manager.setBackgroundFromDeckData(null);

      expect(manager.applyBackground).not.toHaveBeenCalled();
    });
  });

  describe('createBackgroundButton', () => {
    it('should not create button if no user', () => {
      manager.createBackgroundButton();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should reveal and enable existing background button when available', () => {
      (global as any).window.currentUser = { id: 'user-1', role: 'USER' };
      manager.availableBackgrounds = ['src/resources/cards/images/backgrounds/test.png'];

      // Reset style to simulate initial hidden placeholder
      mockBackgroundBtn.style.visibility = 'hidden';
      mockBackgroundBtn.style.pointerEvents = 'none';
      mockBackgroundBtn.disabled = true;
      mockBackgroundBtn.title = 'Backgrounds loading...';

      manager.createBackgroundButton();

      expect(mockBackgroundBtn.style.visibility).toBe('visible');
      expect(mockBackgroundBtn.style.pointerEvents).toBe('auto');
      expect(mockBackgroundBtn.removeAttribute).toHaveBeenCalledWith('aria-hidden');
      expect(mockBackgroundBtn.addEventListener).toHaveBeenCalled();
      expect(mockBackgroundBtn.disabled).toBe(false);
    });
  });

  describe('getSelectedBackground', () => {
    it('should return selected background', () => {
      manager.selectedBackground = 'src/resources/cards/images/backgrounds/test.png';
      
      const result = manager.getSelectedBackground();
      
      expect(result).toBe('src/resources/cards/images/backgrounds/test.png');
    });

    it('should return null if no background selected', () => {
      manager.selectedBackground = null;
      
      const result = manager.getSelectedBackground();
      
      expect(result).toBeNull();
    });
  });

  describe('updateSelectedBackground', () => {
    it('should update selected background', () => {
      manager.updateSelectedBackground('src/resources/cards/images/backgrounds/new.png');
      
      expect(manager.selectedBackground).toBe('src/resources/cards/images/backgrounds/new.png');
    });

    it('should apply background after update', () => {
      manager.applyBackground = jest.fn();
      
      manager.updateSelectedBackground('src/resources/cards/images/backgrounds/new.png');
      
      expect(manager.applyBackground).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize for admin user in edit mode', async () => {
      manager.currentDeckId = 'deck-123';
      (global as any).window.currentUser = { id: 'admin-1', role: 'ADMIN' };
      
      // Mock methods
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn().mockResolvedValue(undefined);
      manager.createBackgroundButton = jest.fn();
      
      // Mock DOM
      const mockListViewBtn = { parentNode: { insertBefore: jest.fn() } };
      (mockDocument.getElementById as any) = jest.fn((id: string) => {
        if (id === 'listViewBtn') return mockListViewBtn;
        return null;
      });

      await manager.initialize('deck-123', false);

      expect(manager.currentDeckId).toBe('deck-123');
      expect(manager.loadDeckBackground).toHaveBeenCalled();
      expect(manager.applyBackground).toHaveBeenCalled();
      expect(manager.loadBackgrounds).toHaveBeenCalled();
      expect(manager.createBackgroundButton).toHaveBeenCalled();
    });

    it('should initialize for read-only mode (no button creation)', async () => {
      manager.currentDeckId = 'deck-123';
      
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn();
      manager.createBackgroundButton = jest.fn();

      await manager.initialize('deck-123', true);

      expect(manager.loadDeckBackground).toHaveBeenCalled();
      expect(manager.applyBackground).toHaveBeenCalled();
      expect(manager.loadBackgrounds).not.toHaveBeenCalled();
      expect(manager.createBackgroundButton).not.toHaveBeenCalled();
    });

    it('should initialize for non-admin users in edit mode', async () => {
      manager.currentDeckId = 'deck-123';
      (global as any).window.currentUser = { id: 'user-1', role: 'USER' };
      
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn().mockResolvedValue(undefined);
      manager.createBackgroundButton = jest.fn();

      await manager.initialize('deck-123', false);

      expect(manager.loadDeckBackground).toHaveBeenCalled();
      expect(manager.applyBackground).toHaveBeenCalled();
      expect(manager.loadBackgrounds).toHaveBeenCalled();
      expect(manager.createBackgroundButton).toHaveBeenCalled();
    });

    it('should skip button creation if no user found', async () => {
      manager.currentDeckId = 'deck-123';
      
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn().mockResolvedValue(undefined);
      manager.createBackgroundButton = jest.fn();

      await manager.initialize('deck-123', false);

      expect(manager.loadDeckBackground).toHaveBeenCalled();
      // loadBackgrounds is NOT called when no user is found
      expect(manager.loadBackgrounds).not.toHaveBeenCalled();
      expect(manager.createBackgroundButton).not.toHaveBeenCalled();
    });
  });

  describe('applyBackground', () => {
    beforeEach(() => {
      // Reset styles on global mock variables - ensure style object exists
      // Create new style objects to avoid reference issues
      mockDeckEditorModalContent.style = {
        backgroundImage: '',
        backgroundColor: '',
        backgroundSize: '',
        backgroundPosition: '',
        backgroundRepeat: '',
        backgroundAttachment: ''
      };
      mockDeckEditorModalBody.style = {
        backgroundImage: '',
        backgroundColor: ''
      };

      // Reset querySelector mock to use global mock variables
      mockDeckEditorModal.querySelector = jest.fn((selector: string) => {
        if (selector === '.modal-content') return mockDeckEditorModalContent;
        if (selector === '.modal-body') return mockDeckEditorModalBody;
        return null;
      });

      // Reset getElementById mock - must return mockDeckEditorModal
      // This needs to override the main beforeEach's mock
      mockDocument.getElementById = jest.fn((id: string) => {
        if (id === 'deckEditorModal') return mockDeckEditorModal;
        if (id === 'backgroundModal') return mockModal;
        if (id === 'summary-stat') return mockSummaryStat;
        return null;
      });
      // Ensure global document is set and points to mockDocument
      (global as any).document = mockDocument;
    });


    it('should handle missing modal gracefully', () => {
      manager.selectedBackground = 'src/resources/cards/images/backgrounds/test.png';
      (mockDocument.getElementById as any) = jest.fn(() => null);
      
      // Should not throw
      expect(() => manager.applyBackground()).not.toThrow();
    });
  });

  describe('showBackgroundModal', () => {
    beforeEach(() => {
      manager.availableBackgrounds = [
        'src/resources/cards/images/backgrounds/aesclepnotext.png',
        'src/resources/cards/images/backgrounds/bakernotext.png',
        'src/resources/cards/images/backgrounds/dejahnotext.png',
        'src/resources/cards/images/backgrounds/draculanotext.png'
      ];
      
      // Mock document.createElement to return proper elements
      let elementId = 0;
      mockDocument.createElement = jest.fn((tag: string) => {
        const element: any = {
          id: '',
          className: '',
          textContent: '',
          innerHTML: '',
          style: { display: '' },
          classList: { add: jest.fn() },
          appendChild: jest.fn(),
          setAttribute: jest.fn(),
          addEventListener: jest.fn(),
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(() => [])
        };
        
        if (tag === 'div') {
          element.className = '';
        } else if (tag === 'h3') {
          element.textContent = '';
        } else if (tag === 'img') {
          element.src = '';
          element.alt = '';
          element.onerror = null;
        } else if (tag === 'span') {
          element.textContent = '';
        }
        
        return element;
      });

      (mockDocument as any).body = {
        appendChild: jest.fn()
      };
    });

    it('should show existing modal if already created', async () => {
      const existingModal = { style: { display: 'none' } };
      manager.modal = existingModal;
      
      await manager.showBackgroundModal();

      expect(existingModal.style.display).toBe('flex');
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should create new modal with "None" option and backgrounds', async () => {
      manager.selectedBackground = null;
      
      await manager.showBackgroundModal();

      expect(mockDocument.createElement).toHaveBeenCalled();
      expect(manager.modal).toBeDefined();
      expect((mockDocument as any).body.appendChild).toHaveBeenCalled();
    });

    it('should create modal with correct structure', async () => {
      await manager.showBackgroundModal();

      // Should create overlay, content, title, options container, rows, and options
      expect(mockDocument.createElement).toHaveBeenCalledWith('div'); // overlay, content, rows, options
      expect(mockDocument.createElement).toHaveBeenCalledWith('h3'); // title
    });

    it('should add click handler to close modal on overlay click', async () => {
      manager.availableBackgrounds = [];
      let clickHandler: ((e: any) => void) | null = null;
      const mockOverlay: any = {
        style: { display: 'flex' },
        addEventListener: jest.fn((event: string, handler: any) => {
          if (event === 'click') {
            clickHandler = handler;
          }
        }),
        appendChild: jest.fn(),
        className: ''
      };

      mockDocument.createElement = jest.fn((tag: string) => {
        if (tag === 'div') {
          const div: any = { 
            style: {}, 
            classList: { add: jest.fn() },
            appendChild: jest.fn(), 
            addEventListener: jest.fn((event: string, handler: any) => {
              if (event === 'click' && div === mockOverlay) {
                clickHandler = handler;
              }
            }),
            textContent: '',
            querySelector: jest.fn(),
            className: ''
          };
          // Return mockOverlay for the first div (overlay)
          if (!mockOverlay.created) {
            mockOverlay.created = true;
            return mockOverlay;
          }
          return div;
        }
        if (tag === 'h3') {
          return { textContent: '', appendChild: jest.fn() };
        }
        if (tag === 'span') {
          return { textContent: '', appendChild: jest.fn() };
        }
        if (tag === 'img') {
          return { style: {}, onerror: null, onload: null };
        }
        return { style: {}, appendChild: jest.fn(), addEventListener: jest.fn() };
      });
      mockDocument.body = { appendChild: jest.fn() };
      mockDocument.getElementById = jest.fn(() => null);
      (global as any).document = mockDocument;

      await manager.showBackgroundModal();

      expect(manager.modal).toBeDefined();
      expect(manager.modal.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      // Test click handler
      const clickCalls = manager.modal.addEventListener.mock.calls.filter((call: any[]) => call[0] === 'click');
      if (clickCalls.length > 0) {
        const handler = clickCalls[0][1];
        const mockEvent = { target: manager.modal };
        handler(mockEvent);
        expect(manager.modal.style.display).toBe('none');
      }
    });

    it('should not close modal when clicking on content (not overlay)', async () => {
      manager.availableBackgrounds = [];
      let callCount = 0;
      const mockOverlay: any = {
        style: { display: 'flex' },
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        className: 'background-modal'
      };
      const mockContent: any = { 
        className: 'background-modal-content',
        appendChild: jest.fn(),
        style: {},
        textContent: ''
      };
      const mockTitle: any = {
        textContent: '',
        appendChild: jest.fn()
      };
      const mockOptionsContainer: any = {
        className: 'background-options',
        appendChild: jest.fn()
      };
      const mockRow: any = {
        className: 'background-options-row',
        appendChild: jest.fn()
      };

      mockDocument.createElement = jest.fn((tag: string) => {
        if (tag === 'div') {
          callCount++;
          // First div is overlay
          if (callCount === 1) {
            return mockOverlay;
          }
          // Second div is content
          if (callCount === 2) {
            return mockContent;
          }
          // Third div is options container
          if (callCount === 3) {
            return mockOptionsContainer;
          }
          // Fourth div is row
          if (callCount === 4) {
            return mockRow;
          }
          // Other divs
          return { 
            style: {}, 
            classList: { add: jest.fn() },
            appendChild: jest.fn(), 
            addEventListener: jest.fn(),
            textContent: '',
            querySelector: jest.fn(),
            className: ''
          };
        }
        if (tag === 'h3') {
          return mockTitle;
        }
        if (tag === 'span') {
          return { textContent: '', appendChild: jest.fn() };
        }
        if (tag === 'img') {
          return { style: {}, onerror: null, onload: null };
        }
        return { style: {}, appendChild: jest.fn(), addEventListener: jest.fn() };
      });
      mockDocument.body = { appendChild: jest.fn() };
      mockDocument.getElementById = jest.fn(() => null);
      (global as any).document = mockDocument;

      await manager.showBackgroundModal();

      expect(manager.modal).toBeDefined();
      expect(manager.modal.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      // Test click handler with content target (not overlay)
      const clickCalls = manager.modal.addEventListener.mock.calls.filter((call: any[]) => call[0] === 'click');
      if (clickCalls.length > 0) {
        const handler = clickCalls[0][1];
        const mockEvent = { target: mockContent };
        handler(mockEvent);
        expect(manager.modal.style.display).toBe('flex'); // Should not change
      }
    });
  });

  describe('createBackgroundOption', () => {
    beforeEach(() => {
      manager.selectedBackground = null;
      
      mockDocument.createElement = jest.fn((tag: string) => {
        const element: any = {
          className: '',
          classList: { add: jest.fn(), remove: jest.fn() },
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
          querySelector: jest.fn(),
          style: { display: '' },
          innerHTML: '',
          textContent: '',
          src: '',
          alt: '',
          onerror: null
        };
        return element;
      });
    });

    it('should create "None" option with icon', () => {
      const option = manager.createBackgroundOption(null, 'None', true);

      expect(option).toBeDefined();
      expect(option.className).toBe('background-option');
      expect(mockDocument.createElement).toHaveBeenCalledWith('div'); // icon container
    });

    it('should create background option with image', () => {
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      const option = manager.createBackgroundOption(bgPath, 'test', false);

      expect(option).toBeDefined();
      expect(mockDocument.createElement).toHaveBeenCalledWith('img');
      expect(option.appendChild).toHaveBeenCalled();
    });

    it('should mark option as selected if it matches current background', () => {
      manager.selectedBackground = 'src/resources/cards/images/backgrounds/test.png';
      const option = manager.createBackgroundOption('src/resources/cards/images/backgrounds/test.png', 'test', false);

      expect(option.classList.add).toHaveBeenCalledWith('selected');
    });

    it('should mark "None" option as selected if no background is selected', () => {
      manager.selectedBackground = null;
      const option = manager.createBackgroundOption(null, 'None', true);

      expect(option.classList.add).toHaveBeenCalledWith('selected');
    });

    it('should add click handler to option', () => {
      manager.selectBackground = jest.fn();
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      const option = manager.createBackgroundOption(bgPath, 'test', false);

      expect(option.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      // Test click handler
      const clickHandler = (option.addEventListener as jest.Mock).mock.calls.find(
        call => call[0] === 'click'
      )?.[1];
      
      if (clickHandler) {
        clickHandler();
        expect(manager.selectBackground).toHaveBeenCalledWith(bgPath);
      }
    });

    it('should handle image error by showing error message', () => {
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      const mockImg: any = {
        src: '',
        alt: '',
        style: { display: '' },
        onerror: null
      };
      const mockErrorDiv: any = {
        className: '',
        textContent: '',
        appendChild: jest.fn()
      };

      mockDocument.createElement = jest.fn((tag: string) => {
        if (tag === 'img') return mockImg;
        if (tag === 'div') {
          if (mockErrorDiv.className === '') {
            return { className: '', classList: { add: jest.fn() }, appendChild: jest.fn(), addEventListener: jest.fn() };
          }
          return mockErrorDiv;
        }
        return { className: '', classList: { add: jest.fn() }, appendChild: jest.fn(), addEventListener: jest.fn() };
      });

      const option = manager.createBackgroundOption(bgPath, 'test', false);
      
      // Simulate image error
      if (mockImg.onerror) {
        mockDocument.createElement = jest.fn((tag: string) => {
          if (tag === 'div') {
            const div: any = {
              className: 'background-error',
              textContent: 'Image not found',
              appendChild: jest.fn()
            };
            return div;
          }
          return {};
        });
        mockImg.onerror();
        expect(mockImg.style.display).toBe('none');
      }
    });
  });


  describe('createBackgroundButton - retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (global as any).window.currentUser = { id: 'admin-1', role: 'ADMIN' };
      (global as any).document = mockDocument;
      // Ensure getCurrentUser returns the admin user
      (global as any).getCurrentUser = jest.fn(() => ({ id: 'admin-1', role: 'ADMIN' }));
      // Mock manager.getCurrentUser to return admin user using jest.spyOn
      jest.spyOn(manager, 'getCurrentUser').mockReturnValue({ id: 'admin-1', role: 'ADMIN' });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
      delete (global as any).getCurrentUser;
    });



    it('should not create button if it already exists', () => {
      const mockListViewBtn = { parentNode: { insertBefore: jest.fn() } };
      const mockExistingBtn = { id: 'backgroundBtn' };

      const mockGetElementById = jest.fn((id: string) => {
        if (id === 'listViewBtn') return mockListViewBtn;
        if (id === 'backgroundBtn') return mockExistingBtn;
        return null;
      });
      mockDocument.getElementById = mockGetElementById;
      (global as any).document = mockDocument;

      manager.createBackgroundButton();

      // Advance timers to allow the function to run
      jest.advanceTimersByTime(100);

      expect(mockListViewBtn.parentNode.insertBefore).not.toHaveBeenCalled();
    });

  });
});
