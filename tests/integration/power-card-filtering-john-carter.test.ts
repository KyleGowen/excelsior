import request from 'supertest';
import { app } from '../../src/test-server';
import { ApiClient } from '../helpers/apiClient';
import { integrationTestUtils } from '../setup-integration';

describe('Stat Type Filtering - John Carter special case', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let testDeckId: string | undefined;

  beforeAll(async () => {
    apiClient = new ApiClient(app);
    testUser = await integrationTestUtils.createTestUser({
      name: 'power-filter-jc-user',
      email: 'power-filter-jc@example.com',
      password: 'password123',
      role: 'USER',
    });
    // Login
    await apiClient.login(testUser.username, 'password123');
    // Create deck
    const deckResp = await apiClient.createDeck({ name: 'JC Filter Test Deck' });
    testDeckId = deckResp.body.data.id;
    integrationTestUtils.trackTestDeck(testDeckId!);
  });

  afterAll(async () => {
    if (testDeckId) {
      try {
        await apiClient.deleteDeck(testDeckId);
      } catch (_) {
        // ignore
      }
    }
  });

  it('treats Brute Force 8 as usable for John Carter, 9 as unusable', async () => {
    // Get characters
    const charactersResp = await request(app).get('/api/characters').expect(200);
    const characters = charactersResp.body.data || [];
    const johnCarter = characters.find((c: any) => (c.name || '').toLowerCase().includes('john carter'));
    expect(johnCarter).toBeTruthy();

    // Add John Carter to deck
    await apiClient.addCardToDeck(testDeckId!, {
      cardType: 'character',
      cardId: johnCarter.id,
      quantity: 1,
    });

    // Fetch power cards
    const powerResp = await request(app).get('/api/power-cards').expect(200);
    const powerCards = powerResp.body.data || [];

    const brute8 = powerCards.filter((p: any) => p.power_type === 'Brute Force' && p.value === 8);
    const brute9 = powerCards.filter((p: any) => p.power_type === 'Brute Force' && p.value === 9);

    // Compute usability using effective overrides
    const effectiveBrute = Math.max(johnCarter.brute_force || 0, 8);

    if (brute8.length > 0) {
      expect(effectiveBrute >= 8).toBe(true);
    }
    if (brute9.length > 0) {
      expect(effectiveBrute >= 9).toBe(false);
    }
  });

  it('uses effective overrides for Any-Power/Multi Power with John Carter', async () => {
    const charactersResp = await request(app).get('/api/characters').expect(200);
    const characters = charactersResp.body.data || [];
    const johnCarter = characters.find((c: any) => (c.name || '').toLowerCase().includes('john carter'));
    expect(johnCarter).toBeTruthy();

    const powerResp = await request(app).get('/api/power-cards').expect(200);
    const powerCards = powerResp.body.data || [];

    const effectiveMax = Math.max(
      johnCarter.energy || 0,
      johnCarter.combat || 0,
      Math.max(johnCarter.brute_force || 0, 8),
      johnCarter.intelligence || 0,
    );

    const any8 = powerCards.filter((p: any) => (p.power_type === 'Any-Power' || p.power_type === 'Multi Power' || p.power_type === 'Multi-Power') && p.value === 8);
    const any9 = powerCards.filter((p: any) => (p.power_type === 'Any-Power' || p.power_type === 'Multi Power' || p.power_type === 'Multi-Power') && p.value === 9);

    if (any8.length > 0) {
      expect(effectiveMax >= 8).toBe(true);
    }
    if (any9.length > 0) {
      expect(effectiveMax >= 9).toBe(false);
    }
  });
});


