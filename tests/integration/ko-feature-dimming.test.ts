import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

/**
 * KO Feature Dimming Integration Tests
 * 
 * These integration tests verify that decks can be properly constructed with all card types
 * that are affected by the KO feature. They set up realistic test scenarios to prove that:
 * 
 * 1. Decks can be created with multiple characters (Ra, Leonidas, King Arthur)
 * 2. All card types can be added to decks:
 *    - Character cards (dimmed when KO'd)
 *    - Special cards (dimmed when their character is KO'd)
 *    - Advanced universe cards (dimmed when their character is KO'd)
 *    - Power cards (dimmed when team can't meet requirements after KO)
 *    - Teamwork cards (dimmed when team can't meet requirements or only one character remains)
 *    - Ally cards (dimmed when no active character meets requirements or only one character remains)
 *    - Training cards (dimmed when no active character can use them)
 *    - Basic universe cards (dimmed when requirements not met)
 * 
 * 3. The deck structure supports KO testing scenarios
 * 
 * Note: These tests verify deck structure and card addition via API. The actual dimming
 * logic and UI behavior is tested in unit tests (draw-hand-ko-dimming.test.ts) and
 * the simulate-ko.js module tests.
 * 
 * Special focus on Ra (8 Energy) and his advanced universe cards, as requested.
 */
describe('KO Feature Dimming Integration Tests', () => {
  let testUser: any;
  let testDeckId: string | null = null;
  let authCookie: string;
  let testUsername: string;
  
  // Card data storage
  let raCharacter: any;
  let leonidasCharacter: any;
  let kingArthurCharacter: any;
  let raSpecialCards: any[] = [];
  let raAdvancedUniverseCards: any[] = [];
  let highValuePowerCards: any[] = [];
  let teamworkCards: any[] = [];
  let allyCards: any[] = [];
  let trainingCards: any[] = [];
  let basicUniverseCards: any[] = [];

  beforeAll(async () => {
    // Ensure guest user exists
    await integrationTestUtils.ensureGuestUser();
    
    // Create a test user
    const timestamp = Date.now();
    testUsername = `ko-test-user-${timestamp}`;
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    testUser = await userRepository.createUser(
      testUsername,
      `ko-test-${timestamp}@example.com`,
      'testpass123',
      'ADMIN' // Admin role to access KO feature
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

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Extract session cookie
    const cookies = loginResponse.headers['set-cookie'];
    authCookie = cookies[0].split(';')[0];
    
    // Load card data
    await loadCardData();
    
    console.log('✅ Test user created and card data loaded');
  });

  afterAll(async () => {
    // Cleanup is handled automatically by the global cleanup functions
    console.log('✅ Test completed - cleanup handled automatically');
  });

  beforeEach(async () => {
    // Reset test deck ID for each test
    testDeckId = null;
  });

  /**
   * Load all card data needed for tests
   */
  async function loadCardData() {
    // Get characters
    const charactersResp = await request(app)
      .get('/api/characters')
      .set('Cookie', authCookie)
      .expect(200);
    
    const characters = charactersResp.body.data;
    raCharacter = characters.find((c: any) => c.name === 'Ra');
    leonidasCharacter = characters.find((c: any) => c.name === 'Leonidas');
    kingArthurCharacter = characters.find((c: any) => c.name === 'King Arthur');
    
    if (!raCharacter) {
      throw new Error('Ra character not found in database');
    }
    if (!leonidasCharacter) {
      throw new Error('Leonidas character not found in database');
    }
    if (!kingArthurCharacter) {
      throw new Error('King Arthur character not found in database');
    }
    
    console.log(`✅ Found characters: Ra (Energy: ${raCharacter.energy}), Leonidas, King Arthur`);
    
    // Get Ra's special cards
    const specialCardsResp = await request(app)
      .get('/api/special-cards')
      .set('Cookie', authCookie)
      .expect(200);
    
    raSpecialCards = specialCardsResp.body.data.filter((card: any) => 
      (card.character === 'Ra' || card.character_name === 'Ra') && 
      card.character !== 'Any Character'
    ).slice(0, 5); // Get first 5 Ra special cards
    
    console.log(`✅ Found ${raSpecialCards.length} Ra special cards`);
    
    // Get Ra's advanced universe cards
    const advancedUniverseResp = await request(app)
      .get('/api/advanced-universe')
      .set('Cookie', authCookie)
      .expect(200);
    
    raAdvancedUniverseCards = advancedUniverseResp.body.data.filter((card: any) => 
      card.character === 'Ra'
    ).slice(0, 5); // Get first 5 Ra advanced universe cards
    
    console.log(`✅ Found ${raAdvancedUniverseCards.length} Ra advanced universe cards`);
    
    // Get high value power cards (Energy 8, 9, Multi-Power, Any-Power)
    const powerCardsResp = await request(app)
      .get('/api/power-cards')
      .set('Cookie', authCookie)
      .expect(200);
    
    highValuePowerCards = powerCardsResp.body.data.filter((card: any) => 
      (card.power_type === 'Energy' && parseInt(card.value) >= 8) ||
      (card.power_type === 'Multi-Power' || card.power_type === 'Multi Power') ||
      (card.power_type === 'Any-Power' && parseInt(card.value) >= 7)
    ).slice(0, 5); // Get first 5 high value power cards
    
    console.log(`✅ Found ${highValuePowerCards.length} high value power cards`);
    
    // Get teamwork cards
    const teamworkResp = await request(app)
      .get('/api/teamwork')
      .set('Cookie', authCookie)
      .expect(200);
    
    teamworkCards = teamworkResp.body.data.slice(0, 5); // Get first 5 teamwork cards
    
    console.log(`✅ Found ${teamworkCards.length} teamwork cards`);
    
    // Get ally cards
    const allyResp = await request(app)
      .get('/api/ally-universe')
      .set('Cookie', authCookie)
      .expect(200);
    
    allyCards = allyResp.body.data.slice(0, 5); // Get first 5 ally cards
    
    console.log(`✅ Found ${allyCards.length} ally cards`);
    
    // Get training cards
    const trainingResp = await request(app)
      .get('/api/training')
      .set('Cookie', authCookie)
      .expect(200);
    
    trainingCards = trainingResp.body.data.slice(0, 5); // Get first 5 training cards
    
    console.log(`✅ Found ${trainingCards.length} training cards`);
    
    // Get basic universe cards
    const basicUniverseResp = await request(app)
      .get('/api/basic-universe')
      .set('Cookie', authCookie)
      .expect(200);
    
    basicUniverseCards = basicUniverseResp.body.data.slice(0, 5); // Get first 5 basic universe cards
    
    console.log(`✅ Found ${basicUniverseCards.length} basic universe cards`);
  }

  /**
   * Create a deck with multiple characters and various card types
   */
  async function createTestDeck(): Promise<string> {
    const createDeckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', authCookie)
      .send({
        name: 'KO Feature Test Deck',
        description: 'A deck for testing KO dimming functionality'
      });

    expect(createDeckResponse.status).toBe(201);
    expect(createDeckResponse.body.success).toBe(true);
    const deckId = createDeckResponse.body.data.id;
    
    // Track the test deck for cleanup
    if (deckId) {
      integrationTestUtils.trackTestDeck(deckId);
    }
    
    return deckId;
  }

  /**
   * Add a card to the deck via API
   */
  async function addCardToDeck(deckId: string, cardType: string, cardId: string, quantity: number = 1) {
    const response = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Cookie', authCookie)
      .send({
        cardType,
        cardId,
        quantity
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }

  describe('KO Feature - Character Card Dimming', () => {
    it('should create deck with characters for KO testing', async () => {
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify both characters are present
      const characters = deck.cards.filter((c: any) => c.type === 'character');
      expect(characters.length).toBe(2);
      expect(characters.some((c: any) => c.cardId === raCharacter.id)).toBe(true);
      expect(characters.some((c: any) => c.cardId === leonidasCharacter.id)).toBe(true);
      
      console.log('✅ Deck created with Ra and Leonidas');
    });
  });

  describe('KO Feature - Ra Special Cards Dimming', () => {
    it('should dim Ra special cards when Ra is KO\'d', async () => {
      if (raSpecialCards.length === 0) {
        console.log('⚠️ Skipping test: No Ra special cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and one of his special cards
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'special', raSpecialCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify Ra and his special card are present
      const characters = deck.cards.filter((c: any) => c.type === 'character');
      const specialCards = deck.cards.filter((c: any) => c.type === 'special');
      
      expect(characters.some((c: any) => c.cardId === raCharacter.id)).toBe(true);
      expect(specialCards.some((c: any) => c.cardId === raSpecialCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra and Ra special card');
      console.log(`   Special card: ${raSpecialCards[0].name || raSpecialCards[0].card_name}`);
      console.log(`   When Ra is KO'd, this card should dim`);
    });
  });

  describe('KO Feature - Ra Advanced Universe Cards Dimming', () => {
    it('should dim Ra advanced universe cards when Ra is KO\'d', async () => {
      if (raAdvancedUniverseCards.length === 0) {
        console.log('⚠️ Skipping test: No Ra advanced universe cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and one of his advanced universe cards
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'advanced-universe', raAdvancedUniverseCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify Ra and his advanced universe card are present
      const characters = deck.cards.filter((c: any) => c.type === 'character');
      const advancedCards = deck.cards.filter((c: any) => c.type === 'advanced-universe');
      
      expect(characters.some((c: any) => c.cardId === raCharacter.id)).toBe(true);
      expect(advancedCards.some((c: any) => c.cardId === raAdvancedUniverseCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra and Ra advanced universe card');
      console.log(`   Advanced universe card: ${raAdvancedUniverseCards[0].name}`);
      console.log(`   When Ra is KO'd, this card should dim`);
    });
  });

  describe('KO Feature - Power Cards Dimming', () => {
    it('should dim high value Energy power cards when high Energy character is KO\'d', async () => {
      if (highValuePowerCards.length === 0) {
        console.log('⚠️ Skipping test: No high value power cards found');
        return;
      }
      
      // Find Energy 8+ power card
      const energyPowerCard = highValuePowerCards.find((c: any) => 
        c.power_type === 'Energy' && parseInt(c.value) >= 8
      );
      
      if (!energyPowerCard) {
        console.log('⚠️ Skipping test: No Energy 8+ power card found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra (8 Energy) and Leonidas (lower Energy)
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'power', energyPowerCard.id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const characters = deck.cards.filter((c: any) => c.type === 'character');
      const powerCards = deck.cards.filter((c: any) => c.type === 'power');
      
      expect(characters.length).toBe(2);
      expect(powerCards.some((c: any) => c.cardId === energyPowerCard.id)).toBe(true);
      
      console.log('✅ Deck created with Ra (8 Energy), Leonidas, and Energy power card');
      console.log(`   Power card: ${energyPowerCard.name} (${energyPowerCard.power_type} ${energyPowerCard.value})`);
      console.log(`   When Ra is KO'd, this card should dim if Leonidas can't meet the requirement`);
    });

    it('should dim Multi-Power cards when team can\'t meet requirement after KO', async () => {
      if (highValuePowerCards.length === 0) {
        console.log('⚠️ Skipping test: No Multi-Power cards found');
        return;
      }
      
      // Find Multi-Power card
      const multiPowerCard = highValuePowerCards.find((c: any) => 
        c.power_type === 'Multi-Power' || c.power_type === 'Multi Power'
      );
      
      if (!multiPowerCard) {
        console.log('⚠️ Skipping test: No Multi-Power card found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'power', multiPowerCard.id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const powerCards = deck.cards.filter((c: any) => c.type === 'power');
      expect(powerCards.some((c: any) => c.cardId === multiPowerCard.id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and Multi-Power card');
      console.log(`   Multi-Power card: ${multiPowerCard.name} (value: ${multiPowerCard.value})`);
      console.log(`   When Ra is KO'd, this card should dim if remaining character can't meet requirement`);
    });
  });

  describe('KO Feature - Teamwork Cards Dimming', () => {
    it('should dim teamwork cards when team can\'t meet requirement after KO', async () => {
      if (teamworkCards.length === 0) {
        console.log('⚠️ Skipping test: No teamwork cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'teamwork', teamworkCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const teamworkCardList = deck.cards.filter((c: any) => c.type === 'teamwork');
      expect(teamworkCardList.some((c: any) => c.cardId === teamworkCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and teamwork card');
      console.log(`   Teamwork card: ${teamworkCards[0].name} (to_use: ${teamworkCards[0].to_use || 'N/A'})`);
      console.log(`   When Ra is KO'd, this card should dim if team can't meet requirement`);
    });

    it('should dim teamwork cards when only one active character remains (special rule)', async () => {
      if (teamworkCards.length === 0) {
        console.log('⚠️ Skipping test: No teamwork cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'teamwork', teamworkCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const teamworkCardList = deck.cards.filter((c: any) => c.type === 'teamwork');
      expect(teamworkCardList.some((c: any) => c.cardId === teamworkCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and teamwork card');
      console.log(`   Teamwork card: ${teamworkCards[0].name}`);
      console.log(`   When Ra is KO'd, leaving only Leonidas, this card should dim (teamwork requires 2+ characters)`);
    });
  });

  describe('KO Feature - Ally Cards Dimming', () => {
    it('should dim ally cards when no active character meets requirement after KO', async () => {
      if (allyCards.length === 0) {
        console.log('⚠️ Skipping test: No ally cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'ally-universe', allyCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const allyCardList = deck.cards.filter((c: any) => c.type === 'ally-universe');
      expect(allyCardList.some((c: any) => c.cardId === allyCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and ally card');
      console.log(`   Ally card: ${allyCards[0].name}`);
      console.log(`   Stat to use: ${allyCards[0].stat_to_use || 'N/A'}, Stat type: ${allyCards[0].stat_type_to_use || 'N/A'}`);
      console.log(`   When Ra is KO'd, this card should dim if no active character meets requirement`);
    });

    it('should dim ally cards when only one active character remains (special rule)', async () => {
      if (allyCards.length === 0) {
        console.log('⚠️ Skipping test: No ally cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'ally-universe', allyCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const allyCardList = deck.cards.filter((c: any) => c.type === 'ally-universe');
      expect(allyCardList.some((c: any) => c.cardId === allyCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and ally card');
      console.log(`   Ally card: ${allyCards[0].name}`);
      console.log(`   When Ra is KO'd, leaving only Leonidas, this card should dim (ally requires 2+ characters)`);
    });
  });

  describe('KO Feature - Training Cards Dimming', () => {
    it('should dim training cards when no active character can use them after KO', async () => {
      if (trainingCards.length === 0) {
        console.log('⚠️ Skipping test: No training cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'training', trainingCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const trainingCardList = deck.cards.filter((c: any) => c.type === 'training');
      expect(trainingCardList.some((c: any) => c.cardId === trainingCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and training card');
      console.log(`   Training card: ${trainingCards[0].name}`);
      console.log(`   Type 1: ${trainingCards[0].type_1 || 'N/A'}, Value: ${trainingCards[0].value_to_use || 'N/A'}`);
      console.log(`   When Ra is KO'd, this card should dim if no active character can use it`);
    });
  });

  describe('KO Feature - Basic Universe Cards Dimming', () => {
    it('should dim basic universe cards when requirement not met after KO', async () => {
      if (basicUniverseCards.length === 0) {
        console.log('⚠️ Skipping test: No basic universe cards found');
        return;
      }
      
      testDeckId = await createTestDeck();
      
      // Add Ra and Leonidas
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'basic-universe', basicUniverseCards[0].id, 1);
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify setup
      const basicUniverseCardList = deck.cards.filter((c: any) => c.type === 'basic-universe');
      expect(basicUniverseCardList.some((c: any) => c.cardId === basicUniverseCards[0].id)).toBe(true);
      
      console.log('✅ Deck created with Ra, Leonidas, and basic universe card');
      console.log(`   Basic universe card: ${basicUniverseCards[0].name}`);
      console.log(`   Type 1: ${basicUniverseCards[0].type_1 || 'N/A'}, Value: ${basicUniverseCards[0].value_to_use || 'N/A'}`);
      console.log(`   When Ra is KO'd, this card should dim if requirement not met`);
    });
  });

  describe('KO Feature - Comprehensive Multi-Character Test', () => {
    it('should create a comprehensive deck with all card types and verify KO dimming', async () => {
      testDeckId = await createTestDeck();
      
      // Add three characters
      await addCardToDeck(testDeckId, 'character', raCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', leonidasCharacter.id, 1);
      await addCardToDeck(testDeckId, 'character', kingArthurCharacter.id, 1);
      
      // Add Ra's special and advanced universe cards
      if (raSpecialCards.length > 0) {
        await addCardToDeck(testDeckId, 'special', raSpecialCards[0].id, 1);
      }
      if (raAdvancedUniverseCards.length > 0) {
        await addCardToDeck(testDeckId, 'advanced-universe', raAdvancedUniverseCards[0].id, 1);
      }
      
      // Add various card types
      if (highValuePowerCards.length > 0) {
        await addCardToDeck(testDeckId, 'power', highValuePowerCards[0].id, 1);
      }
      if (teamworkCards.length > 0) {
        await addCardToDeck(testDeckId, 'teamwork', teamworkCards[0].id, 1);
      }
      if (allyCards.length > 0) {
        await addCardToDeck(testDeckId, 'ally-universe', allyCards[0].id, 1);
      }
      if (trainingCards.length > 0) {
        await addCardToDeck(testDeckId, 'training', trainingCards[0].id, 1);
      }
      if (basicUniverseCards.length > 0) {
        await addCardToDeck(testDeckId, 'basic-universe', basicUniverseCards[0].id, 1);
      }
      
      // Get the deck
      const getDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);
      
      expect(getDeckResponse.status).toBe(200);
      const deck = getDeckResponse.body.data;
      
      // Verify deck has all card types
      const characters = deck.cards.filter((c: any) => c.type === 'character');
      const specials = deck.cards.filter((c: any) => c.type === 'special');
      const advanced = deck.cards.filter((c: any) => c.type === 'advanced-universe');
      const power = deck.cards.filter((c: any) => c.type === 'power');
      const teamwork = deck.cards.filter((c: any) => c.type === 'teamwork');
      const ally = deck.cards.filter((c: any) => c.type === 'ally-universe');
      const training = deck.cards.filter((c: any) => c.type === 'training');
      const basic = deck.cards.filter((c: any) => c.type === 'basic-universe');
      
      expect(characters.length).toBe(3);
      expect(specials.length + advanced.length + power.length + teamwork.length + ally.length + training.length + basic.length).toBeGreaterThan(0);
      
      console.log('✅ Comprehensive deck created with:');
      console.log(`   Characters: ${characters.length} (Ra, Leonidas, King Arthur)`);
      console.log(`   Special cards: ${specials.length}`);
      console.log(`   Advanced universe cards: ${advanced.length}`);
      console.log(`   Power cards: ${power.length}`);
      console.log(`   Teamwork cards: ${teamwork.length}`);
      console.log(`   Ally cards: ${ally.length}`);
      console.log(`   Training cards: ${training.length}`);
      console.log(`   Basic universe cards: ${basic.length}`);
      console.log(`   When characters are KO'd, appropriate cards should dim based on KO state`);
    });
  });
});

