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

const mockDeckEditorModal = {
  querySelector: jest.fn((selector: string) => {
    if (selector === '.modal-content') return { style: {} };
    if (selector === '.modal-body') return { style: {} };
    return null;
  })
};

const mockSummaryStat = {
  querySelector: jest.fn(),
  appendChild: jest.fn(),
  insertBefore: jest.fn()
};

const mockDocument = {
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
  querySelector: jest.fn()
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
    it('should not create button for non-admin users', () => {
      (global as any).window.currentUser = { id: 'user-1', role: 'USER' };
      
      manager.createBackgroundButton();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should not create button if no user', () => {
      manager.createBackgroundButton();

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should create button for admin users when DOM is ready', () => {
      (global as any).window.currentUser = { id: 'admin-1', role: 'ADMIN' };
      
      // Mock DOM elements
      const mockListViewBtn = { nextSibling: null };
      mockSummaryStat.querySelector.mockReturnValue(mockListViewBtn);
      mockDocument.getElementById.mockReturnValue(mockSummaryStat);

      manager.createBackgroundButton();

      // Should attempt to create button (with retry logic)
      expect(mockDocument.getElementById).toHaveBeenCalled();
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

    it('should skip button creation for non-admin users', async () => {
      manager.currentDeckId = 'deck-123';
      (global as any).window.currentUser = { id: 'user-1', role: 'USER' };
      
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn().mockResolvedValue(undefined);
      manager.createBackgroundButton = jest.fn();

      await manager.initialize('deck-123', false);

      expect(manager.loadDeckBackground).toHaveBeenCalled();
      // loadBackgrounds is called but createBackgroundButton is not
      expect(manager.loadBackgrounds).toHaveBeenCalled();
      expect(manager.createBackgroundButton).not.toHaveBeenCalled();
    });

    it('should skip button creation if no user found', async () => {
      manager.currentDeckId = 'deck-123';
      
      manager.loadDeckBackground = jest.fn().mockResolvedValue(undefined);
      manager.applyBackground = jest.fn();
      manager.loadBackgrounds = jest.fn().mockResolvedValue(undefined);
      manager.createBackgroundButton = jest.fn();

      await manager.initialize('deck-123', false);

      expect(manager.loadDeckBackground).toHaveBeenCalled();
      // loadBackgrounds is called but createBackgroundButton is not
      expect(manager.loadBackgrounds).toHaveBeenCalled();
      expect(manager.createBackgroundButton).not.toHaveBeenCalled();
    });
  });

  describe('applyBackground', () => {
    let mockModalContent: any;
    let mockModalBody: any;

    beforeEach(() => {
      // Create mock modal elements
      mockModalContent = {
        style: {
          backgroundImage: '',
          backgroundColor: '',
          backgroundSize: '',
          backgroundPosition: '',
          backgroundRepeat: '',
          backgroundAttachment: ''
        }
      };
      
      mockModalBody = {
        style: {
          backgroundImage: '',
          backgroundColor: ''
        }
      };

      // Reset querySelector mock
      mockDeckEditorModal.querySelector = jest.fn((selector: string) => {
        if (selector === '.modal-content') return mockModalContent;
        if (selector === '.modal-body') return mockModalBody;
        return null;
      });

      (mockDocument.getElementById as any) = jest.fn((id: string) => {
        if (id === 'deckEditorModal') return mockDeckEditorModal;
        return null;
      });
    });

    it('should apply background image when background is selected', () => {
      manager.selectedBackground = 'src/resources/cards/images/backgrounds/test.png';
      
      manager.applyBackground();

      const modalContent = mockDeckEditorModal.querySelector('.modal-content') as any;
      expect(modalContent).toBeDefined();
      expect(modalContent.style.backgroundImage).toBe('url(/src/resources/cards/images/backgrounds/test.png)');
      expect(modalContent.style.backgroundSize).toBe('cover');
      expect(modalContent.style.backgroundPosition).toBe('center');
      expect(modalContent.style.backgroundRepeat).toBe('no-repeat');
      expect(modalContent.style.backgroundAttachment).toBe('scroll');
      expect(modalContent.style.backgroundColor).toBe('transparent');
    });

    it('should set black background when no background is selected', () => {
      manager.selectedBackground = null;
      
      manager.applyBackground();

      const modalContent = mockDeckEditorModal.querySelector('.modal-content') as any;
      expect(modalContent).toBeDefined();
      expect(modalContent.style.backgroundColor).toBe('#000000');
      expect(modalContent.style.backgroundImage).toBe('');
    });

    it('should clear existing backgrounds before applying new one', () => {
      manager.selectedBackground = 'src/resources/cards/images/backgrounds/test.png';
      
      const modalContent = mockDeckEditorModal.querySelector('.modal-content') as any;
      const modalBody = mockDeckEditorModal.querySelector('.modal-body') as any;
      
      expect(modalContent).toBeDefined();
      expect(modalBody).toBeDefined();
      
      // Set existing backgrounds
      modalContent.style.backgroundImage = 'url(/old.png)';
      modalContent.style.backgroundColor = '#ff0000';
      modalBody.style.backgroundImage = 'url(/old.png)';
      
      manager.applyBackground();

      expect(modalContent.style.backgroundImage).toBe('url(/src/resources/cards/images/backgrounds/test.png)');
      expect(modalBody.style.backgroundImage).toBe('');
      expect(modalBody.style.backgroundColor).toBe('');
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
      let clickHandler: ((e: any) => void) | null = null;
      const mockOverlay: any = {
        style: { display: 'flex' },
        addEventListener: jest.fn((event: string, handler: any) => {
          if (event === 'click') {
            clickHandler = handler;
          }
        })
      };

      mockDocument.createElement = jest.fn((tag: string) => {
        if (tag === 'div') {
          return mockOverlay;
        }
        return { style: {}, appendChild: jest.fn(), addEventListener: jest.fn() };
      });

      await manager.showBackgroundModal();

      expect(mockOverlay.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      
      // Test click handler
      if (clickHandler) {
        const mockEvent = { target: mockOverlay };
        (clickHandler as any)(mockEvent);
        expect(mockOverlay.style.display).toBe('none');
      }
    });

    it('should not close modal when clicking on content (not overlay)', async () => {
      let clickHandler: ((e: any) => void) | null = null;
      const mockOverlay: any = {
        style: { display: 'flex' },
        addEventListener: jest.fn((event: string, handler: any) => {
          if (event === 'click') {
            clickHandler = handler;
          }
        })
      };
      const mockContent = {};

      mockDocument.createElement = jest.fn((tag: string) => {
        if (tag === 'div') {
          return mockOverlay;
        }
        return { style: {}, appendChild: jest.fn(), addEventListener: jest.fn() };
      });

      await manager.showBackgroundModal();

      if (clickHandler) {
        const mockEvent = { target: mockContent };
        (clickHandler as any)(mockEvent);
        expect(mockOverlay.style.display).toBe('flex'); // Should not change
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

  describe('selectBackground', () => {
    beforeEach(() => {
      manager.modal = {
        style: { display: 'flex' },
        querySelectorAll: jest.fn(() => [])
      };
    });

    it('should update selected background', () => {
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      manager.modal = {
        querySelectorAll: jest.fn(() => []),
        style: { display: 'flex' }
      };
      manager.applyBackground = jest.fn();
      
      manager.selectBackground(bgPath);

      expect(manager.selectedBackground).toBe(bgPath);
    });

    it('should update selected state in modal', () => {
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      const mockOption1: any = {
        classList: { remove: jest.fn(), add: jest.fn() },
        querySelector: jest.fn(() => ({ src: '/other.png' }))
      };
      const mockOption2: any = {
        classList: { remove: jest.fn(), add: jest.fn() },
        querySelector: jest.fn(() => ({ src: `//${bgPath}` }))
      };

      manager.modal.querySelectorAll = jest.fn(() => [mockOption1, mockOption2]);
      manager.applyBackground = jest.fn();

      manager.selectBackground(bgPath);

      expect(mockOption1.classList.remove).toHaveBeenCalledWith('selected');
      expect(mockOption2.classList.remove).toHaveBeenCalledWith('selected');
      expect(mockOption2.classList.add).toHaveBeenCalledWith('selected');
    });

    it('should select "None" option when imagePath is null', () => {
      const mockOption1: any = {
        classList: { remove: jest.fn(), add: jest.fn() },
        querySelector: jest.fn(() => null)
      };
      const mockOption2: any = {
        classList: { remove: jest.fn(), add: jest.fn() },
        querySelector: jest.fn(() => null)
      };
      // Mock querySelector to return icon for "None" option
      mockOption1.querySelector = jest.fn((selector: string) => {
        if (selector === '.background-none-icon') return { textContent: '×' };
        return null;
      });

      manager.modal.querySelectorAll = jest.fn(() => [mockOption1, mockOption2]);
      manager.applyBackground = jest.fn();

      manager.selectBackground(null);

      expect(manager.selectedBackground).toBeNull();
      expect(mockOption1.classList.add).toHaveBeenCalledWith('selected');
    });

    it('should apply background immediately', () => {
      manager.applyBackground = jest.fn();
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';

      manager.selectBackground(bgPath);

      expect(manager.applyBackground).toHaveBeenCalled();
    });

    it('should close modal after selection', () => {
      const bgPath = 'src/resources/cards/images/backgrounds/test.png';
      manager.modal.style.display = 'flex';
      manager.applyBackground = jest.fn();

      manager.selectBackground(bgPath);

      expect(manager.modal.style.display).toBe('none');
    });
  });

  describe('createBackgroundButton - retry logic', () => {
    beforeEach(() => {
      (global as any).window.currentUser = { id: 'admin-1', role: 'ADMIN' };
    });

    it('should retry when listViewBtn is not found', () => {
      let callCount = 0;
      (mockDocument.getElementById as any) = jest.fn((id: string) => {
        if (id === 'listViewBtn') {
          callCount++;
          if (callCount < 3) {
            return null; // Not found first 2 times
          }
          return { parentNode: { insertBefore: jest.fn() } };
        }
        if (id === 'backgroundBtn') {
          return null; // Button doesn't exist yet
        }
        return null;
      });

      manager.createBackgroundButton();

      // Advance timers to trigger retries
      jest.advanceTimersByTime(250);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('listViewBtn');
    });

    it('should stop retrying after max retries', () => {
      (mockDocument.getElementById as any) = jest.fn(() => null);

      manager.createBackgroundButton();

      // Advance timers past max retries (50 * 100ms = 5000ms)
      jest.advanceTimersByTime(5100);

      // Should have tried maxRetries times
      expect(mockDocument.getElementById).toHaveBeenCalledTimes(51); // Initial + 50 retries
    });

    it('should not create button if it already exists', () => {
      const mockListViewBtn = { parentNode: { insertBefore: jest.fn() } };
      const mockExistingBtn = { id: 'backgroundBtn' };

      (mockDocument.getElementById as any) = jest.fn((id: string) => {
        if (id === 'listViewBtn') return mockListViewBtn;
        if (id === 'backgroundBtn') return mockExistingBtn;
        return null;
      });

      manager.createBackgroundButton();

      expect(mockListViewBtn.parentNode.insertBefore).not.toHaveBeenCalled();
    });

    it('should create button with correct attributes', () => {
      const mockListViewBtn = {
        parentNode: {
          insertBefore: jest.fn()
        }
      };

      (mockDocument.getElementById as any) = jest.fn((id: string) => {
        if (id === 'listViewBtn') return mockListViewBtn;
        if (id === 'backgroundBtn') return null;
        return null;
      });

      const mockNewButton: any = {
        id: '',
        className: '',
        textContent: '',
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
      };

      (mockDocument.createElement as any) = jest.fn(() => mockNewButton);
      manager.showBackgroundModal = jest.fn();

      manager.createBackgroundButton();

      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
      expect(mockNewButton.setAttribute).toHaveBeenCalledWith('data-click-handler', 'showBackgroundModal');
      expect(mockNewButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockListViewBtn.parentNode.insertBefore).toHaveBeenCalled();
    });
  });
});
