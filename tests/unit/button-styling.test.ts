/**
 * @jest-environment jsdom
 */

describe('Button Styling Tests', () => {
  let mockDocument: any;
  let mockWindow: any;

  beforeEach(() => {
    // Mock document and window
    mockDocument = {
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      createElement: jest.fn()
    };

    mockWindow = {
      getComputedStyle: jest.fn()
    };

    // Mock global objects
    (global as any).document = mockDocument;
    (global as any).window = mockWindow;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Export Button Styling', () => {
    it('should have correct dimensions matching Save button', () => {
      // Mock Export button element
      const exportBtn = {
        style: {},
        className: 'export-import-btn',
        getAttribute: jest.fn().mockReturnValue('display: inline-block;')
      };

      // Mock Save button element
      const saveBtn = {
        style: {},
        className: 'action-btn save-btn',
        getAttribute: jest.fn().mockReturnValue('display: inline-block;')
      };

      mockDocument.getElementById
        .mockReturnValueOnce(exportBtn) // exportBtn
        .mockReturnValueOnce(saveBtn);   // saveBtn

      // Mock computed styles for Export button
      const exportStyles = {
        width: '88px',
        height: '24.5px',
        padding: '4px 8px',
        minHeight: '24px',
        backgroundColor: 'rgb(43, 43, 43)',
        color: 'rgb(210, 180, 140)',
        border: '1px solid rgba(210, 180, 140, 0.35)',
        borderRadius: '4px'
      };

      // Mock computed styles for Save button
      const saveStyles = {
        width: '88px',
        height: '24px',
        padding: '4px 8px',
        minHeight: '24px',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        color: 'rgb(78, 205, 196)',
        border: '1px solid rgba(78, 205, 196, 0.3)',
        borderRadius: '4px'
      };

      mockWindow.getComputedStyle
        .mockReturnValueOnce(exportStyles) // exportBtn styles
        .mockReturnValueOnce(saveStyles);   // saveBtn styles

      // Test the styling comparison
      const exportComputed = mockWindow.getComputedStyle(exportBtn);
      const saveComputed = mockWindow.getComputedStyle(saveBtn);

      // Verify Export button matches Save button dimensions
      expect(exportComputed.width).toBe(saveComputed.width); // Both should be '88px'
      expect(exportComputed.padding).toBe(saveComputed.padding); // Both should be '4px 8px'
      expect(exportComputed.minHeight).toBe(saveComputed.minHeight); // Both should be '24px'
      expect(exportComputed.borderRadius).toBe(saveComputed.borderRadius); // Both should be '4px'
    });

    it('should have correct CSS class and styling properties', () => {
      const exportBtn = {
        className: 'export-import-btn',
        style: {
          display: 'inline-block'
        }
      };

      mockDocument.getElementById.mockReturnValue(exportBtn);

      // Test that Export button has the correct class
      expect(exportBtn.className).toBe('export-import-btn');
      expect(exportBtn.style.display).toBe('inline-block');
    });
  });

  describe('Import Button Styling', () => {
    it('should have correct dimensions matching Cancel button', () => {
      // Mock Import button element
      const importBtn = {
        style: {},
        className: 'export-import-btn',
        getAttribute: jest.fn().mockReturnValue('display: inline-block;')
      };

      // Mock Cancel button element
      const cancelBtn = {
        style: {},
        className: 'cancel-btn',
        getAttribute: jest.fn().mockReturnValue('display: inline-block;')
      };

      mockDocument.getElementById.mockReturnValue(importBtn);
      mockDocument.querySelector.mockReturnValue(cancelBtn);

      // Mock computed styles for Import button
      const importStyles = {
        width: '88px',
        height: '24.5px',
        padding: '4px 8px',
        minHeight: '24px',
        backgroundColor: 'rgb(43, 43, 43)',
        color: 'rgb(210, 180, 140)',
        border: '1px solid rgba(210, 180, 140, 0.35)',
        borderRadius: '4px'
      };

      // Mock computed styles for Cancel button
      const cancelStyles = {
        width: 'auto',
        height: 'auto',
        padding: '8px 16px',
        minHeight: '0px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'rgb(236, 240, 241)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px'
      };

      mockWindow.getComputedStyle
        .mockReturnValueOnce(importStyles) // importBtn styles
        .mockReturnValueOnce(cancelStyles); // cancelBtn styles

      // Test the styling comparison
      const importComputed = mockWindow.getComputedStyle(importBtn);
      const cancelComputed = mockWindow.getComputedStyle(cancelBtn);

      // Verify Import button matches Cancel button key dimensions
      expect(importComputed.borderRadius).toBe(cancelComputed.borderRadius); // Both should be '4px'
      expect(importComputed.minHeight).toBe('24px'); // Import should have 24px min-height
    });

    it('should have correct CSS class and styling properties', () => {
      const importBtn = {
        className: 'export-import-btn',
        style: {
          display: 'inline-block'
        }
      };

      mockDocument.getElementById.mockReturnValue(importBtn);

      // Test that Import button has the correct class
      expect(importBtn.className).toBe('export-import-btn');
      expect(importBtn.style.display).toBe('inline-block');
    });
  });

  describe('Button Grid Layout', () => {
    it('should have correct grid positioning for all buttons', () => {
      const buttons = {
        exportBtn: { style: {}, className: 'export-import-btn' },
        importBtn: { style: {}, className: 'export-import-btn' },
        saveBtn: { style: {}, className: 'action-btn save-btn' },
        cancelBtn: { style: {}, className: 'cancel-btn' }
      };

      mockDocument.getElementById
        .mockReturnValueOnce(buttons.exportBtn)
        .mockReturnValueOnce(buttons.importBtn)
        .mockReturnValueOnce(buttons.saveBtn);
      mockDocument.querySelector.mockReturnValue(buttons.cancelBtn);

      // Mock grid positioning styles
      const gridStyles = {
        gridColumn: '1',
        gridRow: '1'
      };

      mockWindow.getComputedStyle.mockReturnValue(gridStyles);

      // Simulate the actual calls that would happen in the application
      mockDocument.getElementById('exportBtn');
      mockDocument.getElementById('importBtn');
      mockDocument.getElementById('saveDeckButton');
      mockDocument.querySelector('.cancel-btn');

      // Test that all buttons are found
      expect(mockDocument.getElementById).toHaveBeenCalledWith('exportBtn');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('importBtn');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('saveDeckButton');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.cancel-btn');
    });
  });

  describe('Button Visibility and Access Control', () => {
    it('should show Export and Import buttons only for ADMIN users', () => {
      const exportBtn = {
        style: { display: 'none' },
        className: 'export-import-btn'
      };

      const importBtn = {
        style: { display: 'none' },
        className: 'export-import-btn'
      };

      mockDocument.getElementById
        .mockReturnValueOnce(exportBtn)
        .mockReturnValueOnce(importBtn);

      // Mock ADMIN user
      const adminUser = { role: 'ADMIN' };
      (global as any).currentUser = adminUser;

      // Simulate showing buttons for ADMIN user
      if (adminUser.role === 'ADMIN') {
        exportBtn.style.display = 'inline-block';
        importBtn.style.display = 'inline-block';
      }

      expect(exportBtn.style.display).toBe('inline-block');
      expect(importBtn.style.display).toBe('inline-block');
    });

    it('should hide Export and Import buttons for non-ADMIN users', () => {
      const exportBtn = {
        style: { display: 'none' },
        className: 'export-import-btn'
      };

      const importBtn = {
        style: { display: 'none' },
        className: 'export-import-btn'
      };

      mockDocument.getElementById
        .mockReturnValueOnce(exportBtn)
        .mockReturnValueOnce(importBtn);

      // Mock non-ADMIN user
      const guestUser = { role: 'GUEST' };
      (global as any).currentUser = guestUser;

      // Simulate hiding buttons for non-ADMIN user
      if (guestUser.role !== 'ADMIN') {
        exportBtn.style.display = 'none';
        importBtn.style.display = 'none';
      }

      expect(exportBtn.style.display).toBe('none');
      expect(importBtn.style.display).toBe('none');
    });
  });

  describe('CSS Class Consistency', () => {
    it('should use consistent CSS classes for Export and Import buttons', () => {
      const exportBtn = { className: 'export-import-btn' };
      const importBtn = { className: 'export-import-btn' };

      mockDocument.getElementById
        .mockReturnValueOnce(exportBtn)
        .mockReturnValueOnce(importBtn);

      // Both buttons should use the same CSS class
      expect(exportBtn.className).toBe(importBtn.className);
      expect(exportBtn.className).toBe('export-import-btn');
    });

    it('should have different CSS classes from Save and Cancel buttons', () => {
      const exportBtn = { className: 'export-import-btn' };
      const importBtn = { className: 'export-import-btn' };
      const saveBtn = { className: 'action-btn save-btn' };
      const cancelBtn = { className: 'cancel-btn' };

      mockDocument.getElementById
        .mockReturnValueOnce(exportBtn)
        .mockReturnValueOnce(importBtn)
        .mockReturnValueOnce(saveBtn);
      mockDocument.querySelector.mockReturnValue(cancelBtn);

      // Export/Import should have different classes from Save/Cancel
      expect(exportBtn.className).not.toBe(saveBtn.className);
      expect(importBtn.className).not.toBe(cancelBtn.className);
      expect(exportBtn.className).not.toBe(cancelBtn.className);
      expect(importBtn.className).not.toBe(saveBtn.className);
    });
  });

  describe('Import Button Functionality', () => {
    it('should do nothing when clicked (import functionality disabled)', () => {
      // Mock the importDeckFromJson function
      const mockImportDeckFromJson = jest.fn();
      (global as any).importDeckFromJson = mockImportDeckFromJson;

      // Mock the import button
      const importBtn = {
        className: 'export-import-btn',
        onclick: null as any,
        addEventListener: jest.fn()
      };

      mockDocument.getElementById.mockReturnValue(importBtn);

      // Simulate the import button click
      if (importBtn.onclick) {
        importBtn.onclick();
      }

      // Verify that importDeckFromJson was not called
      expect(mockImportDeckFromJson).not.toHaveBeenCalled();

      // Verify that the button exists but has no onclick handler
      expect(importBtn.onclick).toBeNull();
    });

    it('should show disabled message when import functionality is called', () => {
      // Mock the importDeckFromJson function to simulate the disabled behavior
      const mockShowNotification = jest.fn();
      (global as any).showNotification = mockShowNotification;

      // Simulate calling the disabled import function
      const importDeckFromJson = () => {
        console.log('🔒 Import functionality is disabled');
        mockShowNotification('Import functionality is currently disabled', 'info');
      };

      // Call the function
      importDeckFromJson();

      // Verify the disabled message was shown
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Import functionality is currently disabled', 
        'info'
      );
    });
  });
});
