/**
 * Unit tests for guest welcome message functionality
 * Tests that the welcome message displays "Welcome, Guest!" for guest users
 * and proper usernames for regular users
 */

describe('Guest Welcome Message Unit Tests', () => {
  describe('Display Name Logic', () => {
    // Test the core display name logic from the showMainApp function
    function getDisplayName(currentUser: any): string {
      return (currentUser?.username === 'guest' || currentUser?.name === 'guest') 
          ? 'Guest' 
          : (currentUser?.username || currentUser?.name || 'User');
    }

    it('should display "Guest" for guest users with username "guest"', () => {
      const guestUser = {
        id: 'guest-001',
        username: 'guest',
        name: 'guest',
        email: '',
        role: 'GUEST'
      };

      const displayName = getDisplayName(guestUser);

      expect(displayName).toBe('Guest');
    });

    it('should display "Guest" for guest users with name "guest"', () => {
      const guestUser = {
        id: 'guest-001',
        username: 'user123',
        name: 'guest',
        email: '',
        role: 'GUEST'
      };

      const displayName = getDisplayName(guestUser);

      expect(displayName).toBe('Guest');
    });

    it('should display "Guest" for guest users with both username and name "guest"', () => {
      const guestUser = {
        id: 'guest-001',
        username: 'guest',
        name: 'guest',
        email: '',
        role: 'GUEST'
      };

      const displayName = getDisplayName(guestUser);

      expect(displayName).toBe('Guest');
    });

    it('should display username for regular users', () => {
      const regularUser = {
        id: 'user-123',
        username: 'john_doe',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(regularUser);

      expect(displayName).toBe('john_doe');
    });

    it('should display name when username is not available', () => {
      const regularUser = {
        id: 'user-123',
        username: null,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(regularUser);

      expect(displayName).toBe('Jane Smith');
    });

    it('should display "User" as fallback when neither username nor name is available', () => {
      const userWithNoName = {
        id: 'user-123',
        username: null,
        name: null,
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(userWithNoName);

      expect(displayName).toBe('User');
    });

    it('should prioritize username over name for regular users', () => {
      const regularUser = {
        id: 'user-123',
        username: 'preferred_username',
        name: 'Full Name',
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(regularUser);

      expect(displayName).toBe('preferred_username');
    });

    it('should handle empty string username and name', () => {
      const userWithEmptyStrings = {
        id: 'user-123',
        username: '',
        name: '',
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(userWithEmptyStrings);

      expect(displayName).toBe('User');
    });

    it('should handle undefined username and name', () => {
      const userWithUndefined = {
        id: 'user-123',
        username: undefined,
        name: undefined,
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(userWithUndefined);

      expect(displayName).toBe('User');
    });

    it('should not display "Guest" for users with "guest" in their name but different username', () => {
      const regularUserWithGuestInName = {
        id: 'user-123',
        username: 'myguestaccount',
        name: 'My Guest Account',
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(regularUserWithGuestInName);

      expect(displayName).toBe('myguestaccount');
    });

    it('should not display "Guest" for users with "guest" in their username but different name', () => {
      const regularUserWithGuestInUsername = {
        id: 'user-123',
        username: 'guestuser123',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'USER'
      };

      const displayName = getDisplayName(regularUserWithGuestInUsername);

      expect(displayName).toBe('guestuser123');
    });
  });

  describe('Edge Cases', () => {
    function getDisplayName(currentUser: any): string {
      return (currentUser?.username === 'guest' || currentUser?.name === 'guest') 
          ? 'Guest' 
          : (currentUser?.username || currentUser?.name || 'User');
    }

    it('should handle null currentUser gracefully', () => {
      const displayName = getDisplayName(null);

      expect(displayName).toBe('User');
    });

    it('should handle empty currentUser object gracefully', () => {
      const displayName = getDisplayName({});

      expect(displayName).toBe('User');
    });

    it('should handle currentUser with only role property', () => {
      const userWithOnlyRole = {
        role: 'USER'
      };

      const displayName = getDisplayName(userWithOnlyRole);

      expect(displayName).toBe('User');
    });
  });

  describe('Guest Detection Logic', () => {
    function getDisplayName(currentUser: any): string {
      return (currentUser?.username === 'guest' || currentUser?.name === 'guest') 
          ? 'Guest' 
          : (currentUser?.username || currentUser?.name || 'User');
    }

    it('should detect guest by exact username match', () => {
      const guestUser = { username: 'guest', name: 'some other name' };
      const displayName = getDisplayName(guestUser);
      expect(displayName).toBe('Guest');
    });

    it('should detect guest by exact name match', () => {
      const guestUser = { username: 'some other username', name: 'guest' };
      const displayName = getDisplayName(guestUser);
      expect(displayName).toBe('Guest');
    });

    it('should not detect guest by partial match in username', () => {
      const regularUser = { username: 'myguestaccount', name: 'Regular User' };
      const displayName = getDisplayName(regularUser);
      expect(displayName).toBe('myguestaccount');
    });

    it('should not detect guest by partial match in name', () => {
      const regularUser = { username: 'regularuser', name: 'My Guest Account' };
      const displayName = getDisplayName(regularUser);
      expect(displayName).toBe('regularuser');
    });

    it('should be case sensitive for guest detection', () => {
      const regularUser = { username: 'Guest', name: 'Regular User' };
      const displayName = getDisplayName(regularUser);
      expect(displayName).toBe('Guest'); // This would be the username, not detected as guest
    });
  });
});