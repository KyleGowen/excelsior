import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { UserRepository } from '../../src/repository/UserRepository';
import { DeckRepository } from '../../src/repository/DeckRepository';
import bcrypt from 'bcrypt';

describe('Role-Based Restrictions Integration Tests', () => {
  let userRepository: UserRepository;
  let deckRepository: DeckRepository;

  beforeAll(async () => {
    const dataSourceConfig = DataSourceConfig.getInstance();
    userRepository = dataSourceConfig.getUserRepository();
    deckRepository = dataSourceConfig.getDeckRepository();
  });

  afterAll(async () => {
    // Clean up test users
    try {
      await userRepository.deleteUser('test-guest-username-user-role');
      await userRepository.deleteUser('test-admin-username-guest-role');
      await userRepository.deleteUser('test-any-username-guest-role');
      await userRepository.deleteUser('test-any-username-user-role');
    } catch (error) {
      // Users might already be deleted, ignore error
    }
  });

  describe('Username vs Role Restrictions', () => {
    it('should allow user with username "guest" but USER role to save decks', async () => {
      // Create a user with username "guest" but USER role
      const testUser = await userRepository.createUser(
        'test-guest-username-user-role',
        'test-guest-username@example.com',
        'testpassword',
        'USER'
      );

      // Login to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-guest-username-user-role',
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      const sessionCookie = loginResponse.headers['set-cookie'][0].split(';')[0];

      // Try to create a deck - should succeed because role is USER
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', sessionCookie)
        .send({
          name: 'Test Deck by Guest Username User Role',
          description: 'A deck created by user with guest-like username but USER role'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Test Deck by Guest Username User Role');

      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);

      // Clean up user
      await userRepository.deleteUser(testUser.id);
    });

    it('should deny user with username "admin" but GUEST role from saving decks', async () => {
      // Create a user with username "admin" but GUEST role
      const uniqueId = Date.now();
      const testUser = await userRepository.createUser(
        `test-admin-username-guest-role-${uniqueId}`,
        `test-admin-username-guest-${uniqueId}@example.com`,
        'testpassword',
        'GUEST'
      );

      // Login to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: `test-admin-username-guest-role-${uniqueId}`,
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      const sessionCookie = loginResponse.headers['set-cookie'][0].split(';')[0];

      // Try to create a deck - should fail because role is GUEST
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', sessionCookie)
        .send({
          name: 'Test Deck by Admin Username Guest Role',
          description: 'A deck creation attempt by user with admin-like username but GUEST role'
        });

      expect(createDeckResponse.status).toBe(403);
      expect(createDeckResponse.body.success).toBe(false);
      expect(createDeckResponse.body.error).toContain('Guests may not create decks');

      // Clean up user
      await userRepository.deleteUser(testUser.id);
    });

    it('should deny user with any username but GUEST role from modifying decks', async () => {
      // Create a regular user to create a deck
      const uniqueId = Date.now();
      const regularUser = await userRepository.createUser(
        `test-regular-user-${uniqueId}`,
        `test-regular-user-${uniqueId}@example.com`,
        'testpassword',
        'USER'
      );

      // Login as regular user to create a deck
      const regularLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: `test-regular-user-${uniqueId}`,
          password: 'testpassword'
        });

      expect(regularLoginResponse.status).toBe(200);
      const regularSessionCookie = regularLoginResponse.headers['set-cookie'][0].split(';')[0];

      // Create a deck as regular user
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', regularSessionCookie)
        .send({
          name: 'Test Deck for Guest',
          description: 'A deck to test guest restrictions',
          characters: []
        });

      expect(createDeckResponse.status).toBe(201);
      const deckId = createDeckResponse.body.data.id;

      // Now create a guest user
      const guestUser = await userRepository.createUser(
        `test-any-username-guest-role-${uniqueId}`,
        `test-any-username-guest-${uniqueId}@example.com`,
        'testpassword',
        'GUEST'
      );

      // Login as guest user
      const guestLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: `test-any-username-guest-role-${uniqueId}`,
          password: 'testpassword'
        });

      expect(guestLoginResponse.status).toBe(200);
      const guestSessionCookie = guestLoginResponse.headers['set-cookie'][0].split(';')[0];

      // Try to modify the deck as guest - should fail because role is GUEST
      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Modified Deck Name',
          description: 'Modified description'
        });

      expect(modifyDeckResponse.status).toBe(403);
      expect(modifyDeckResponse.body.success).toBe(false);
      expect(modifyDeckResponse.body.error).toContain('Guests may not modify decks');

      // Clean up users
      await userRepository.deleteUser(regularUser.id);
      await userRepository.deleteUser(guestUser.id);
    });

    it('should allow user with any username but USER role to modify decks', async () => {
      // Create a user with random username but USER role
      const uniqueUsername = `test-any-username-user-role-${Date.now()}`;
      const testUser = await userRepository.createUser(
        uniqueUsername,
        `test-any-username-user-${Date.now()}@example.com`,
        'testpassword',
        'USER'
      );

      // Login to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-any-username-user-role',
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      const sessionCookie = loginResponse.headers['set-cookie'][0].split(';')[0];

      // Create a deck first
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', sessionCookie)
        .send({
          name: 'Test Deck for Modification',
          description: 'A deck to test modification permissions'
        });

      expect(createDeckResponse.status).toBe(201);
      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);

      // Try to modify the deck - should succeed because role is USER
      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', sessionCookie)
        .send({
          name: 'Modified Deck Name',
          description: 'Modified description'
        });

      expect(modifyDeckResponse.status).toBe(200);
      expect(modifyDeckResponse.body.success).toBe(true);
      expect(modifyDeckResponse.body.data.name).toBe('Modified Deck Name');

      // Clean up user
      await userRepository.deleteUser(testUser.id);
    });
  });

  describe('Role-Based API Endpoint Access', () => {
    let guestUser: any;
    let userRoleUser: any;
    let guestSessionCookie: string;
    let userSessionCookie: string;

    beforeAll(async () => {
      // Create a GUEST role user
      guestUser = await userRepository.createUser(
        'test-guest-role-user',
        'test-guest-role@example.com',
        'testpassword',
        'GUEST'
      );

      // Create a USER role user
      userRoleUser = await userRepository.createUser(
        'test-user-role-user',
        'test-user-role@example.com',
        'testpassword',
        'USER'
      );

      // Login both users
      const guestLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-guest-role-user',
          password: 'testpassword'
        });

      const userLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-user-role-user',
          password: 'testpassword'
        });

      guestSessionCookie = guestLoginResponse.headers['set-cookie'][0].split(';')[0];
      userSessionCookie = userLoginResponse.headers['set-cookie'][0].split(';')[0];
    });

    afterAll(async () => {
      // Clean up test users
      try {
        await userRepository.deleteUser(guestUser.id);
        await userRepository.deleteUser(userRoleUser.id);
      } catch (error) {
        // Users might already be deleted, ignore error
      }
    });

    it('should deny GUEST role users from creating decks regardless of username', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Test Deck by Guest Role',
          description: 'A deck creation attempt by GUEST role user'
        });

      expect(createDeckResponse.status).toBe(403);
      expect(createDeckResponse.body.success).toBe(false);
      expect(createDeckResponse.body.error).toContain('Guests may not create decks');
    });

    it('should allow USER role users to create decks regardless of username', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck by User Role',
          description: 'A deck created by USER role user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Test Deck by User Role');

      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);
    });

    it('should deny GUEST role users from deleting decks regardless of username', async () => {
      const deleteDeckResponse = await request(app)
        .delete('/api/decks/non-existent-deck-id')
        .set('Cookie', guestSessionCookie);

      expect(deleteDeckResponse.status).toBe(403);
      expect(deleteDeckResponse.body.success).toBe(false);
      expect(deleteDeckResponse.body.error).toContain('Guests may not delete decks');
    });

    it('should allow USER role users to delete their own decks regardless of username', async () => {
      // First create a deck
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck for Deletion',
          description: 'A deck to test deletion permissions'
        });

      expect(createDeckResponse.status).toBe(201);
      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);

      // Now delete it
      const deleteDeckResponse = await request(app)
        .delete(`/api/decks/${deckId}`)
        .set('Cookie', userSessionCookie);

      expect(deleteDeckResponse.status).toBe(200);
      expect(deleteDeckResponse.body.success).toBe(true);
      expect(deleteDeckResponse.body.message).toBe('Deck deleted successfully');

      // Untrack since it's deleted
      integrationTestUtils.untrackTestDeck(deckId);
    });
  });

  describe('Role Verification in Session', () => {
    it('should return correct role information regardless of username', async () => {
      // Create users with different usernames but same role
      const user1 = await userRepository.createUser(
        'username1',
        'user1@example.com',
        'testpassword',
        'USER'
      );

      const user2 = await userRepository.createUser(
        'username2',
        'user2@example.com',
        'testpassword',
        'USER'
      );

      // Login both users
      const login1Response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'username1',
          password: 'testpassword'
        });

      const login2Response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'username2',
          password: 'testpassword'
        });

      const session1Cookie = login1Response.headers['set-cookie'][0].split(';')[0];
      const session2Cookie = login2Response.headers['set-cookie'][0].split(';')[0];

      // Check session info for both users
      const me1Response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', session1Cookie);

      const me2Response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', session2Cookie);

      expect(me1Response.status).toBe(200);
      expect(me1Response.body.success).toBe(true);
      expect(me1Response.body.data.role).toBe('USER');
      expect(me1Response.body.data.name).toBe('username1');

      expect(me2Response.status).toBe(200);
      expect(me2Response.body.success).toBe(true);
      expect(me2Response.body.data.role).toBe('USER');
      expect(me2Response.body.data.name).toBe('username2');

      // Both should have same role but different usernames
      expect(me1Response.body.data.role).toBe(me2Response.body.data.role);
      expect(me1Response.body.data.name).not.toBe(me2Response.body.data.name);

      // Clean up users
      await userRepository.deleteUser(user1.id);
      await userRepository.deleteUser(user2.id);
    });
  });
});
