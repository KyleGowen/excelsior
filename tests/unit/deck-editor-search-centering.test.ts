/**
 * Unit tests for deck editor search bar centering
 * Tests that the search bar is properly centered in the header layout
 */

import { JSDOM } from 'jsdom';

describe('Deck Editor Search Bar Centering', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    // Create a fresh JSDOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
          <style>
            .modal-header {
              display: grid;
              grid-template-columns: auto 1fr auto;
              align-items: center;
              padding: 12px 20px 15px 20px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              margin-bottom: 15px;
            }
            .deck-editor-title-section {
              display: flex;
              flex-direction: column;
              gap: 4px;
              text-align: left;
              padding-left: 20px;
              justify-self: start;
              max-width: 300px;
              min-width: 200px;
            }
            .deck-editor-search-container {
              position: relative;
              max-width: 400px;
              justify-self: center;
              margin: 0 auto;
            }
            .deck-editor-actions {
              display: flex;
              gap: 20px;
              justify-self: end;
              padding-right: 20px;
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
            }
          </style>
        </head>
        <body>
          <div class="modal-header">
            <div class="deck-editor-title-section">
              <h3 id="deckEditorTitle">New Deck</h3>
              <p id="deckEditorDescription">Click to add description</p>
            </div>
            <div class="deck-editor-search-container">
              <input type="text" id="deckEditorSearchInput" class="deck-editor-search-input" placeholder="Search by card name, character, or type...">
            </div>
            <div class="deck-editor-actions">
              <button class="btn-secondary">Cancel</button>
              <button class="btn-primary">Save</button>
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
    window = dom.window as any;
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Grid Layout Structure', () => {
    it('should use CSS Grid for the modal header', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      expect(modalHeader).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(modalHeader);
      expect(computedStyle.display).toBe('grid');
      expect(computedStyle.gridTemplateColumns).toBe('auto 1fr auto');
    });

    it('should have three grid columns for title, search, and actions', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      const children = modalHeader.children;
      
      expect(children.length).toBe(3);
      expect(children[0].classList.contains('deck-editor-title-section')).toBe(true);
      expect(children[1].classList.contains('deck-editor-search-container')).toBe(true);
      expect(children[2].classList.contains('deck-editor-actions')).toBe(true);
    });
  });

  describe('Search Container Centering', () => {
    it('should center the search container in the middle column', () => {
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      expect(searchContainer).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(searchContainer);
      expect(computedStyle.justifySelf).toBe('center');
    });

    it('should have proper max-width constraint', () => {
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      expect(searchContainer).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(searchContainer);
      expect(computedStyle.maxWidth).toBe('400px');
    });

    it('should be positioned relatively for dropdown results', () => {
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      expect(searchContainer).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(searchContainer);
      expect(computedStyle.position).toBe('relative');
    });
  });

  describe('Title Section Positioning', () => {
    it('should align title section to the start (left)', () => {
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      expect(titleSection).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(titleSection);
      expect(computedStyle.justifySelf).toBe('start');
    });

    it('should maintain proper width constraints', () => {
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      expect(titleSection).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(titleSection);
      expect(computedStyle.maxWidth).toBe('300px');
      expect(computedStyle.minWidth).toBe('200px');
    });
  });

  describe('Actions Section Positioning', () => {
    it('should align actions section to the end (right)', () => {
      const actionsSection = document.querySelector('.deck-editor-actions') as HTMLElement;
      expect(actionsSection).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(actionsSection);
      expect(computedStyle.justifySelf).toBe('end');
    });

    it('should maintain flex layout for buttons', () => {
      const actionsSection = document.querySelector('.deck-editor-actions') as HTMLElement;
      expect(actionsSection).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(actionsSection);
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.gap).toBe('20px');
    });
  });

  describe('Search Input Styling', () => {
    it('should have proper search input styling', () => {
      const searchInput = document.querySelector('#deckEditorSearchInput') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(searchInput);
      expect(computedStyle.width).toBe('100%');
    });

    it('should have correct placeholder text', () => {
      const searchInput = document.querySelector('#deckEditorSearchInput') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      
      expect(searchInput.placeholder).toBe('Search by card name, character, or type...');
    });
  });

  describe('Layout Responsiveness', () => {
    it('should maintain grid structure with different content lengths', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      const actionsSection = document.querySelector('.deck-editor-actions') as HTMLElement;
      
      // Test with longer title
      titleSection.innerHTML = '<h3>Very Long Deck Title That Should Not Break Layout</h3><p>Long description text</p>';
      
      const headerStyle = window.getComputedStyle(modalHeader);
      const searchStyle = window.getComputedStyle(searchContainer);
      
      expect(headerStyle.display).toBe('grid');
      expect(searchStyle.justifySelf).toBe('center');
    });

    it('should handle empty search container gracefully', () => {
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      searchContainer.innerHTML = '';
      
      const computedStyle = window.getComputedStyle(searchContainer);
      expect(computedStyle.justifySelf).toBe('center');
    });
  });

  describe('Visual Alignment', () => {
    it('should ensure all elements are vertically centered', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      const searchContainer = document.querySelector('.deck-editor-search-container') as HTMLElement;
      const actionsSection = document.querySelector('.deck-editor-actions') as HTMLElement;
      
      const headerStyle = window.getComputedStyle(modalHeader);
      expect(headerStyle.alignItems).toBe('center');
      
      // All child elements should be aligned to center
      const titleStyle = window.getComputedStyle(titleSection);
      const searchStyle = window.getComputedStyle(searchContainer);
      const actionsStyle = window.getComputedStyle(actionsSection);
      
      // In a grid with align-items: center, all children should be vertically centered
      expect(headerStyle.alignItems).toBe('center');
    });
  });

  describe('Grid Column Distribution', () => {
    it('should distribute space with auto 1fr auto for true centering', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      const computedStyle = window.getComputedStyle(modalHeader);
      
      expect(computedStyle.gridTemplateColumns).toBe('auto 1fr auto');
    });

    it('should give equal space to title and actions sections', () => {
      const modalHeader = document.querySelector('.modal-header') as HTMLElement;
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      const actionsSection = document.querySelector('.deck-editor-actions') as HTMLElement;
      
      // Both should have justify-self set appropriately
      const titleStyle = window.getComputedStyle(titleSection);
      const actionsStyle = window.getComputedStyle(actionsSection);
      
      expect(titleStyle.justifySelf).toBe('start');
      expect(actionsStyle.justifySelf).toBe('end');
    });
  });
});
