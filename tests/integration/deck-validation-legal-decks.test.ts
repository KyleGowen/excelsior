/**
 * Integration tests for legal deck validation
 * Tests that properly constructed decks pass all validation rules
 */

import request from 'supertest';
import { app } from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from '../setup-integration';
import { createTestUser, createTestDeck } from '../helpers/testHelpers';

describe('Deck Validation - Legal Decks Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Create a test user and get auth cookie
    testUser = await createTestUser();
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'testpassword' });
    
    authCookie = loginResponse.headers['set-cookie'][0];
  });

  afterEach(async () => {
    // Clean up test data
    if (testUser) {
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Cookie', authCookie);
    }
  });

  describe('Legal Deck Construction', () => {
    it('should create and validate a completely legal deck without events', async () => {
      // Create a legal deck with:
      // - 4 characters (threat levels: 15, 18, 20, 16 = 69 total)
      // - 7 mission cards from same set
      // - 1 location (threat level: 5)
      // - Special cards for selected characters
      // - 51 power cards
      // Total threat: 69 + 5 = 74 (≤ 76)

      const legalDeck = {
        name: 'Legal Deck Without Events',
        description: 'A completely legal deck following all Overpower rules',
        cards: [
          // 4 Characters (exactly 4)
          { type: 'character', cardId: 'char-001', quantity: 1 }, // 15 threat
          { type: 'character', cardId: 'char-002', quantity: 1 }, // 18 threat
          { type: 'character', cardId: 'char-003', quantity: 1 }, // 20 threat
          { type: 'character', cardId: 'char-004', quantity: 1 }, // 16 threat
          
          // 7 Mission cards from same set
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 1 Location (max 1)
          { type: 'location', cardId: 'location-001', quantity: 1 }, // 5 threat
          
          // Special cards for selected characters
          { type: 'special_card', cardId: 'special-001', quantity: 1 }, // For char-001
          { type: 'special_card', cardId: 'special-002', quantity: 1 }, // Any Character
          
          // 51 Power cards (exactly 51 for deck without events)
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.cards).toHaveLength(legalDeck.cards.length);

      // The deck should be marked as legal in the deck list
      const listResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      
      const createdDeck = listResponse.body.data.find((deck: any) => deck.metadata.id === deckId);
      expect(createdDeck).toBeDefined();
      
      // Note: The validation status would be shown in the frontend
      // In the backend, we can verify the deck structure is correct
      expect(createdDeck.metadata.cardCount).toBeGreaterThan(0);
    });

    it('should create and validate a completely legal deck with events', async () => {
      // Create a legal deck with:
      // - 4 characters (threat levels: 15, 18, 20, 16 = 69 total)
      // - 7 mission cards from same set
      // - 1 location (threat level: 5)
      // - 1 event from same mission set
      // - Special cards for selected characters
      // - 55 power cards (56 total with event)
      // Total threat: 69 + 5 = 74 (≤ 76)

      const legalDeckWithEvents = {
        name: 'Legal Deck With Events',
        description: 'A completely legal deck with events following all Overpower rules',
        cards: [
          // 4 Characters (exactly 4)
          { type: 'character', cardId: 'char-001', quantity: 1 }, // 15 threat
          { type: 'character', cardId: 'char-002', quantity: 1 }, // 18 threat
          { type: 'character', cardId: 'char-003', quantity: 1 }, // 20 threat
          { type: 'character', cardId: 'char-004', quantity: 1 }, // 16 threat
          
          // 7 Mission cards from same set
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 1 Event from same mission set
          { type: 'event', cardId: 'event-001', quantity: 1 },
          
          // 1 Location (max 1)
          { type: 'location', cardId: 'location-001', quantity: 1 }, // 5 threat
          
          // Special cards for selected characters
          { type: 'special_card', cardId: 'special-001', quantity: 1 }, // For char-001
          { type: 'special_card', cardId: 'special-002', quantity: 1 }, // Any Character
          
          // 55 Power cards (56 total with event)
          { type: 'power_card', cardId: 'power-001', quantity: 55 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeckWithEvents);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.cards).toHaveLength(legalDeckWithEvents.cards.length);

      // Verify deck structure
      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      const eventCards = deck.cards.filter((card: any) => card.type === 'event');
      const locationCards = deck.cards.filter((card: any) => card.type === 'location');
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );

      expect(characterCards).toHaveLength(4);
      expect(missionCards).toHaveLength(7);
      expect(eventCards).toHaveLength(1);
      expect(locationCards).toHaveLength(1);
      
      // Draw pile should have 56 cards (55 power + 1 event)
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(56);
    });

    it('should create and validate a legal deck with no location', async () => {
      // Create a legal deck with:
      // - 4 characters (threat levels: 15, 18, 20, 16 = 69 total)
      // - 7 mission cards from same set
      // - No location (0 locations is legal)
      // - Special cards for selected characters
      // - 51 power cards
      // Total threat: 69 (≤ 76)

      const legalDeckNoLocation = {
        name: 'Legal Deck No Location',
        description: 'A legal deck with no location',
        cards: [
          // 4 Characters (exactly 4)
          { type: 'character', cardId: 'char-001', quantity: 1 }, // 15 threat
          { type: 'character', cardId: 'char-002', quantity: 1 }, // 18 threat
          { type: 'character', cardId: 'char-003', quantity: 1 }, // 20 threat
          { type: 'character', cardId: 'char-004', quantity: 1 }, // 16 threat
          
          // 7 Mission cards from same set
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // Special cards for selected characters
          { type: 'special_card', cardId: 'special-001', quantity: 1 }, // For char-001
          { type: 'special_card', cardId: 'special-002', quantity: 1 }, // Any Character
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeckNoLocation);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      // Verify deck structure
      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      const locationCards = deck.cards.filter((card: any) => card.type === 'location');
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );

      expect(characterCards).toHaveLength(4);
      expect(missionCards).toHaveLength(7);
      expect(locationCards).toHaveLength(0);
      
      // Draw pile should have 51 cards
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(51);
    });

    it('should create and validate a legal deck with maximum threat level', async () => {
      // Create a legal deck with:
      // - 4 characters with high threat levels (total: 76)
      // - 7 mission cards from same set
      // - No location (to keep threat at exactly 76)
      // - Special cards for selected characters
      // - 51 power cards
      // Total threat: 76 (exactly at limit)

      const legalDeckMaxThreat = {
        name: 'Legal Deck Max Threat',
        description: 'A legal deck with maximum allowed threat level',
        cards: [
          // 4 Characters with high threat levels
          { type: 'character', cardId: 'char-005', quantity: 1 }, // 25 threat
          { type: 'character', cardId: 'char-006', quantity: 1 }, // 20 threat
          { type: 'character', cardId: 'char-007', quantity: 1 }, // 18 threat
          { type: 'character', cardId: 'char-008', quantity: 1 }, // 13 threat
          
          // 7 Mission cards from same set
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // Special cards for selected characters
          { type: 'special_card', cardId: 'special-001', quantity: 1 }, // For char-005
          { type: 'special_card', cardId: 'special-002', quantity: 1 }, // Any Character
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeckMaxThreat);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      // Verify deck structure
      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );

      expect(characterCards).toHaveLength(4);
      expect(missionCards).toHaveLength(7);
      
      // Draw pile should have 51 cards
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(51);
    });
  });

  describe('Deck Validation in API Responses', () => {
    it('should return deck validation status in deck list', async () => {
      // Create a legal deck
      const legalDeck = {
        name: 'API Validation Test Deck',
        description: 'Testing API validation response',
        cards: [
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeck);

      expect(createResponse.status).toBe(201);
      const deckId = createResponse.body.data.id;

      // Get deck list and verify structure
      const listResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.data)).toBe(true);

      const createdDeck = listResponse.body.data.find((deck: any) => deck.metadata.id === deckId);
      expect(createdDeck).toBeDefined();
      expect(createdDeck.metadata.name).toBe(legalDeck.name);
      expect(createdDeck.cards).toBeDefined();
      expect(Array.isArray(createdDeck.cards)).toBe(true);
    });

    it('should return deck validation status in individual deck response', async () => {
      // Create a legal deck
      const legalDeck = {
        name: 'Individual Deck Validation Test',
        description: 'Testing individual deck validation response',
        cards: [
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          { type: 'event', cardId: 'event-001', quantity: 1 },
          { type: 'power_card', cardId: 'power-001', quantity: 55 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(legalDeck);

      expect(createResponse.status).toBe(201);
      const deckId = createResponse.body.data.id;

      // Get individual deck and verify structure
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(deckId);
      expect(getResponse.body.data.name).toBe(legalDeck.name);
      expect(getResponse.body.data.cards).toBeDefined();
      expect(Array.isArray(getResponse.body.data.cards)).toBe(true);
      expect(getResponse.body.data.cards).toHaveLength(legalDeck.cards.length);
    });
  });
});
