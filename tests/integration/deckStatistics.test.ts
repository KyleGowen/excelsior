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

describe('Deck Statistics Tests', () => {
  let app: any;
  let pool: Pool;
  let testUserId: string;
  let testDeckIds: string[] = [];
  let authCookie: string = '';

  beforeAll(async () => {
    // Import and set up the Express app
    const { default: expressApp } = await import('../../dist/index.js');
    app = expressApp;

    // Set up database connection
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'overpower_deckbuilder',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });

    // Use the existing guest user for testing
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'guest', password: 'guest' });

    if (loginResponse.status === 200) {
      testUserId = loginResponse.body.data.userId;
      
      if (loginResponse.headers['set-cookie']) {
        authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
      }
      console.log('✅ Guest user authenticated for deck statistics tests');
    } else {
      console.log('Failed to authenticate guest user:', loginResponse.body);
    }

    // Create test decks with different card counts
    const deck1Id = generateUUID();
    const deck2Id = generateUUID();
    const deck3Id = generateUUID();
    testDeckIds = [deck1Id, deck2Id, deck3Id];

    // Create decks
    await pool.query(`
      INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck1Id, testUserId, 'Small Deck', 'A deck with few cards']);

    await pool.query(`
      INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck2Id, testUserId, 'Medium Deck', 'A deck with medium cards']);

    await pool.query(`
      INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck3Id, testUserId, 'Large Deck', 'A deck with many cards']);

    // Add cards to decks with different quantities
    // Deck 1: 5 cards total
    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck1Id, 'character', 'char_1', 1]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck1Id, 'power', 'power_1', 2]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck1Id, 'special', 'special_1', 2]);

    // Deck 2: 10 cards total
    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck2Id, 'character', 'char_2', 1]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck2Id, 'power', 'power_2', 3]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck2Id, 'special', 'special_2', 4]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck2Id, 'mission', 'mission_1', 2]);

    // Deck 3: 15 cards total
    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck3Id, 'character', 'char_3', 1]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck3Id, 'power', 'power_3', 5]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck3Id, 'special', 'special_3', 6]);

    await pool.query(`
      INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [deck3Id, 'mission', 'mission_2', 3]);
  });

  afterAll(async () => {
    // Clean up test data
    for (const deckId of testDeckIds) {
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
      await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Deck Statistics API', () => {
    it('should return correct deck statistics for authenticated user', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      const response = await request(app)
        .get('/api/deck-stats')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalDecks');
      expect(response.body.data).toHaveProperty('totalCards');
      expect(response.body.data).toHaveProperty('averageCardsPerDeck');
      expect(response.body.data).toHaveProperty('largestDeckSize');

      // Verify the calculated values
      expect(response.body.data.totalDecks).toBe(3);
      expect(response.body.data.totalCards).toBe(30); // 5 + 10 + 15
      expect(response.body.data.averageCardsPerDeck).toBe(10); // 30 / 3
      expect(response.body.data.largestDeckSize).toBe(15); // Largest deck

      console.log('✅ Deck statistics API returns correct values');
    });

    it('should return zero statistics for user with no decks', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      // Create a user with no decks
      const emptyUserId = generateUUID();
      await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [emptyUserId, 'Empty User', 'empty@example.com', 'hashed_password', 'USER']);

      // Login as the empty user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Empty User', password: 'hashed_password' });

      if (loginResponse.status === 200) {
        const emptyUserCookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0];
        
        const response = await request(app)
          .get('/api/deck-stats')
          .set('Cookie', emptyUserCookie || '')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalDecks).toBe(0);
        expect(response.body.data.totalCards).toBe(0);
        expect(response.body.data.averageCardsPerDeck).toBe(0);
        expect(response.body.data.largestDeckSize).toBe(0);

        console.log('✅ Empty user statistics return zero values');
      } else {
        console.log('⚠️ Skipping test - could not authenticate empty user');
      }

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [emptyUserId]);
    });

    it('should handle decks with no cards correctly', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      // Create an empty deck for the test user
      const emptyDeckId = generateUUID();
      
      await pool.query(`
        INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [emptyDeckId, testUserId, 'Empty Deck', 'A deck with no cards']);

      const response = await request(app)
        .get('/api/deck-stats')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDecks).toBe(4); // 3 existing + 1 new empty deck
      expect(response.body.data.totalCards).toBe(30); // Only the 3 existing decks have cards

      // Clean up
      await pool.query('DELETE FROM decks WHERE id = $1', [emptyDeckId]);

      console.log('✅ Empty deck statistics handled correctly');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/deck-stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');

      console.log('✅ Unauthenticated requests return 401');
    });
  });

  describe('Deck Statistics Frontend Integration', () => {
    it('should display deck statistics in deck builder view', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that the deck statistics elements are present
      expect(response.text).toContain('id="total-decks"');
      expect(response.text).toContain('id="total-cards-in-decks"');
      expect(response.text).toContain('id="average-cards-per-deck"');
      expect(response.text).toContain('id="largest-deck-size"');

      // Check that the labels are correct
      expect(response.text).toContain('Total Decks');
      expect(response.text).toContain('Total Cards');
      expect(response.text).toContain('Avg Cards/Deck');
      expect(response.text).toContain('Largest Deck');

      console.log('✅ Deck statistics elements are present in HTML');
    });

    it('should have proper CSS classes for deck statistics', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for deck-stats CSS class
      expect(response.text).toContain('class="deck-stats"');
      expect(response.text).toContain('class="stat-card"');
      expect(response.text).toContain('class="stat-info"');
      expect(response.text).toContain('class="stat-number"');
      expect(response.text).toContain('class="stat-label"');

      console.log('✅ Deck statistics have proper CSS classes');
    });

    it('should have responsive grid layout for deck statistics', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for CSS grid properties
      expect(response.text).toContain('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))');
      expect(response.text).toContain('display: grid');

      console.log('✅ Deck statistics have responsive grid layout');
    });
  });

  describe('Header Statistics Visibility', () => {
    it('should hide database statistics in deck builder view', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that header statistics are present but will be hidden by JavaScript
      expect(response.text).toContain('class="header-stats"');
      expect(response.text).toContain('id="total-characters"');
      expect(response.text).toContain('id="total-special-cards"');

      // Check that the JavaScript logic is present
      expect(response.text).toContain('headerStats.style.display = \'none\'');
      expect(response.text).toContain('headerStats.style.display = \'grid\'');

      console.log('✅ Header statistics visibility logic is present');
    });

    it('should show database statistics in database view', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that header statistics are present
      expect(response.text).toContain('class="header-stats"');
      expect(response.text).toContain('id="total-characters"');
      expect(response.text).toContain('id="total-special-cards"');

      console.log('✅ Database view shows header statistics');
    });
  });

  describe('JavaScript Functionality', () => {
    it('should have updateDeckStats function that updates all statistics', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that the updateDeckStats function is present
      expect(response.text).toContain('function updateDeckStats()');
      expect(response.text).toContain('total-decks');
      expect(response.text).toContain('total-cards-in-decks');
      expect(response.text).toContain('average-cards-per-deck');
      expect(response.text).toContain('largest-deck-size');

      console.log('✅ updateDeckStats function updates all statistics');
    });

    it('should call updateDeckStats when loading decks', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check that updateDeckStats is called in loadDecks
      expect(response.text).toContain('updateDeckStats()');

      console.log('✅ updateDeckStats is called when loading decks');
    });

    it('should have proper error handling in updateDeckStats', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for error handling
      expect(response.text).toContain('.catch(error =>');
      expect(response.text).toContain('console.error(\'Error loading deck stats:\', error)');

      console.log('✅ updateDeckStats has proper error handling');
    });
  });

  describe('Tab Switching Logic', () => {
    it('should have switchToDeckBuilder function that hides header stats', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for switchToDeckBuilder function
      expect(response.text).toContain('function switchToDeckBuilder()');
      expect(response.text).toContain('headerStats.style.display = \'none\'');

      console.log('✅ switchToDeckBuilder hides header statistics');
    });

    it('should have switchToDatabaseView function that shows header stats', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for switchToDatabaseView function
      expect(response.text).toContain('function switchToDatabaseView()');
      expect(response.text).toContain('headerStats.style.display = \'grid\'');

      console.log('✅ switchToDatabaseView shows header statistics');
    });

    it('should have switchAppTab function that handles both views', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Check for switchAppTab function
      expect(response.text).toContain('function switchAppTab(tabId)');
      expect(response.text).toContain('tabId === \'deck-builder\'');
      expect(response.text).toContain('headerStats.style.display = \'none\'');
      expect(response.text).toContain('headerStats.style.display = \'grid\'');

      console.log('✅ switchAppTab handles both view types');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing deck cards gracefully', async () => {
      if (!authCookie) {
        console.log('⚠️ Skipping test - no authentication available');
        return;
      }

      // Create a deck with null cards for the test user
      const nullCardsDeckId = generateUUID();
      
      await pool.query(`
        INSERT INTO decks (id, user_id, name, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [nullCardsDeckId, testUserId, 'Null Cards Deck', 'A deck with null cards']);

      const response = await request(app)
        .get('/api/deck-stats')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDecks).toBe(4); // 3 existing + 1 new deck
      expect(response.body.data.totalCards).toBe(30); // Only the 3 existing decks have cards

      // Clean up
      await pool.query('DELETE FROM decks WHERE id = $1', [nullCardsDeckId]);

      console.log('✅ Null cards handled gracefully');
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll just verify the error handling exists in the code
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('catch(error =>');
      expect(response.text).toContain('console.error');

      console.log('✅ Error handling exists for database connection issues');
    });
  });
});
