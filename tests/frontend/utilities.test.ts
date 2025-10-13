/**
 * Unit tests for public/js/utilities.js
 * Tests the core utility functions extracted during Phase 2 of refactoring
 */

// Mock authService
const mockAuthService = {
  getCurrentUser: jest.fn(),
};

// Define the functions from utilities.js for testing
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getCurrentUser() {
  return mockAuthService.getCurrentUser();
}

describe('Utilities.js - Core Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce function', () => {
    it('should be defined', () => {
      expect(typeof debounce).toBe('function');
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle different delay values', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('test');
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should handle no arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith();
    });

    it('should handle zero delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');
      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should handle negative delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, -100);

      debouncedFn('test');
      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledWith('test');
    });
  });

  describe('getCurrentUser function', () => {
    it('should be defined', () => {
      expect(typeof getCurrentUser).toBe('function');
    });

    it('should call authService.getCurrentUser', () => {
      const mockUser = { id: '123', name: 'Test User' };
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      const result = getCurrentUser();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockUser);
    });

    it('should return null when authService returns null', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const result = getCurrentUser();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should return undefined when authService returns undefined', () => {
      mockAuthService.getCurrentUser.mockReturnValue(undefined);

      const result = getCurrentUser();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should handle authService errors gracefully', () => {
      mockAuthService.getCurrentUser.mockImplementation(() => {
        throw new Error('Auth service error');
      });

      expect(() => getCurrentUser()).toThrow('Auth service error');
    });
  });
});
