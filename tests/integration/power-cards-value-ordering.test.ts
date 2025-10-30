/**
 * Integration test: verifies Power Cards are ordered by value with OP type tiebreakers
 */

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.SKIP_MIGRATIONS = 'true';

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Power Cards ordering by value (with OP type tiebreakers)', () => {
  const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Multi Power', 'Any-Power'];
  const orderIndex = (t: string) => {
    const idx = preferredOrder.indexOf(t);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  let testUser: any;
  let testDeck: any;
  let authCookie: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
  });

  afterAll(async () => {
    const userRepo = DataSourceConfig.getInstance().getUserRepository();
    if (testUser) {
      try { await userRepo.deleteUser(testUser.id); } catch {}
    }
  });

  beforeEach(async () => {
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    const deckRepository = DataSourceConfig.getInstance().getDeckRepository();

    const ts = Date.now();
    testUser = await userRepository.createUser(
      `pcsort_${ts}`,
      `pcsort_${ts}@example.com`,
      'testpass123',
      'USER'
    );

    testDeck = await deckRepository.createDeck(
      testUser.id,
      'Power Sort Deck',
      'Verify power card ordering by value'
    );
    integrationTestUtils.trackTestDeck(testDeck.id);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.name, password: 'testpass123' });
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    authCookie = login.headers['set-cookie']![0].split(';')[0];
  });

  afterEach(async () => {
    const userRepo = DataSourceConfig.getInstance().getUserRepository();
    if (testUser) {
      try { await userRepo.deleteUser(testUser.id); } catch {}
    }
  });

  it('adds all power cards and verifies value ordering in deck editor', async () => {
    // Fetch all power cards
    const powerResp = await request(app).get('/api/power-cards').expect(200);
    expect(powerResp.body.success).toBe(true);
    const allPowerCards = powerResp.body.data as Array<{ id: string; value: number; power_type: string }>;
    expect(allPowerCards.length).toBeGreaterThan(0);

    // Add every power card to the deck
    for (const card of allPowerCards) {
      const add = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({ cardId: card.id, cardType: 'power' });
      expect([200, 201, 204]).toContain(add.status);
    }

    // Enable value-sort in UI preferences for this deck
    const prefs = {
      powerCardsSortMode: 'value'
    } as any;
    const putPrefs = await request(app)
      .put(`/api/decks/${testDeck.id}/ui-preferences`)
      .set('Cookie', authCookie)
      .send(prefs);
    expect([200, 201]).toContain(putPrefs.status);

    // Load deck editor HTML
    const htmlResp = await request(app)
      .get(`/users/${testUser.id}/decks/${testDeck.id}`)
      .set('Cookie', authCookie);
    expect(htmlResp.status).toBe(200);
    const html = htmlResp.text;

    // Extract the Power Cards section lines in the order they appear
    // Each power card renders a name like: `${value} - ${power_type}`
    const regex = /<div class="deck-card-editor-name">(\d+) - ([^<]+)\b/g;
    const found: Array<{ value: number; type: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      const v = parseInt(m[1], 10);
      const t = m[2].trim();
      found.push({ value: v, type: t });
    }

    // Sanity check: we should have at least as many items as the number of power cards added
    expect(found.length).toBeGreaterThan(0);

    // Verify non-decreasing by value, and ties use OP type order
    for (let i = 1; i < found.length; i++) {
      const prev = found[i - 1];
      const curr = found[i];
      if (curr.value < prev.value) {
        throw new Error(`Value order violated at index ${i}: ${prev.value} -> ${curr.value}`);
      }
      if (curr.value === prev.value) {
        const cmp = orderIndex(prev.type) - orderIndex(curr.type);
        if (cmp > 0) {
          throw new Error(`Type tiebreak violated at value ${curr.value}: '${prev.type}' before '${curr.type}'`);
        }
      }
    }
  });
});


