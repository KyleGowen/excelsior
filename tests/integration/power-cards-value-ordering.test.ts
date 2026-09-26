/**
 * Integration test: persists the power-card value-sort preference used by the React UI.
 * Rendering and tie-breakers are covered by frontend unit tests.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.SKIP_MIGRATIONS = 'true';

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Power card value-sort preference persistence', () => {
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

  it('persists the power-card value-sort preference across API reloads', async () => {
    // React owns rendering/sorting; its numeric ordering is covered by the v2 unit suite.
    // The API contract is that the selected sorting preference survives a reload.
    await request(app).put(`/api/v1/decks/${testDeck.id}/ui-preferences`)
      .set('Cookie', authCookie).send({ powerCardsSortMode: 'value' }).expect(200);
    const saved = await request(app).get(`/api/v1/decks/${testDeck.id}/ui-preferences`)
      .set('Cookie', authCookie).expect(200);
    expect(saved.body.data.powerCardsSortMode).toBe('value');
  });
});
