import { fetchCatalogFresh } from '../../../frontend/src/lib/api/catalog';

describe('fresh catalog requests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('bypasses the browser HTTP cache for printing detail refreshes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [] }),
    } as Response);
    global.fetch = fetchMock;

    await fetchCatalogFresh('power-cards');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/catalog/power-cards',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
    );
  });
});
