import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { registerSupporterV1HttpRoutes } from '../../../../src/api/http/supporter.http';
import type { SupporterBillingService } from '../../../../src/api/services/supporterBillingService';

function service() {
  return {
    getStatus: jest.fn(async () => ({
      isSupporter: false,
      sources: [],
      complimentaryExpiresAt: null,
      billingAvailable: true,
      minimumMonthlyContributionUsd: 3,
      maximumMonthlyContributionUsd: 1000,
      presetMonthlyContributionUsd: [3, 5, 10],
      paid: null
    })),
    createCheckout: jest.fn(async (_userId: string, amount: number) => ({
      url: 'https://checkout.stripe.com/test/session',
      expiresAt: new Date('2026-09-16T12:30:00.000Z').toISOString(),
      amount
    })),
    createPortalSession: jest.fn(async () => ({ url: 'https://billing.stripe.com/test/session' })),
    constructWebhookEvent: jest.fn(),
    processWebhook: jest.fn()
  } as unknown as jest.Mocked<SupporterBillingService>;
}

function appFor(role: 'USER' | 'GUEST' | 'ADMIN' | null, billing = service()) {
  const app = express();
  app.use(express.json());
  const auth: RequestHandler = (req, _res, next) => {
    if (role) {
      req.user = {
        id: '11111111-1111-4111-8111-111111111111',
        name: role.toLowerCase(),
        email: `${role.toLowerCase()}@example.com`,
        role
      };
    }
    next();
  };
  const router = express.Router();
  registerSupporterV1HttpRoutes(router, {
    supporterBillingService: billing,
    authenticateUser: auth,
    optionalAuth: auth
  });
  app.use('/api/v1', router);
  return { app, billing };
}

describe('Supporter v1 HTTP routes', () => {
  it.each([3, 5, 10, 999])('accepts the intended contribution value %i only', async (amount) => {
    const { app, billing } = appFor('USER');
    const response = await request(app)
      .post('/api/v1/supporter/checkout')
      .send({ monthlyContributionUsd: amount });
    expect(response.status).toBe(201);
    expect(billing.createCheckout).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      amount
    );
  });

  it.each([
    {},
    { monthlyContributionUsd: 3.5 },
    { monthlyContributionUsd: '5' },
    { monthlyContributionUsd: 5, priceId: 'price_browser_override' },
    { monthlyContributionUsd: 5, userId: 'someone-else' },
    { monthlyContributionUsd: 5, successUrl: 'https://evil.example' }
  ])('rejects an invalid or expanded request body', async (body) => {
    const { app, billing } = appFor('USER');
    const response = await request(app).post('/api/v1/supporter/checkout').send(body);
    expect(response.status).toBe(400);
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it.each(['GUEST', 'ADMIN'] as const)('rejects a %s account before checkout', async (role) => {
    const { app, billing } = appFor(role);
    const response = await request(app)
      .post('/api/v1/supporter/checkout')
      .send({ monthlyContributionUsd: 5 });
    expect(response.status).toBe(403);
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it('returns anonymous canonical status without requiring authentication', async () => {
    const { app, billing } = appFor(null);
    const response = await request(app).get('/api/v1/supporter/status');
    expect(response.status).toBe(200);
    expect(billing.getStatus).toHaveBeenCalledWith(null);
  });

  it('requires an empty portal body and uses the authenticated owner', async () => {
    const { app, billing } = appFor('USER');
    const invalid = await request(app).post('/api/v1/supporter/portal').send({ customer: 'cus_override' });
    expect(invalid.status).toBe(400);
    expect(billing.createPortalSession).not.toHaveBeenCalled();

    const valid = await request(app).post('/api/v1/supporter/portal').send({});
    expect(valid.status).toBe(201);
    expect(billing.createPortalSession).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111'
    );
  });
});
