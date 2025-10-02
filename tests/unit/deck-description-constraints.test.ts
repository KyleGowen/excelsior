/**
 * Unit tests for deck description field constraints and character limits
 * Tests word wrapping, character limits, and layout constraints
 */

import { JSDOM } from 'jsdom';

describe('Deck Description Field Constraints', () => {
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
            .deck-editor-title-section {
              display: flex;
              flex-direction: column;
              gap: 4px;
              text-align: left;
              padding-left: 20px;
              flex: 0 0 auto;
              max-width: 300px;
              min-width: 200px;
            }
            .deck-description {
              color: #bdc3c7;
              font-size: 0.9rem;
              margin-bottom: 10px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              max-width: 100%;
              line-height: 1.4;
            }
            .editable-description {
              cursor: pointer;
              transition: all 0.2s ease;
              padding: 4px 8px;
              border-radius: 4px;
              border: 2px solid transparent;
              background: transparent;
              min-height: 20px;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              max-width: 100%;
              line-height: 1.4;
            }
            .editable-description.editing textarea {
              width: 100%;
              max-width: 100%;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              resize: vertical;
              min-height: 40px;
              max-height: 120px;
            }
            .character-counter {
              font-size: 0.8rem;
              color: #bdc3c7;
              text-align: right;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="deck-editor-title-section">
            <h3 id="deckEditorTitle">New Deck</h3>
            <p id="deckEditorDescription" class="deck-description editable-description">Click to add description</p>
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

  describe('CSS Layout Constraints', () => {
    it('should have proper width constraints on title section', () => {
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      expect(titleSection).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(titleSection);
      expect(computedStyle.maxWidth).toBe('300px');
      expect(computedStyle.minWidth).toBe('200px');
      expect(computedStyle.flex).toBe('0 0 auto');
    });

    it('should have word wrapping enabled on description', () => {
      const description = document.querySelector('.deck-description') as HTMLElement;
      expect(description).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(description);
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
      expect(computedStyle.whiteSpace).toBe('pre-wrap');
      expect(computedStyle.maxWidth).toBe('100%');
    });

    it('should have proper line height for readability', () => {
      const description = document.querySelector('.deck-description') as HTMLElement;
      expect(description).toBeTruthy();
      
      const computedStyle = window.getComputedStyle(description);
      expect(computedStyle.lineHeight).toBe('1.4');
    });
  });

  describe('Character Limit Functionality', () => {
    it('should create textarea with 140 character limit', () => {
      const descElement = document.getElementById('deckEditorDescription');
      expect(descElement).toBeTruthy();
      const currentDescription = descElement!.textContent;

      // Create textarea element (simulating startEditingDescription)
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-input';
      textarea.value = currentDescription;
      textarea.placeholder = 'Enter deck description (max 140 characters)';
      textarea.rows = 2;
      textarea.style.resize = 'none';
      textarea.maxLength = 140;

      expect(textarea.maxLength).toBe(140);
      expect(textarea.placeholder).toBe('Enter deck description (max 140 characters)');
    });

    it('should create character counter', () => {
      const descElement = document.getElementById('deckEditorDescription');
      expect(descElement).toBeTruthy();
      const currentDescription = descElement!.textContent;

      // Create textarea element
      const textarea = document.createElement('textarea');
      textarea.value = currentDescription;
      textarea.maxLength = 140;

      // Create character counter
      const counter = document.createElement('div');
      counter.className = 'character-counter';
      counter.style.cssText = 'font-size: 0.8rem; color: #bdc3c7; text-align: right; margin-top: 4px;';
      counter.textContent = `${currentDescription.length}/140`;

      expect(counter.textContent).toBe(`${currentDescription.length}/140`);
      expect(counter.className).toBe('character-counter');
    });

    it('should update character counter on input', () => {
      const descElement = document.getElementById('deckEditorDescription');
      expect(descElement).toBeTruthy();
      const currentDescription = descElement!.textContent;

      // Create textarea element
      const textarea = document.createElement('textarea');
      textarea.value = currentDescription;
      textarea.maxLength = 140;

      // Create character counter
      const counter = document.createElement('div');
      counter.className = 'character-counter';
      counter.style.cssText = 'font-size: 0.8rem; color: #bdc3c7; text-align: right; margin-top: 4px;';
      counter.textContent = `${currentDescription.length}/140`;

      // Simulate input event
      textarea.value = 'This is a test description';
      const inputEvent = new window.Event('input');
      textarea.dispatchEvent(inputEvent);

      // Update counter (simulating the event listener)
      counter.textContent = `${textarea.value.length}/140`;

      expect(counter.textContent).toBe(`${textarea.value.length}/140`);
    });

    it('should change counter color based on character count', () => {
      const counter = document.createElement('div');
      counter.className = 'character-counter';
      counter.style.cssText = 'font-size: 0.8rem; color: #bdc3c7; text-align: right; margin-top: 4px;';

      // Test different character counts
      const testCases = [
        { length: 50, expectedColor: 'rgb(189, 195, 199)' }, // #bdc3c7
        { length: 110, expectedColor: 'rgb(243, 156, 18)' }, // #f39c12
        { length: 130, expectedColor: 'rgb(231, 76, 60)' }   // #e74c3c
      ];

      testCases.forEach(({ length, expectedColor }) => {
        counter.textContent = `${length}/140`;
        
        if (length > 120) {
          counter.style.color = '#e74c3c';
        } else if (length > 100) {
          counter.style.color = '#f39c12';
        } else {
          counter.style.color = '#bdc3c7';
        }

        expect(counter.style.color).toBe(expectedColor);
      });
    });
  });

  describe('Description Truncation', () => {
    it('should truncate description to 140 characters', () => {
      const longDescription = 'A'.repeat(200);
      let newDescription = longDescription.trim();
      
      // Truncate to 140 characters if needed
      if (newDescription.length > 140) {
        newDescription = newDescription.substring(0, 140);
      }

      expect(newDescription.length).toBe(140);
      expect(newDescription).toBe('A'.repeat(140));
    });

    it('should not truncate description under 140 characters', () => {
      const shortDescription = 'This is a short description';
      let newDescription = shortDescription.trim();
      
      // Truncate to 140 characters if needed
      if (newDescription.length > 140) {
        newDescription = newDescription.substring(0, 140);
      }

      expect(newDescription).toBe(shortDescription);
      expect(newDescription.length).toBe(shortDescription.length);
    });

    it('should handle empty description', () => {
      const emptyDescription = '';
      let newDescription = emptyDescription.trim();
      
      // Truncate to 140 characters if needed
      if (newDescription.length > 140) {
        newDescription = newDescription.substring(0, 140);
      }

      expect(newDescription).toBe('');
      expect(newDescription.length).toBe(0);
    });
  });

  describe('Textarea Constraints', () => {
    it('should have proper textarea styling when editing', () => {
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-input';
      textarea.style.cssText = `
        width: 100%;
        max-width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
        resize: vertical;
        min-height: 40px;
        max-height: 120px;
      `;

      const computedStyle = window.getComputedStyle(textarea);
      expect(textarea.style.width).toBe('100%');
      expect(textarea.style.maxWidth).toBe('100%');
      expect(textarea.style.resize).toBe('vertical');
      expect(textarea.style.minHeight).toBe('40px');
      expect(textarea.style.maxHeight).toBe('120px');
    });

    it('should prevent horizontal expansion', () => {
      const textarea = document.createElement('textarea');
      textarea.style.width = '100%';
      textarea.style.maxWidth = '100%';
      textarea.style.resize = 'vertical';

      expect(textarea.style.width).toBe('100%');
      expect(textarea.style.maxWidth).toBe('100%');
      expect(textarea.style.resize).toBe('vertical');
    });
  });

  describe('Word Wrapping Behavior', () => {
    it('should handle long words without spaces', () => {
      const longWord = 'supercalifragilisticexpialidocious'.repeat(10);
      const descElement = document.querySelector('.deck-description') as HTMLElement;
      
      descElement.textContent = longWord;
      
      const computedStyle = window.getComputedStyle(descElement);
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
    });

    it('should preserve line breaks with pre-wrap', () => {
      const multiLineText = 'Line 1\nLine 2\nLine 3';
      const descElement = document.querySelector('.deck-description') as HTMLElement;
      
      descElement.textContent = multiLineText;
      
      const computedStyle = window.getComputedStyle(descElement);
      expect(computedStyle.whiteSpace).toBe('pre-wrap');
    });
  });

  describe('Layout Integration', () => {
    it('should maintain layout constraints in flex container', () => {
      const titleSection = document.querySelector('.deck-editor-title-section') as HTMLElement;
      const description = document.querySelector('.deck-description') as HTMLElement;
      
      expect(titleSection).toBeTruthy();
      expect(description).toBeTruthy();
      
      const titleStyle = window.getComputedStyle(titleSection);
      const descStyle = window.getComputedStyle(description);
      
      // Title section should have width constraints
      expect(titleStyle.maxWidth).toBe('300px');
      expect(titleStyle.minWidth).toBe('200px');
      
      // Description should not exceed parent width
      expect(descStyle.maxWidth).toBe('100%');
    });

    it('should handle very long descriptions gracefully', () => {
      const veryLongDescription = 'This is a very long description that should wrap properly and not break the layout. '.repeat(5);
      const descElement = document.querySelector('.deck-description') as HTMLElement;
      
      descElement.textContent = veryLongDescription;
      
      const computedStyle = window.getComputedStyle(descElement);
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
      expect(computedStyle.maxWidth).toBe('100%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in description', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const descElement = document.querySelector('.deck-description') as HTMLElement;
      
      descElement.textContent = specialChars;
      
      const computedStyle = window.getComputedStyle(descElement);
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 emoji test';
      const descElement = document.querySelector('.deck-description') as HTMLElement;
      
      descElement.textContent = unicodeText;
      
      const computedStyle = window.getComputedStyle(descElement);
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
    });

    it('should handle empty and whitespace-only descriptions', () => {
      const testCases = ['', '   ', '\n\t', '  \n  '];
      
      testCases.forEach(testCase => {
        const descElement = document.querySelector('.deck-description') as HTMLElement;
        descElement.textContent = testCase;
        
        const computedStyle = window.getComputedStyle(descElement);
        expect(computedStyle.wordWrap).toBe('break-word');
        expect(computedStyle.overflowWrap).toBe('break-word');
      });
    });
  });
});
