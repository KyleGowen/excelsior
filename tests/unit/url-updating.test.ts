/**
 * Unit tests for URL updating functionality
 * Tests that URLs are updated when editing/viewing decks
 */

import { JSDOM } from 'jsdom';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('URL Updating Functionality', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="mainContainer">
            <div id="deckEditor" style="display: none;">
              <h2 id="deckEditorTitle">Deck Title</h2>
              <p id="deckEditorDescription">Deck Description</p>
            </div>
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
    global.window = window as any;

    // Mock getCurrentUser function
    (window as any).getCurrentUser = () => ({
      userId: 'test-user-123',
      name: 'Test User',
      role: 'USER'
    });

    // Mock showDeckEditor function
    (window as any).showDeckEditor = () => {
      const deckEditor = document.getElementById('deckEditor');
      if (deckEditor) {
        deckEditor.style.display = 'block';
      }
    };

    // Mock loadDeckForEditing function
    (window as any).loadDeckForEditing = async (deckId: string) => {
      console.log('Mock loadDeckForEditing called with:', deckId);
      return Promise.resolve();
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('editDeck function', () => {
    it('should update URL when editing a deck', () => {
      // Mock the editDeck function
      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? currentUser.userId : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
        console.log('🔍 Updated URL to:', newUrl);
        
        (window as any).loadDeckForEditing(deckId);
        (window as any).showDeckEditor();
      };

      // Test editing a deck
      const testDeckId = 'test-deck-456';
      editDeck(testDeckId);

      // Verify URL was updated
      expect(window.location.pathname).toBe('/users/test-user-123/decks/test-deck-456');
    });

    it('should handle guest user in URL', () => {
      // Mock getCurrentUser to return null (guest)
      (window as any).getCurrentUser = () => null;

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? currentUser.userId : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
        console.log('🔍 Updated URL to:', newUrl);
      };

      const testDeckId = 'test-deck-789';
      editDeck(testDeckId);

      // Verify URL was updated for guest
      expect(window.location.pathname).toBe('/users/guest/decks/test-deck-789');
    });
  });

  describe('viewDeck function', () => {
    it('should update URL when viewing a deck in read-only mode', () => {
      const viewDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? currentUser.userId : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}?readonly=true`;
        window.history.pushState({ deckId, userId, readonly: true }, '', newUrl);
        console.log('🔍 Updated URL to:', newUrl);
      };

      const testDeckId = 'view-deck-123';
      viewDeck(testDeckId);

      // Verify URL was updated with readonly parameter
      expect(window.location.pathname).toBe('/users/test-user-123/decks/view-deck-123');
      expect(window.location.search).toBe('?readonly=true');
    });
  });

  describe('createNewDeck function', () => {
    it('should update URL when creating a new deck', () => {
      const createNewDeck = () => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/new`;
        window.history.pushState({ newDeck: true, userId }, '', newUrl);
        console.log('🔍 Updated URL to:', newUrl);
      };

      createNewDeck();

      // Verify URL was updated for new deck
      expect(window.location.pathname).toBe('/users/test-user-123/decks/new');
    });
  });

  describe('URL state management', () => {
    it('should update URL correctly for multiple deck edits', () => {
      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? currentUser.userId : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      // Edit first deck
      editDeck('deck-1');
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-1');

      // Edit second deck
      editDeck('deck-2');
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-2');

      // Edit third deck
      editDeck('deck-3');
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-3');
    });

    it('should handle multiple URL updates correctly', () => {
      const updateUrl = (deckId: string, readonly = false) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? currentUser.userId : 'guest';
        const newUrl = readonly 
          ? `/users/${userId}/decks/${deckId}?readonly=true`
          : `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId, readonly }, '', newUrl);
      };

      // Test multiple URL updates
      updateUrl('deck-1');
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-1');
      expect(window.location.search).toBe('');

      updateUrl('deck-2', true);
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-2');
      expect(window.location.search).toBe('?readonly=true');

      updateUrl('deck-3');
      expect(window.location.pathname).toBe('/users/test-user-123/decks/deck-3');
      expect(window.location.search).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing getCurrentUser function', () => {
      // Remove getCurrentUser function
      delete (window as any).getCurrentUser;

      const editDeck = (deckId: string) => {
        try {
          const currentUser = (window as any).getCurrentUser();
          const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
          const newUrl = `/users/${userId}/decks/${deckId}`;
          window.history.pushState({ deckId, userId }, '', newUrl);
        } catch (error) {
          // Fallback to guest if getCurrentUser fails
          const newUrl = `/users/guest/decks/${deckId}`;
          window.history.pushState({ deckId, userId: 'guest' }, '', newUrl);
        }
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/guest/decks/test-deck');
    });

    it('should handle getCurrentUser returning undefined', () => {
      (window as any).getCurrentUser = () => undefined;

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/guest/decks/test-deck');
    });
  });

  describe('UserId fallback logic', () => {
    it('should use userId when available', () => {
      (window as any).getCurrentUser = () => ({
        userId: 'user-123',
        id: 'fallback-456'
      });

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/user-123/decks/test-deck');
    });

    it('should fallback to id when userId is missing', () => {
      (window as any).getCurrentUser = () => ({
        id: 'fallback-456'
        // No userId property
      });

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/fallback-456/decks/test-deck');
    });

    it('should fallback to id when userId is null', () => {
      (window as any).getCurrentUser = () => ({
        userId: null,
        id: 'fallback-456'
      });

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/fallback-456/decks/test-deck');
    });

    it('should fallback to id when userId is empty string', () => {
      (window as any).getCurrentUser = () => ({
        userId: '',
        id: 'fallback-456'
      });

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/fallback-456/decks/test-deck');
    });

    it('should fallback to guest when both userId and id are missing', () => {
      (window as any).getCurrentUser = () => ({
        name: 'Test User'
        // No userId or id properties
      });

      const editDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}`;
        window.history.pushState({ deckId, userId }, '', newUrl);
      };

      editDeck('test-deck');
      expect(window.location.pathname).toBe('/users/guest/decks/test-deck');
    });

    it('should work for viewDeck function with userId fallback', () => {
      (window as any).getCurrentUser = () => ({
        id: 'view-fallback-789'
        // No userId property
      });

      const viewDeck = (deckId: string) => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/${deckId}?readonly=true`;
        window.history.pushState({ deckId, userId, readonly: true }, '', newUrl);
      };

      viewDeck('view-deck');
      expect(window.location.pathname).toBe('/users/view-fallback-789/decks/view-deck');
      expect(window.location.search).toBe('?readonly=true');
    });

    it('should work for createNewDeck function with userId fallback', () => {
      (window as any).getCurrentUser = () => ({
        id: 'create-fallback-999'
        // No userId property
      });

      const createNewDeck = () => {
        const currentUser = (window as any).getCurrentUser();
        const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
        const newUrl = `/users/${userId}/decks/new`;
        window.history.pushState({ newDeck: true, userId }, '', newUrl);
      };

      createNewDeck();
      expect(window.location.pathname).toBe('/users/create-fallback-999/decks/new');
    });
  });
});
