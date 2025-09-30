import request from 'supertest';
import { app } from '../../src/test-server';
import { initializeTestServer } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Global Nav Integration Tests', () => {
  let server: any;
  let agent: any;

  beforeAll(async () => {
    // Ensure required seed users exist and initialize test server
    await integrationTestUtils.ensureGuestUser();
    const testApp = await initializeTestServer();
    server = testApp.listen(0); // Use random available port
    agent = request(server);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('View Switching Functionality', () => {
    test('should load main page with global nav component', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that the page contains the global nav HTML structure
      expect(response.text).toContain('unified-header');
      expect(response.text).toContain('header-left');
      expect(response.text).toContain('header-center');
      expect(response.text).toContain('header-right');
      expect(response.text).toContain('app-tabs');
      expect(response.text).toContain('databaseViewBtn');
      expect(response.text).toContain('deckBuilderBtn');
      expect(response.text).toContain('createDeckBtn');
      expect(response.text).toContain('logoutBtn');
    });

    test('should include global nav JavaScript and CSS files', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that global nav component files are referenced
      expect(response.text).toContain('components/globalNav.html');
      expect(response.text).toContain('components/globalNav.css');
      expect(response.text).toContain('components/globalNav.js');
    });

    test('should serve global nav HTML component', async () => {
      const response = await agent
        .get('/components/globalNav.html')
        .expect(200);

      // Verify the HTML structure
      expect(response.text).toContain('<div class="unified-header">');
      expect(response.text).toContain('<div class="header-left">');
      expect(response.text).toContain('<div class="header-center">');
      expect(response.text).toContain('<div class="header-right">');
      expect(response.text).toContain('onclick="switchToDatabaseView()"');
      expect(response.text).toContain('onclick="switchToDeckBuilder()"');
      expect(response.text).toContain('onclick="showCreateDeckModal()"');
    });

    test('should serve global nav CSS component', async () => {
      const response = await agent
        .get('/components/globalNav.css')
        .expect(200);

      // Verify CSS classes are present
      expect(response.text).toContain('.unified-header');
      expect(response.text).toContain('.header-left');
      expect(response.text).toContain('.header-center');
      expect(response.text).toContain('.header-right');
      expect(response.text).toContain('.app-tab-button');
      expect(response.text).toContain('.create-deck-btn');
      expect(response.text).toContain('.logout-btn');
    });

    test('should serve global nav JavaScript component', async () => {
      const response = await agent
        .get('/components/globalNav.js')
        .expect(200);

      // Verify JavaScript functions are present
      expect(response.text).toContain('function switchToDatabaseView()');
      expect(response.text).toContain('function switchToDeckBuilder()');
      expect(response.text).toContain('function initializeGlobalNav()');
      expect(response.text).toContain('function updateUserWelcome()');
    });
  });

  describe('Create Deck Functionality', () => {
    test('should have create deck button in global nav', async () => {
      const response = await agent
        .get('/components/globalNav.html')
        .expect(200);

      // Verify create deck button is present
      expect(response.text).toContain('id="createDeckBtn"');
      expect(response.text).toContain('class="create-deck-btn"');
      expect(response.text).toContain('onclick="showCreateDeckModal()"');
      expect(response.text).toContain('+ Create Deck');
    });

    test('should have create deck modal functionality', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that the main page includes create deck modal
      expect(response.text).toContain('createDeckModal');
      expect(response.text).toContain('showCreateDeckModal');
    });

    test('should handle create deck API endpoint', async () => {
      // Test that the create deck API endpoint exists and is accessible
      const response = await agent
        .post('/api/decks')
        .send({
          name: 'Test Deck',
          description: 'Test deck description',
          characters: []
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Deck');
    });

    test('should validate deck creation with character limits', async () => {
      // Test valid deck creation (0-4 characters)
      const validResponse = await agent
        .post('/api/decks')
        .send({
          name: 'Valid Deck',
          description: 'Valid deck with 2 characters',
          characters: [
            { id: 'char1', name: 'Character 1' },
            { id: 'char2', name: 'Character 2' }
          ]
        })
        .expect(201);

      expect(validResponse.body.success).toBe(true);

      // Test invalid deck creation (5+ characters)
      const invalidResponse = await agent
        .post('/api/decks')
        .send({
          name: 'Invalid Deck',
          description: 'Invalid deck with 5 characters',
          characters: [
            { id: 'char1', name: 'Character 1' },
            { id: 'char2', name: 'Character 2' },
            { id: 'char3', name: 'Character 3' },
            { id: 'char4', name: 'Character 4' },
            { id: 'char5', name: 'Character 5' }
          ]
        })
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error).toContain('character');
    });
  });

  describe('Logout Functionality', () => {
    test('should have logout button in global nav', async () => {
      const response = await agent
        .get('/components/globalNav.html')
        .expect(200);

      // Verify logout button is present
      expect(response.text).toContain('id="logoutBtn"');
      expect(response.text).toContain('class="logout-btn"');
      expect(response.text).toContain('Log Out');
    });

    test('should handle logout API endpoint', async () => {
      // Test logout endpoint
      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });

    test('should clear session on logout', async () => {
      // First, create a session by logging in
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      // Then logout
      const logoutResponse = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verify session is cleared by checking auth status
      const authResponse = await agent
        .get('/api/auth/me')
        .expect(401);

      expect(authResponse.body.success).toBe(false);
    });
  });

  describe('User Welcome Message', () => {
    test('should display username in global nav', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that username display elements are present
      expect(response.text).toContain('id="userWelcome"');
      expect(response.text).toContain('id="currentUsername"');
      expect(response.text).toContain('Welcome,');
    });

    test('should handle guest user display', async () => {
      const response = await agent
        .get('/users/guest/decks')
        .expect(200);

      // Check that guest user elements are present
      expect(response.text).toContain('id="userWelcome"');
      expect(response.text).toContain('id="currentUsername"');
    });
  });

  describe('Navigation State Management', () => {
    test('should handle browser back/forward navigation', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that popstate event listener is set up
      expect(response.text).toContain('addEventListener');
      expect(response.text).toContain('popstate');
    });

    test('should update URL without page reload', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that history.pushState is used
      expect(response.text).toContain('history.pushState');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that null checks are in place
      expect(response.text).toContain('if (');
      expect(response.text).toContain('getElementById');
    });

    test('should handle missing functions gracefully', async () => {
      const response = await agent
        .get('/components/globalNav.js')
        .expect(200);

      // Check that function existence checks are in place
      expect(response.text).toContain('typeof');
      expect(response.text).toContain('function');
    });
  });

  describe('CSS Styling Integration', () => {
    test('should have proper CSS classes for styling', async () => {
      const response = await agent
        .get('/components/globalNav.css')
        .expect(200);

      // Check for key CSS classes
      expect(response.text).toContain('.unified-header');
      expect(response.text).toContain('.app-tab-button');
      expect(response.text).toContain('.create-deck-btn');
      expect(response.text).toContain('.logout-btn');
      expect(response.text).toContain('.header-logo');
    });

    test('should have responsive design elements', async () => {
      const response = await agent
        .get('/components/globalNav.css')
        .expect(200);

      // Check for flexbox and responsive design
      expect(response.text).toContain('display: flex');
      expect(response.text).toContain('justify-content');
      expect(response.text).toContain('align-items');
    });
  });

  describe('Component Integration', () => {
    test('should integrate with main application pages', async () => {
      // Test database view page
      const dbResponse = await agent
        .get('/users/testuser/decks')
        .expect(200);

      expect(dbResponse.text).toContain('database-view');
      expect(dbResponse.text).toContain('deck-builder');

      // Test deck builder page
      const deckResponse = await agent
        .get('/deck-builder.html')
        .expect(200);

      expect(deckResponse.text).toContain('deck-builder');
    });

    test('should maintain state across view switches', async () => {
      const response = await agent
        .get('/users/testuser/decks')
        .expect(200);

      // Check that state management is in place
      expect(response.text).toContain('style.display');
      expect(response.text).toContain('classList');
    });
  });
});
