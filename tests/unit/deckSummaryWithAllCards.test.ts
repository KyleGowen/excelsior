import { getDeckSummaryWithAllCards } from '../../src/database/deck/deck-crud';
import type { DeckRepositoryContext } from '../../src/database/deck/context';

describe('getDeckSummaryWithAllCards', () => {
  it('rejects malformed IDs without opening a transaction', async () => {
    const connect = jest.fn();
    expect(await getDeckSummaryWithAllCards({ pool: { connect } } as unknown as DeckRepositoryContext, 'bad-id')).toBeUndefined();
    expect(connect).not.toHaveBeenCalled();
  });
  it('preserves the pre-placed flag when loading a full deck', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValue({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: '11111111-1111-4111-8111-111111111111', user_id: 'user-1', name: 'Saved deck', card_count: 52 }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'card-row-1',
              card_type: 'training',
              card_id: 'training-1',
              quantity: 1,
              exclude_from_draw: true,
            },
          ],
        }),
      release: jest.fn(),
    };
    const ctx = {
      pool: { connect: jest.fn().mockResolvedValue(client) },
      cache: new Map(),
      cacheTtlMs: 60_000,
      invalidateDeck: jest.fn(),
    } as unknown as DeckRepositoryContext;

    const deck = await getDeckSummaryWithAllCards(ctx, '11111111-1111-4111-8111-111111111111');

    expect(deck?.cards).toEqual([
      expect.objectContaining({
        type: 'training',
        cardId: 'training-1',
        exclude_from_draw: true,
      }),
    ]);
    expect(deck?.card_count).toBe(52);
    expect(client.query.mock.calls[0][0]).toBe('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    expect(client.query.mock.calls.at(-1)?.[0]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});
