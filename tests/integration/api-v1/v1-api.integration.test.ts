/**
 * Integration tests for /api/v1 (auth + dbv-catalog routers).
 */
import request from 'supertest';
import type { Server } from 'node:http';
import { initializeTestServer } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

interface CatalogTestCard {
  name?: string;
  set?: string;
  set_number?: string | null;
  errata?: Array<{
    source_section: number;
    entry_text: string;
    source_url: string;
  }>;
}

describe('API v1 integration', () => {
  let username: string;
  let password: string;

  let server: Server;

  beforeAll(async () => {
    // Reuse the suite listener; per-request listeners can race local port reuse.
    server = (await initializeTestServer()).server;
    expect(server.listening).toBe(true);
    await integrationTestUtils.ensureGuestUser();
    const ts = Date.now();
    username = `v1-api-${ts}`;
    password = 'v1IntegrationPass123';
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    const user = await userRepository.createUser(username, `${username}@example.com`, password, 'USER');
    integrationTestUtils.trackTestUser(user.id);
  });

  describe('dbv-catalog.http', () => {
    it('GET /api/v1/catalog/characters returns 200 without session (optional auth)', async () => {
      const res = await request(server).get('/api/v1/catalog/characters').expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/catalog/characters returns v1 envelope and character rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/characters').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/locations returns v1 envelope and location rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/locations').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/special-cards returns v1 envelope and special card rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/special-cards').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('catalogs include official errata on every linked card printing', async () => {
      const [characters, locations, specials, events] = await Promise.all([
        request(server).get('/api/v1/catalog/characters').expect(200),
        request(server).get('/api/v1/catalog/locations').expect(200),
        request(server).get('/api/v1/catalog/special-cards').expect(200),
        request(server).get('/api/v1/catalog/events').expect(200)
      ]);

      const immortal = (specials.body.data as CatalogTestCard[])
        .find((card) => card.set === 'SKY' && card.set_number === '073');
      expect(immortal?.errata?.map((entry) => entry.source_section)).toEqual([1, 12]);
      expect(immortal?.errata?.[0]?.entry_text).toContain('normal KO process is followed');
      expect(immortal?.errata?.[0]?.entry_text).toContain('Immortal - When Immortal is KO’d');
      expect(immortal?.errata?.[0]?.entry_text).not.toContain('Allen the Alien -');
      expect(immortal?.errata?.[0]?.entry_text).not.toContain('Mauler Twins -');
      expect(immortal?.errata?.[0]?.entry_text).not.toContain('Walkers: Herd -');
      expect(immortal?.errata?.[1]).toEqual(expect.objectContaining({
        entry_text: expect.stringContaining('Remainder of Game Full Hourglass'),
        source_url: 'https://overpowercardgame.com/errata/#s12'
      }));

      const friendlyManipulation = (specials.body.data as CatalogTestCard[])
        .find((card) => card.set === 'SKY' && card.set_number === '049');
      expect(friendlyManipulation?.errata?.[0]?.entry_text).toContain(
        'all Universe cards with grid requirements now check the character’s grid'
      );
      expect(friendlyManipulation?.errata?.[0]?.entry_text).toContain(
        'Allen the Alien’s “Friendly Manipulation”'
      );
      expect(friendlyManipulation?.errata?.[0]?.entry_text).not.toContain(
        'The Flaxans “City Leveling Invasion”'
      );

      const forGuineveresLove = (specials.body.data as CatalogTestCard[])
        .find((card) => card.set === 'ERB' && card.set_number === '134');
      const knightOfTheRoundTable = (specials.body.data as CatalogTestCard[])
        .find((card) => card.set === 'ERB' && card.set_number === '136');
      expect(forGuineveresLove?.errata?.[0]?.entry_text).toContain('For Guinevere’s Love');
      expect(forGuineveresLove?.errata?.[0]?.entry_text).not.toContain('Knight of the Round Table');
      expect(knightOfTheRoundTable?.errata?.[0]?.entry_text).toContain('Knight of the Round Table');
      expect(knightOfTheRoundTable?.errata?.[0]?.entry_text).not.toContain('For Guinevere’s Love');

      const glennPrintings = (characters.body.data as CatalogTestCard[]).filter(
        (card) => card.name === 'Glenn' && Boolean(card.set_number && ['170', '442', '442F'].includes(card.set_number))
      );
      expect(glennPrintings).toHaveLength(3);
      expect(glennPrintings.every((card) => card.errata?.[0]?.source_section === 9)).toBe(true);
      expect(glennPrintings.every((card) => (
        card.errata?.[0]?.entry_text.includes('The practical implication is that Glenn can use an 8')
          && !card.errata[0].entry_text.includes('Strategically,')
          && !card.errata[0].entry_text.includes('Shapesmith')
      ))).toBe(true);

      const monstrousLeadership = (specials.body.data as CatalogTestCard[]).find(
        (card) => card.set === 'SKY' && card.set_number === '055' && card.name === 'Monstrous Leadership'
      );
      expect(monstrousLeadership?.errata?.[0]?.source_section).toBe(7);
      expect(monstrousLeadership?.errata?.[0]?.entry_text).toContain(
        'occasionally the Player may have 4 Front Line characters',
      );
      expect(monstrousLeadership?.errata?.[0]?.entry_text).not.toContain('rarely a strategic advantage');

      const salamandersToxikinesis = (specials.body.data as CatalogTestCard[]).find(
        (card) => card.set === 'SKY' && card.set_number === '118' && card.name === "Salamander's Toxikinesis"
      );
      expect(salamandersToxikinesis?.errata?.[0]?.source_section).toBe(19);
      expect(salamandersToxikinesis?.errata?.[0]?.entry_text).toContain(
        'It does prevent itself from being removed',
      );
      expect(salamandersToxikinesis?.errata?.[0]?.entry_text).not.toContain(
        'powerful effect for this Max 6',
      );

      const linkedLocations = (locations.body.data as CatalogTestCard[]).filter(
        (card) => (card.name === 'Barsoom' && card.set_number === '468')
          || (card.name === 'Mars' && card.set_number === '384')
      );
      expect(linkedLocations).toHaveLength(2);
      expect(linkedLocations.every((card) => card.errata?.[0]?.source_section === 6)).toBe(true);

      const newGuardians = (events.body.data as CatalogTestCard[]).find(
        (card) => card.name === 'The New Guardians' && card.set_number === '402'
      );
      expect(newGuardians?.errata?.[0]).toEqual(expect.objectContaining({
        source_section: 16,
        source_url: 'https://overpowercardgame.com/errata/#s16'
      }));
    });

    it('GET /api/v1/catalog/missions returns v1 envelope and mission rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/missions').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/events returns v1 envelope and event rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/events').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/aspects returns v1 envelope and aspect rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/aspects').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/advanced-universe returns v1 envelope and advanced universe rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/advanced-universe').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/teamwork returns v1 envelope and teamwork rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/teamwork').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/ally-universe returns v1 envelope and ally universe rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/ally-universe').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/training returns v1 envelope and training rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/training').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/basic-universe returns v1 envelope and basic universe rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/basic-universe').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/catalog/power-cards returns v1 envelope and power card rows', async () => {
      const login = await request(server).post('/api/auth/login').send({ username, password }).expect(200);
      const cookie = login.headers['set-cookie']![0].split(';')[0];
      const res = await request(server).get('/api/v1/catalog/power-cards').set('Cookie', cookie).expect(200);
      expect(res.body.errors).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('auth.http', () => {
    it('login with JWT and GET /api/v1/auth/me returns user profile', async () => {
      const login = await request(server)
        .post('/api/v1/auth/login')
        .send({ username, password })
        .expect(200);
      expect(login.body.data.accessToken).toBeDefined();
      const token = login.body.data.accessToken as string;

      const me = await request(server).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
      expect(me.body.data.username).toBe(username);
      expect(me.body.data.role).toBe('USER');
    });

    it('POST /api/v1/auth/logout returns v1 envelope with Bearer token', async () => {
      const login = await request(server)
        .post('/api/v1/auth/login')
        .send({ username, password })
        .expect(200);
      const token = login.body.data.accessToken as string;

      const out = await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(out.body.errors).toEqual([]);
      expect(out.body.data).toEqual({ loggedOut: true });
    });

    it('POST /api/v1/auth/logout without token still returns 200 (idempotent)', async () => {
      const out = await request(server).post('/api/v1/auth/logout').expect(200);
      expect(out.body.errors).toEqual([]);
      expect(out.body.data).toEqual({ loggedOut: true });
    });
  });
});
