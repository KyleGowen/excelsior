/**
 * Integration tests for Collection SQL injection hardening
 *
 * Goal: ensure request-controlled `cardType` cannot influence SQL identifiers and is strictly validated.
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection SQL Injection Hardening Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let adminAuthCookie: string;
  let adminUsername: string;
  let testCharacterId: string;

  const clearUserCollections = async (userId: string) => {
    const collectionResult = await pool.query('SELECT id FROM collections WHERE user_id = $1', [userId]);
    if (collectionResult.rows.length === 0) {
      return;
    }

    const collectionId = collectionResult.rows[0].id;

    // Delete cards first (may trigger history writes while collection still exists),
    // then delete history, then delete the collection.
    await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
    await pool.query('DELETE FROM collection_history WHERE collection_id = $1', [collectionId]);
    await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
  };

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    const characterResult = await pool.query('SELECT id FROM characters LIMIT 1');
    if (characterResult.rows.length < 1) {
      throw new Error('Not enough test cards available in database');
    }
    testCharacterId = characterResult.rows[0].id;

    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();

    adminUsername = `collection-sql-hardening-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `collection-sql-hardening-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUsername, password: 'adminpass123' });

    expect(login.status).toBe(200);
    adminAuthCookie = login.headers['set-cookie'][0].split(';')[0];
  });

  beforeEach(async () => {
    // Clear this user's collection state for deterministic tests.
    await clearUserCollections(adminUser.id);
  });

  afterAll(async () => {
    // Ensure global cleanup can delete the user without cascading into collection triggers/history.
    await clearUserCollections(adminUser.id);
    await pool.end();
  });

  it('rejects injection-shaped cardType with 400 (not 404/500)', async () => {
    const response = await request(app)
      .post('/api/collections/me/cards')
      .set('Cookie', adminAuthCookie)
      .send({
        cardId: testCharacterId,
        cardType: "characters; DROP TABLE users; --",
        quantity: 1
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects unknown cardType with 400', async () => {
    const response = await request(app)
      .post('/api/collections/me/cards')
      .set('Cookie', adminAuthCookie)
      .send({
        cardId: testCharacterId,
        cardType: 'not-a-real-type',
        quantity: 1
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('still allows valid cardType + existing cardId (happy path)', async () => {
    const response = await request(app)
      .post('/api/collections/me/cards')
      .set('Cookie', adminAuthCookie)
      .send({
        cardId: testCharacterId,
        cardType: 'character',
        quantity: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.card_id).toBeDefined();
    expect(response.body.data.card_type).toBe('character');
  });
});

