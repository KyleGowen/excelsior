/**
 * Integration tests for v1 DBV support routes (read-only; no test data cleanup required).
 */
import request from 'supertest';
import type { Server } from 'node:http';
import { app, initializeTestServer } from '../../src/test-server';
import { getKyleSessionCookieHeader } from './helpers/integrationSessionAuth';

describe('GET /api/v1/dbv/sets', () => {
  let catalogAuthCookie: string;
  let server: Server;

  beforeAll(async () => {
    server = (await initializeTestServer()).server;
    expect(server.listening).toBe(true);
    catalogAuthCookie = await getKyleSessionCookieHeader(app);
  });

  it('returns v1 envelope with code/name rows from sets table', async () => {
    const res = await request(server).get('/api/v1/dbv/sets').set('Cookie', catalogAuthCookie).expect(200);
    // Phase 3 (catalog cache) adds catalogDataVersion/catalogLastUpdated to meta;
    // see docs/current/API_V1_CATALOG_CACHING.md.
    expect(res.body.meta).toEqual(
      expect.objectContaining({ catalogDataVersion: expect.any(Number) })
    );
    expect(res.body.errors).toEqual([]);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const row = res.body.data[0];
    expect(typeof row.code).toBe('string');
    expect(typeof row.name).toBe('string');
  });
});
