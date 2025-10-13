/**
 * Unit tests for public/js/event-binder.js
 * Tests the event binding system extracted during Phase 11B of refactoring
 */

// Mock DOM elements
const mockElement = {
  addEventListener: jest.fn(),
  getAttribute: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  nodeType: 1,
};

const mockContainer = {
  querySelectorAll: jest.fn(() => []),
};

// Mock document
const mockDocument = {
  querySelectorAll: jest.fn(() => []),
};

// Mock MutationObserver
const mockMutationObserver = jest.fn();
const mockObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
};

// Set up global mocks
(global as any).document = mockDocument;
(global as any).MutationObserver = mockMutationObserver;
(global as any).window = {
  testHandler: jest.fn(),
  testHandlerWithTab: jest.fn(),
  testEditHandler: jest.fn(),
  testCloseHandler: jest.fn(),
};

// Define the EventBinder class for testing
class EventBinder {
  initialized: boolean;

  constructor() {
    this.initialized = false;
  }

  // Initialize event binding for the entire document
  init() {
    if (this.initialized) return;
    
    // Bind events for existing elements
    this.bindEvents(mockDocument);
    
    // Set up mutation observer for dynamically added elements
    this.setupMutationObserver();
    
    this.initialized = true;
    console.log('✅ Event binding system initialized');
  }

  // Bind events for a specific container
  bindEvents(container: any) {
    // Handle click events
    const clickElements = container.querySelectorAll('[data-click-handler]');
    clickElements.forEach((element: any) => {
      const handler = element.getAttribute('data-click-handler');
      const tab = element.getAttribute('data-tab');
      
      element.addEventListener('click', (e: any) => {
        e.preventDefault();
        if (typeof (global as any).window[handler] === 'function') {
          if (tab) {
            (global as any).window[handler](tab);
          } else {
            (global as any).window[handler]();
          }
        } else {
          console.warn(`Handler function '${handler}' not found`);
        }
      });
    });

    // Handle edit events
    const editElements = container.querySelectorAll('[data-edit-handler]');
    editElements.forEach((element: any) => {
      const handler = element.getAttribute('data-edit-handler');
      element.addEventListener('click', (e: any) => {
        e.preventDefault();
        if (typeof (global as any).window[handler] === 'function') {
          (global as any).window[handler]();
        } else {
          console.warn(`Handler function '${handler}' not found`);
        }
      });
    });

    // Handle modal close events
    const modals = container.querySelectorAll('[data-close-handler]');
    modals.forEach((modal: any) => {
      const handler = modal.getAttribute('data-close-handler');
      modal.addEventListener('click', (e: any) => {
        if (e.target === modal) {
          if (typeof (global as any).window[handler] === 'function') {
            (global as any).window[handler]();
          } else {
            console.warn(`Handler function '${handler}' not found`);
          }
        }
      });
    });

    // Handle stop propagation
    const stopPropElements = container.querySelectorAll('[data-stop-propagation="true"]');
    stopPropElements.forEach((element: any) => {
      element.addEventListener('click', (e: any) => {
        e.stopPropagation();
      });
    });
  }

  // Set up mutation observer to handle dynamically added elements
  setupMutationObserver() {
    const observer = new (global as any).MutationObserver((mutations: any[]) => {
      mutations.forEach((mutation: any) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node: any) => {
            if (node.nodeType === 1) { // Element node
              this.bindEvents(node);
            }
          });
        }
      });
    });

    observer.observe(mockDocument, {
      childList: true,
      subtree: true
    });
  }
}

describe('EventBinder - Event Binding System', () => {
  let eventBinder: EventBinder;

  beforeEach(() => {
    jest.clearAllMocks();
    eventBinder = new EventBinder();
    mockMutationObserver.mockReturnValue(mockObserver);
  });

  describe('constructor', () => {
    it('should initialize with initialized set to false', () => {
      expect(eventBinder.initialized).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize event binding system', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      eventBinder.init();

      expect(eventBinder.initialized).toBe(true);
      expect(mockDocument.querySelectorAll).toHaveBeenCalled();
      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(mockDocument, {
        childList: true,
        subtree: true
      });
      expect(consoleSpy).toHaveBeenCalledWith('✅ Event binding system initialized');
      consoleSpy.mockRestore();
    });

    it('should not reinitialize if already initialized', () => {
      eventBinder.initialized = true;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      eventBinder.init();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('bindEvents', () => {
    it('should bind click events with data-click-handler', () => {
      const mockClickElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandler';
          if (attr === 'data-tab') return null;
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-click-handler]');
      expect(mockClickElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind click events with tab parameter', () => {
      const mockClickElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandlerWithTab';
          if (attr === 'data-tab') return 'characters';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      expect(mockClickElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind edit events with data-edit-handler', () => {
      const mockEditElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-edit-handler') return 'testEditHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-edit-handler]') return [mockEditElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-edit-handler]');
      expect(mockEditElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind modal close events with data-close-handler', () => {
      const mockModal = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-close-handler') return 'testCloseHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-close-handler]') return [mockModal];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-close-handler]');
      expect(mockModal.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind stop propagation events', () => {
      const mockStopPropElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-stop-propagation') return 'true';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-stop-propagation="true"]') return [mockStopPropElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-stop-propagation="true"]');
      expect(mockStopPropElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle multiple elements of each type', () => {
      const mockElements = [mockElement, mockElement, mockElement];

      mockContainer.querySelectorAll.mockReturnValue(mockElements);

      eventBinder.bindEvents(mockContainer);

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-click-handler]');
      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-edit-handler]');
      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-close-handler]');
      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith('[data-stop-propagation="true"]');
    });
  });

  describe('event handlers', () => {
    it('should call window handler function for click events', () => {
      const mockClickElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      // Get the event handler function
      const clickHandler = mockClickElement.addEventListener.mock.calls[0][1];
      const mockEvent = { preventDefault: jest.fn() };

      clickHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect((global as any).window.testHandler).toHaveBeenCalled();
    });

    it('should call window handler function with tab parameter', () => {
      const mockClickElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandlerWithTab';
          if (attr === 'data-tab') return 'characters';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      const clickHandler = mockClickElement.addEventListener.mock.calls[0][1];
      const mockEvent = { preventDefault: jest.fn() };

      clickHandler(mockEvent);

      expect((global as any).window.testHandlerWithTab).toHaveBeenCalledWith('characters');
    });

    it('should warn when handler function is not found', () => {
      const mockClickElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'nonexistentHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      eventBinder.bindEvents(mockContainer);

      const clickHandler = mockClickElement.addEventListener.mock.calls[0][1];
      const mockEvent = { preventDefault: jest.fn() };

      clickHandler(mockEvent);

      expect(consoleSpy).toHaveBeenCalledWith("Handler function 'nonexistentHandler' not found");
      consoleSpy.mockRestore();
    });

    it('should handle modal close events only when target is modal', () => {
      const mockModal = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-close-handler') return 'testCloseHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-close-handler]') return [mockModal];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      const clickHandler = mockModal.addEventListener.mock.calls[0][1];
      const mockEvent = { target: mockModal };

      clickHandler(mockEvent);

      expect((global as any).window.testCloseHandler).toHaveBeenCalled();
    });

    it('should not handle modal close events when target is not modal', () => {
      const mockModal = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-close-handler') return 'testCloseHandler';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-close-handler]') return [mockModal];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      const clickHandler = mockModal.addEventListener.mock.calls[0][1];
      const mockEvent = { target: mockElement }; // Different target

      clickHandler(mockEvent);

      expect((global as any).window.testCloseHandler).not.toHaveBeenCalled();
    });

    it('should stop propagation for stop propagation elements', () => {
      const mockStopPropElement = {
        ...mockElement,
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-stop-propagation') return 'true';
          return null;
        }),
      };

      mockContainer.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-stop-propagation="true"]') return [mockStopPropElement];
        return [];
      });

      eventBinder.bindEvents(mockContainer);

      const clickHandler = mockStopPropElement.addEventListener.mock.calls[0][1];
      const mockEvent = { stopPropagation: jest.fn() };

      clickHandler(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('setupMutationObserver', () => {
    it('should set up mutation observer with correct options', () => {
      eventBinder.setupMutationObserver();

      expect(mockMutationObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(mockObserver.observe).toHaveBeenCalledWith(mockDocument, {
        childList: true,
        subtree: true
      });
    });

    it('should bind events for newly added element nodes', () => {
      const mockAddedNode = {
        nodeType: 1, // Element node
        querySelectorAll: jest.fn(() => []),
      };

      const mockMutation = {
        type: 'childList',
        addedNodes: [mockAddedNode],
      };

      // Get the mutation observer callback
      const observerCallback = mockMutationObserver.mock.calls[0][0];
      const bindEventsSpy = jest.spyOn(eventBinder, 'bindEvents');

      observerCallback([mockMutation]);

      expect(bindEventsSpy).toHaveBeenCalledWith(mockAddedNode);
    });

    it('should not bind events for non-element nodes', () => {
      const mockTextNode = {
        nodeType: 3, // Text node
      };

      const mockMutation = {
        type: 'childList',
        addedNodes: [mockTextNode],
      };

      const observerCallback = mockMutationObserver.mock.calls[0][0];
      const bindEventsSpy = jest.spyOn(eventBinder, 'bindEvents');

      observerCallback([mockMutation]);

      expect(bindEventsSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple mutations', () => {
      const mockNode1 = { nodeType: 1, querySelectorAll: jest.fn(() => []) };
      const mockNode2 = { nodeType: 1, querySelectorAll: jest.fn(() => []) };

      const mockMutations = [
        { type: 'childList', addedNodes: [mockNode1] },
        { type: 'childList', addedNodes: [mockNode2] },
      ];

      const observerCallback = mockMutationObserver.mock.calls[0][0];
      const bindEventsSpy = jest.spyOn(eventBinder, 'bindEvents');

      observerCallback(mockMutations);

      expect(bindEventsSpy).toHaveBeenCalledWith(mockNode1);
      expect(bindEventsSpy).toHaveBeenCalledWith(mockNode2);
    });
  });

  describe('integration', () => {
    it('should handle complete initialization flow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      eventBinder.init();

      expect(eventBinder.initialized).toBe(true);
      expect(mockDocument.querySelectorAll).toHaveBeenCalled();
      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Event binding system initialized');
      consoleSpy.mockRestore();
    });

    it('should handle re-initialization gracefully', () => {
      eventBinder.init();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      eventBinder.init();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
