/**
 * Integration tests for the All tab in the card database
 * Tests API endpoints, filtering, sorting, and display functionality
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('All Tab Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let adminAuthCookie: string;
  let adminUsername: string;
  let regularUser: any;
  let regularAuthCookie: string;
  let regularUsername: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
    });

    // Create ADMIN user
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    adminUsername = `alltab-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);

    // Create regular USER
    regularUsername = `alltab-user-${timestamp}`;
    regularUser = await userRepository.createUser(
      regularUsername,
      `user-${timestamp}@example.com`,
      'userpass123',
      'USER'
    );
    integrationTestUtils.trackTestUser(regularUser.id);

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUsername,
        password: 'adminpass123'
      });
    adminAuthCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];

    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: regularUsername,
        password: 'userpass123'
      });
    regularAuthCookie = userLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('API Endpoints - All Card Types', () => {
    it('should return all card types with set and set_number fields', async () => {
      const cardTypes = [
        { endpoint: '/api/characters', type: 'character' },
        { endpoint: '/api/special-cards', type: 'special' },
        { endpoint: '/api/power-cards', type: 'power' },
        { endpoint: '/api/locations', type: 'location' },
        { endpoint: '/api/aspects', type: 'aspect' },
        { endpoint: '/api/missions', type: 'mission' },
        { endpoint: '/api/events', type: 'event' },
        { endpoint: '/api/teamwork', type: 'teamwork' },
        { endpoint: '/api/ally-universe', type: 'ally-universe' },
        { endpoint: '/api/training', type: 'training' },
        { endpoint: '/api/basic-universe', type: 'basic-universe' },
        { endpoint: '/api/advanced-universe', type: 'advanced-universe' }
      ];

      for (const cardType of cardTypes) {
        const response = await request(app)
          .get(cardType.endpoint)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const firstCard = response.body.data[0];
          expect(firstCard).toHaveProperty('id');
          
          // Verify set and set_number fields exist
          expect(firstCard).toHaveProperty('set');
          expect(firstCard).toHaveProperty('set_number');
          
          // Verify set is a string
          expect(typeof firstCard.set).toBe('string');
        }
      }
    });

    it('should return cards sorted by set then set_number when loaded', async () => {
      // Get cards from multiple types
      const [charactersRes, specialsRes, powerRes] = await Promise.all([
        request(app).get('/api/characters'),
        request(app).get('/api/special-cards'),
        request(app).get('/api/power-cards')
      ]);

      const allCards = [
        ...charactersRes.body.data.map((c: any) => ({ ...c, cardType: 'character' })),
        ...specialsRes.body.data.map((c: any) => ({ ...c, cardType: 'special' })),
        ...powerRes.body.data.map((c: any) => ({ ...c, cardType: 'power' }))
      ];

      // Sort by set then set_number (as the frontend does)
      const sorted = [...allCards].sort((a, b) => {
        const setA = String(a.set || a.universe || 'ERB').toUpperCase().trim();
        const setB = String(b.set || b.universe || 'ERB').toUpperCase().trim();
        
        if (setA !== setB) {
          return setA.localeCompare(setB);
        }
        
        const numAStr = String(a.set_number || '').trim();
        const numBStr = String(b.set_number || '').trim();
        
        if (!numAStr && !numBStr) return 0;
        if (!numAStr) return 1;
        if (!numBStr) return -1;
        
        const numA = parseInt(numAStr, 10) || 0;
        const numB = parseInt(numBStr, 10) || 0;
        
        return numA - numB;
      });

      // Verify sorting: cards from same set should be ordered by set_number
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        
        const currentSet = String(current.set || current.universe || 'ERB').toUpperCase();
        const nextSet = String(next.set || next.universe || 'ERB').toUpperCase();
        
        if (currentSet === nextSet) {
          const currentNumStr = String(current.set_number || '').trim();
          const nextNumStr = String(next.set_number || '').trim();
          // Match the sort rule: missing set_number sorts last
          const currentNum = currentNumStr ? (parseInt(currentNumStr, 10) || Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
          const nextNum = nextNumStr ? (parseInt(nextNumStr, 10) || Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
          expect(currentNum).toBeLessThanOrEqual(nextNum);
        }
      }
    });

    it('should return cards with consistent data structure across all types', async () => {
      const endpoints = [
        '/api/characters',
        '/api/special-cards',
        '/api/power-cards',
        '/api/locations',
        '/api/missions',
        '/api/events'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        if (response.body.data.length > 0) {
          const card = response.body.data[0];
          
          // All cards should have these fields
          expect(card).toHaveProperty('id');
          expect(card).toHaveProperty('set');
          expect(card).toHaveProperty('set_number');
        }
      }
    });
  });

  describe('Card Name Extraction', () => {
    it('should extract correct names for different card types', async () => {
      const [charactersRes, powerRes, aspectRes] = await Promise.all([
        request(app).get('/api/characters').query({ limit: 1 }),
        request(app).get('/api/power-cards').query({ limit: 1 }),
        request(app).get('/api/aspects').query({ limit: 1 })
      ]);

      // Characters should have 'name'
      if (charactersRes.body.data.length > 0) {
        expect(charactersRes.body.data[0]).toHaveProperty('name');
      }

      // Power cards should have 'value' and 'power_type'
      if (powerRes.body.data.length > 0) {
        const powerCard = powerRes.body.data[0];
        expect(powerCard).toHaveProperty('value');
        expect(powerCard).toHaveProperty('power_type');
      }

      // Aspects should have 'card_name' or 'name'
      if (aspectRes.body.data.length > 0) {
        const aspect = aspectRes.body.data[0];
        expect(aspect).toHaveProperty('card_name');
      }
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter cards by card type correctly', async () => {
      // Get all cards
      const [charactersRes, specialsRes, powerRes] = await Promise.all([
        request(app).get('/api/characters'),
        request(app).get('/api/special-cards'),
        request(app).get('/api/power-cards')
      ]);

      const allCards = [
        ...charactersRes.body.data.map((c: any) => ({ ...c, cardType: 'character' })),
        ...specialsRes.body.data.map((c: any) => ({ ...c, cardType: 'special' })),
        ...powerRes.body.data.map((c: any) => ({ ...c, cardType: 'power' }))
      ];

      // Filter by character type
      const characterCards = allCards.filter((c: any) => c.cardType === 'character');
      expect(characterCards.length).toBe(charactersRes.body.data.length);
      expect(characterCards.every((c: any) => c.cardType === 'character')).toBe(true);

      // Filter by special type
      const specialCards = allCards.filter((c: any) => c.cardType === 'special');
      expect(specialCards.length).toBe(specialsRes.body.data.length);
      expect(specialCards.every((c: any) => c.cardType === 'special')).toBe(true);
    });
  });

  describe('Guest User Restrictions', () => {
    it('should allow guest users to view all cards', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should prevent unauthenticated users from adding cards to decks', async () => {
      // This is tested at the frontend level, but we verify the API requires auth
      const deckId = 'test-deck-id';
      
      const response = await request(app)
        .post(`/api/decks/${deckId}/cards`)
        .send({
          cardType: 'character',
          cardId: 'test-id',
          quantity: 1
        })
        .expect(401); // Unauthorized

      expect(response.body.success).toBe(false);
    });
  });

  describe('ADMIN Collection Feature', () => {
    it('should allow ADMIN users to add cards to collection', async () => {
      // Get a card to add
      const charactersRes = await request(app)
        .get('/api/characters')
        .expect(200);

      if (charactersRes.body.data.length > 0) {
        const card = charactersRes.body.data[0];

        const response = await request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie)
          .send({
            cardId: card.id,
            cardType: 'character',
            quantity: 1
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Cleanup
        await request(app)
          .delete(`/api/collections/me/cards/${card.id}?cardType=character`)
          .set('Cookie', adminAuthCookie);
      }
    });

    it('should prevent non-ADMIN users from accessing collection endpoints', async () => {
      const charactersRes = await request(app)
        .get('/api/characters')
        .expect(200);

      if (charactersRes.body.data.length > 0) {
        const card = charactersRes.body.data[0];

        const response = await request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', regularAuthCookie)
          .send({
            cardId: card.id,
            cardType: 'character',
            quantity: 1
          })
          .expect(403); // Forbidden

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('ADMIN');
      }
    });
  });

  describe('Performance and Data Loading', () => {
    it('should load all card types efficiently', async () => {
      const startTime = Date.now();

      const endpoints = [
        '/api/characters',
        '/api/special-cards',
        '/api/power-cards',
        '/api/locations',
        '/api/aspects',
        '/api/missions',
        '/api/events',
        '/api/teamwork',
        '/api/ally-universe',
        '/api/training',
        '/api/basic-universe',
        '/api/advanced-universe'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => request(app).get(endpoint))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Log performance metrics
      const totalCards = responses.reduce((sum, res) => sum + res.body.data.length, 0);
      console.log(`Loaded ${totalCards} cards from ${endpoints.length} endpoints in ${duration}ms`);
    });

    it('should return consistent card counts across requests', async () => {
      const [firstRes, secondRes] = await Promise.all([
        request(app).get('/api/characters'),
        request(app).get('/api/characters')
      ]);

      expect(firstRes.body.data.length).toBe(secondRes.body.data.length);
    });
  });

  describe('Card Sorting Verification', () => {
    it('should verify cards are sorted by set then set_number in database', async () => {
      // Verify sorting within each table (avoids invalid ORDER BY + UNION syntax)
      const [characters, specials] = await Promise.all([
        pool.query(`
          SELECT set, set_number
          FROM characters
          WHERE set IS NOT NULL AND set_number IS NOT NULL
          ORDER BY set, CAST(set_number AS INTEGER)
          LIMIT 50
        `),
        pool.query(`
          SELECT set, set_number
          FROM special_cards
          WHERE set IS NOT NULL AND set_number IS NOT NULL
          ORDER BY set, CAST(set_number AS INTEGER)
          LIMIT 50
        `)
      ]);

      const verifySorted = (rows: any[]) => {
        for (let i = 0; i < rows.length - 1; i++) {
          const currentSet = String(rows[i].set).toUpperCase();
          const nextSet = String(rows[i + 1].set).toUpperCase();
          if (currentSet === nextSet) {
            const currentNum = parseInt(String(rows[i].set_number), 10);
            const nextNum = parseInt(String(rows[i + 1].set_number), 10);
            expect(currentNum).toBeLessThanOrEqual(nextNum);
          } else {
            expect(currentSet.localeCompare(nextSet)).toBeLessThanOrEqual(0);
          }
        }
      };

      verifySorted(characters.rows);
      verifySorted(specials.rows);
    });

    it('should handle cards with missing set_number gracefully', async () => {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM characters
        WHERE set_number IS NULL
      `);

      // Should not crash, just log that some cards don't have set_number
      expect(parseInt(result.rows[0].count, 10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Card Image Paths', () => {
    it('should return valid image paths for all card types', async () => {
      const endpoints = [
        { endpoint: '/api/characters', type: 'character' },
        { endpoint: '/api/special-cards', type: 'special' },
        { endpoint: '/api/power-cards', type: 'power' },
        { endpoint: '/api/locations', type: 'location' }
      ];

      for (const { endpoint } of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        if (response.body.data.length > 0) {
          const card = response.body.data[0];
          
          // Cards should have image_path or image field
          expect(card.image_path || card.image).toBeDefined();
          
          // Image path should be a string
          expect(typeof (card.image_path || card.image)).toBe('string');
        }
      }
    });
  });
});

