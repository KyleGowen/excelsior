import request from 'supertest';
import { Pool } from 'pg';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('Character Limit Validation API Tests', () => {
  let app: any;
  let pool: Pool;
  let testUserId: string | null = null;
  let authCookie: string = '';

  beforeAll(async () => {
    // Set up database connection
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });

    // Import and set up the Express app
    const { default: expressApp } = await import('../../dist/index.js');
    app = expressApp;

    // Create a test user
    testUserId = generateUUID();
    const userName = `Character Limit Test User ${generateUUID()}`;
    const userEmail = `character-limit-${generateUUID()}@example.com`;
    
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [testUserId, userName, userEmail, 'test_password_hash', 'USER']
    );

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: userName, password: 'test_password' });

    if (loginResponse.headers['set-cookie']) {
      authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Character Limit API Validation', () => {
    it('should allow creating a deck with 0 characters', async () => {
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
      // Get a character ID
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 1');
      const characterId = characterResult.rows[0].id;

      const deckName = `Test Deck 1 Character ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: [characterId] 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with 1 character created successfully');
    });

    it('should allow creating a deck with 4 characters (maximum)', async () => {
      // Get 4 character IDs
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 4');
      const characterIds = characterResult.rows.map(row => row.id);

      const deckName = `Test Deck 4 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: characterIds 
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deckName);

      console.log('✅ Deck with 4 characters created successfully');
    });

    it('should reject creating a deck with 5 characters', async () => {
      // Get 5 character IDs
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 5');
      const characterIds = characterResult.rows.map(row => row.id);

      const deckName = `Test Deck 5 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: characterIds 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 5 characters correctly rejected');
    });

    it('should reject creating a deck with 6+ characters', async () => {
      // Get 6 character IDs
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 6');
      const characterIds = characterResult.rows.map(row => row.id);

      const deckName = `Test Deck 6 Characters ${generateUUID()}`;
      
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({ 
          name: deckName, 
          characters: characterIds 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 6 characters correctly rejected');
    });

    it('should handle undefined characters array', async () => {
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
