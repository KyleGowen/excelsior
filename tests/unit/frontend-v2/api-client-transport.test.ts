import { createApiClient, ApiError } from '../../../frontend/src/lib/api/client';
const response = (data: unknown, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(data) }) as Response;
describe('configurable browser transport', () => {
  it('preserves defaults, v1 errors, request body, cache and abort signal', async () => {
    const mock = jest.fn().mockResolvedValue(response({ data: ['card'] })); const client = createApiClient({ fetcher: mock }); const controller = new AbortController();
    expect(await client.request('/api/v1/catalog/characters', { cache: 'no-store', signal: controller.signal })).toEqual(['card']);
    expect(mock).toHaveBeenCalledWith('/api/v1/catalog/characters', expect.objectContaining({ credentials: 'include', cache: 'no-store', signal: controller.signal }));
    mock.mockResolvedValue(response({ data: { detail: 'structured' }, errors: [{ code: 'DENIED', message: 'No access' }] }, 403));
    await expect(client.api.post('/api/v1/decks', { name: 'fictional' })).rejects.toEqual(expect.objectContaining({ status: 403, code: 'DENIED', data: { detail: 'structured' } }));
  });
  it('supports a public host adapter prefix and refreshes the player header once', async () => {
    let identity = 'expired'; const mock = jest.fn(async (_url: string, init: RequestInit) => response({ data: true }, (init.headers as Record<string, string>).Authorization === 'Bearer renewed' ? 200 : 401));
    const refresh = jest.fn(async () => { identity = 'renewed'; return true; });
    const client = createApiClient({ apiBase: 'https://host.example', pathPrefix: '/api/adapter', credentials: 'omit', getHeaders: () => ({ Authorization: 'Bearer ' + identity }), refreshAuthentication: refresh, fetcher: mock as typeof fetch });
    await Promise.all([client.api.get('/api/v1/decks'), client.api.get('/api/v1/collections/me')]);
    expect(refresh).toHaveBeenCalledTimes(1); expect(mock).toHaveBeenCalledWith('https://host.example/api/adapter/api/v1/decks', expect.objectContaining({ credentials: 'omit' }));
  });
  it.each(['x-excelsior-service-authorization', 'Cookie', 'CLIENT_SECRET'])('keeps %s server-only', async name => {
    const mock = jest.fn(); const client = createApiClient({ getHeaders: () => ({ [name]: 'fictional-secret' }), fetcher: mock });
    await expect(client.api.get('/api/v1/decks')).rejects.toEqual(expect.objectContaining({ code: 'SERVER_CREDENTIAL_REQUIRED' })); expect(mock).not.toHaveBeenCalled();
  });
  it('does not renew explicit login/logout/refresh actions or retry forever', async () => {
    const mock = jest.fn().mockResolvedValue(response({ errors: [{ code: 'UNAUTHORIZED' }] }, 401)); const refresh = jest.fn().mockResolvedValue(true); const client = createApiClient({ fetcher: mock, refreshAuthentication: refresh });
    for (const action of ['login', 'logout', 'refresh', 'google', 'signup']) await expect(client.api.post('/api/auth/' + action)).rejects.toBeInstanceOf(ApiError);
    expect(refresh).not.toHaveBeenCalled(); mock.mockClear(); await expect(client.api.get('/api/v1/decks')).rejects.toBeInstanceOf(ApiError); expect(mock).toHaveBeenCalledTimes(2); expect(refresh).toHaveBeenCalledTimes(1);
  });
  it('normalizes failed renewal and preserves cancellation/network errors', async () => {
    const mock = jest.fn().mockResolvedValue(response({}, 401)); const client = createApiClient({ fetcher: mock, refreshAuthentication: () => { throw new Error('private detail'); } });
    await expect(client.api.get('/api/v1/decks')).rejects.toEqual(expect.objectContaining({ code: 'AUTH_REFRESH_FAILED' }));
    mock.mockRejectedValue(new Error('offline')); await expect(createApiClient({ fetcher: mock }).api.get('/api/v1/decks')).rejects.toEqual(expect.objectContaining({ status: 0 }));
    const controller = new AbortController(); controller.abort(); await expect(client.request('/api/v1/decks', { signal: controller.signal })).rejects.toEqual(expect.objectContaining({ name: 'AbortError' }));
  });
  it.each(['/api/v1/decks/%2e%2e', '//host/api/v1/decks', '/api/v1/decks#fragment', '/api/v1/../admin'])('rejects unsafe path %s', async path => {
    await expect(createApiClient().request(path)).rejects.toEqual(expect.objectContaining({ code: 'INVALID_API_PATH' }));
  });
});
