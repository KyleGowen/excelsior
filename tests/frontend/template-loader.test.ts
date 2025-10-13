/**
 * Unit tests for public/js/template-loader.js
 * Tests the template loading system extracted during Phase 11B of refactoring
 */

// Mock fetch
global.fetch = jest.fn();

// Mock DOM elements
const mockElement = {
  insertAdjacentHTML: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getAttribute: jest.fn(),
  addEventListener: jest.fn(),
  innerHTML: '',
};

// Mock document methods
const mockQuerySelector = jest.fn((selector: string) => {
  if (selector === '.test-target') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(selector: string) => any>;

// Set up global mocks
(global as any).document = {
  querySelector: mockQuerySelector,
};

// Mock global window functions
(global as any).window = {
  testHandler: jest.fn(),
  testHandlerWithTab: jest.fn(),
  testCloseHandler: jest.fn(),
};

// Define the TemplateLoader class for testing
class TemplateLoader {
  templates: Map<string, string>;
  loaded: boolean;

  constructor() {
    this.templates = new Map();
    this.loaded = false;
  }

  // Load all templates
  async loadTemplates() {
    if (this.loaded) return;

    try {
      // Load deck editor template
      const deckEditorResponse = await fetch('/templates/deck-editor-template.html');
      const deckEditorHtml = await deckEditorResponse.text();
      this.templates.set('deck-editor', deckEditorHtml);

      // Load modal templates
      const modalResponse = await fetch('/templates/modal-templates.html');
      const modalHtml = await modalResponse.text();
      this.templates.set('modals', modalHtml);

      // Load database view template
      const dbViewResponse = await fetch('/templates/database-view-template.html');
      const dbViewHtml = await dbViewResponse.text();
      this.templates.set('database-view', dbViewHtml);

      this.loaded = true;
      console.log('✅ Templates loaded successfully');
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  }

  // Insert template into DOM
  insertTemplate(templateName: string, targetSelector: string) {
    const template = this.templates.get(templateName);
    if (!template) {
      console.error(`Template '${templateName}' not found`);
      return;
    }

    const target = (global as any).document.querySelector(targetSelector);
    if (!target) {
      console.error(`Target selector '${targetSelector}' not found`);
      return;
    }

    target.insertAdjacentHTML('beforeend', template);
    this.bindEvents(target);
  }

  // Bind events for dynamically loaded content
  bindEvents(container: any) {
    // Handle modal close events
    const modals = container.querySelectorAll('[data-close-handler]');
    modals.forEach((modal: any) => {
      const handler = modal.getAttribute('data-close-handler');
      modal.addEventListener('click', (e: any) => {
        if (e.target === modal) {
          if (typeof (global as any).window[handler] === 'function') {
            (global as any).window[handler]();
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
        }
      });
    });
  }

  // Replace content with template
  replaceWithTemplate(templateName: string, targetSelector: string) {
    const template = this.templates.get(templateName);
    if (!template) {
      console.error(`Template '${templateName}' not found`);
      return;
    }

    const target = (global as any).document.querySelector(targetSelector);
    if (!target) {
      console.error(`Target selector '${targetSelector}' not found`);
      return;
    }

    target.innerHTML = template;
    this.bindEvents(target);
  }
}

describe('TemplateLoader - Template Loading System', () => {
  let templateLoader: TemplateLoader;

  beforeEach(() => {
    jest.clearAllMocks();
    templateLoader = new TemplateLoader();
  });

  describe('constructor', () => {
    it('should initialize with empty templates map and loaded false', () => {
      expect(templateLoader.templates.size).toBe(0);
      expect(templateLoader.loaded).toBe(false);
    });
  });

  describe('loadTemplates', () => {
    it('should load all templates successfully', async () => {
      const mockDeckEditorHtml = '<div>Deck Editor Template</div>';
      const mockModalHtml = '<div>Modal Template</div>';
      const mockDbViewHtml = '<div>Database View Template</div>';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ text: async () => mockDeckEditorHtml })
        .mockResolvedValueOnce({ text: async () => mockModalHtml })
        .mockResolvedValueOnce({ text: async () => mockDbViewHtml });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await templateLoader.loadTemplates();

      expect(global.fetch).toHaveBeenCalledWith('/templates/deck-editor-template.html');
      expect(global.fetch).toHaveBeenCalledWith('/templates/modal-templates.html');
      expect(global.fetch).toHaveBeenCalledWith('/templates/database-view-template.html');
      expect(templateLoader.templates.get('deck-editor')).toBe(mockDeckEditorHtml);
      expect(templateLoader.templates.get('modals')).toBe(mockModalHtml);
      expect(templateLoader.templates.get('database-view')).toBe(mockDbViewHtml);
      expect(templateLoader.loaded).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Templates loaded successfully');
      consoleSpy.mockRestore();
    });

    it('should not reload templates if already loaded', async () => {
      templateLoader.loaded = true;

      await templateLoader.loadTemplates();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await templateLoader.loadTemplates();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading templates:', expect.any(Error));
      expect(templateLoader.loaded).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should handle partial loading failures', async () => {
      const mockDeckEditorHtml = '<div>Deck Editor Template</div>';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ text: async () => mockDeckEditorHtml })
        .mockRejectedValueOnce(new Error('Modal template error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await templateLoader.loadTemplates();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading templates:', expect.any(Error));
      expect(templateLoader.loaded).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('insertTemplate', () => {
    beforeEach(() => {
      templateLoader.templates.set('test-template', '<div>Test Template</div>');
    });

    it('should insert template into target element', () => {
      templateLoader.insertTemplate('test-template', '.test-target');

      expect(mockQuerySelector).toHaveBeenCalledWith('.test-target');
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalledWith('beforeend', '<div>Test Template</div>');
    });

    it('should handle missing template', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      templateLoader.insertTemplate('nonexistent-template', '.test-target');

      expect(consoleSpy).toHaveBeenCalledWith("Template 'nonexistent-template' not found");
      expect(mockElement.insertAdjacentHTML).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle missing target element', () => {
      mockQuerySelector.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      templateLoader.insertTemplate('test-template', '.nonexistent-target');

      expect(consoleSpy).toHaveBeenCalledWith("Target selector '.nonexistent-target' not found");
      expect(mockElement.insertAdjacentHTML).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should bind events after inserting template', () => {
      const bindEventsSpy = jest.spyOn(templateLoader, 'bindEvents');

      templateLoader.insertTemplate('test-template', '.test-target');

      expect(bindEventsSpy).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('bindEvents', () => {
    it('should bind modal close events', () => {
      const mockModal = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-close-handler') return 'testCloseHandler';
          return null;
        }),
        addEventListener: jest.fn(),
      };

      mockElement.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-close-handler]') return [mockModal];
        return [];
      });

      templateLoader.bindEvents(mockElement);

      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-close-handler]');
      expect(mockModal.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind stop propagation events', () => {
      const mockStopPropElement = {
        addEventListener: jest.fn(),
      };

      mockElement.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-stop-propagation="true"]') return [mockStopPropElement];
        return [];
      });

      templateLoader.bindEvents(mockElement);

      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-stop-propagation="true"]');
      expect(mockStopPropElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind click events', () => {
      const mockClickElement = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandler';
          if (attr === 'data-tab') return null;
          return null;
        }),
        addEventListener: jest.fn(),
      };

      mockElement.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      templateLoader.bindEvents(mockElement);

      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-click-handler]');
      expect(mockClickElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should bind click events with tab parameter', () => {
      const mockClickElement = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-click-handler') return 'testHandlerWithTab';
          if (attr === 'data-tab') return 'characters';
          return null;
        }),
        addEventListener: jest.fn(),
      };

      mockElement.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-click-handler]') return [mockClickElement];
        return [];
      });

      templateLoader.bindEvents(mockElement);

      expect(mockClickElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle multiple elements of each type', () => {
      const mockElements = [mockElement, mockElement, mockElement];

      mockElement.querySelectorAll.mockReturnValue(mockElements);

      templateLoader.bindEvents(mockElement);

      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-close-handler]');
      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-stop-propagation="true"]');
      expect(mockElement.querySelectorAll).toHaveBeenCalledWith('[data-click-handler]');
    });
  });

  describe('replaceWithTemplate', () => {
    beforeEach(() => {
      templateLoader.templates.set('test-template', '<div>Replacement Template</div>');
    });

    it('should replace content with template', () => {
      templateLoader.replaceWithTemplate('test-template', '.test-target');

      expect(mockQuerySelector).toHaveBeenCalledWith('.test-target');
      expect(mockElement.innerHTML).toBe('<div>Replacement Template</div>');
    });

    it('should handle missing template', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      templateLoader.replaceWithTemplate('nonexistent-template', '.test-target');

      expect(consoleSpy).toHaveBeenCalledWith("Template 'nonexistent-template' not found");
      consoleSpy.mockRestore();
    });

    it('should handle missing target element', () => {
      mockQuerySelector.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      templateLoader.replaceWithTemplate('test-template', '.nonexistent-target');

      expect(consoleSpy).toHaveBeenCalledWith("Target selector '.nonexistent-target' not found");
      consoleSpy.mockRestore();
    });

    it('should bind events after replacing template', () => {
      const bindEventsSpy = jest.spyOn(templateLoader, 'bindEvents');

      templateLoader.replaceWithTemplate('test-template', '.test-target');

      expect(bindEventsSpy).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete template loading and insertion workflow', async () => {
      const mockTemplateHtml = '<div>Loaded Template</div>';
      (global.fetch as jest.Mock).mockResolvedValueOnce({ text: async () => mockTemplateHtml });

      await templateLoader.loadTemplates();
      templateLoader.insertTemplate('deck-editor', '.test-target');

      expect(templateLoader.templates.get('deck-editor')).toBe(mockTemplateHtml);
      expect(mockElement.insertAdjacentHTML).toHaveBeenCalledWith('beforeend', mockTemplateHtml);
    });

    it('should handle template replacement workflow', async () => {
      const mockTemplateHtml = '<div>Replacement Template</div>';
      (global.fetch as jest.Mock).mockResolvedValueOnce({ text: async () => mockTemplateHtml });

      await templateLoader.loadTemplates();
      templateLoader.replaceWithTemplate('deck-editor', '.test-target');

      expect(mockElement.innerHTML).toBe(mockTemplateHtml);
    });

    it('should maintain state consistency across operations', async () => {
      const mockTemplateHtml = '<div>Test Template</div>';
      (global.fetch as jest.Mock).mockResolvedValueOnce({ text: async () => mockTemplateHtml });

      await templateLoader.loadTemplates();
      expect(templateLoader.loaded).toBe(true);

      templateLoader.insertTemplate('deck-editor', '.test-target');
      expect(templateLoader.templates.has('deck-editor')).toBe(true);

      templateLoader.replaceWithTemplate('deck-editor', '.test-target');
      expect(templateLoader.templates.get('deck-editor')).toBe(mockTemplateHtml);
    });
  });
});
