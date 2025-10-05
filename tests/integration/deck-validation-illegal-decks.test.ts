/**
 * Integration tests for illegal deck validation
 * Tests that decks violating Overpower rules are properly identified
 * Each test focuses on one specific rule violation
 */

import request from 'supertest';
import { app } from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from '../setup-integration';
import { createTestUser } from '../helpers/testHelpers';

describe('Deck Validation - Illegal Decks Integration Tests', () => {
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

  describe('Rule 1 Violation: Wrong Number of Characters', () => {
    it('should create deck with too few characters (3 instead of 4)', async () => {
      const illegalDeck = {
        name: 'Too Few Characters',
        description: 'Deck with only 3 characters (should be 4)',
        cards: [
          // Only 3 Characters (should be 4)
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck (should succeed - validation happens in frontend)
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong structure
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      expect(characterCards).toHaveLength(3); // Should be 3, not 4
    });

    it('should create deck with too many characters (5 instead of 4)', async () => {
      const illegalDeck = {
        name: 'Too Many Characters',
        description: 'Deck with 5 characters (should be 4)',
        cards: [
          // 5 Characters (should be 4)
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          { type: 'character', cardId: 'char-005', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong structure
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      expect(characterCards).toHaveLength(5); // Should be 5, not 4
    });
  });

  describe('Rule 2 Violation: Special Cards for Wrong Characters', () => {
    it('should create deck with special card for character not in team', async () => {
      const illegalDeck = {
        name: 'Wrong Special Card Character',
        description: 'Deck with special card for character not in team',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // Special card for char-005 (not in team)
          { type: 'special_card', cardId: 'special-003', quantity: 1 },
          
          // 50 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 50 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong special card
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const specialCards = deck.cards.filter((card: any) => card.type === 'special_card');
      expect(specialCards).toHaveLength(1);
      expect(specialCards[0].cardId).toBe('special-003'); // This should be invalid
    });
  });

  describe('Rule 3 Violation: Wrong Number of Mission Cards', () => {
    it('should create deck with too few mission cards (5 instead of 7)', async () => {
      const illegalDeck = {
        name: 'Too Few Mission Cards',
        description: 'Deck with only 5 mission cards (should be 7)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // Only 5 Mission cards (should be 7)
          { type: 'mission', cardId: 'mission-001', quantity: 5 },
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong structure
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      expect(missionCards).toHaveLength(5); // Should be 5, not 7
    });

    it('should create deck with too many mission cards (8 instead of 7)', async () => {
      const illegalDeck = {
        name: 'Too Many Mission Cards',
        description: 'Deck with 8 mission cards (should be 7)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 8 Mission cards (should be 7)
          { type: 'mission', cardId: 'mission-001', quantity: 8 },
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong structure
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      expect(missionCards).toHaveLength(8); // Should be 8, not 7
    });

    it('should create deck with mission cards from different sets', async () => {
      const illegalDeck = {
        name: 'Mixed Mission Sets',
        description: 'Deck with mission cards from different sets',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards from different sets
          { type: 'mission', cardId: 'mission-001', quantity: 4 }, // Set A
          { type: 'mission', cardId: 'mission-003', quantity: 3 }, // Set B
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with mixed mission sets
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      expect(missionCards).toHaveLength(7);
      
      // Should have cards from both mission-001 and mission-003
      const missionIds = missionCards.map((card: any) => card.cardId);
      expect(missionIds).toContain('mission-001');
      expect(missionIds).toContain('mission-003');
    });
  });

  describe('Rule 4 Violation: Events from Wrong Mission Set', () => {
    it('should create deck with event from different mission set', async () => {
      const illegalDeck = {
        name: 'Wrong Event Mission Set',
        description: 'Deck with event from different mission set',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards from Set A
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // Event from Set B (wrong set)
          { type: 'event', cardId: 'event-003', quantity: 1 },
          
          // 55 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 55 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong event
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const eventCards = deck.cards.filter((card: any) => card.type === 'event');
      expect(eventCards).toHaveLength(1);
      expect(eventCards[0].cardId).toBe('event-003'); // This should be invalid
    });
  });

  describe('Rule 5 Violation: Too Many Locations', () => {
    it('should create deck with more than 1 location', async () => {
      const illegalDeck = {
        name: 'Too Many Locations',
        description: 'Deck with 2 locations (should be max 1)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 2 Locations (should be max 1)
          { type: 'location', cardId: 'location-001', quantity: 1 },
          { type: 'location', cardId: 'location-002', quantity: 1 },
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with too many locations
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const locationCards = deck.cards.filter((card: any) => card.type === 'location');
      expect(locationCards).toHaveLength(2); // Should be 2, not max 1
    });
  });

  describe('Rule 6 Violation: Threat Level Too High', () => {
    it('should create deck with threat level over 76', async () => {
      const illegalDeck = {
        name: 'Threat Level Too High',
        description: 'Deck with threat level over 76',
        cards: [
          // 4 Characters with high threat levels
          { type: 'character', cardId: 'char-005', quantity: 1 }, // 25 threat
          { type: 'character', cardId: 'char-006', quantity: 1 }, // 20 threat
          { type: 'character', cardId: 'char-007', quantity: 1 }, // 18 threat
          { type: 'character', cardId: 'char-008', quantity: 1 }, // 13 threat
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 1 Location with high threat
          { type: 'location', cardId: 'location-002', quantity: 1 }, // 8 threat
          
          // 51 Power cards
          { type: 'power_card', cardId: 'power-001', quantity: 51 }
        ]
      };
      // Total threat: 25 + 20 + 18 + 13 + 8 = 84 (> 76)

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with high threat
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      const locationCards = deck.cards.filter((card: any) => card.type === 'location');
      expect(characterCards).toHaveLength(4);
      expect(locationCards).toHaveLength(1);
    });
  });

  describe('Rule 7 Violation: Wrong Deck Size', () => {
    it('should create deck with too few cards (45 instead of 51)', async () => {
      const illegalDeck = {
        name: 'Too Few Cards',
        description: 'Deck with only 45 cards (should be 51)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // Only 45 Power cards (should be 51)
          { type: 'power_card', cardId: 'power-001', quantity: 45 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong size
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(45); // Should be 45, not 51
    });

    it('should create deck with too many cards (60 instead of 51)', async () => {
      const illegalDeck = {
        name: 'Too Many Cards',
        description: 'Deck with 60 cards (should be 51)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 60 Power cards (should be 51)
          { type: 'power_card', cardId: 'power-001', quantity: 60 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong size
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(60); // Should be 60, not 51
    });

    it('should create deck with events but wrong size (50 instead of 56)', async () => {
      const illegalDeck = {
        name: 'Wrong Size With Events',
        description: 'Deck with events but only 50 cards (should be 56)',
        cards: [
          // 4 Characters
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          { type: 'character', cardId: 'char-003', quantity: 1 },
          { type: 'character', cardId: 'char-004', quantity: 1 },
          
          // 7 Mission cards
          { type: 'mission', cardId: 'mission-001', quantity: 7 },
          
          // 1 Event
          { type: 'event', cardId: 'event-001', quantity: 1 },
          
          // Only 50 Power cards (should be 55 for 56 total with event)
          { type: 'power_card', cardId: 'power-001', quantity: 50 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with wrong size
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);
      expect(drawPileCount).toBe(50); // Should be 50, not 56
    });
  });

  describe('Multiple Rule Violations', () => {
    it('should create deck violating multiple rules simultaneously', async () => {
      const illegalDeck = {
        name: 'Multiple Violations',
        description: 'Deck violating multiple Overpower rules',
        cards: [
          // Only 2 Characters (should be 4)
          { type: 'character', cardId: 'char-001', quantity: 1 },
          { type: 'character', cardId: 'char-002', quantity: 1 },
          
          // Only 5 Mission cards (should be 7)
          { type: 'mission', cardId: 'mission-001', quantity: 5 },
          
          // 2 Locations (should be max 1)
          { type: 'location', cardId: 'location-001', quantity: 1 },
          { type: 'location', cardId: 'location-002', quantity: 1 },
          
          // Only 40 Power cards (should be 51)
          { type: 'power_card', cardId: 'power-001', quantity: 40 }
        ]
      };

      // Create the deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(illegalDeck);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const deckId = createResponse.body.data.id;

      // Verify the deck was created with multiple violations
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);

      const deck = getResponse.body.data;
      const characterCards = deck.cards.filter((card: any) => card.type === 'character');
      const missionCards = deck.cards.filter((card: any) => card.type === 'mission');
      const locationCards = deck.cards.filter((card: any) => card.type === 'location');
      const drawPileCards = deck.cards.filter((card: any) => 
        !['mission', 'character', 'location'].includes(card.type)
      );
      const drawPileCount = drawPileCards.reduce((sum: number, card: any) => sum + card.quantity, 0);

      expect(characterCards).toHaveLength(2); // Should be 2, not 4
      expect(missionCards).toHaveLength(5); // Should be 5, not 7
      expect(locationCards).toHaveLength(2); // Should be 2, not max 1
      expect(drawPileCount).toBe(40); // Should be 40, not 51
    });
  });
});
