import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Editor Search - New Deck Integration', () => {
  let testUser: any;
  let testDeckId: string | null = null;
  let authCookie: string;
  let testUsername: string;

  beforeAll(async () => {
    // Ensure guest user exists
    await integrationTestUtils.ensureGuestUser();
    
    // Create a test user
    const timestamp = Date.now();
    testUsername = `search-test-user-${timestamp}`;
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    testUser = await userRepository.createUser(
      testUsername,
      `search-test-${timestamp}@example.com`,
      'testpass123',
      'USER'
    );
    
    // Track the test user for cleanup
    integrationTestUtils.trackTestUser(testUser.id);
    
    // Login as test user to get session cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: 'testpass123'
      });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.status, loginResponse.body);
    }
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Extract session cookie
    const cookies = loginResponse.headers['set-cookie'];
    authCookie = cookies[0].split(';')[0];
    
    console.log('✅ Test user created and logged in:', testUser.id);
  });

  afterAll(async () => {
    // Cleanup is handled automatically by the global cleanup functions
    // No manual cleanup needed
    console.log('✅ Test completed - cleanup handled automatically');
  });

  beforeEach(async () => {
    // Reset test deck ID for each test
    testDeckId = null;
  });

  it('should create a new deck and add cards via API before saving', async () => {
    console.log('🧪 Testing deck creation and card addition via API...');

    // Step 1: Create a new deck
    const createDeckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', authCookie)
      .send({
        name: 'Search Test Deck',
        description: 'A deck for testing search functionality'
      });

    expect(createDeckResponse.status).toBe(201);
    expect(createDeckResponse.body.success).toBe(true);
    testDeckId = createDeckResponse.body.data.id;
    
    // Track the test deck for cleanup
    if (testDeckId) {
      integrationTestUtils.trackTestDeck(testDeckId);
    }
    
    console.log('✅ New deck created with ID:', testDeckId);

    // Step 2: Verify the deck is empty initially
    const getDeckResponse = await request(app)
      .get(`/api/decks/${testDeckId}`)
      .set('Cookie', authCookie);

    expect(getDeckResponse.status).toBe(200);
    expect(getDeckResponse.body.success).toBe(true);
    expect(getDeckResponse.body.data.cards).toHaveLength(0);
    console.log('✅ Confirmed initial deck is empty');

    // Step 3: Search for cards using the individual card APIs (like the frontend does)
    const charactersResponse = await request(app)
      .get('/api/characters')
      .set('Cookie', authCookie);

    expect(charactersResponse.status).toBe(200);
    expect(charactersResponse.body.success).toBe(true);
    expect(charactersResponse.body.data.length).toBeGreaterThan(0);
    console.log(`✅ Found ${charactersResponse.body.data.length} characters`);

    // Find a character that matches "mina" (like the frontend search would)
    const minaCharacters = charactersResponse.body.data.filter((char: any) => 
      char.name && char.name.toLowerCase().includes('mina')
    );
    expect(minaCharacters.length).toBeGreaterThan(0);
    console.log(`✅ Found ${minaCharacters.length} characters matching "mina"`);

    // Step 4: Add the first matching character to the deck
    const firstCard = minaCharacters[0];
    const addCardResponse = await request(app)
      .post(`/api/decks/${testDeckId}/cards`)
      .set('Cookie', authCookie)
      .send({
        cardId: firstCard.id,
        cardType: 'character' // Characters are always type 'character'
      });

    expect(addCardResponse.status).toBe(200);
    expect(addCardResponse.body.success).toBe(true);
    console.log('✅ First card added to deck:', firstCard.name);

    // Step 5: Verify the card was added to the deck
    const getDeckAfterFirstResponse = await request(app)
      .get(`/api/decks/${testDeckId}`)
      .set('Cookie', authCookie);

    expect(getDeckAfterFirstResponse.status).toBe(200);
    expect(getDeckAfterFirstResponse.body.success).toBe(true);
    expect(getDeckAfterFirstResponse.body.data.cards).toHaveLength(1);
    expect(getDeckAfterFirstResponse.body.data.cards[0].cardId).toBe(firstCard.id);
    console.log('✅ Verified first card is in deck');

    // Step 6: Add a second card from search results
    if (minaCharacters.length > 1) {
      const secondCard = minaCharacters[1];
      const addSecondCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardId: secondCard.id,
          cardType: 'character' // Characters are always type 'character'
        });

      expect(addSecondCardResponse.status).toBe(200);
      expect(addSecondCardResponse.body.success).toBe(true);
      console.log('✅ Second card added to deck:', secondCard.name);

      // Step 7: Verify both cards are in the deck
      const getDeckAfterSecondResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);

      expect(getDeckAfterSecondResponse.status).toBe(200);
      expect(getDeckAfterSecondResponse.body.success).toBe(true);
      expect(getDeckAfterSecondResponse.body.data.cards).toHaveLength(2);
      console.log('✅ Verified both cards are in deck');
    }

    // Step 8: Test searching for different card types
    const specialCardsResponse = await request(app)
      .get('/api/special-cards')
      .set('Cookie', authCookie);

    expect(specialCardsResponse.status).toBe(200);
    expect(specialCardsResponse.body.success).toBe(true);
    expect(specialCardsResponse.body.data.length).toBeGreaterThan(0);
    console.log(`✅ Found ${specialCardsResponse.body.data.length} special cards`);

    // Step 9: Verify deck statistics are updated
    const finalDeckResponse = await request(app)
      .get(`/api/decks/${testDeckId}`)
      .set('Cookie', authCookie);

    expect(finalDeckResponse.status).toBe(200);
    expect(finalDeckResponse.body.success).toBe(true);
    expect(finalDeckResponse.body.data.cards.length).toBeGreaterThan(0);
    
    // Verify deck metadata is updated
    expect(finalDeckResponse.body.data.metadata.cardCount).toBeGreaterThan(0);
    console.log('✅ Deck statistics updated correctly');

    console.log('🎉 Test completed successfully - search and card addition works via API!');
  });

  it('should handle search for different card types', async () => {
    console.log('🧪 Testing search for different card types...');

    // Test searching for characters
    const characterSearchResponse = await request(app)
      .get('/api/characters')
      .set('Cookie', authCookie);

    expect(characterSearchResponse.status).toBe(200);
    expect(characterSearchResponse.body.success).toBe(true);
    expect(characterSearchResponse.body.data.length).toBeGreaterThan(0);
    console.log(`✅ Found ${characterSearchResponse.body.data.length} character cards`);

    // Test searching for special cards
    const specialSearchResponse = await request(app)
      .get('/api/special-cards')
      .set('Cookie', authCookie);

    expect(specialSearchResponse.status).toBe(200);
    expect(specialSearchResponse.body.success).toBe(true);
    expect(specialSearchResponse.body.data.length).toBeGreaterThan(0);
    console.log(`✅ Found ${specialSearchResponse.body.data.length} special cards`);

    // Test searching for power cards
    const powerSearchResponse = await request(app)
      .get('/api/power-cards')
      .set('Cookie', authCookie);

    expect(powerSearchResponse.status).toBe(200);
    expect(powerSearchResponse.body.success).toBe(true);
    expect(powerSearchResponse.body.data.length).toBeGreaterThan(0);
    console.log(`✅ Found ${powerSearchResponse.body.data.length} power cards`);

    console.log('🎉 Different card type searches work correctly!');
  });

  it('should handle empty search results gracefully', async () => {
    console.log('🧪 Testing empty search results...');

    // Test searching for characters and filtering for something that doesn't exist
    const charactersResponse = await request(app)
      .get('/api/characters')
      .set('Cookie', authCookie);

    expect(charactersResponse.status).toBe(200);
    expect(charactersResponse.body.success).toBe(true);
    
    // Filter for something that doesn't exist (like the frontend search would)
    const emptyResults = charactersResponse.body.data.filter((char: any) => 
      char.name && char.name.toLowerCase().includes('nonexistentcard12345')
    );
    expect(emptyResults).toHaveLength(0);
    console.log('✅ Empty search results handled correctly');

    // Test that we can still get all characters when needed
    expect(charactersResponse.body.data.length).toBeGreaterThan(0);
    console.log('✅ Can still retrieve all characters when needed');

    console.log('🎉 Empty search results handled gracefully!');
  });
});
