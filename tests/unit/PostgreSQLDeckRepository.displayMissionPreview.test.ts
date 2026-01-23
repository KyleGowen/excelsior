describe('PostgreSQLDeckRepository.getDecksByUserId mission preview selection', () => {
  it('should prefer display_mission_card_id in the mission preview ORDER BY', async () => {
    // tests/setup.ts mocks this module globally; use the real implementation here.
    const { PostgreSQLDeckRepository } = jest.requireActual('../../src/database/PostgreSQLDeckRepository');

    const mockClient: any = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'deck-1',
            user_id: 'user-1',
            name: 'Deck 1',
            description: null,
            ui_preferences: null,
            is_limited: false,
            is_valid: true,
            card_count: 0,
            threat: 0,
            reserve_character: null,
            display_mission_card_id: null,
            background_image_path: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            character_1_id: null,
            character_2_id: null,
            character_3_id: null,
            character_4_id: null,
            location_id: null,
            mission_1_id: null,
            mission_1_name: null,
            mission_1_default_image: null,
          },
        ],
      }),
      release: jest.fn(),
    };

    const mockPool: any = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    const repo = new PostgreSQLDeckRepository(mockPool);
    await repo.getDecksByUserId('user-1');

    expect(mockClient.query).toHaveBeenCalled();
    const sql = String(mockClient.query.mock.calls[0][0]);

    expect(sql).toContain('display_mission_card_id');
    expect(sql).toContain('dc.card_id = d.display_mission_card_id::text');
    expect(sql).toContain('CASE');
    expect(sql).toContain('ORDER BY');
  });
});

