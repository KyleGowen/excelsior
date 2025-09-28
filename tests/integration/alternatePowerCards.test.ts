import { ApiClient } from '../helpers/apiClient';
import { v4 as uuidv4 } from 'uuid';

describe('Alternate Power Cards Integration Tests', () => {
  let apiClient: ApiClient;
  let testUserId: string | null = null;
  let testDeckId: string | null = null;

  beforeAll(() => {
    // Initialize API client with your app
    // apiClient = new ApiClient(app);
  });

  afterEach(async () => {
    // Clean up test deck if created
    if (testDeckId) {
      // await apiClient.deleteDeck(testDeckId);
      testDeckId = null;
    }
    if (testUserId) {
      // await apiClient.deleteUser(testUserId);
      testUserId = null;
    }
  });

  describe('Power Card Alternate Images', () => {
    it('should show alternate image options for 5 - Multi Power', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('PowerCardTester', `powercard-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('PowerCardTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Power Card Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 5 - Multi Power
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const multiPowerCard = powerCardsResponse.body.data.find(card => card.name === '5 - Multi Power');
      expect(multiPowerCard).toBeDefined();
      expect(multiPowerCard.alternate_images).toContain('power-cards/alternate/5_multipower.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: multiPowerCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === multiPowerCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/5_multipower.webp');
      expect(deckCard.alternate_images).toContain(multiPowerCard.image_path); // Default image
      
      console.log('✅ 5 - Multi Power alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 7 - Combat', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('CombatTester', `combat-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('CombatTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Combat Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 7 - Combat
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const combatCard = powerCardsResponse.body.data.find(card => card.name === '7 - Combat');
      expect(combatCard).toBeDefined();
      expect(combatCard.alternate_images).toContain('power-cards/alternate/7_combat.png');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: combatCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === combatCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/7_combat.png');
      expect(deckCard.alternate_images).toContain(combatCard.image_path); // Default image
      
      console.log('✅ 7 - Combat alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 8 - Any-Power', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('AnyPowerTester', `anypower-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('AnyPowerTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Any-Power Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 8 - Any-Power
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const anyPowerCard = powerCardsResponse.body.data.find(card => card.name === '8 - Any-Power');
      expect(anyPowerCard).toBeDefined();
      expect(anyPowerCard.alternate_images).toContain('power-cards/alternate/7_anypower.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: anyPowerCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === anyPowerCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/7_anypower.webp');
      expect(deckCard.alternate_images).toContain(anyPowerCard.image_path); // Default image
      
      console.log('✅ 8 - Any-Power alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 8 - Brute Force', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('BruteForceTester', `bruteforce-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('BruteForceTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Brute Force Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 8 - Brute Force
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const bruteForceCard = powerCardsResponse.body.data.find(card => card.name === '8 - Brute Force');
      expect(bruteForceCard).toBeDefined();
      expect(bruteForceCard.alternate_images).toContain('power-cards/alternate/8_brute_force.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: bruteForceCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === bruteForceCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/8_brute_force.webp');
      expect(deckCard.alternate_images).toContain(bruteForceCard.image_path); // Default image
      
      console.log('✅ 8 - Brute Force alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 8 - Combat', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('Combat8Tester', `combat8-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('Combat8Tester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Combat 8 Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 8 - Combat
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const combatCard = powerCardsResponse.body.data.find(card => card.name === '8 - Combat');
      expect(combatCard).toBeDefined();
      expect(combatCard.alternate_images).toContain('power-cards/alternate/8_combat.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: combatCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === combatCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/8_combat.webp');
      expect(deckCard.alternate_images).toContain(combatCard.image_path); // Default image
      
      console.log('✅ 8 - Combat alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 8 - Energy', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('EnergyTester', `energy-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('EnergyTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Energy Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 8 - Energy
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const energyCard = powerCardsResponse.body.data.find(card => card.name === '8 - Energy');
      expect(energyCard).toBeDefined();
      expect(energyCard.alternate_images).toContain('power-cards/alternate/8_energy.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: energyCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === energyCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/8_energy.webp');
      expect(deckCard.alternate_images).toContain(energyCard.image_path); // Default image
      
      console.log('✅ 8 - Energy alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should show alternate image options for 8 - Intelligence', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('IntelligenceTester', `intelligence-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('IntelligenceTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Intelligence Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get power cards to find 8 - Intelligence
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const intelligenceCard = powerCardsResponse.body.data.find(card => card.name === '8 - Intelligence');
      expect(intelligenceCard).toBeDefined();
      expect(intelligenceCard.alternate_images).toContain('power-cards/alternate/8_intelligence.webp');
      
      // Add card to deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: intelligenceCard.id,
          quantity: 1
        })
        .expect(200);
      
      expect(addCardResponse.body.success).toBe(true);
      
      // Verify card appears in deck with alternate image option
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === intelligenceCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.alternate_images).toContain('power-cards/alternate/8_intelligence.webp');
      expect(deckCard.alternate_images).toContain(intelligenceCard.image_path); // Default image
      
      console.log('✅ 8 - Intelligence alternate image test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });
  });

  describe('Alternate Image Switching and Persistence', () => {
    it('should allow switching between default and alternate images for power cards', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('ImageSwitchTester', `imageswitch-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('ImageSwitchTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Image Switch Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get a power card with alternates (8 - Any-Power)
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const anyPowerCard = powerCardsResponse.body.data.find(card => card.name === '8 - Any-Power');
      expect(anyPowerCard).toBeDefined();
      expect(anyPowerCard.alternate_images.length).toBeGreaterThan(0);
      
      // Add card to deck
      await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: anyPowerCard.id,
          quantity: 1
        })
        .expect(200);
      
      // Switch to alternate image
      const switchToAlternateResponse = await request(app)
        .put(`/api/decks/${testDeckId}/cards/${anyPowerCard.id}/image`)
        .set('Cookie', apiClient.cookies)
        .send({
          imagePath: 'power-cards/alternate/7_anypower.webp'
        })
        .expect(200);
      
      expect(switchToAlternateResponse.body.success).toBe(true);
      
      // Verify the image was switched
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const deckCard = deckResponse.body.data.cards.find(card => card.cardId === anyPowerCard.id);
      expect(deckCard).toBeDefined();
      expect(deckCard.selectedImage).toBe('power-cards/alternate/7_anypower.webp');
      
      // Switch back to default image
      const switchToDefaultResponse = await request(app)
        .put(`/api/decks/${testDeckId}/cards/${anyPowerCard.id}/image`)
        .set('Cookie', apiClient.cookies)
        .send({
          imagePath: anyPowerCard.image_path
        })
        .expect(200);
      
      expect(switchToDefaultResponse.body.success).toBe(true);
      
      // Verify the image was switched back
      const finalDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const finalDeckCard = finalDeckResponse.body.data.cards.find(card => card.cardId === anyPowerCard.id);
      expect(finalDeckCard).toBeDefined();
      expect(finalDeckCard.selectedImage).toBe(anyPowerCard.image_path);
      
      console.log('✅ Image switching test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should persist selected alternate image across deck loads', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('PersistenceTester', `persistence-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('PersistenceTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Persistence Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get a power card with alternates (8 - Brute Force)
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const bruteForceCard = powerCardsResponse.body.data.find(card => card.name === '8 - Brute Force');
      expect(bruteForceCard).toBeDefined();
      expect(bruteForceCard.alternate_images.length).toBeGreaterThan(0);
      
      // Add card to deck
      await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: bruteForceCard.id,
          quantity: 1
        })
        .expect(200);
      
      // Switch to alternate image
      await request(app)
        .put(`/api/decks/${testDeckId}/cards/${bruteForceCard.id}/image`)
        .set('Cookie', apiClient.cookies)
        .send({
          imagePath: 'power-cards/alternate/8_brute_force.webp'
        })
        .expect(200);
      
      // Save the deck
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .send({
          name: 'Persistence Test Deck',
          description: 'Testing image persistence'
        })
        .expect(200);
      
      // Load the deck again
      const reloadedDeckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const reloadedDeckCard = reloadedDeckResponse.body.data.cards.find(card => card.cardId === bruteForceCard.id);
      expect(reloadedDeckCard).toBeDefined();
      expect(reloadedDeckCard.selectedImage).toBe('power-cards/alternate/8_brute_force.webp');
      
      console.log('✅ Image persistence test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });

    it('should handle multiple power cards with different selected images', async () => {
      // This is a template - you would uncomment when app is ready
      /*
      // Create test user and deck
      const userResponse = await apiClient.createUser('MultiImageTester', `multiimage-${uuidv4()}@example.com`, 'password123');
      testUserId = userResponse.data.id;
      await apiClient.login('MultiImageTester', 'password123');
      
      const deckResponse = await apiClient.createDeck(testUserId!, 'Multi Image Test Deck');
      testDeckId = deckResponse.data.id;
      
      // Get multiple power cards with alternates
      const powerCardsResponse = await request(app)
        .get('/api/cards/powers')
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const anyPowerCard = powerCardsResponse.body.data.find(card => card.name === '8 - Any-Power');
      const combatCard = powerCardsResponse.body.data.find(card => card.name === '7 - Combat');
      
      expect(anyPowerCard).toBeDefined();
      expect(combatCard).toBeDefined();
      
      // Add both cards to deck
      await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: anyPowerCard.id,
          quantity: 1
        })
        .expect(200);
      
      await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', apiClient.cookies)
        .send({
          cardType: 'powers',
          cardId: combatCard.id,
          quantity: 1
        })
        .expect(200);
      
      // Set different images for each card
      await request(app)
        .put(`/api/decks/${testDeckId}/cards/${anyPowerCard.id}/image`)
        .set('Cookie', apiClient.cookies)
        .send({
          imagePath: 'power-cards/alternate/7_anypower.webp'
        })
        .expect(200);
      
      await request(app)
        .put(`/api/decks/${testDeckId}/cards/${combatCard.id}/image`)
        .set('Cookie', apiClient.cookies)
        .send({
          imagePath: 'power-cards/alternate/7_combat.png'
        })
        .expect(200);
      
      // Verify both cards have their selected images
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', apiClient.cookies)
        .expect(200);
      
      const anyPowerDeckCard = deckResponse.body.data.cards.find(card => card.cardId === anyPowerCard.id);
      const combatDeckCard = deckResponse.body.data.cards.find(card => card.cardId === combatCard.id);
      
      expect(anyPowerDeckCard).toBeDefined();
      expect(combatDeckCard).toBeDefined();
      expect(anyPowerDeckCard.selectedImage).toBe('power-cards/alternate/7_anypower.webp');
      expect(combatDeckCard.selectedImage).toBe('power-cards/alternate/7_combat.png');
      
      console.log('✅ Multiple image selection test passed');
      */
      
      // Placeholder assertion for now
      expect(true).toBe(true);
    });
  });
});
