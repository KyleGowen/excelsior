import { SupporterSavedDatabaseViewAccessPolicy } from '../../../../src/api/services/savedDatabaseViewAccessPolicy';

describe('SupporterSavedDatabaseViewAccessPolicy', () => {
  it('allows admins without an entitlement lookup', async () => {
    const isSupporter = jest.fn();
    const policy = new SupporterSavedDatabaseViewAccessPolicy({ isSupporter });
    await expect(policy.canAccess({ id: 'admin-1', role: 'ADMIN' })).resolves.toBe(true);
    expect(isSupporter).not.toHaveBeenCalled();
  });

  it('allows entitled users and denies unentitled users and guests', async () => {
    const isSupporter = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const policy = new SupporterSavedDatabaseViewAccessPolicy({ isSupporter });
    await expect(policy.canAccess({ id: 'user-1', role: 'USER' })).resolves.toBe(true);
    await expect(policy.canAccess({ id: 'user-2', role: 'USER' })).resolves.toBe(false);
    await expect(policy.canAccess({ id: 'guest-1', role: 'GUEST' })).resolves.toBe(false);
    expect(isSupporter).toHaveBeenCalledTimes(2);
  });
});

