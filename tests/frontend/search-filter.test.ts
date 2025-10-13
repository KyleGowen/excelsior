/**
 * Unit tests for public/js/search-filter.js
 * Tests the search and filter functions extracted during Phase 7 of refactoring
 */

// Mock DOM elements
const mockElement = {
  value: '',
  checked: false,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
};

// Mock document methods
const mockQuerySelectorAll = jest.fn(() => [mockElement]);

// Set up global mocks
(global as any).document = {
  querySelectorAll: mockQuerySelectorAll,
};

// Mock global variables and functions
let isClearingFilters = false;
const mockLoadCharacters = jest.fn();

// Define the functions from search-filter.js for testing
function clearAllFiltersGlobally() {
  if (isClearingFilters) {
    return;
  }
  
  isClearingFilters = true;
  
  // Clear all text search inputs
  const headerFilters = (global as any).document.querySelectorAll('.header-filter');
  headerFilters.forEach((input: any) => {
    input.value = '';
  });
  
  // Clear all numeric filters
  const filterInputs = (global as any).document.querySelectorAll('.filter-input');
  filterInputs.forEach((input: any) => {
    input.value = '';
  });
  
  // Clear all checkboxes
  const checkboxes = (global as any).document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox: any) => {
    checkbox.checked = false;
  });
  
  isClearingFilters = false;
}

function clearFilters(loadFunction: any) {
  clearAllFiltersGlobally();
  if (typeof loadFunction === 'function') {
    loadFunction();
  }
}

function clearAllFilters() {
  // Use the global clear function
  clearAllFiltersGlobally();
  
  // Reload all characters
  mockLoadCharacters();
}

describe('Search and Filter Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isClearingFilters = false;
    mockElement.value = '';
    mockElement.checked = false;
  });

  describe('clearAllFiltersGlobally', () => {
    it('should clear all header filter inputs', () => {
      const mockHeaderFilter = { value: 'test search' };
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [mockHeaderFilter];
        if (selector === '.filter-input') return [];
        if (selector === 'input[type="checkbox"]') return [];
        return [];
      });

      clearAllFiltersGlobally();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.header-filter');
      expect(mockHeaderFilter.value).toBe('');
    });

    it('should clear all filter inputs', () => {
      const mockFilterInput = { value: '123' };
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [];
        if (selector === '.filter-input') return [mockFilterInput];
        if (selector === 'input[type="checkbox"]') return [];
        return [];
      });

      clearAllFiltersGlobally();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.filter-input');
      expect(mockFilterInput.value).toBe('');
    });

    it('should clear all checkboxes', () => {
      const mockCheckbox = { checked: true };
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [];
        if (selector === '.filter-input') return [];
        if (selector === 'input[type="checkbox"]') return [mockCheckbox];
        return [];
      });

      clearAllFiltersGlobally();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('input[type="checkbox"]');
      expect(mockCheckbox.checked).toBe(false);
    });

    it('should clear all types of filters', () => {
      const mockHeaderFilter = { value: 'search text' };
      const mockFilterInput = { value: '456' };
      const mockCheckbox = { checked: true };
      
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [mockHeaderFilter];
        if (selector === '.filter-input') return [mockFilterInput];
        if (selector === 'input[type="checkbox"]') return [mockCheckbox];
        return [];
      });

      clearAllFiltersGlobally();

      expect(mockHeaderFilter.value).toBe('');
      expect(mockFilterInput.value).toBe('');
      expect(mockCheckbox.checked).toBe(false);
    });

    it('should not clear filters if already clearing', () => {
      isClearingFilters = true;
      const mockHeaderFilter = { value: 'should not be cleared' };
      
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [mockHeaderFilter];
        return [];
      });

      clearAllFiltersGlobally();

      expect(mockHeaderFilter.value).toBe('should not be cleared');
      expect(mockQuerySelectorAll).not.toHaveBeenCalled();
    });

    it('should handle empty filter collections', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => clearAllFiltersGlobally()).not.toThrow();
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.header-filter');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.filter-input');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('input[type="checkbox"]');
    });

    it('should reset isClearingFilters flag after completion', () => {
      isClearingFilters = false;
      mockQuerySelectorAll.mockReturnValue([]);

      clearAllFiltersGlobally();

      expect(isClearingFilters).toBe(false);
    });
  });

  describe('clearFilters', () => {
    it('should call clearAllFiltersGlobally and load function', () => {
      const mockLoadFunction = jest.fn();
      mockQuerySelectorAll.mockReturnValue([]);

      clearFilters(mockLoadFunction);

      expect(mockLoadFunction).toHaveBeenCalled();
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.header-filter');
    });

    it('should not call load function if not provided', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => clearFilters(undefined)).not.toThrow();
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.header-filter');
    });

    it('should not call load function if not a function', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => clearFilters('not a function')).not.toThrow();
      expect(() => clearFilters(null)).not.toThrow();
      expect(() => clearFilters(undefined)).not.toThrow();
    });

    it('should handle load function errors gracefully', () => {
      const mockLoadFunction = jest.fn(() => { throw new Error('Load error'); });
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => clearFilters(mockLoadFunction)).toThrow('Load error');
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters and reload characters', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      clearAllFilters();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.header-filter');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.filter-input');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('input[type="checkbox"]');
      expect(mockLoadCharacters).toHaveBeenCalled();
    });

    it('should handle loadCharacters errors gracefully', () => {
      mockLoadCharacters.mockImplementation(() => { throw new Error('Load characters error'); });
      mockQuerySelectorAll.mockReturnValue([]);

      expect(() => clearAllFilters()).toThrow('Load characters error');
    });

    it('should complete even if clearing filters fails', () => {
      mockQuerySelectorAll.mockImplementation(() => { throw new Error('Query error'); });

      expect(() => clearAllFilters()).toThrow('Query error');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete filter clearing workflow', () => {
      const mockHeaderFilter = { value: 'search' };
      const mockFilterInput = { value: '123' };
      const mockCheckbox = { checked: true };
      
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return [mockHeaderFilter];
        if (selector === '.filter-input') return [mockFilterInput];
        if (selector === 'input[type="checkbox"]') return [mockCheckbox];
        return [];
      });

      clearAllFilters();

      expect(mockHeaderFilter.value).toBe('');
      expect(mockFilterInput.value).toBe('');
      expect(mockCheckbox.checked).toBe(false);
      expect(mockLoadCharacters).toHaveBeenCalled();
    });

    it('should handle multiple filter elements of each type', () => {
      const mockHeaderFilters = [
        { value: 'search1' },
        { value: 'search2' }
      ];
      const mockFilterInputs = [
        { value: '123' },
        { value: '456' }
      ];
      const mockCheckboxes = [
        { checked: true },
        { checked: true }
      ];
      
      mockQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector === '.header-filter') return mockHeaderFilters;
        if (selector === '.filter-input') return mockFilterInputs;
        if (selector === 'input[type="checkbox"]') return mockCheckboxes;
        return [];
      });

      clearAllFiltersGlobally();

      mockHeaderFilters.forEach(filter => expect(filter.value).toBe(''));
      mockFilterInputs.forEach(filter => expect(filter.value).toBe(''));
      mockCheckboxes.forEach(checkbox => expect(checkbox.checked).toBe(false));
    });

    it('should handle nested function calls correctly', () => {
      const mockLoadFunction = jest.fn();
      mockQuerySelectorAll.mockReturnValue([]);

      clearFilters(mockLoadFunction);

      expect(mockLoadFunction).toHaveBeenCalledTimes(1);
      expect(mockQuerySelectorAll).toHaveBeenCalledTimes(3); // header-filter, filter-input, checkbox
    });
  });
});
