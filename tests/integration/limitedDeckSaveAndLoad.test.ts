import request from 'supertest';
import { app } from '../setup-integration';
import { integrationTestUtils } from '../setup-integration';

describe('Limited Deck Save and Load Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  beforeAll(async () => {
    // Create a test user
    testUser = await integrationTestUtils.createTestUser({
      name: 'limited-test-user',
      email: 'limited-test@example.com',
      password: 'testpassword123',
      role: 'USER'
    });
    console.log('🔍 Created test user:', testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await integrationTestUtils.cleanupTestData();
  });

  beforeEach(async () => {
    // Login as the test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'testpassword123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Extract the session cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    authCookie = setCookieHeader[0];
  });

  describe('Save and Load Limited Deck', () => {
    it('should save a deck with is_limited=true and load it with Limited state preserved', async () => {
      // Step 1: Create a new deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Test Deck',
          description: 'A deck to test Limited functionality',
          characters: ['a9b944f2-194a-4814-b877-25db1ba784ad', '050f4873-2fa8-422c-ba32-eab3500cbdc0']
        });

      if (createResponse.status !== 201) {
        console.error('❌ Deck creation failed with status:', createResponse.status);
        console.error('❌ Response body:', createResponse.body);
        console.error('❌ Response headers:', createResponse.headers);
      }
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;
      console.log('🔍 Created deck with ID:', deckId);

      // Step 2: Verify the deck was created with is_limited=false by default
      const initialLoadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(initialLoadResponse.status).toBe(200);
      expect(initialLoadResponse.body.success).toBe(true);
      expect(initialLoadResponse.body.data.metadata.is_limited).toBe(false);
      console.log('🔍 Initial deck is_limited:', initialLoadResponse.body.data.metadata.is_limited);

      // Step 3: Update the deck to set is_limited=true
      const updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Test Deck',
          description: 'A deck to test Limited functionality',
          is_limited: true
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.is_limited).toBe(true);
      console.log('🔍 Updated deck is_limited to:', updateResponse.body.data.is_limited);

      // Step 4: Load the deck again and verify is_limited is preserved
      const reloadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(reloadResponse.status).toBe(200);
      expect(reloadResponse.body.success).toBe(true);
      expect(reloadResponse.body.data.metadata.is_limited).toBe(true);
      console.log('🔍 Reloaded deck is_limited:', reloadResponse.body.data.metadata.is_limited);

      // Step 5: Verify the deck appears in the deck list with is_limited=true
      const deckListResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(deckListResponse.status).toBe(200);
      expect(deckListResponse.body.success).toBe(true);
      
      const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === deckId);
      expect(deckInList).toBeDefined();
      expect(deckInList.metadata.is_limited).toBe(true);
      console.log('🔍 Deck in list is_limited:', deckInList.metadata.is_limited);

      // Step 6: Test the /api/decks/:id/full endpoint as well
      const fullDeckResponse = await request(app)
        .get(`/api/decks/${deckId}/full`)
        .set('Cookie', authCookie);

      expect(fullDeckResponse.status).toBe(200);
      expect(fullDeckResponse.body.success).toBe(true);
      expect(fullDeckResponse.body.data.metadata.is_limited).toBe(true);
      console.log('🔍 Full deck endpoint is_limited:', fullDeckResponse.body.data.metadata.is_limited);
    });

    it('should save a deck with is_limited=false and load it with Limited state preserved', async () => {
      // Step 1: Create a new deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Regular Test Deck',
          description: 'A regular deck (not limited)',
          characters: ['60f61594-3431-4ea8-b534-50ab6642d658', '9436652b-7b7f-4fee-b2c1-df6aa69afcd4']
        });

      if (createResponse.status !== 201) {
        console.error('❌ Regular deck creation failed with status:', createResponse.status);
        console.error('❌ Response body:', createResponse.body);
        console.error('❌ Response headers:', createResponse.headers);
      }
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;
      console.log('🔍 Created regular deck with ID:', deckId);

      // Step 2: Verify the deck was created with is_limited=false by default
      const initialLoadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(initialLoadResponse.status).toBe(200);
      expect(initialLoadResponse.body.success).toBe(true);
      expect(initialLoadResponse.body.data.metadata.is_limited).toBe(false);
      console.log('🔍 Initial regular deck is_limited:', initialLoadResponse.body.data.metadata.is_limited);

      // Step 3: Explicitly set is_limited=false (should remain false)
      const updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Regular Test Deck',
          description: 'A regular deck (not limited)',
          is_limited: false
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.is_limited).toBe(false);
      console.log('🔍 Updated regular deck is_limited to:', updateResponse.body.data.is_limited);

      // Step 4: Load the deck again and verify is_limited is preserved as false
      const reloadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(reloadResponse.status).toBe(200);
      expect(reloadResponse.body.success).toBe(true);
      expect(reloadResponse.body.data.metadata.is_limited).toBe(false);
      console.log('🔍 Reloaded regular deck is_limited:', reloadResponse.body.data.metadata.is_limited);

      // Step 5: Verify the deck appears in the deck list with is_limited=false
      const deckListResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(deckListResponse.status).toBe(200);
      expect(deckListResponse.body.success).toBe(true);
      
      const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === deckId);
      expect(deckInList).toBeDefined();
      expect(deckInList.metadata.is_limited).toBe(false);
      console.log('🔍 Regular deck in list is_limited:', deckInList.metadata.is_limited);
    });

    it('should toggle is_limited state multiple times and preserve each state', async () => {
      // Step 1: Create a new deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Toggle Test Deck',
          description: 'A deck to test toggling Limited state',
          characters: ['a9b944f2-194a-4814-b877-25db1ba784ad']
        });

      if (createResponse.status !== 201) {
        console.error('❌ Toggle test deck creation failed with status:', createResponse.status);
        console.error('❌ Response body:', createResponse.body);
        console.error('❌ Response headers:', createResponse.headers);
      }
      
      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;
      console.log('🔍 Created toggle test deck with ID:', deckId);

      // Step 2: Toggle to Limited (true)
      let updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          is_limited: true
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.is_limited).toBe(true);
      console.log('🔍 Toggled to Limited (true)');

      // Step 3: Verify Limited state
      let loadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(loadResponse.status).toBe(200);
      expect(loadResponse.body.data.metadata.is_limited).toBe(true);
      console.log('🔍 Verified Limited state (true)');

      // Step 4: Toggle back to Regular (false)
      updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          is_limited: false
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.is_limited).toBe(false);
      console.log('🔍 Toggled back to Regular (false)');

      // Step 5: Verify Regular state
      loadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(loadResponse.status).toBe(200);
      expect(loadResponse.body.data.metadata.is_limited).toBe(false);
      console.log('🔍 Verified Regular state (false)');

      // Step 6: Toggle to Limited again (true)
      updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          is_limited: true
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.is_limited).toBe(true);
      console.log('🔍 Toggled to Limited again (true)');

      // Step 7: Final verification
      loadResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(loadResponse.status).toBe(200);
      expect(loadResponse.body.data.metadata.is_limited).toBe(true);
      console.log('🔍 Final verification - Limited state (true)');
    });
  });
});
