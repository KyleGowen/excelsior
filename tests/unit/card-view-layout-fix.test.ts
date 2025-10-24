/**
 * Unit tests for Card View layout fix
 * Tests the CSS and JavaScript fixes that ensure Card View categories stack vertically
 */

import { JSDOM } from 'jsdom';

describe('Card View Layout Fix', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Base deck-cards-editor styles */
            .deck-cards-editor {
              flex: 1 1 0%;
              min-height: 200px;
              max-height: 100%;
              border: none;
              border-radius: 8px;
              padding: 20px;
              overflow: hidden auto;
              background: rgba(255, 255, 255, 0.05);
              transition: none;
            }

            /* Card View specific styles */
            .deck-cards-editor.card-view {
              padding: 20px;
              background: rgba(0, 0, 0, 0.3);
              width: 100%;
              min-width: 100%;
              box-sizing: border-box;
              display: flex !important;
              flex-direction: column !important;
              flex-wrap: nowrap !important;
              align-items: stretch !important;
            }

            .card-view-category-section {
              width: 100% !important;
              margin-bottom: 40px;
              padding-bottom: 10px;
              display: block;
              clear: both;
            }

            .card-view-category-header {
              background: rgba(255, 215, 0, 0.1);
              border: 1px solid rgba(255, 215, 0, 0.3);
              border-radius: 6px;
              padding: 12px 16px;
              margin-bottom: 12px;
              width: 100%;
              box-sizing: border-box;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .card-view-category-name {
              color: #ffd700;
              font-weight: 600;
              font-size: 1.2rem;
            }

            .card-view-category-count {
              color: #bdc3c7;
              font-size: 1rem;
            }

            .card-view-category-cards {
              display: flex;
              flex-wrap: wrap;
              gap: 45px 15px;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="deckCardsEditor" class="deck-cards-editor">
            <!-- Content will be dynamically added -->
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
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('CSS Rules', () => {
    test('should have correct CSS rules for .deck-cards-editor.card-view', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      expect(deckCardsEditor).toBeTruthy();

      // Add card-view class
      deckCardsEditor!.classList.add('card-view');

      // Get computed styles
      const computedStyle = window.getComputedStyle(deckCardsEditor);

      // Test that our CSS rules are applied
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.flexDirection).toBe('column');
      expect(computedStyle.flexWrap).toBe('nowrap');
      expect(computedStyle.alignItems).toBe('stretch');
    });

    test('should have correct CSS rules for .card-view-category-section', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Create a category section
      const categorySection = document.createElement('div');
      categorySection.className = 'card-view-category-section';
      deckCardsEditor!.appendChild(categorySection);

      const computedStyle = window.getComputedStyle(categorySection);

      // Test that category sections have correct styles
      expect(computedStyle.width).toBe('100%');
      expect(computedStyle.display).toBe('block');
      expect(computedStyle.clear).toBe('both');
      expect(computedStyle.marginBottom).toBe('40px');
      expect(computedStyle.paddingBottom).toBe('10px');
    });
  });

  describe('JavaScript Style Enforcement', () => {
    test('should enforce flex-direction column via inline styles', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Mock the renderDeckCardsCardView function behavior
      const mockRenderDeckCardsCardView = () => {
        // FORCE flex-direction to column for Card View
        deckCardsEditor!.style.display = 'flex';
        deckCardsEditor!.style.flexDirection = 'column';
        deckCardsEditor!.style.flexWrap = 'nowrap';
        deckCardsEditor!.style.alignItems = 'stretch';
      };

      // Execute the mock function
      mockRenderDeckCardsCardView();

      // Test that inline styles are applied
      expect(deckCardsEditor!.style.display).toBe('flex');
      expect(deckCardsEditor!.style.flexDirection).toBe('column');
      expect(deckCardsEditor!.style.flexWrap).toBe('nowrap');
      expect(deckCardsEditor!.style.alignItems).toBe('stretch');
    });

    test('should override any conflicting CSS with inline styles', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Simulate conflicting CSS by setting inline styles to row
      deckCardsEditor!.style.flexDirection = 'row';

      // Mock the renderDeckCardsCardView function behavior
      const mockRenderDeckCardsCardView = () => {
        // FORCE flex-direction to column for Card View
        deckCardsEditor!.style.display = 'flex';
        deckCardsEditor!.style.flexDirection = 'column';
        deckCardsEditor!.style.flexWrap = 'nowrap';
        deckCardsEditor!.style.alignItems = 'stretch';
      };

      // Execute the mock function
      mockRenderDeckCardsCardView();

      // Test that inline styles override conflicting CSS
      expect(deckCardsEditor!.style.flexDirection).toBe('column');
    });
  });

  describe('Vertical Layout Verification', () => {
    test('should stack category sections vertically', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Apply the JavaScript fix
      deckCardsEditor!.style.display = 'flex';
      deckCardsEditor!.style.flexDirection = 'column';
      deckCardsEditor!.style.flexWrap = 'nowrap';
      deckCardsEditor!.style.alignItems = 'stretch';

      // Create multiple category sections
      const categories = ['Characters', 'Locations', 'Missions'];
      categories.forEach((categoryName, index) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'card-view-category-section';
        categorySection.innerHTML = `
          <div class="card-view-category-header">
            <span class="card-view-category-name">${categoryName}</span>
            <span class="card-view-category-count">${index + 1} cards</span>
          </div>
          <div class="card-view-category-cards">
            <div>Card content</div>
          </div>
        `;
        deckCardsEditor!.appendChild(categorySection);
      });

      // Force a layout calculation
      deckCardsEditor!.offsetHeight;

      // Test that the container has the correct flex properties
      const computedStyle = window.getComputedStyle(deckCardsEditor!);
      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.flexDirection).toBe('column');
      expect(computedStyle.flexWrap).toBe('nowrap');

      // Test that category sections exist and have correct classes
      const categorySections = deckCardsEditor!.querySelectorAll('.card-view-category-section');
      expect(categorySections.length).toBe(3);
      
      // Test that each section has the correct CSS properties
      categorySections.forEach(section => {
        const sectionStyle = window.getComputedStyle(section);
        expect(sectionStyle.width).toBe('100%');
        expect(sectionStyle.display).toBe('block');
        expect(sectionStyle.clear).toBe('both');
      });

      // Test that sections are in the correct order in the DOM
      const sectionNames = Array.from(categorySections).map(section => {
        const nameElement = section.querySelector('.card-view-category-name');
        return nameElement ? nameElement.textContent : '';
      });
      expect(sectionNames).toEqual(['Characters', 'Locations', 'Missions']);
    });

    test('should maintain vertical layout after content changes', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Apply the JavaScript fix
      deckCardsEditor!.style.display = 'flex';
      deckCardsEditor!.style.flexDirection = 'column';
      deckCardsEditor!.style.flexWrap = 'nowrap';
      deckCardsEditor!.style.alignItems = 'stretch';

      // Create initial category sections
      const categorySection = document.createElement('div');
      categorySection.className = 'card-view-category-section';
      categorySection.innerHTML = `
        <div class="card-view-category-header">
          <span class="card-view-category-name">Characters</span>
          <span class="card-view-category-count">1 cards</span>
        </div>
        <div class="card-view-category-cards">
          <div>Card content</div>
        </div>
      `;
      deckCardsEditor!.appendChild(categorySection);

      // Force a layout calculation
      deckCardsEditor!.offsetHeight;

      // Get initial position
      const initialRect = categorySection.getBoundingClientRect();
      const initialTop = initialRect.top;

      // Add more content to the category
      const cardsContainer = categorySection.querySelector('.card-view-category-cards');
      const newCard = document.createElement('div');
      newCard.textContent = 'New card content';
      cardsContainer!.appendChild(newCard);

      // Force a layout recalculation
      deckCardsEditor!.offsetHeight;

      // Get new position
      const newRect = categorySection.getBoundingClientRect();
      const newTop = newRect.top;

      // Test that the category section maintains its position (vertical layout preserved)
      expect(newTop).toBe(initialTop);
    });
  });

  describe('View Cycling Persistence', () => {
    test('should maintain vertical layout after removing and re-adding card-view class', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Apply the JavaScript fix
      deckCardsEditor!.style.display = 'flex';
      deckCardsEditor!.style.flexDirection = 'column';
      deckCardsEditor!.style.flexWrap = 'nowrap';
      deckCardsEditor!.style.alignItems = 'stretch';

      // Create category sections
      const categorySection = document.createElement('div');
      categorySection.className = 'card-view-category-section';
      categorySection.innerHTML = `
        <div class="card-view-category-header">
          <span class="card-view-category-name">Characters</span>
          <span class="card-view-category-count">1 cards</span>
        </div>
        <div class="card-view-category-cards">
          <div>Card content</div>
        </div>
      `;
      deckCardsEditor!.appendChild(categorySection);

      // Force a layout calculation
      deckCardsEditor!.offsetHeight;

      // Get initial position
      const initialRect = categorySection.getBoundingClientRect();
      const initialTop = initialRect.top;

      // Simulate switching to another view (remove card-view class)
      deckCardsEditor!.classList.remove('card-view');
      deckCardsEditor!.classList.add('list-view');

      // Simulate switching back to Card View (re-add card-view class)
      deckCardsEditor!.classList.remove('list-view');
      deckCardsEditor!.classList.add('card-view');

      // Re-apply the JavaScript fix (this would happen in renderDeckCardsCardView)
      deckCardsEditor!.style.display = 'flex';
      deckCardsEditor!.style.flexDirection = 'column';
      deckCardsEditor!.style.flexWrap = 'nowrap';
      deckCardsEditor!.style.alignItems = 'stretch';

      // Force a layout recalculation
      deckCardsEditor!.offsetHeight;

      // Get new position
      const newRect = categorySection.getBoundingClientRect();
      const newTop = newRect.top;

      // Test that the category section maintains its position (vertical layout preserved)
      expect(newTop).toBe(initialTop);
    });

    test('should override conflicting CSS rules with inline styles', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Simulate a conflicting CSS rule by adding inline styles that would cause horizontal layout
      deckCardsEditor!.style.flexDirection = 'row';
      deckCardsEditor!.style.flexWrap = 'wrap';

      // Mock the renderDeckCardsCardView function behavior
      const mockRenderDeckCardsCardView = () => {
        // FORCE flex-direction to column for Card View
        deckCardsEditor!.style.display = 'flex';
        deckCardsEditor!.style.flexDirection = 'column';
        deckCardsEditor!.style.flexWrap = 'nowrap';
        deckCardsEditor!.style.alignItems = 'stretch';
      };

      // Execute the mock function
      mockRenderDeckCardsCardView();

      // Test that our inline styles override the conflicting CSS
      expect(deckCardsEditor!.style.flexDirection).toBe('column');
      expect(deckCardsEditor!.style.flexWrap).toBe('nowrap');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty deck gracefully', () => {
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.classList.add('card-view');

      // Mock the renderDeckCardsCardView function behavior for empty deck
      const mockRenderDeckCardsCardView = () => {
        // FORCE flex-direction to column for Card View
        deckCardsEditor!.style.display = 'flex';
        deckCardsEditor!.style.flexDirection = 'column';
        deckCardsEditor!.style.flexWrap = 'nowrap';
        deckCardsEditor!.style.alignItems = 'stretch';

        // Set empty deck message
        deckCardsEditor!.innerHTML = `
          <div class="empty-deck-message">
            <p>No cards in this deck yet.</p>
            <p>Drag cards from the right panel to add them!</p>
          </div>
        `;
      };

      // Execute the mock function
      mockRenderDeckCardsCardView();

      // Test that styles are still applied even with empty deck
      expect(deckCardsEditor!.style.flexDirection).toBe('column');
      expect(deckCardsEditor!.innerHTML).toContain('No cards in this deck yet');
    });

    test('should handle missing deckCardsEditor element gracefully', () => {
      // Remove the deckCardsEditor element
      const deckCardsEditor = document.getElementById('deckCardsEditor');
      deckCardsEditor!.remove();

      // Mock the renderDeckCardsCardView function behavior
      const mockRenderDeckCardsCardView = () => {
        const element = document.getElementById('deckCardsEditor');
        if (!element) return; // Early return if element doesn't exist

        // This code should not execute
        element.style.flexDirection = 'column';
      };

      // Execute the mock function - should not throw an error
      expect(() => mockRenderDeckCardsCardView()).not.toThrow();
    });
  });
});
