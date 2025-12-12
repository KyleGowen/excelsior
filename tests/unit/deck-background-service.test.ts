/**
 * Unit tests for DeckBackgroundService
 * Tests background image listing, caching, and path validation
 */

import { DeckBackgroundService } from '../../src/services/deckBackgroundService';
import * as path from 'path';

// Mock fs/promises
const mockReaddir = jest.fn();
const mockAccess = jest.fn();

jest.mock('fs/promises', () => ({
  readdir: (...args: any[]) => mockReaddir(...args),
  access: (...args: any[]) => mockAccess(...args),
  constants: {
    F_OK: 0
  }
}));

describe('DeckBackgroundService', () => {
  let service: DeckBackgroundService;

  beforeEach(() => {
    service = new DeckBackgroundService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    service.clearCache();
  });

  describe('getAvailableBackgrounds', () => {
    it('should return list of PNG files from backgrounds directory', async () => {
      const mockFiles = ['aesclepnotext.png', 'bakernotext.png', 'test.jpg', 'another.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      const result = await service.getAvailableBackgrounds();

      expect(result.length).toBe(3); // Only PNG files
      expect(result).toContain('src/resources/cards/images/backgrounds/another.png');
      expect(result).toContain('src/resources/cards/images/backgrounds/aesclepnotext.png');
      expect(result).toContain('src/resources/cards/images/backgrounds/bakernotext.png');
      expect(result).not.toContain('src/resources/cards/images/backgrounds/test.jpg');
      expect(mockReaddir).toHaveBeenCalledTimes(1);
    });

    it('should filter out non-PNG files', async () => {
      const mockFiles = ['test.jpg', 'test.gif', 'test.webp', 'valid.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      const result = await service.getAvailableBackgrounds();

      expect(result).toEqual(['src/resources/cards/images/backgrounds/valid.png']);
      expect(result.length).toBe(1);
    });

    it('should handle case-insensitive PNG extension matching', async () => {
      const mockFiles = ['test.PNG', 'test.Png', 'test.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      const result = await service.getAvailableBackgrounds();

      expect(result.length).toBe(3);
      // The implementation preserves original case in filenames
      expect(result).toContain('src/resources/cards/images/backgrounds/test.PNG');
      expect(result).toContain('src/resources/cards/images/backgrounds/test.Png');
      expect(result).toContain('src/resources/cards/images/backgrounds/test.png');
    });

    it('should return sorted list of backgrounds', async () => {
      const mockFiles = ['zebra.png', 'alpha.png', 'beta.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      const result = await service.getAvailableBackgrounds();

      expect(result).toEqual([
        'src/resources/cards/images/backgrounds/alpha.png',
        'src/resources/cards/images/backgrounds/beta.png',
        'src/resources/cards/images/backgrounds/zebra.png'
      ]);
    });

    it('should cache results for 15 minutes', async () => {
      const mockFiles = ['test.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      // First call - should read from filesystem
      const result1 = await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(1);

      // Advance time by 14 minutes (still within cache)
      jest.advanceTimersByTime(14 * 60 * 1000);

      // Second call - should use cache
      const result2 = await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toEqual(result1);
    });

    it('should refresh cache after 15 minutes', async () => {
      const mockFiles1 = ['old.png'];
      const mockFiles2 = ['old.png', 'new.png'];
      mockReaddir
        .mockResolvedValueOnce(mockFiles1)
        .mockResolvedValueOnce(mockFiles2);

      // First call
      const result1 = await service.getAvailableBackgrounds();
      expect(result1.length).toBe(1);

      // Advance time by 15 minutes and 1 second (cache expired)
      jest.advanceTimersByTime(15 * 60 * 1000 + 1000);

      // Second call - should refresh cache
      const result2 = await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(2);
      expect(result2.length).toBe(2);
    });

    it('should return empty array on filesystem error', async () => {
      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      const result = await service.getAvailableBackgrounds();

      expect(result).toEqual([]);
    });

    it('should return empty array if directory does not exist', async () => {
      mockReaddir.mockRejectedValue({ code: 'ENOENT' });

      const result = await service.getAvailableBackgrounds();

      expect(result).toEqual([]);
    });
  });

  describe('validateBackgroundPath', () => {
    it('should return true for null path (default background)', async () => {
      const result = await service.validateBackgroundPath(null);
      expect(result).toBe(true);
    });

    it('should return true for valid background path', async () => {
      const validPath = 'src/resources/cards/images/backgrounds/aesclepnotext.png';
      mockAccess.mockResolvedValue(undefined);

      const result = await service.validateBackgroundPath(validPath);

      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalled();
    });

    it('should return false for path without "backgrounds" directory', async () => {
      const invalidPath = 'src/resources/cards/images/other/image.png';

      const result = await service.validateBackgroundPath(invalidPath);

      expect(result).toBe(false);
      expect(mockAccess).not.toHaveBeenCalled();
    });

    it('should return false for non-existent file', async () => {
      const invalidPath = 'src/resources/cards/images/backgrounds/nonexistent.png';
      mockAccess.mockRejectedValue({ code: 'ENOENT' });

      const result = await service.validateBackgroundPath(invalidPath);

      expect(result).toBe(false);
    });

    it('should return false for path with access error', async () => {
      const invalidPath = 'src/resources/cards/images/backgrounds/test.png';
      mockAccess.mockRejectedValue(new Error('Permission denied'));

      const result = await service.validateBackgroundPath(invalidPath);

      expect(result).toBe(false);
    });

    it('should handle paths with "backgrounds" in different positions', async () => {
      const validPath = 'src/resources/cards/images/backgrounds/test.png';
      mockAccess.mockResolvedValue(undefined);

      const result = await service.validateBackgroundPath(validPath);

      expect(result).toBe(true);
    });

    it('should resolve path correctly from project root', async () => {
      const relativePath = 'src/resources/cards/images/backgrounds/test.png';
      mockAccess.mockResolvedValue(undefined);

      await service.validateBackgroundPath(relativePath);

      // Verify access was called with a resolved path
      expect(mockAccess).toHaveBeenCalled();
      const callArgs = (mockAccess as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('backgrounds');
      expect(callArgs).toContain('test.png');
    });
  });

  describe('clearCache', () => {
    it('should clear cached backgrounds', async () => {
      const mockFiles = ['test.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      // Load cache
      await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Advance time but stay within original cache window
      jest.advanceTimersByTime(5 * 60 * 1000);

      // Should read from filesystem again
      await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(2);
    });

    it('should reset cache timestamp', async () => {
      const mockFiles = ['test.png'];
      mockReaddir.mockResolvedValue(mockFiles);

      await service.getAvailableBackgrounds();
      service.clearCache();

      // Should immediately refresh on next call
      await service.getAvailableBackgrounds();
      expect(mockReaddir).toHaveBeenCalledTimes(2);
    });
  });
});
