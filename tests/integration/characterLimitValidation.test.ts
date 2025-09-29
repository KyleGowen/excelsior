import request from 'supertest';
import { app } from '../setup-integration';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('Character Limit Validation API Tests', () => {
  let testUserId: string | null = null;
  let authCookie: string = '';

  beforeAll(async () => {
    // app is imported from setup-integration

    // Use the existing guest user for testing
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'guest', password: 'guest' });

    if (loginResponse.status === 200) {
      testUserId = loginResponse.body.data.userId;
      
      if (loginResponse.headers['set-cookie']) {
        authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
      }
      console.log('✅ Guest user authenticated for character limit tests');
    } else {
      console.log('Failed to authenticate guest user:', loginResponse.body);
    }
  });

  afterAll(async () => {
    // Clean up test data through API if possible
    if (testUserId && authCookie) {
      try {
        // Get user's decks and delete them
        const decksResponse = await request(app)
          .get('/api/decks')
          .set('Cookie', authCookie);
        
        if (decksResponse.status === 200) {
          for (const deck of decksResponse.body.data) {
            await request(app)
              .delete(`/api/decks/${deck.id}`)
              .set('Cookie', authCookie);
          }
        }
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Character Limit API Validation', () => {
    it('should allow creating a deck with 0 characters', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck 0 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ name: deckName });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with 0 characters created successfully');
    });

    it('should allow creating a deck with 1 character', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck 1 Character ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: ['character1'] 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with 1 character created successfully');
    });

    it('should allow creating a deck with 4 characters (maximum)', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck 4 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: ['char1', 'char2', 'char3', 'char4'] 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with 4 characters created successfully');
    });

    it('should reject creating a deck with 5 characters', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck 5 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: ['char1', 'char2', 'char3', 'char4', 'char5'] 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 5 characters correctly rejected');
    });

    it('should reject creating a deck with 6+ characters', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck 6+ Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: ['char1', 'char2', 'char3', 'char4', 'char5', 'char6'] 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 6+ characters correctly rejected');
    });

    it('should handle undefined characters array', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck Undefined Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: undefined 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with undefined characters array created successfully');
    });

    it('should handle null characters array', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck Null Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: null 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with null characters array created successfully');
    });

    it('should handle empty characters array', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const deckName = `Test Deck Empty Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: [] 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with empty characters array created successfully');
    });
  });
});
