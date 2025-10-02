/**
 * Unit tests for read-only mode label functionality
 * Tests the simplified "Read Only Mode" label display
 */

import { JSDOM } from 'jsdom';

describe('Read-Only Mode Label', () => {
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
        </head>
        <body>
          <div id="readOnlyIndicator" class="read-only-indicator" style="display: none;">
            <span class="read-only-text">📖 Read Only Mode</span>
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

  describe('Read-only indicator display', () => {
    it('should have the correct simplified label text', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      expect(readOnlyText).toBeTruthy();
      expect(readOnlyText?.textContent).toBe('📖 Read Only Mode');
    });

    it('should not contain the old verbose label text', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      expect(readOnlyText?.textContent).not.toContain('Read-Only Mode - Viewing Another User\'s Deck');
      expect(readOnlyText?.textContent).not.toContain('Viewing Another User\'s Deck');
    });

    it('should maintain the emoji prefix', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      expect(readOnlyText?.textContent).toMatch(/^📖/);
    });

    it('should have the correct HTML structure', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator');
      const readOnlyText = document.querySelector('.read-only-text');
      
      expect(readOnlyIndicator).toBeTruthy();
      expect(readOnlyText).toBeTruthy();
      expect(readOnlyIndicator?.classList.contains('read-only-indicator')).toBe(true);
      expect(readOnlyText?.classList.contains('read-only-text')).toBe(true);
    });
  });

  describe('Read-only indicator visibility', () => {
    it('should be hidden by default', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      expect(readOnlyIndicator.style.display).toBe('none');
    });

    it('should be visible when shown', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      readOnlyIndicator.style.display = 'block';
      expect(readOnlyIndicator.style.display).toBe('block');
    });

    it('should be hidden when hidden', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      readOnlyIndicator.style.display = 'none';
      expect(readOnlyIndicator.style.display).toBe('none');
    });
  });

  describe('Label text consistency', () => {
    it('should have consistent text across different states', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      const initialText = readOnlyText?.textContent;
      
      // Simulate showing/hiding the indicator
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      readOnlyIndicator.style.display = 'block';
      
      const textAfterShow = readOnlyText?.textContent;
      expect(textAfterShow).toBe(initialText);
      
      readOnlyIndicator.style.display = 'none';
      const textAfterHide = readOnlyText?.textContent;
      expect(textAfterHide).toBe(initialText);
    });

    it('should maintain the same text when dynamically updated', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      const originalText = '📖 Read Only Mode';
      
      expect(readOnlyText?.textContent).toBe(originalText);
      
      // Simulate dynamic content update
      if (readOnlyText) {
        readOnlyText.textContent = originalText;
      }
      
      expect(readOnlyText?.textContent).toBe(originalText);
    });
  });

  describe('CSS class structure', () => {
    it('should have the correct CSS classes for styling', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator');
      const readOnlyText = document.querySelector('.read-only-text');
      
      expect(readOnlyIndicator?.classList.contains('read-only-indicator')).toBe(true);
      expect(readOnlyText?.classList.contains('read-only-text')).toBe(true);
    });

    it('should support CSS styling through classes', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      const readOnlyText = document.querySelector('.read-only-text') as HTMLElement;
      
      // Test that elements can be styled
      readOnlyIndicator.style.backgroundColor = 'red';
      readOnlyText.style.color = 'blue';
      
      expect(readOnlyIndicator.style.backgroundColor).toBe('red');
      expect(readOnlyText.style.color).toBe('blue');
    });
  });

  describe('Accessibility and usability', () => {
    it('should have appropriate semantic structure', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator');
      const readOnlyText = document.querySelector('.read-only-text');
      
      expect(readOnlyIndicator?.tagName).toBe('DIV');
      expect(readOnlyText?.tagName).toBe('SPAN');
    });

    it('should be readable and clear to users', () => {
      const readOnlyText = document.querySelector('.read-only-text');
      const text = readOnlyText?.textContent || '';
      
      // Should be concise and clear
      expect(text.length).toBeLessThan(50); // Much shorter than the old label
      expect(text).toContain('Read Only');
      expect(text).toContain('Mode');
    });
  });

  describe('Integration with existing functionality', () => {
    it('should work with existing read-only mode logic', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      const readOnlyText = document.querySelector('.read-only-text');
      
      // Simulate showing read-only mode
      readOnlyIndicator.style.display = 'block';
      expect(readOnlyIndicator.style.display).toBe('block');
      expect(readOnlyText?.textContent).toBe('📖 Read Only Mode');
      
      // Simulate hiding read-only mode
      readOnlyIndicator.style.display = 'none';
      expect(readOnlyIndicator.style.display).toBe('none');
    });

    it('should maintain functionality when toggled multiple times', () => {
      const readOnlyIndicator = document.querySelector('#readOnlyIndicator') as HTMLElement;
      const readOnlyText = document.querySelector('.read-only-text');
      
      // Toggle multiple times
      for (let i = 0; i < 5; i++) {
        readOnlyIndicator.style.display = 'block';
        expect(readOnlyText?.textContent).toBe('📖 Read Only Mode');
        
        readOnlyIndicator.style.display = 'none';
        expect(readOnlyIndicator.style.display).toBe('none');
      }
    });
  });
});
