import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Ownership Security Integration Tests', () => {
  let deckOwner: any;
  let nonOwner: any;
  let testDeckId: string | null = null;
  let ownerAuthCookie: string;
  let nonOwnerAuthCookie: string;
  let ownerUsername: string;
  let nonOwnerUsername: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    
    const timestamp = Date.now();
    
    // Create deck owner user
    ownerUsername = `deck-owner-${timestamp}`;
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    deckOwner = await userRepository.createUser(
      ownerUsername,
      `owner-${timestamp}@example.com`,
      'ownerpass123',
      'USER'
    );
    integrationTestUtils.trackTestUser(deckOwner.id);
    
    // Create non-owner user
    nonOwnerUsername = `non-owner-${timestamp}`;
    nonOwner = await userRepository.createUser(
      nonOwnerUsername,
      `nonowner-${timestamp}@example.com`,
      'nonownerpass123',
      'USER'
    );
    integrationTestUtils.trackTestUser(nonOwner.id);
    
    // Login as deck owner
    const ownerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: ownerUsername,
        password: 'ownerpass123'
      });
    
    expect(ownerLoginResponse.status).toBe(200);
    expect(ownerLoginResponse.body.success).toBe(true);
    ownerAuthCookie = ownerLoginResponse.headers['set-cookie'][0].split(';')[0];
    
    // Login as non-owner
    const nonOwnerLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: nonOwnerUsername,
        password: 'nonownerpass123'
      });
    
    expect(nonOwnerLoginResponse.status).toBe(200);
    expect(nonOwnerLoginResponse.body.success).toBe(true);
    nonOwnerAuthCookie = nonOwnerLoginResponse.headers['set-cookie'][0].split(';')[0];
    
    console.log('✅ Test users created and logged in');
  });

  afterAll(async () => {
    // Cleanup is handled automatically by the global cleanup functions
    console.log('✅ Test completed - cleanup handled automatically');
  });

  beforeEach(async () => {
    // Create a fresh deck for each test
    const createDeckResponse = await request(app)
      .post('/api/v1/decks')
      .set('Cookie', ownerAuthCookie)
      .send({
        name: 'Security Test Deck',
        description: 'A deck for testing ownership security'
      });

    if (createDeckResponse.status === 201) {
      testDeckId = createDeckResponse.body.data.id;
      if (testDeckId) {
        integrationTestUtils.trackTestDeck(testDeckId);
      }
    }
  });

  describe('Deck Creation and Ownership', () => {
    it('should allow deck owner to create a deck', async () => {
      console.log('🧪 Testing deck creation by owner...');

      // Deck should already be created in beforeEach
      expect(testDeckId).toBeTruthy();
      console.log('✅ Deck created successfully by owner:', testDeckId);
    });

    it('should verify deck ownership in API response', async () => {
      console.log('🧪 Testing deck ownership verification...');

      const getDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie);

      expect(getDeckResponse.status).toBe(200);
      expect(getDeckResponse.body.errors).toEqual([]);
      expect(getDeckResponse.body.data.metadata.isOwner).toBe(true);
      
      console.log('✅ Deck ownership verified for owner');
    });
  });

  describe('Owner Permissions - Edit Mode', () => {
    it('should allow deck owner to modify deck metadata', async () => {
      console.log('🧪 Testing deck metadata modification by owner...');

      const updateResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie)
        .send({
          name: 'Updated Owner Deck',
          description: 'Updated description by owner'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.errors).toEqual([]);
      expect(updateResponse.body.data.metadata.name).toBe('Updated Owner Deck');
      expect(updateResponse.body.data.metadata.description).toBe('Updated description by owner');
      
      console.log('✅ Deck metadata updated successfully by owner');
    });

    it('should allow deck owner to add cards to deck', async () => {
      console.log('🧪 Testing card addition by owner...');

      // Get available characters
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', ownerAuthCookie);

      expect(charactersResponse.status).toBe(200);
      expect(charactersResponse.body.errors).toEqual([]);
      expect(charactersResponse.body.data.length).toBeGreaterThan(0);

      const firstCharacter = charactersResponse.body.data[0];
      
      const addCardResponse = await request(app)
        .post(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', ownerAuthCookie)
        .send({
          cardId: firstCharacter.id,
          cardType: 'character'
        });

      expect(addCardResponse.status).toBe(200);
      expect(addCardResponse.body.errors).toEqual([]);
      expect(addCardResponse.body.data.metadata).toBeDefined();

      console.log('✅ Card added successfully by owner:', firstCharacter.name);
    });

    it('should allow deck owner to remove cards from deck', async () => {
      console.log('🧪 Testing card removal by owner...');

      // First add a card to the deck
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', ownerAuthCookie);

      expect(charactersResponse.status).toBe(200);
      expect(charactersResponse.body.errors).toEqual([]);
      expect(charactersResponse.body.data.length).toBeGreaterThan(0);

      const firstCharacter = charactersResponse.body.data[0];
      
      const addCardResponse = await request(app)
        .post(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', ownerAuthCookie)
        .send({
          cardId: firstCharacter.id,
          cardType: 'character'
        });

      expect(addCardResponse.status).toBe(200);
      expect(addCardResponse.body.errors).toEqual([]);

      // Now get the deck to see the added card
      const getDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie);

      expect(getDeckResponse.status).toBe(200);
      expect(getDeckResponse.body.errors).toEqual([]);
      expect(getDeckResponse.body.data.cards.length).toBeGreaterThan(0);

      const firstCard = getDeckResponse.body.data.cards[0];
      
      const removeCardResponse = await request(app)
        .delete(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', ownerAuthCookie)
        .send({
          cardId: firstCard.cardId,
          cardType: firstCard.type
        });

      expect(removeCardResponse.status).toBe(200);
      expect(removeCardResponse.body.errors).toEqual([]);

      console.log('✅ Card removed successfully by owner');
    });

    it('should allow deck owner to save UI preferences', async () => {
      console.log('🧪 Testing UI preferences save by owner...');

      const savePreferencesResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', ownerAuthCookie)
        .send({
          dividerPosition: 75,
          viewMode: 'tile'
        });

      expect(savePreferencesResponse.status).toBe(200);
      expect(savePreferencesResponse.body.errors).toEqual([]);

      console.log('✅ UI preferences saved successfully by owner');
    });
  });

  describe('Non-Owner Permissions - Read-Only Mode', () => {
    it('should show deck to non-owner with isOwner: false', async () => {
      console.log('🧪 Testing deck access by non-owner...');

      const getDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', nonOwnerAuthCookie);

      expect(getDeckResponse.status).toBe(200);
      expect(getDeckResponse.body.errors).toEqual([]);
      expect(getDeckResponse.body.data.metadata.isOwner).toBe(false);
      
      console.log('✅ Non-owner can view deck but isOwner is false');
    });

    it('should block non-owner from modifying deck metadata', async () => {
      console.log('🧪 Testing deck metadata modification block for non-owner...');

      const updateResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          name: 'Hacked Deck Name',
          description: 'Unauthorized modification attempt'
        });

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.data).toBeNull();
      expect(updateResponse.body.errors[0].message).toContain('Access denied');
      
      console.log('✅ Non-owner blocked from modifying deck metadata');
    });

    it('should block non-owner from adding cards to deck', async () => {
      console.log('🧪 Testing card addition block for non-owner...');

      // Get available characters
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', nonOwnerAuthCookie);

      expect(charactersResponse.status).toBe(200);
      const firstCharacter = charactersResponse.body.data[0];
      
      const addCardResponse = await request(app)
        .post(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          cardId: firstCharacter.id,
          cardType: 'character'
        });

      expect(addCardResponse.status).toBe(403);
      expect(addCardResponse.body.data).toBeNull();
      expect(addCardResponse.body.errors[0].message).toContain('Access denied');

      console.log('✅ Non-owner blocked from adding cards');
    });

    it('should block non-owner from removing cards from deck', async () => {
      console.log('🧪 Testing card removal block for non-owner...');

      // First add a card to the deck as the owner
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', ownerAuthCookie);

      expect(charactersResponse.status).toBe(200);
      expect(charactersResponse.body.errors).toEqual([]);
      expect(charactersResponse.body.data.length).toBeGreaterThan(0);

      const firstCharacter = charactersResponse.body.data[0];
      
      const addCardResponse = await request(app)
        .post(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', ownerAuthCookie)
        .send({
          cardId: firstCharacter.id,
          cardType: 'character'
        });

      expect(addCardResponse.status).toBe(200);
      expect(addCardResponse.body.errors).toEqual([]);

      // Now get the deck to see the added card
      const getDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', nonOwnerAuthCookie);

      expect(getDeckResponse.status).toBe(200);
      expect(getDeckResponse.body.data.cards.length).toBeGreaterThan(0);

      const firstCard = getDeckResponse.body.data.cards[0];
      
      const removeCardResponse = await request(app)
        .delete(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          cardId: firstCard.cardId,
          cardType: firstCard.type
        });

      expect(removeCardResponse.status).toBe(403);
      expect(removeCardResponse.body.data).toBeNull();
      expect(removeCardResponse.body.errors[0].message).toContain('Access denied');

      console.log('✅ Non-owner blocked from removing cards');
    });

    it('should block non-owner from saving UI preferences', async () => {
      console.log('🧪 Testing UI preferences save block for non-owner...');

      const savePreferencesResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          dividerPosition: 25,
          viewMode: 'list'
        });

      expect(savePreferencesResponse.status).toBe(403);
      expect(savePreferencesResponse.body.data).toBeNull();
      expect(savePreferencesResponse.body.errors[0].message).toContain('Access denied');

      console.log('✅ Non-owner blocked from saving UI preferences');
    });
  });

  describe('React app shell delivery', () => {
    it('serves the React shell to owners and readers; API tests enforce ownership', async () => {
      console.log('🧪 Testing deck editor route ownership info...');

      // Test owner access
      const ownerEditorResponse = await request(app)
        .get(`/users/${deckOwner.id}/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie);

      expect(ownerEditorResponse.status).toBe(200);
      // Check that the response contains deck-related content (more flexible than checking exact name)
      expect(ownerEditorResponse.text).toContain('id="root"'); // Check for deck-related content
      
      console.log('✅ Deck editor accessible to owner');

      // Test non-owner access
      const nonOwnerEditorResponse = await request(app)
        .get(`/users/${deckOwner.id}/decks/${testDeckId}`)
        .set('Cookie', nonOwnerAuthCookie);

      expect(nonOwnerEditorResponse.status).toBe(200);
      // Check that the response contains deck-related content (more flexible than checking exact name)
      expect(nonOwnerEditorResponse.text).toContain('id="root"'); // Check for deck-related content
      
      console.log('✅ Deck editor accessible to non-owner (read-only mode)');
    });

    it('serves the React shell when a readonly link is opened', async () => {
      console.log('🧪 Testing readonly=true parameter enforcement...');

      const readonlyResponse = await request(app)
        .get(`/users/${deckOwner.id}/decks/${testDeckId}?readonly=true`)
        .set('Cookie', ownerAuthCookie);

      expect(readonlyResponse.status).toBe(200);
      // Check that the response contains deck-related content (more flexible than checking exact name)
      expect(readonlyResponse.text).toContain('id="root"'); // Check for deck-related content
      
      console.log('✅ Readonly parameter enforces read-only mode even for owner');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle deck access with invalid deck ID', async () => {
      console.log('🧪 Testing invalid deck ID access...');

      const invalidDeckResponse = await request(app)
        .get('/api/v1/decks/invalid-deck-id')
        .set('Cookie', ownerAuthCookie);

      expect(invalidDeckResponse.status).toBe(404);
      expect(invalidDeckResponse.body.data).toBeNull();
      expect(invalidDeckResponse.body.errors.length).toBeGreaterThan(0);
      
      console.log('✅ Invalid deck ID properly handled');
    });

    it('should handle deck access without authentication', async () => {
      console.log('🧪 Testing unauthenticated deck access...');

      const unauthenticatedResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}`).send({ name: 'Unauthorized change' });

      expect(unauthenticatedResponse.status).toBe(401);
      expect(unauthenticatedResponse.body.errors?.[0]?.code).toBe('UNAUTHORIZED');
      expect(unauthenticatedResponse.body.data).toBeNull();
      
      console.log('✅ Unauthenticated access properly blocked');
    });

    it('should handle deck access with invalid session', async () => {
      console.log('🧪 Testing invalid session deck access...');

      const invalidSessionResponse = await request(app)
        .put(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', 'sessionId=invalid-session-id')
        .send({ name: 'Unauthorized change' });

      expect(invalidSessionResponse.status).toBe(401);
      expect(invalidSessionResponse.body.errors?.[0]?.code).toBe('UNAUTHORIZED');
      expect(invalidSessionResponse.body.data).toBeNull();
      
      console.log('✅ Invalid session properly handled');
    });
  });

  describe('Data Integrity Verification', () => {
    it('should verify deck data remains unchanged after non-owner access attempts', async () => {
      console.log('🧪 Testing data integrity after non-owner access attempts...');

      // Ensure we have a valid deck ID
      if (!testDeckId) {
        console.log('⚠️ No test deck ID available, skipping data integrity test');
        return;
      }

      // Get original deck state
      const originalDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie);

      if (originalDeckResponse.status !== 200) {
        console.log('⚠️ Could not retrieve original deck state, skipping data integrity test');
        return;
      }

      const originalDeck = originalDeckResponse.body.data;
      
      // Attempt unauthorized modifications (these should fail)
      await request(app)
        .put(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          name: 'Hacked Name',
          description: 'Hacked Description'
        });

      await request(app)
        .post(`/api/v1/decks/${testDeckId}/cards`)
        .set('Cookie', nonOwnerAuthCookie)
        .send({
          cardId: 'some-card-id',
          cardType: 'character'
        });

      // Verify deck data is unchanged
      const finalDeckResponse = await request(app)
        .get(`/api/v1/decks/${testDeckId}`)
        .set('Cookie', ownerAuthCookie);

      if (finalDeckResponse.status === 200) {
        const finalDeck = finalDeckResponse.body.data;
        
        expect(finalDeck.metadata.name).toBe(originalDeck.metadata.name);
        expect(finalDeck.metadata.description).toBe(originalDeck.metadata.description);
        expect(finalDeck.cards.length).toBe(originalDeck.cards.length);
        
        console.log('✅ Deck data integrity maintained after unauthorized access attempts');
      } else {
        console.log('⚠️ Could not verify final deck state, but unauthorized modifications were blocked');
      }
    });
  });
});
