import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Supporter entitlements v1 integration', () => {
  const pool = DataSourceConfig.getInstance().getPool();
  let admin: { id: string; username: string };
  let user: { id: string; username: string };

  beforeAll(async () => {
    await initializeTestServer();
    admin = await integrationTestUtils.createTestUser({
      name: 'supporter-admin',
      email: 'supporter-admin@example.com',
      role: 'ADMIN'
    });
    user = await integrationTestUtils.createTestUser({
      name: 'supporter-user',
      email: 'supporter-user@example.com',
      role: 'USER'
    });
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM supporter_entitlement_sources WHERE user_id = $1', [user.id]);
  });

  const as = (userId: string) => ({ 'x-test-user-id': userId });

  it('grants, exposes, audits, and revokes complimentary Supporter access', async () => {
    const grant = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'grant', duration: '30_DAYS', reason: 'Community thank-you' })
      .expect(200);
    expect(grant.body.data).toMatchObject({
      id: user.id,
      isSupporter: true,
      supporterSources: ['COMPLIMENTARY']
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'password123' })
      .expect(200);
    expect(login.body.data.isSupporter).toBe(true);
    const cookie = login.headers['set-cookie']?.[0];
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.data.isSupporter).toBe(true);

    const auditAfterGrant = await pool.query<{ action: string; reason: string }>(
      'SELECT action, reason FROM supporter_entitlement_audit WHERE user_id = $1 ORDER BY created_at',
      [user.id]
    );
    expect(auditAfterGrant.rows).toEqual([{ action: 'GRANTED', reason: 'Community thank-you' }]);
    await expect(pool.query(
      "UPDATE supporter_entitlement_audit SET reason = 'changed' WHERE user_id = $1",
      [user.id]
    )).rejects.toThrow(/immutable/i);

    const revoke = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'revoke', reason: 'Complimentary period complete' })
      .expect(200);
    expect(revoke.body.data.isSupporter).toBe(false);
    expect(revoke.body.data.supporterSources).toEqual([]);
    const auditAfterRevoke = await pool.query<{ action: string }>(
      'SELECT action FROM supporter_entitlement_audit WHERE user_id = $1 ORDER BY created_at',
      [user.id]
    );
    expect(auditAfterRevoke.rows.map((row) => row.action)).toEqual(['GRANTED', 'REVOKED']);
  });

  it('keeps Stripe access active when complimentary access is revoked', async () => {
    await pool.query(
      `INSERT INTO supporter_entitlement_sources
         (user_id, source, source_reference, reason)
       VALUES ($1, 'STRIPE', 'sub_test_overlap', 'Stripe test subscription')`,
      [user.id]
    );
    await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'grant', duration: 'PERMANENT', reason: 'Community thank-you' })
      .expect(200);
    const revoked = await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'revoke', reason: 'Remove complimentary source only' })
      .expect(200);
    expect(revoked.body.data.isSupporter).toBe(true);
    expect(revoked.body.data.supporterSources).toEqual(['STRIPE']);
  });

  it('requires an admin, a valid duration, and an audit reason', async () => {
    await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(user.id))
      .send({ action: 'grant', duration: '30_DAYS', reason: 'Not allowed' })
      .expect(403);
    await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'grant', reason: 'Missing duration' })
      .expect(400);
    await request(app)
      .patch(`/api/v1/admin/users/${user.id}/supporter`)
      .set(as(admin.id))
      .send({ action: 'grant', duration: '30_DAYS', reason: '' })
      .expect(400);
  });
});

