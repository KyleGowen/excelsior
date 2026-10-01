import { loadCurrentUserOrGuest } from '../../../frontend/src/lib/api/auth';

const response = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
}) as Response;

describe('default Guest session', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps an existing account session', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(
      response(200, { data: { id: 'member-1', name: 'Member', role: 'USER' } }),
    );

    await expect(loadCurrentUserOrGuest()).resolves.toMatchObject({ id: 'member-1', role: 'USER' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/auth/me');
  });

  it('starts Guest mode only after a missing or expired session', async () => {
    const fetch = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(response(401, { error: 'No session found' }))
      .mockResolvedValueOnce(response(200, {
        data: { userId: 'guest-1', username: 'guest', role: 'GUEST' },
      }));

    await expect(loadCurrentUserOrGuest()).resolves.toMatchObject({ id: 'guest-1', role: 'GUEST' });
    expect(fetch.mock.calls.map(([path]) => path)).toEqual(['/api/auth/me', '/api/auth/login']);
    expect(JSON.parse((fetch.mock.calls[1]?.[1] as RequestInit).body as string)).toEqual({
      username: 'guest', password: 'guest',
    });
  });

  it('does not treat a server failure as a signed-out visitor', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(
      response(503, { error: 'Service unavailable' }),
    );

    await expect(loadCurrentUserOrGuest()).rejects.toThrow('Service unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
