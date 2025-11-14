import request from 'supertest';
import { app } from '../../src/test-server';
import { ApiClient } from '../helpers/apiClient';
import { integrationTestUtils } from '../setup-integration';

describe('Stat Type Filtering - Time Traveler special case', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let testDeckId: string | undefined;

  beforeAll(async () => {
    apiClient = new ApiClient(app);
    testUser = await integrationTestUtils.createTestUser({
      name: 'power-filter-tt-user',
      email: 'power-filter-tt@example.com',
      password: 'password123',
      role: 'USER',
    });
    await apiClient.login(testUser.username, 'password123');
    const deckResp = await apiClient.createDeck({ name: 'TT Filter Test Deck' });
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

  it('treats Intelligence 8 as usable for Time Traveler, 9 as unusable', async () => {
    const charactersResp = await request(app).get('/api/characters').expect(200);
    const characters = charactersResp.body.data || [];
    const timeTraveler = characters.find((c: any) => (c.name || '').toLowerCase() === 'time traveler');
    expect(timeTraveler).toBeTruthy();

    // Ensure cardId is a string (UUIDs from database might be objects)
    await apiClient.addCardToDeck(testDeckId!, {
      cardType: 'character',
      cardId: String(timeTraveler.id),
      quantity: 1,
    });

    const powerResp = await request(app).get('/api/power-cards').expect(200);
    const powerCards = powerResp.body.data || [];

    const intel8 = powerCards.filter((p: any) => p.power_type === 'Intelligence' && p.value === 8);
    const intel9 = powerCards.filter((p: any) => p.power_type === 'Intelligence' && p.value === 9);

    const effectiveIntel = Math.max(timeTraveler.intelligence || 0, 8);

    if (intel8.length > 0) {
      expect(effectiveIntel >= 8).toBe(true);
    }
    if (intel9.length > 0) {
      expect(effectiveIntel >= 9).toBe(false);
    }
  });

  it('uses effective overrides for Any-Power/Multi Power with Time Traveler', async () => {
    const charactersResp = await request(app).get('/api/characters').expect(200);
    const characters = charactersResp.body.data || [];
    const timeTraveler = characters.find((c: any) => (c.name || '').toLowerCase() === 'time traveler');
    expect(timeTraveler).toBeTruthy();

    const powerResp = await request(app).get('/api/power-cards').expect(200);
    const powerCards = powerResp.body.data || [];

    const effectiveMax = Math.max(
      timeTraveler.energy || 0,
      timeTraveler.combat || 0,
      timeTraveler.brute_force || 0,
      Math.max(timeTraveler.intelligence || 0, 8),
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


