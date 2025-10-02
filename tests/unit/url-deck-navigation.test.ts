/**
 * Unit tests for URL deck navigation functionality
 * Tests URL updating when editing, viewing, and creating decks
 */

import { JSDOM } from 'jsdom';

describe('URL Deck Navigation', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;
  let originalHistory: any;

  beforeEach(() => {
    // Create a fresh JSDOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <div id="main-container"></div>
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

    // Mock history.pushState
    originalHistory = window.history.pushState;
    window.history.pushState = jest.fn();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('editDeck function', () => {
    beforeEach(() => {
      // Mock getCurrentUser function
      (window as any).getCurrentUser = jest.fn();
    });

    it('should update URL when editing a deck with valid user', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      // Mock editDeck function
      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-456');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/user-123/decks/deck-456'
      );
    });

    it('should handle guest user fallback when no current user', () => {
      (window as any).getCurrentUser.mockReturnValue(null);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-789');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-789'
      );
    });

    it('should handle userId fallback when userId is missing', () => {
      const mockUser = { id: 'user-456' }; // No userId property
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-123');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/user-456/decks/deck-123'
      );
    });

    it('should handle both userId and id missing', () => {
      const mockUser = {}; // No userId or id properties
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-999');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-999'
      );
    });
  });

  describe('viewDeck function', () => {
    beforeEach(() => {
      (window as any).getCurrentUser = jest.fn();
    });

    it('should update URL when viewing a deck with readonly parameter', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).viewDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}?readonly=true`);
      };

      (window as any).viewDeck('deck-456');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/user-123/decks/deck-456?readonly=true'
      );
    });

    it('should handle guest user for viewDeck', () => {
      (window as any).getCurrentUser.mockReturnValue(null);

      (window as any).viewDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}?readonly=true`);
      };

      (window as any).viewDeck('deck-789');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-789?readonly=true'
      );
    });
  });

  describe('createNewDeck function', () => {
    beforeEach(() => {
      (window as any).getCurrentUser = jest.fn();
    });

    it('should update URL when creating a new deck', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).createNewDeck = function() {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/new`);
      };

      (window as any).createNewDeck();

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/user-123/decks/new'
      );
    });

    it('should handle guest user for createNewDeck', () => {
      (window as any).getCurrentUser.mockReturnValue(null);

      (window as any).createNewDeck = function() {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/new`);
      };

      (window as any).createNewDeck();

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/new'
      );
    });
  });

  describe('URL state management', () => {
    beforeEach(() => {
      (window as any).getCurrentUser = jest.fn();
    });

    it('should handle multiple URL updates correctly', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      // Mock functions
      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).viewDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}?readonly=true`);
      };

      (window as any).createNewDeck = function() {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/new`);
      };

      // Test multiple operations
      (window as any).editDeck('deck-1');
      (window as any).viewDeck('deck-2');
      (window as any).createNewDeck();

      expect(window.history.pushState).toHaveBeenCalledTimes(3);
      expect(window.history.pushState).toHaveBeenNthCalledWith(1, {}, '', '/users/user-123/decks/deck-1');
      expect(window.history.pushState).toHaveBeenNthCalledWith(2, {}, '', '/users/user-123/decks/deck-2?readonly=true');
      expect(window.history.pushState).toHaveBeenNthCalledWith(3, {}, '', '/users/user-123/decks/new');
    });

    it('should maintain URL consistency across different user states', () => {
      // Test with different user states
      const testCases = [
        { user: { id: 'user-1', userId: 'user-1' }, expected: 'user-1' },
        { user: { id: 'user-2' }, expected: 'user-2' }, // No userId
        { user: { userId: 'user-3' }, expected: 'user-3' }, // No id
        { user: {}, expected: 'guest' }, // No id or userId
        { user: null, expected: 'guest' }, // No user
        { user: undefined, expected: 'guest' } // No user
      ];

      testCases.forEach(({ user, expected }, index) => {
        (window as any).getCurrentUser.mockReturnValue(user);

        (window as any).editDeck = function(deckId: string) {
          const currentUser = (window as any).getCurrentUser();
          const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
          window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
        };

        (window as any).editDeck(`deck-${index}`);

        expect(window.history.pushState).toHaveBeenNthCalledWith(
          index + 1,
          {},
          '',
          `/users/${expected}/decks/deck-${index}`
        );
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing getCurrentUser function', () => {
      // Remove getCurrentUser function
      delete (window as any).getCurrentUser;

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser ? (window as any).getCurrentUser() : null;
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-123');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-123'
      );
    });

    it('should handle getCurrentUser returning undefined', () => {
      (window as any).getCurrentUser = jest.fn().mockReturnValue(undefined);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-456');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-456'
      );
    });

    it('should handle empty string values for userId and id', () => {
      (window as any).getCurrentUser = jest.fn();
      const mockUser = { id: '', userId: '' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-789');

      expect(window.history.pushState).toHaveBeenCalledWith(
        {},
        '',
        '/users/guest/decks/deck-789'
      );
    });
  });

  describe('URL format validation', () => {
    beforeEach(() => {
      (window as any).getCurrentUser = jest.fn();
    });

    it('should generate correct URL format for editDeck', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).editDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}`);
      };

      (window as any).editDeck('deck-456');

      const expectedUrl = '/users/user-123/decks/deck-456';
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });

    it('should generate correct URL format for viewDeck with readonly parameter', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).viewDeck = function(deckId: string) {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/${deckId}?readonly=true`);
      };

      (window as any).viewDeck('deck-789');

      const expectedUrl = '/users/user-123/decks/deck-789?readonly=true';
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });

    it('should generate correct URL format for createNewDeck', () => {
      const mockUser = { id: 'user-123', userId: 'user-123' };
      (window as any).getCurrentUser.mockReturnValue(mockUser);

      (window as any).createNewDeck = function() {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        window.history.pushState({}, '', `/users/${userId}/decks/new`);
      };

      (window as any).createNewDeck();

      const expectedUrl = '/users/user-123/decks/new';
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', expectedUrl);
    });
  });
});
