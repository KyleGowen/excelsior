import bcrypt from 'bcrypt';

/**
 * Utility functions for password hashing and verification
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Hash a plain text password using bcrypt
   * @param password - The plain text password to hash
   * @returns Promise<string> - The hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - The plain text password
   * @param hashedPassword - The hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Check if a password is already hashed (starts with bcrypt prefix)
   * @param password - The password to check
   * @returns boolean - True if already hashed, false otherwise
   */
  static isHashed(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }
    return password.startsWith('$2a$') || password.startsWith('$2b$');
  }
}
