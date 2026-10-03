import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';

/** Retirement is a release boundary: stale clients cannot activate billing. */
describe('Shelved Supporter API stays unavailable', () => {
  beforeAll(async () => { await initializeTestServer(); });

  it.each([
    ['get', '/api/v1/supporter/status'],
    ['post', '/api/v1/supporter/checkout'],
    ['post', '/api/v1/supporter/portal'],
    ['post', '/api/v1/supporter/webhook'],
    ['patch', '/api/v1/admin/users/00000000-0000-0000-0000-000000000001/supporter'],
  ] as const)('%s %s returns 404 rather than entering a billing or entitlement handler', async (method, path) => {
    await request(app)[method](path).send({}).expect(404);
  });
});
