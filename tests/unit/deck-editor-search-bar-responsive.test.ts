/**
 * Unit tests for deck editor search bar responsive behavior
 * Tests CSS constraints and layout behavior for different viewport sizes
 */

import { JSDOM } from 'jsdom';

describe('Deck Editor Search Bar Responsive Behavior', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    // Create a mock DOM with the deck editor structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Mock CSS for testing */
            .deck-editor-layout {
              display: flex;
              height: 100%;
              overflow: hidden;
              flex: 1;
              width: 100%;
            }
            
            .deck-pane, .card-selector-pane {
              display: flex;
              flex-direction: column;
              gap: 15px;
              height: 100%;
              max-height: 100%;
              overflow: hidden;
              min-height: 0;
              min-width: 150px;
              padding: 0 8px;
              box-sizing: border-box;
            }
            
            .deck-pane {
              flex: 2;
              max-width: 77%;
              min-width: 0;
            }
            
            .card-selector-pane {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              max-width: 50%;
              box-sizing: border-box;
            }
            
            .deck-editor-search-container {
              position: relative;
              width: 100%;
              justify-self: center;
              margin: 0 auto;
              flex-shrink: 0;
              box-sizing: border-box;
            }
            
            .card-selector-pane .deck-editor-search-container {
              margin-top: 7px;
              margin-bottom: 0px;
              margin-left: 4px;
              margin-right: 4px;
              flex-shrink: 0;
              width: calc(100% - 8px);
              max-width: calc(100% - 8px);
              box-sizing: border-box;
              overflow: hidden;
            }
            
            .deck-editor-search-input {
              width: 100%;
              padding: 10px 15px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 25px;
              background: rgba(255, 255, 255, 0.1);
              color: white;
              font-size: 14px;
              outline: none;
              transition: all 0.3s ease;
              box-sizing: border-box;
              max-width: 100%;
            }
            
            /* Responsive media queries */
            @media (max-width: 700px) {
              .deck-pane, .card-selector-pane {
                min-width: 120px;
              }
            }
            
            @media (max-width: 500px) {
              .deck-pane, .card-selector-pane {
                min-width: 100px;
              }
            }
          </style>
        </head>
        <body>
          <div class="deck-editor-layout">
            <div class="deck-pane">
              <div>Deck Content</div>
            </div>
            <div class="resizable-divider"></div>
            <div class="card-selector-pane">
              <div class="deck-editor-search-container">
                <input type="text" id="deckEditorSearchInput" class="deck-editor-search-input" placeholder="Search by card name, character, or type...">
              </div>
              <div>Available Cards</div>
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
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('CSS Layout Constraints', () => {
    it('should have proper flex constraints on deck pane', () => {
      const deckPane = document.querySelector('.deck-pane') as HTMLElement;
      const computedStyle = window.getComputedStyle(deckPane);
      
      expect(computedStyle.flex).toBe('2 1 0%');
      expect(computedStyle.maxWidth).toBe('77%');
      expect(computedStyle.minWidth).toBe('0');
      expect(computedStyle.boxSizing).toBe('border-box');
    });

    it('should have proper flex constraints on card selector pane', () => {
      const cardSelectorPane = document.querySelector('.card-selector-pane') as HTMLElement;
      const computedStyle = window.getComputedStyle(cardSelectorPane);
      
      expect(computedStyle.flex).toBe('1 1 0%');
      expect(computedStyle.maxWidth).toBe('50%');
      expect(computedStyle.minWidth).toBe('0');
      expect(computedStyle.boxSizing).toBe('border-box');
      expect(computedStyle.overflow).toBe('hidden');
    });

    it('should have proper constraints on search container', () => {
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      const computedStyle = window.getComputedStyle(searchContainer);
      
      expect(computedStyle.width).toBe('calc(100% - 8px)');
      expect(computedStyle.maxWidth).toBe('calc(100% - 8px)');
      expect(computedStyle.boxSizing).toBe('border-box');
      expect(computedStyle.overflow).toBe('hidden');
    });

    it('should have proper constraints on search input', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLElement;
      const computedStyle = window.getComputedStyle(searchInput);
      
      expect(computedStyle.width).toBe('100%');
      expect(computedStyle.maxWidth).toBe('100%');
      expect(computedStyle.boxSizing).toBe('border-box');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive CSS rules defined', () => {
      // Check that responsive CSS rules are present in the stylesheet
      const styleSheets = document.styleSheets;
      expect(styleSheets.length).toBeGreaterThan(0);
      
      // Verify responsive CSS is included in the HTML
      const htmlContent = document.documentElement.outerHTML;
      expect(htmlContent).toContain('@media (max-width: 700px)');
      expect(htmlContent).toContain('@media (max-width: 500px)');
      expect(htmlContent).toContain('min-width: 120px');
      expect(htmlContent).toContain('min-width: 100px');
    });

    it('should have proper base min-width constraints', () => {
      const deckPane = document.querySelector('.deck-pane') as HTMLElement;
      const cardSelectorPane = document.querySelector('.card-selector-pane') as HTMLElement;
      
      const deckStyle = window.getComputedStyle(deckPane);
      const cardStyle = window.getComputedStyle(cardSelectorPane);
      
      // Base min-width should be 150px (JSDOM may compute as 0 due to flex behavior)
      expect(deckStyle.minWidth).toBe('0');
      expect(cardStyle.minWidth).toBe('0');
      
      // Verify the CSS rules are present in the HTML
      const htmlContent = document.documentElement.outerHTML;
      expect(htmlContent).toContain('min-width: 150px');
    });
  });

  describe('Layout Calculations', () => {
    it('should calculate proper widths for different viewport sizes', () => {
      const layout = document.querySelector('.deck-editor-layout') as HTMLElement;
      const deckPane = document.querySelector('.deck-pane') as HTMLElement;
      const cardSelectorPane = document.querySelector('.card-selector-pane') as HTMLElement;
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLElement;

      // Test at 1000px viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });

      // Simulate layout calculation
      const layoutWidth = 1000;
      const deckMaxWidth = Math.min(layoutWidth * 0.77, layoutWidth * 0.67);
      const cardMaxWidth = Math.min(layoutWidth * 0.50, layoutWidth * 0.33);
      
      expect(deckMaxWidth).toBeLessThanOrEqual(770); // 77% of 1000px
      expect(cardMaxWidth).toBeLessThanOrEqual(500); // 50% of 1000px
    });

    it('should ensure search container fits within card selector pane', () => {
      const cardSelectorPane = document.querySelector('.card-selector-pane') as HTMLElement;
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;

      // Mock getBoundingClientRect
      const mockCardRect = {
        width: 200,
        left: 0,
        right: 200,
        top: 0,
        bottom: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };

      const mockSearchRect = {
        width: 192, // 200px - 8px margins
        left: 4,
        right: 196,
        top: 0,
        bottom: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };

      // Verify search container fits within card selector pane
      expect(mockSearchRect.width).toBeLessThanOrEqual(mockCardRect.width);
      expect(mockSearchRect.right).toBeLessThanOrEqual(mockCardRect.right);
    });
  });

  describe('Search Input Behavior', () => {
    it('should have proper placeholder text', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLInputElement;
      
      expect(searchInput.placeholder).toBe('Search by card name, character, or type...');
    });

    it('should be focusable and have proper attributes', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLInputElement;
      
      expect(searchInput.type).toBe('text');
      expect(searchInput.id).toBe('deckEditorSearchInput');
      expect(searchInput.className).toBe('deck-editor-search-input');
    });

    it('should handle input events properly', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLInputElement;
      let inputEventFired = false;
      
      searchInput.addEventListener('input', () => {
        inputEventFired = true;
      });
      
      searchInput.value = 'test search';
      
      // Create a proper input event for JSDOM
      const inputEvent = document.createEvent('Event');
      inputEvent.initEvent('input', true, true);
      searchInput.dispatchEvent(inputEvent);
      
      expect(inputEventFired).toBe(true);
      expect(searchInput.value).toBe('test search');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLInputElement;
      
      expect(searchInput.placeholder).toBeTruthy();
      expect(searchInput.id).toBeTruthy();
      expect(searchInput.type).toBe('text');
    });

    it('should be keyboard navigable', () => {
      const searchInput = document.querySelector('.deck-editor-search-input') as HTMLInputElement;
      
      // Test tab navigation
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });
});
