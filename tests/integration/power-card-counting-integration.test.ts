import request from 'supertest';
import { app } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('Power Card Counting Integration Tests', () => {
  let testUser: any;
  let testDeck: any;
  let userCookie: string;

  beforeAll(async () => {
    // Create a test user with proper password hash
    const userRepo = DataSourceConfig.getInstance().getUserRepository();
    testUser = await userRepo.createUser('testuser', 'test@example.com', 'testpassword', 'USER');
    
    // Login to get session cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpassword' });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers['set-cookie']).toBeDefined();
    expect(loginResponse.headers['set-cookie'].length).toBeGreaterThan(0);
    
    userCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    // Clean up test data
    const deckRepo = DataSourceConfig.getInstance().getDeckRepository();
    const userRepo = DataSourceConfig.getInstance().getUserRepository();
    
    if (testDeck) {
      await deckRepo.deleteDeck(testDeck.id);
    }
    if (testUser) {
      await userRepo.deleteUser(testUser.id);
    }
  });

  describe('Power Card Counting Scenarios', () => {
    beforeEach(async () => {
      // Create a fresh test deck for each test
      const deckRepo = DataSourceConfig.getInstance().getDeckRepository();
      testDeck = await deckRepo.createDeck(testUser.id, 'Test Deck', 'Test Description');
    });

    afterEach(async () => {
      // Clean up the test deck
      if (testDeck) {
        const deckRepo = DataSourceConfig.getInstance().getDeckRepository();
        await deckRepo.deleteDeck(testDeck.id);
        testDeck = null;
      }
    });

    test('should show 0 power cards when no power cards are added', async () => {
      // Get the deck data to verify no power cards are present
      const response = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata.name).toBe('Test Deck');
      
      // Verify no power cards are present
      const powerCards = response.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCards.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(powerCards.length).toBe(0);
      expect(totalPowerCardQuantity).toBe(0);
    });

    test('should show correct count when adding one of each power card type', async () => {
      // Get available power cards first
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      // Group power cards by type
      const powerCardsByType = powerCards.reduce((acc: any, card: any) => {
        if (!acc[card.power_type]) {
          acc[card.power_type] = [];
        }
        acc[card.power_type].push(card);
        return acc;
      }, {});

      const powerTypes = Object.keys(powerCardsByType);
      expect(powerTypes.length).toBeGreaterThan(0);

      // Add one card of each power type
      let totalExpectedCards = 0;
      for (const powerType of powerTypes) {
        const card = powerCardsByType[powerType][0]; // Take first card of each type
        
        const addCardResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', userCookie)
          .send({
            cardType: 'power',
            cardId: card.id,
            quantity: 1
          })
          .expect(200);

        expect(addCardResponse.body.success).toBe(true);
        totalExpectedCards += 1;
      }

      // Verify the deck now has the expected number of power cards
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(totalExpectedCards);
      expect(powerCardsInDeck.length).toBe(powerTypes.length); // One unique card of each type
    });

    test('should show correct count when adding multiple cards of each power type', async () => {
      // Get available power cards
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      // Group power cards by type
      const powerCardsByType = powerCards.reduce((acc: any, card: any) => {
        if (!acc[card.power_type]) {
          acc[card.power_type] = [];
        }
        acc[card.power_type].push(card);
        return acc;
      }, {});

      const powerTypes = Object.keys(powerCardsByType);
      expect(powerTypes.length).toBeGreaterThan(0);

      // Add multiple cards of each power type (2-4 cards per type)
      let totalExpectedCards = 0;
      const cardsPerType = [2, 3, 4, 2]; // Different quantities per type
      
      for (let i = 0; i < powerTypes.length && i < cardsPerType.length; i++) {
        const powerType = powerTypes[i];
        const quantity = cardsPerType[i];
        const card = powerCardsByType[powerType][0]; // Take first card of each type
        
        const addCardResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', userCookie)
          .send({
            cardType: 'power',
            cardId: card.id,
            quantity: quantity
          })
          .expect(200);

        expect(addCardResponse.body.success).toBe(true);
        totalExpectedCards += quantity;
      }

      // Verify the deck now has the expected number of power cards
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(totalExpectedCards);
    });

    test('should show correct count when adding same power card multiple times', async () => {
      // Get a single power card
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      const testCard = powerCards[0];
      const quantityToAdd = 5;

      // Add the same card multiple times
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: quantityToAdd
        })
        .expect(200);

      expect(addCardResponse.body.success).toBe(true);

      // Verify the deck has the correct quantity
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(quantityToAdd);
      expect(powerCardsInDeck.length).toBe(1); // Only one unique card
    });

    test('should show correct count when mixing power cards with other card types', async () => {
      // Add some power cards
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      // Add 2 power cards
      const powerCard1 = powerCards[0];
      const powerCard2 = powerCards[1];

      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: powerCard1.id,
          quantity: 3
        })
        .expect(200);

      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: powerCard2.id,
          quantity: 2
        })
        .expect(200);

      // Add some non-power cards
      const charactersResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      const characters = charactersResponse.body.data;
      expect(characters.length).toBeGreaterThan(0);

      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'character',
          cardId: characters[0].id,
          quantity: 1
        })
        .expect(200);

      // Add special cards
      const specialCardsResponse = await request(app)
        .get('/api/special-cards')
        .expect(200);

      const specialCards = specialCardsResponse.body.data;
      if (specialCards.length > 0) {
        await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', userCookie)
          .send({
            cardType: 'special',
            cardId: specialCards[0].id,
            quantity: 2
          })
          .expect(200);
      }

      // Verify only power cards are counted in power card total
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const allCards = deckResponse.body.data.cards;
      const powerCardsInDeck = allCards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(5); // 3 + 2
      expect(powerCardsInDeck.length).toBe(2); // Two unique power cards
      
      // Verify other card types are present but not counted in power total
      const characterCards = allCards.filter((card: any) => card.type === 'character');
      const specialCardsInDeck = allCards.filter((card: any) => card.type === 'special');
      
      expect(characterCards.length).toBe(1);
      expect(specialCardsInDeck.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle removing power cards and update count correctly', async () => {
      // Add some power cards first
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      const testCard = powerCards[0];

      // Add 5 copies of a power card
      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: 5
        })
        .expect(200);

      // Verify initial count
      let deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      let powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      let totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      expect(totalPowerCardQuantity).toBe(5);

      // Remove 2 copies
      const removeResponse = await request(app)
        .delete(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: 2
        })
        .expect(200);

      expect(removeResponse.body.success).toBe(true);

      // Verify updated count
      deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      expect(totalPowerCardQuantity).toBe(3); // 5 - 2
    });

    test('should handle removing all power cards and show 0 count', async () => {
      // Add some power cards first
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      const testCard = powerCards[0];

      // Add power cards
      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: 3
        })
        .expect(200);

      // Verify initial count
      let deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      let powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      let totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      expect(totalPowerCardQuantity).toBe(3);

      // Remove all power cards
      const removeResponse = await request(app)
        .delete(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: 3
        })
        .expect(200);

      expect(removeResponse.body.success).toBe(true);

      // Verify count is now 0
      deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      expect(totalPowerCardQuantity).toBe(0);
    });
  });

  describe('Power Card Counting Edge Cases', () => {
    beforeEach(async () => {
      const deckRepo = DataSourceConfig.getInstance().getDeckRepository();
      testDeck = await deckRepo.createDeck(testUser.id, 'Test Deck', 'Test Description');
    });

    afterEach(async () => {
      if (testDeck) {
        const deckRepo = DataSourceConfig.getInstance().getDeckRepository();
        await deckRepo.deleteDeck(testDeck.id);
        testDeck = null;
      }
    });

    test('should handle large quantities of power cards', async () => {
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(0);

      const testCard = powerCards[0];
      const largeQuantity = 50;

      // Add a large quantity of power cards
      await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'power',
          cardId: testCard.id,
          quantity: largeQuantity
        })
        .expect(200);

      // Verify the count is correct
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(largeQuantity);
    });

    test('should handle multiple different power cards with various quantities', async () => {
      const powerCardsResponse = await request(app)
        .get('/api/power-cards')
        .expect(200);

      const powerCards = powerCardsResponse.body.data;
      expect(powerCards.length).toBeGreaterThan(2);

      // Add different power cards with different quantities
      const testCards = powerCards.slice(0, 3);
      const quantities = [1, 3, 7];
      let expectedTotal = 0;

      for (let i = 0; i < testCards.length; i++) {
        const card = testCards[i];
        const quantity = quantities[i];

        await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', userCookie)
          .send({
            cardType: 'power',
            cardId: card.id,
            quantity: quantity
          })
          .expect(200);

        expectedTotal += quantity;
      }

      // Verify the total count
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', userCookie)
        .expect(200);

      const powerCardsInDeck = deckResponse.body.data.cards.filter((card: any) => card.type === 'power');
      const totalPowerCardQuantity = powerCardsInDeck.reduce((total: number, card: any) => total + card.quantity, 0);
      
      expect(totalPowerCardQuantity).toBe(expectedTotal); // 1 + 3 + 7 = 11
      expect(powerCardsInDeck.length).toBe(3); // Three unique cards
    });
  });
});
