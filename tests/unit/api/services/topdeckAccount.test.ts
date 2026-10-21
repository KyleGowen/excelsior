import { UserAccountService } from '../../../../src/api/services/userAccountService';
import { CommunityService } from '../../../../src/api/services/communityService';
import type { CommunityDeckRepository } from '../../../../src/api/services/communityService';

const user = { id: 'owner', name: 'login-name', email: 'private@example.invalid', role: 'USER' as const,
  displayName: 'Public name', topdeckHandle: 'Example', authProvider: 'google' };
const repo = () => ({
  getUserById: jest.fn().mockResolvedValue(user), getUserByEmail: jest.fn(),
  getUserByUsername: jest.fn(), getUserAuthMeta: jest.fn(), updateUserPassword: jest.fn(),
  updateUser: jest.fn().mockImplementation(async (_id, updates) => ({ ...user, ...updates })),
});

describe('TopDeck self-service', () => {
  it.each(['USER', 'ADMIN'] as const)('saves only the supplied actor for role %s', async role => {
    const repository = repo();
    const result = await new UserAccountService(repository).setTopDeckHandle('actor', role, ' @Saved ');
    expect(repository.updateUser).toHaveBeenCalledWith('actor', { topdeckHandle: 'Saved' });
    expect(result).toEqual({ ok: true, status: 200, data: {
      topdeckHandle: 'Saved', topdeckProfileUrl: 'https://topdeck.gg/profile/@Saved',
    } });
    // Google users are eligible too; neither credentials nor claimed ownership are checked.
    expect(repository.getUserAuthMeta).not.toHaveBeenCalled();
    expect(repository.getUserByUsername).not.toHaveBeenCalled();
  });
  it.each(['GUEST', undefined] as const)('rejects role %p before writing', async role => {
    const repository = repo();
    expect(await new UserAccountService(repository).setTopDeckHandle('actor', role, 'Saved'))
      .toMatchObject({ ok: false, status: 403 });
    expect(repository.updateUser).not.toHaveBeenCalled();
  });
  it.each([null, '', '  '])('clears using %p', async raw => {
    const repository = repo();
    expect(await new UserAccountService(repository).setTopDeckHandle('actor', 'USER', raw))
      .toEqual({ ok: true, status: 200, data: { topdeckHandle: null, topdeckProfileUrl: null } });
  });
  it('retains service validation even with the HTTP parser disabled', async () => {
    const repository = repo();
    const service = new UserAccountService(repository);
    for (const input of [undefined, 123, 'bad/url']) {
      expect(await service.setTopDeckHandle('actor', 'USER', input)).toMatchObject({ ok: false, status: 400, code: 'TOPDECK_HANDLE_INVALID' });
    }
    expect(repository.updateUser).not.toHaveBeenCalled();
  });
  it('returns 404 if the actor no longer exists', async () => {
    const repository = repo(); repository.updateUser.mockResolvedValue(undefined);
    expect(await new UserAccountService(repository).setTopDeckHandle('actor', 'USER', 'Saved'))
      .toMatchObject({ ok: false, status: 404, code: 'USER_NOT_FOUND' });
  });
});

describe('Public profile allowlist', () => {
  it('returns a saved handle without reading decks or exposing private user fields', async () => {
    const lookup = { getUsersByIds: jest.fn().mockResolvedValue([user]) };
    const service = new CommunityService({} as CommunityDeckRepository, lookup);
    expect(await service.getPublicUserProfile('owner')).toEqual({ id: 'owner', displayName: 'Public name',
      topdeckHandle: 'Example', topdeckProfileUrl: 'https://topdeck.gg/profile/@Example' });
    expect(lookup.getUsersByIds).toHaveBeenCalledWith(['owner']);
  });
  it('never derives an unset handle from a username', async () => {
    const service = new CommunityService({} as CommunityDeckRepository, {
      getUsersByIds: jest.fn().mockResolvedValue([{ ...user, topdeckHandle: null }]),
    });
    expect(await service.getPublicUserProfile('owner')).toMatchObject({ topdeckHandle: null, topdeckProfileUrl: null });
  });
  it('does not expose a Google email as the public profile name', async () => {
    const service = new CommunityService({} as CommunityDeckRepository, {
      getUsersByIds: jest.fn().mockResolvedValue([{ ...user, displayName: null }]),
    });
    expect(await service.getPublicUserProfile('owner')).toMatchObject({ displayName: 'login-name' });
  });
  it.each([{ users: [] }, { users: [{ ...user, role: 'GUEST' }] }, { users: [{ ...user, id: 'someone-else' }] }])('hides missing/guest/wrong users', async ({ users }) => {
    const service = new CommunityService({} as CommunityDeckRepository, { getUsersByIds: jest.fn().mockResolvedValue(users) });
    expect(await service.getPublicUserProfile('owner')).toBeNull();
  });
});
