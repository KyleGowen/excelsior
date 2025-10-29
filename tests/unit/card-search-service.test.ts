/** @jest-environment jsdom */
import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../public/js/services/CardSearchService.js');

describe('CardSearchService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn() as any;
    ((global as any).fetch as any).mockResolvedValue({ json: async () => ({ success: true, data: [] }) } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns empty for short terms', async () => {
    const service = new (window as any).CardSearchService();
    const results = await service.search('k');
    expect(results).toEqual([]);
  });

  test('normalizes character results', async () => {
    (global as any).fetch = jest.fn() as any;
    ((global as any).fetch as any)
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: [{ id: 'c1', name: 'King Arthur', image: 'ka.jpg' }] }) } as any)
      .mockResolvedValue({ json: async () => ({ success: true, data: [] }) } as any);
    const service = new (window as any).CardSearchService();
    const results = await service.search('king');
    expect(results[0]).toEqual(expect.objectContaining({ id: 'c1', type: 'character', name: 'King Arthur' }));
  });
});


