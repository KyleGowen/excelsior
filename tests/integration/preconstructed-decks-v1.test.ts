import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

interface PreconstructedDeckItem {
  metadata: {
    id: string;
    name: string;
    userId: string;
    is_private: boolean;
    is_limited: boolean;
    isFavorited: boolean;
  };
}

interface PreconstructedDeckGroup {
  setCode: string;
  setName: string;
  decks: PreconstructedDeckItem[];
  featuredUpgradeRecommendations: PreconstructedDeckItem[];
}

const featuredOwnerId = '6c8da510-b2c9-4210-b772-7b786cbc635d';
const featuredDeckIds = [
  '63a92f20-1e50-47ab-b7e6-84574370b666',
  'b955e265-bff1-4869-8e15-a4b72c280213',
  '32734448-f027-4898-b682-c925c2c2ff49',
  '7434ab13-993c-46e0-8bd1-79a12a8dfe4b',
];

describe('GET /api/v1/community/preconstructed-decks', () => {
  let authCookie: string;
  let favoritedDeckId: string | null = null;
  let featuredFixtureOwnerCreated = false;
  let featuredFixtureDeckIdsCreated: string[] = [];

  beforeAll(async () => {
    await initializeTestServer();
    const pool = DataSourceConfig.getInstance().getPool();
    const ownerInsert = await pool.query<{ id: string }>(`
      INSERT INTO users (id, username, email, role)
      VALUES ($1, 'featured-upgrade-fixture', 'featured-upgrade-fixture@invalid.test', 'USER')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [featuredOwnerId]);
    featuredFixtureOwnerCreated = ownerInsert.rowCount === 1;

    const deckInsert = await pool.query<{ id: string }>(`
      INSERT INTO decks (
        id, user_id, name, is_private, is_valid, is_limited, card_count, threat
      )
      SELECT id, $1::uuid, name, FALSE, TRUE, FALSE, card_count, threat
      FROM unnest($2::uuid[], $3::text[], $4::int[], $5::int[]) AS fixture(
        id, name, card_count, threat
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      featuredOwnerId,
      featuredDeckIds,
      ['Starter Deck Revamped 1', 'Starter Deck Revamped 2', 'Starter Deck Revamped 3', 'Starter Deck Revamped 4'],
      [61, 56, 56, 56],
      [76, 75, 76, 75],
    ]);
    featuredFixtureDeckIdsCreated = deckInsert.rows.map((row) => row.id);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kyle', password: 'test' })
      .expect(200);
    authCookie = login.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    if (favoritedDeckId) {
      await request(app)
        .delete(`/api/v1/decks/${favoritedDeckId}/favorite`)
        .set('Cookie', authCookie);
    }
    const pool = DataSourceConfig.getInstance().getPool();
    if (featuredFixtureDeckIdsCreated.length > 0) {
      await pool.query('DELETE FROM decks WHERE id = ANY($1::uuid[])', [featuredFixtureDeckIdsCreated]);
    }
    if (featuredFixtureOwnerCreated) {
      await pool.query('DELETE FROM users WHERE id = $1', [featuredOwnerId]);
    }
  });

  it('returns Skybound above ERB with friendly set names and four public Limited decks in workbook order', async () => {
    const res = await request(app)
      .get('/api/v1/community/preconstructed-decks')
      .set('Cookie', authCookie)
      .expect(200);

    const groups = res.body.data as PreconstructedDeckGroup[];
    expect(groups.map((group) => [group.setCode, group.setName])).toEqual([
      ['SKY', 'Skybound'],
      ['ERB', 'Edgar Rice Burroughs and the World Legends'],
    ]);
    expect(groups[0].decks.map((deck) => deck.metadata.name)).toEqual([
      'We Are Invincible',
      'We are the Walking Dead',
      'Limitless Possibilities',
      'Worlds Collide',
    ]);
    expect(groups[1].decks.map((deck) => deck.metadata.name)).toEqual([
      'Horror Menagerie',
      'The Resistance',
      'Ungodly Power',
      'Time Detectives',
    ]);
    expect(
      groups[0].featuredUpgradeRecommendations.map((deck) => deck.metadata.id)
    ).toEqual(featuredDeckIds);
    expect(groups[1].featuredUpgradeRecommendations).toEqual([]);

    for (const deck of groups.flatMap((group) => [
      ...group.decks,
      ...group.featuredUpgradeRecommendations,
    ])) {
      expect(deck.metadata.is_private).toBe(false);
      expect(typeof deck.metadata.isFavorited).toBe('boolean');
    }
    expect(groups.flatMap((group) => group.decks).every((deck) => deck.metadata.is_limited)).toBe(true);
  });

  it('stores all 8 manifests with only non-foil printings from their registered set', async () => {
    const pool = DataSourceConfig.getInstance().getPool();
    const summary = await pool.query<{
      deck_count: string;
      deck_card_rows: string;
      total_quantity: string;
      wrong_printings: string;
    }>(`
      WITH catalog AS (
        SELECT id::text AS card_id, set, is_foil FROM characters
        UNION ALL SELECT id::text, set, is_foil FROM special_cards
        UNION ALL SELECT id::text, set, is_foil FROM locations
        UNION ALL SELECT id::text, set, is_foil FROM missions
        UNION ALL SELECT id::text, set, is_foil FROM events
        UNION ALL SELECT id::text, set, is_foil FROM aspects
        UNION ALL SELECT id::text, set, is_foil FROM advanced_universe_cards
        UNION ALL SELECT id::text, set, is_foil FROM teamwork_cards
        UNION ALL SELECT id::text, set, is_foil FROM ally_universe_cards
        UNION ALL SELECT id::text, set, is_foil FROM training_cards
        UNION ALL SELECT id::text, set, is_foil FROM basic_universe_cards
        UNION ALL SELECT id::text, set, is_foil FROM power_cards
      )
      SELECT
        COUNT(DISTINCT pd.deck_id)::text AS deck_count,
        COUNT(*)::text AS deck_card_rows,
        SUM(dc.quantity)::text AS total_quantity,
        COUNT(*) FILTER (
          WHERE catalog.card_id IS NULL
             OR catalog.set <> pd.set_code
             OR COALESCE(catalog.is_foil, FALSE)
        )::text AS wrong_printings
      FROM preconstructed_decks pd
      JOIN deck_cards dc ON dc.deck_id = pd.deck_id
      LEFT JOIN catalog ON catalog.card_id = dc.card_id
    `);

    expect(summary.rows[0]).toEqual({
      deck_count: '8',
      deck_card_rows: '345',
      total_quantity: '452',
      wrong_printings: '0',
    });

    const threeMusketeers = await pool.query<{ image_path: string }>(`
      SELECT characters.image_path
      FROM preconstructed_decks pd
      JOIN deck_cards dc ON dc.deck_id = pd.deck_id AND dc.card_type = 'character'
      JOIN characters ON characters.id::text = dc.card_id
      WHERE pd.set_code = 'ERB' AND characters.set_number = '244'
    `);
    expect(threeMusketeers.rows).toEqual([
      { image_path: 'characters/three_musketeers.webp' },
    ]);
  });

  it('supports favorite and unfavorite through the shared deck favorite API', async () => {
    const initial = await request(app)
      .get('/api/v1/community/preconstructed-decks')
      .set('Cookie', authCookie)
      .expect(200);
    favoritedDeckId = (initial.body.data as PreconstructedDeckGroup[])[0]
      .featuredUpgradeRecommendations[0].metadata.id;

    await request(app)
      .delete(`/api/v1/decks/${favoritedDeckId}/favorite`)
      .set('Cookie', authCookie)
      .expect(200);
    await request(app)
      .post(`/api/v1/decks/${favoritedDeckId}/favorite`)
      .set('Cookie', authCookie)
      .send({})
      .expect(200);

    const afterFavorite = await request(app)
      .get('/api/v1/community/preconstructed-decks')
      .set('Cookie', authCookie)
      .expect(200);
    const favorited = (afterFavorite.body.data as PreconstructedDeckGroup[])
      .flatMap((group) => [...group.decks, ...group.featuredUpgradeRecommendations])
      .find((deck) => deck.metadata.id === favoritedDeckId);
    expect(favorited?.metadata.isFavorited).toBe(true);

    await request(app)
      .delete(`/api/v1/decks/${favoritedDeckId}/favorite`)
      .set('Cookie', authCookie)
      .expect(200);
    favoritedDeckId = null;
  });
});
