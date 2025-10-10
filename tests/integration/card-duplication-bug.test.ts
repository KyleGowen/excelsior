import { Pool } from 'pg';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';
import { PostgreSQLCardRepository } from '../../src/database/PostgreSQLCardRepository';
import { PasswordUtils } from '../../src/utils/passwordUtils';

describe('Card Duplication Bug Integration Test', () => {
  let pool: Pool;
  let userRepository: PostgreSQLUserRepository;
  let deckRepository: PostgreSQLDeckRepository;
  let cardRepository: PostgreSQLCardRepository;
  let testUserId: string;
  let testDeckId: string;

  beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'overpower',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '1337'),
    });

    // Initialize repositories
    userRepository = new PostgreSQLUserRepository(pool);
    deckRepository = new PostgreSQLDeckRepository(pool);
    cardRepository = new PostgreSQLCardRepository(pool);

    await userRepository.initialize();
    await deckRepository.initialize();
    await cardRepository.initialize();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await PasswordUtils.hashPassword('testpassword');
    const user = await userRepository.createUser(
      `testuser_${Date.now()}`,
      `test_${Date.now()}@example.com`,
      hashedPassword,
      'USER'
    );
    testUserId = user.id;

    // Create test deck
    const deck = await deckRepository.createDeck(
      testUserId,
      `Test Deck ${Date.now()}`,
      'Integration test deck for card duplication bug'
    );
    testDeckId = deck.id;
  });

  afterEach(async () => {
    // Clean up: delete deck and user regardless of test outcome
    try {
      if (testDeckId) {
        await deckRepository.deleteDeck(testDeckId);
      }
    } catch (error) {
      console.warn('Failed to delete test deck:', error);
    }

    try {
      if (testUserId) {
        await userRepository.deleteUser(testUserId);
      }
    } catch (error) {
      console.warn('Failed to delete test user:', error);
    }
  });

  it('should prevent card duplication when saving deck multiple times', async () => {
    // Step 1: Get available cards for each type
    const characters = await cardRepository.getAllCharacters();
    const powerCards = await cardRepository.getAllPowerCards();
    const specialCards = await cardRepository.getAllSpecialCards();
    const locations = await cardRepository.getAllLocations();
    const missions = await cardRepository.getAllMissions();
    const events = await cardRepository.getAllEvents();
    const aspects = await cardRepository.getAllAspects();
    const advancedUniverses = await cardRepository.getAllAdvancedUniverse();
    const teamworks = await cardRepository.getAllTeamwork();
    const allyUniverses = await cardRepository.getAllAllyUniverse();
    const trainings = await cardRepository.getAllTraining();
    const basicUniverses = await cardRepository.getAllBasicUniverse();

    // Ensure we have at least one card of each type
    expect(characters.length).toBeGreaterThan(0);
    expect(powerCards.length).toBeGreaterThan(0);
    expect(specialCards.length).toBeGreaterThan(0);
    expect(locations.length).toBeGreaterThan(0);
    expect(missions.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
    expect(aspects.length).toBeGreaterThan(0);
    expect(advancedUniverses.length).toBeGreaterThan(0);
    expect(teamworks.length).toBeGreaterThan(0);
    expect(allyUniverses.length).toBeGreaterThan(0);
    expect(trainings.length).toBeGreaterThan(0);
    expect(basicUniverses.length).toBeGreaterThan(0);

    // Step 2: Create initial deck with one of each card type
    const initialCards = [
      { cardType: 'character', cardId: characters[0].id, quantity: 1 },
      { cardType: 'power', cardId: powerCards[0].id, quantity: 1 },
      { cardType: 'special', cardId: specialCards[0].id, quantity: 1 },
      { cardType: 'location', cardId: locations[0].id, quantity: 1 },
      { cardType: 'mission', cardId: missions[0].id, quantity: 1 },
      { cardType: 'event', cardId: events[0].id, quantity: 1 },
      { cardType: 'aspect', cardId: aspects[0].id, quantity: 1 },
      { cardType: 'advanced-universe', cardId: advancedUniverses[0].id, quantity: 1 },
      { cardType: 'teamwork', cardId: teamworks[0].id, quantity: 1 },
      { cardType: 'ally-universe', cardId: allyUniverses[0].id, quantity: 1 },
      { cardType: 'training', cardId: trainings[0].id, quantity: 1 },
      { cardType: 'basic-universe', cardId: basicUniverses[0].id, quantity: 1 }
    ];

    // Step 3: Add cards to deck using bulk replacement
    const success = await deckRepository.replaceAllCardsInDeck(testDeckId, initialCards);
    expect(success).toBe(true);

    // Step 4: Verify initial quantities are correct
    let deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(12); // One of each type
    deckCards.forEach(card => {
      expect(card.quantity).toBe(1);
    });

    // Step 5: Save again (simulate user saving multiple times)
    const success2 = await deckRepository.replaceAllCardsInDeck(testDeckId, initialCards);
    expect(success2).toBe(true);

    // Step 6: Verify quantities are still correct after second save
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(12);
    deckCards.forEach(card => {
      expect(card.quantity).toBe(1);
    });

    // Step 7: Save a third time
    const success3 = await deckRepository.replaceAllCardsInDeck(testDeckId, initialCards);
    expect(success3).toBe(true);

    // Step 8: Verify quantities are still correct after third save
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(12);
    deckCards.forEach(card => {
      expect(card.quantity).toBe(1);
    });

    // Step 9: Test with different quantities to ensure replacement works
    const modifiedCards = initialCards.map(card => ({
      ...card,
      quantity: 2 // Change all quantities to 2
    }));

    const success4 = await deckRepository.replaceAllCardsInDeck(testDeckId, modifiedCards);
    expect(success4).toBe(true);

    // Step 10: Verify quantities were properly replaced (not added to)
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(12);
    deckCards.forEach(card => {
      expect(card.quantity).toBe(2);
    });

    // Step 11: Test with fewer cards to ensure removal works
    const reducedCards = initialCards.slice(0, 6); // Only first 6 card types
    const success5 = await deckRepository.replaceAllCardsInDeck(testDeckId, reducedCards);
    expect(success5).toBe(true);

    // Step 12: Verify only 6 cards remain
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(6);
    deckCards.forEach(card => {
      expect(card.quantity).toBe(1);
    });

    // Step 13: Test with empty deck
    const success6 = await deckRepository.replaceAllCardsInDeck(testDeckId, []);
    expect(success6).toBe(true);

    // Step 14: Verify deck is empty
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(0);
  });

  it('should handle the old addCardToDeck method correctly (for comparison)', async () => {
    // This test verifies that the old method would have caused duplication
    // We'll use it to demonstrate the difference

    const characters = await cardRepository.getAllCharacters();
    const powerCards = await cardRepository.getAllPowerCards();

    expect(characters.length).toBeGreaterThan(0);
    expect(powerCards.length).toBeGreaterThan(0);

    // Add a character card
    await deckRepository.addCardToDeck(testDeckId, 'character', characters[0].id, 1);
    
    // Add a power card
    await deckRepository.addCardToDeck(testDeckId, 'power', powerCards[0].id, 1);

    // Verify initial state
    let deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(2);
    expect(deckCards[0].quantity).toBe(1);
    expect(deckCards[1].quantity).toBe(1);

    // Now add the same cards again using the old method
    // This would have caused duplication in the old system
    await deckRepository.addCardToDeck(testDeckId, 'character', characters[0].id, 1);
    await deckRepository.addCardToDeck(testDeckId, 'power', powerCards[0].id, 1);

    // Verify that quantities were added (this is the old behavior)
    deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(2);
    expect(deckCards[0].quantity).toBe(2); // Quantity was added
    expect(deckCards[1].quantity).toBe(2); // Quantity was added

    // This demonstrates why the old clear-and-add approach was problematic
    // The addCardToDeck method adds to existing quantities, which is correct
    // for individual card additions, but wrong for bulk replacement scenarios
  });

  it('should maintain data consistency during concurrent saves', async () => {
    const characters = await cardRepository.getAllCharacters();
    const powerCards = await cardRepository.getAllPowerCards();

    expect(characters.length).toBeGreaterThan(0);
    expect(powerCards.length).toBeGreaterThan(0);

    const cards1 = [
      { cardType: 'character', cardId: characters[0].id, quantity: 1 },
      { cardType: 'power', cardId: powerCards[0].id, quantity: 1 }
    ];

    const cards2 = [
      { cardType: 'character', cardId: characters[0].id, quantity: 2 },
      { cardType: 'power', cardId: powerCards[0].id, quantity: 3 }
    ];

    // Simulate concurrent saves using Promise.all
    const [result1, result2] = await Promise.all([
      deckRepository.replaceAllCardsInDeck(testDeckId, cards1),
      deckRepository.replaceAllCardsInDeck(testDeckId, cards2)
    ]);

    // At least one should succeed
    expect(result1 || result2).toBe(true);

    // Verify final state is consistent (not a mix of both)
    const deckCards = await deckRepository.getDeckCards(testDeckId);
    expect(deckCards).toHaveLength(2);
    
    // The quantities should be either from cards1 or cards2, not a mix
    const characterCard = deckCards.find(c => c.type === 'character');
    const powerCard = deckCards.find(c => c.type === 'power');
    
    expect(characterCard).toBeDefined();
    expect(powerCard).toBeDefined();
    
    // Quantities should be consistent (both 1 or both 2/3)
    if (characterCard!.quantity === 1) {
      expect(powerCard!.quantity).toBe(1);
    } else {
      expect(characterCard!.quantity).toBe(2);
      expect(powerCard!.quantity).toBe(3);
    }
  });
});
