import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Supporter billing v1 integration (billing disabled)', () => {
  let guestId: string;
  let userId: string;

  beforeAll(async () => {
    await initializeTestServer();
    const guest = await integrationTestUtils.createTestUser({
      name: 'supporter-billing-guest',
      email: 'supporter-billing-guest@example.com',
      role: 'GUEST'
    });
    const user = await integrationTestUtils.createTestUser({
      name: 'supporter-billing-user',
      email: 'supporter-billing-user@example.com',
      role: 'USER'
    });
    guestId = guest.id;
    userId = user.id;
  });

  const as = (id: string) => ({ 'x-test-user-id': id });

  it('returns the public offer without advertising unavailable checkout', async () => {
    const response = await request(app).get('/api/v1/supporter/status').expect(200);
    expect(response.body.data).toMatchObject({
      isSupporter: false,
      sources: [],
      billingAvailable: false,
      minimumMonthlyContributionUsd: 3,
      presetMonthlyContributionUsd: [3, 5, 10],
      paid: null
    });
  });

  it('rejects guest checkout and keeps server validation authoritative for users', async () => {
    await request(app)
      .post('/api/v1/supporter/checkout')
      .set(as(guestId))
      .send({ monthlyContributionUsd: 5 })
      .expect(403);

    const invalid = await request(app)
      .post('/api/v1/supporter/checkout')
      .set(as(userId))
      .send({ monthlyContributionUsd: 5, priceId: 'price_override' })
      .expect(400);
    expect(invalid.body.errors[0].code).toBe('VALIDATION_ERROR');

    const disabled = await request(app)
      .post('/api/v1/supporter/checkout')
      .set(as(userId))
      .send({ monthlyContributionUsd: 5 })
      .expect(503);
    expect(disabled.body.errors[0].code).toBe('SUPPORTER_BILLING_UNAVAILABLE');
  });

  it('fails closed for portal and unsigned webhook requests', async () => {
    const portal = await request(app)
      .post('/api/v1/supporter/portal')
      .set(as(userId))
      .send({})
      .expect(503);
    expect(portal.body.errors[0].code).toBe('SUPPORTER_BILLING_UNAVAILABLE');

    const webhook = await request(app)
      .post('/api/v1/supporter/webhook')
      .send({ type: 'invoice.paid' })
      .expect(400);
    expect(webhook.body.errors[0].code).toBe('SUPPORTER_WEBHOOK_INVALID');
  });
});
