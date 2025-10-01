import { PasswordUtils } from '../../src/utils/passwordUtils';

// Mock bcrypt to avoid actual hashing in tests
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

import bcrypt from 'bcrypt';

describe('PasswordUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt with correct salt rounds', async () => {
      const password = 'testpassword123';
      const expectedHash = '$2b$10$hashedpassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(expectedHash);
    });

    it('should handle empty password', async () => {
      const password = '';
      const expectedHash = '$2b$10$emptyhash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(expectedHash);
    });

    it('should handle special characters in password', async () => {
      const password = 'p@ssw0rd!@#$%^&*()';
      const expectedHash = '$2b$10$specialcharshash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(expectedHash);
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const expectedHash = '$2b$10$longpasswordhash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(expectedHash);
    });

    it('should propagate bcrypt errors', async () => {
      const password = 'testpassword';
      const error = new Error('Bcrypt hashing failed');
      
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(PasswordUtils.hashPassword(password)).rejects.toThrow('Bcrypt hashing failed');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should handle null/undefined password gracefully', async () => {
      const password = null as any;
      const expectedHash = '$2b$10$nullhash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash);

      const result = await PasswordUtils.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(expectedHash);
    });
  });

  describe('comparePassword', () => {
    it('should compare password with hash using bcrypt', async () => {
      const password = 'testpassword123';
      const hashedPassword = '$2b$10$hashedpassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'wrongpassword';
      const hashedPassword = '$2b$10$hashedpassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashedPassword = '$2b$10$hashedpassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty hash comparison', async () => {
      const password = 'testpassword';
      const hashedPassword = '';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle null/undefined parameters', async () => {
      const password = null as any;
      const hashedPassword = null as any;
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should propagate bcrypt comparison errors', async () => {
      const password = 'testpassword';
      const hashedPassword = '$2b$10$hashedpassword';
      const error = new Error('Bcrypt comparison failed');
      
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(PasswordUtils.comparePassword(password, hashedPassword)).rejects.toThrow('Bcrypt comparison failed');
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should handle special characters in both password and hash', async () => {
      const password = 'p@ssw0rd!@#$%^&*()';
      const hashedPassword = '$2b$10$specialcharshash';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtils.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('isHashed', () => {
    it('should return true for bcrypt $2a$ prefix', () => {
      const hashedPassword = '$2a$10$hashedpassword';
      
      const result = PasswordUtils.isHashed(hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should return true for bcrypt $2b$ prefix', () => {
      const hashedPassword = '$2b$10$hashedpassword';
      
      const result = PasswordUtils.isHashed(hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should return false for plain text password', () => {
      const plainPassword = 'plaintextpassword';
      
      const result = PasswordUtils.isHashed(plainPassword);
      
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const emptyPassword = '';
      
      const result = PasswordUtils.isHashed(emptyPassword);
      
      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      const nullPassword = null as any;
      const undefinedPassword = undefined as any;
      
      expect(PasswordUtils.isHashed(nullPassword)).toBe(false);
      expect(PasswordUtils.isHashed(undefinedPassword)).toBe(false);
    });

    it('should return false for other hash prefixes', () => {
      const md5Hash = '$1$hashedpassword';
      const sha256Hash = '$5$hashedpassword';
      const argon2Hash = '$argon2id$hashedpassword';
      
      expect(PasswordUtils.isHashed(md5Hash)).toBe(false);
      expect(PasswordUtils.isHashed(sha256Hash)).toBe(false);
      expect(PasswordUtils.isHashed(argon2Hash)).toBe(false);
    });

    it('should return true for $2a$ with different salt rounds', () => {
      const hashWithDifferentRounds = '$2a$12$hashedpassword';
      
      const result = PasswordUtils.isHashed(hashWithDifferentRounds);
      
      expect(result).toBe(true);
    });

    it('should return true for $2b$ with different salt rounds', () => {
      const hashWithDifferentRounds = '$2b$15$hashedpassword';
      
      const result = PasswordUtils.isHashed(hashWithDifferentRounds);
      
      expect(result).toBe(true);
    });

    it('should handle case sensitivity correctly', () => {
      const uppercaseHash = '$2A$10$hashedpassword';
      const mixedCaseHash = '$2a$10$HASHEDPASSWORD';
      
      expect(PasswordUtils.isHashed(uppercaseHash)).toBe(false);
      expect(PasswordUtils.isHashed(mixedCaseHash)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should work correctly for typical password workflow', async () => {
      const originalPassword = 'userpassword123';
      const hashedPassword = '$2b$10$hashedpassword';
      
      // Mock the hash operation
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      // Hash the password
      const hashResult = await PasswordUtils.hashPassword(originalPassword);
      expect(hashResult).toBe(hashedPassword);
      
      // Verify it's recognized as hashed
      expect(PasswordUtils.isHashed(hashResult)).toBe(true);
      
      // Mock the compare operation
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Verify the password
      const compareResult = await PasswordUtils.comparePassword(originalPassword, hashResult);
      expect(compareResult).toBe(true);
    });

    it('should handle password verification failure correctly', async () => {
      const originalPassword = 'userpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = '$2b$10$hashedpassword';
      
      // Mock the hash operation
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      // Hash the password
      const hashResult = await PasswordUtils.hashPassword(originalPassword);
      expect(hashResult).toBe(hashedPassword);
      
      // Mock the compare operation to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      // Verify wrong password fails
      const compareResult = await PasswordUtils.comparePassword(wrongPassword, hashResult);
      expect(compareResult).toBe(false);
    });

    it('should handle edge case with very short password', async () => {
      const shortPassword = 'a';
      const hashedPassword = '$2b$10$shorthash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const hashResult = await PasswordUtils.hashPassword(shortPassword);
      expect(hashResult).toBe(hashedPassword);
      
      const compareResult = await PasswordUtils.comparePassword(shortPassword, hashResult);
      expect(compareResult).toBe(true);
    });

    it('should handle edge case with unicode characters', async () => {
      const unicodePassword = 'pássw0rd🔐';
      const hashedPassword = '$2b$10$unicodehash';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const hashResult = await PasswordUtils.hashPassword(unicodePassword);
      expect(hashResult).toBe(hashedPassword);
      
      const compareResult = await PasswordUtils.comparePassword(unicodePassword, hashResult);
      expect(compareResult).toBe(true);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle bcrypt hash throwing synchronous errors', async () => {
      const password = 'testpassword';
      const error = new Error('Synchronous bcrypt error');
      
      (bcrypt.hash as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(PasswordUtils.hashPassword(password)).rejects.toThrow('Synchronous bcrypt error');
    });

    it('should handle bcrypt compare throwing synchronous errors', async () => {
      const password = 'testpassword';
      const hashedPassword = '$2b$10$hashedpassword';
      const error = new Error('Synchronous bcrypt compare error');
      
      (bcrypt.compare as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(PasswordUtils.comparePassword(password, hashedPassword)).rejects.toThrow('Synchronous bcrypt compare error');
    });

    it('should handle non-string inputs gracefully', async () => {
      const numberPassword = 12345 as any;
      const objectPassword = { password: 'test' } as any;
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      // These should not throw errors, but bcrypt will handle the conversion
      await expect(PasswordUtils.hashPassword(numberPassword)).resolves.toBe('$2b$10$hash');
      await expect(PasswordUtils.comparePassword(numberPassword, '$2b$10$hash')).resolves.toBe(false);
      await expect(PasswordUtils.comparePassword(objectPassword, '$2b$10$hash')).resolves.toBe(false);
    });
  });
});