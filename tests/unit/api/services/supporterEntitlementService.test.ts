import { SupporterEntitlementService } from '../../../../src/api/services/supporterEntitlementService';
import type {
  SupporterEntitlementRepository,
  SupporterEntitlementStatus
} from '../../../../src/repository/SupporterEntitlementRepository';

const emptyStatus = (): SupporterEntitlementStatus => ({
  isSupporter: false,
  sources: [],
  complimentaryExpiresAt: null
});

function repository(): jest.Mocked<SupporterEntitlementRepository> {
  let status = emptyStatus();
  return {
    getStatuses: jest.fn(async (ids, _asOf) => new Map(ids.map((id) => [id, status]))),
    setSource: jest.fn(async (input) => {
      status = {
        isSupporter: true,
        sources: input.source === 'STRIPE' ? ['STRIPE'] : ['COMPLIMENTARY'],
        complimentaryExpiresAt: input.source === 'COMPLIMENTARY' ? input.expiresAt : null
      };
    }),
    revokeSource: jest.fn(async (_input) => {
      status = emptyStatus();
      return true;
    })
  };
}

describe('SupporterEntitlementService', () => {
  const now = new Date('2026-09-14T12:00:00.000Z');

  it.each([
    ['30_DAYS', '2026-10-14T12:00:00.000Z'],
    ['90_DAYS', '2026-12-13T12:00:00.000Z'],
    ['1_YEAR', '2027-09-14T12:00:00.000Z'],
    ['PERMANENT', null]
  ] as const)('grants %s complimentary access', async (duration, expectedExpiry) => {
    const repo = repository();
    const service = new SupporterEntitlementService(repo, () => now);
    const result = await service.grantComplimentary({
      userId: 'user-1',
      actorUserId: 'admin-1',
      duration,
      reason: 'Community thank-you'
    });

    expect(repo.setSource).toHaveBeenCalledWith(expect.objectContaining({
      source: 'COMPLIMENTARY',
      sourceReference: 'manual',
      actorUserId: 'admin-1',
      reason: 'Community thank-you'
    }));
    const expiry = repo.setSource.mock.calls[0][0].expiresAt;
    expect(expiry?.toISOString() ?? null).toBe(expectedExpiry);
    expect(result.isSupporter).toBe(true);
  });

  it('rejects a custom expiry that is not in the future', async () => {
    const service = new SupporterEntitlementService(repository(), () => now);
    await expect(service.grantComplimentary({
      userId: 'user-1',
      actorUserId: 'admin-1',
      duration: 'CUSTOM',
      customExpiresAt: now,
      reason: 'Community thank-you'
    })).rejects.toThrow('future');
  });

  it('uses a distinct Stripe source reference for future webhook synchronization', async () => {
    const repo = repository();
    const service = new SupporterEntitlementService(repo, () => now);
    await service.setStripeSubscription({
      userId: 'user-1',
      subscriptionId: 'sub_test_123',
      active: true,
      currentPeriodEnd: new Date('2026-10-14T12:00:00.000Z'),
      reason: 'Stripe subscription active'
    });
    expect(repo.setSource).toHaveBeenCalledWith(expect.objectContaining({
      source: 'STRIPE',
      sourceReference: 'sub_test_123',
      actorUserId: null
    }));
  });
});
