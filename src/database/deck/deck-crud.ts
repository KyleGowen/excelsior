import { Deck, DeckCard, PreconstructedDeckRecord } from '../../types';
import { invalidateUserDeckListCache, type DeckRepositoryContext } from './context';

/** Deck row from SELECT * FROM decks */
type DeckRow = Record<string, unknown>;

/** Deck list row with joined character/location/battleground/mission preview columns */
interface DeckListRow extends DeckRow {
  character_1_id?: string;
  character_1_name?: string;
  character_1_default_image?: string;
  character_1_is_foil?: boolean;
  character_2_id?: string;
  character_2_name?: string;
  character_2_default_image?: string;
  character_2_is_foil?: boolean;
  character_3_id?: string;
  character_3_name?: string;
  character_3_default_image?: string;
  character_3_is_foil?: boolean;
  character_4_id?: string;
  character_4_name?: string;
  character_4_default_image?: string;
  character_4_is_foil?: boolean;
  location_id?: string;
  preview_location_id?: string;
  location_name?: string;
  location_default_image?: string;
  battleground_id?: string;
  battleground_name?: string;
  battleground_default_image?: string;
  mission_1_id?: string;
  mission_1_name?: string;
  mission_1_default_image?: string;
}

interface PreconstructedDeckListRow extends DeckListRow {
  preconstructed_set_code: string;
  preconstructed_set_label: string;
  preconstructed_release_order: number;
  preconstructed_deck_order: number;
}

/** First mission preview in deck list (from LATERAL subquery aliases). */
const MISSION_LIST_SLOTS = [
  {
    idField: 'mission_1_id',
    nameField: 'mission_1_name',
    imageField: 'mission_1_default_image',
    syntheticIdPrefix: 'mission1',
  },
] as const;

interface DeckCardRow {
  id: string;
  card_type: string;
  card_id: string;
  quantity: number;
  display_order?: number | null;
  exclude_from_draw?: boolean;
}

const CHARACTER_LIST_SLOTS = [
  {
    sqlAlias: 'c1',
    idField: 'character_1_id',
    nameField: 'character_1_name',
    imageField: 'character_1_default_image',
    foilField: 'character_1_is_foil',
    syntheticSuffix: '1',
  },
  {
    sqlAlias: 'c2',
    idField: 'character_2_id',
    nameField: 'character_2_name',
    imageField: 'character_2_default_image',
    foilField: 'character_2_is_foil',
    syntheticSuffix: '2',
  },
  {
    sqlAlias: 'c3',
    idField: 'character_3_id',
    nameField: 'character_3_name',
    imageField: 'character_3_default_image',
    foilField: 'character_3_is_foil',
    syntheticSuffix: '3',
  },
  {
    sqlAlias: 'c4',
    idField: 'character_4_id',
    nameField: 'character_4_name',
    imageField: 'character_4_default_image',
    foilField: 'character_4_is_foil',
    syntheticSuffix: '4',
  },
] as const;

function buildCharacterListSqlFragments(): { selectFragment: string; joinFragment: string } {
  const fallbackJoin = `
        LEFT JOIN LATERAL (
          SELECT
            MAX(CASE WHEN sub.rn = 1 THEN sub.char_id END) AS fb_char1_id,
            MAX(CASE WHEN sub.rn = 1 THEN sub.char_name END) AS fb_char1_name,
            MAX(CASE WHEN sub.rn = 1 THEN sub.char_image END) AS fb_char1_image,
            COALESCE(BOOL_OR(sub.rn = 1 AND sub.char_foil), false) AS fb_char1_foil,
            MAX(CASE WHEN sub.rn = 2 THEN sub.char_id END) AS fb_char2_id,
            MAX(CASE WHEN sub.rn = 2 THEN sub.char_name END) AS fb_char2_name,
            MAX(CASE WHEN sub.rn = 2 THEN sub.char_image END) AS fb_char2_image,
            COALESCE(BOOL_OR(sub.rn = 2 AND sub.char_foil), false) AS fb_char2_foil,
            MAX(CASE WHEN sub.rn = 3 THEN sub.char_id END) AS fb_char3_id,
            MAX(CASE WHEN sub.rn = 3 THEN sub.char_name END) AS fb_char3_name,
            MAX(CASE WHEN sub.rn = 3 THEN sub.char_image END) AS fb_char3_image,
            COALESCE(BOOL_OR(sub.rn = 3 AND sub.char_foil), false) AS fb_char3_foil,
            MAX(CASE WHEN sub.rn = 4 THEN sub.char_id END) AS fb_char4_id,
            MAX(CASE WHEN sub.rn = 4 THEN sub.char_name END) AS fb_char4_name,
            MAX(CASE WHEN sub.rn = 4 THEN sub.char_image END) AS fb_char4_image,
            COALESCE(BOOL_OR(sub.rn = 4 AND sub.char_foil), false) AS fb_char4_foil
          FROM (
            SELECT
              c.id::text AS char_id,
              c.name AS char_name,
              c.image_path AS char_image,
              c.is_foil AS char_foil,
              ROW_NUMBER() OVER (
                ORDER BY dc.display_order ASC NULLS LAST, dc.created_at, dc.card_id
              ) AS rn
            FROM deck_cards dc
            JOIN characters c ON c.id = dc.card_id::uuid
            WHERE dc.deck_id = d.id
              AND dc.card_type = 'character'
              AND dc.card_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          ) sub
          WHERE sub.rn <= 4
        ) dc_chars ON TRUE`;
  const selectParts = CHARACTER_LIST_SLOTS.map((s, index) => {
    const slot = index + 1;
    return `COALESCE(d.${s.idField}, dc_chars.fb_char${slot}_id::uuid) AS ${s.idField},
          COALESCE(${s.sqlAlias}.name, dc_chars.fb_char${slot}_name) AS ${s.nameField},
          COALESCE(${s.sqlAlias}.image_path, dc_chars.fb_char${slot}_image) AS ${s.imageField},
          COALESCE(${s.sqlAlias}.is_foil, dc_chars.fb_char${slot}_foil, false) AS ${s.foilField}`;
  });
  const joinParts = CHARACTER_LIST_SLOTS.map(
    (s) => `LEFT JOIN characters ${s.sqlAlias} ON d.${s.idField} = ${s.sqlAlias}.id`,
  );
  return {
    selectFragment: selectParts.join(',\n          '),
    joinFragment: [...joinParts.map((j) => `        ${j}`), fallbackJoin].join('\n'),
  };
}

function previewImagePath(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pushCharacterPreviewCards(cards: DeckCard[], deckRow: DeckListRow): void {
  const deckId = deckRow.id as string;
  for (const slot of CHARACTER_LIST_SLOTS) {
    const cardId = deckRow[slot.idField];
    if (!cardId) {
      continue;
    }
    const defaultImage = previewImagePath(deckRow[slot.imageField]);
    cards.push({
      id: `char${slot.syntheticSuffix}_${deckId}`,
      type: 'character',
      cardId,
      quantity: 1,
      ...(defaultImage !== undefined && { defaultImage }),
      ...(deckRow[slot.nameField] !== undefined && { name: deckRow[slot.nameField] }),
      is_foil: deckRow[slot.foilField] ?? false,
    });
  }
}

function pushMissionPreviewCards(cards: DeckCard[], deckRow: DeckListRow): void {
  const deckId = deckRow.id as string;
  for (const slot of MISSION_LIST_SLOTS) {
    const cardId = deckRow[slot.idField];
    if (!cardId) {
      continue;
    }
    cards.push({
      id: `${slot.syntheticIdPrefix}_${deckId}`,
      type: 'mission',
      cardId,
      quantity: 1,
      ...(deckRow[slot.imageField] !== undefined && {
        defaultImage: deckRow[slot.imageField],
      }),
      ...(deckRow[slot.nameField] !== undefined && { name: deckRow[slot.nameField] }),
    });
  }
}

export function mapDeckRowWithCards(deckRow: DeckRow, cards: DeckCard[]): Deck {
  const desc = deckRow.description as string | undefined;
  const uiPrefs = deckRow.ui_preferences as Deck['ui_preferences'] | undefined;
  const isLimited = deckRow.is_limited as boolean | undefined;
  const isValid = deckRow.is_valid as boolean | undefined;
  const isPrivate = deckRow.is_private as boolean | undefined;
  const cardCount = deckRow.card_count as number | undefined;
  const reserveChar = deckRow.reserve_character as string | undefined;
  const displayMission = (deckRow.display_mission_card_id as string | null) ?? null;
  const bgPath = deckRow.background_image_path as string | undefined;
  const threatVal = deckRow.threat as number | undefined;
  const createdAt = deckRow.created_at as string | undefined;
  const updatedAt = deckRow.updated_at as string | undefined;
  return {
    id: deckRow.id as string,
    user_id: deckRow.user_id as string,
    name: deckRow.name as string,
    ...(desc !== undefined && { description: desc }),
    ...(uiPrefs !== undefined && { ui_preferences: uiPrefs }),
    ...(isLimited !== undefined && { is_limited: isLimited }),
    ...(isValid !== undefined && { is_valid: isValid }),
    ...(isPrivate !== undefined && { is_private: isPrivate }),
    ...(cardCount !== undefined && { card_count: cardCount }),
    ...(reserveChar !== undefined && { reserve_character: reserveChar }),
    ...(displayMission !== null && { display_mission_card_id: displayMission }),
    ...(bgPath !== undefined && { background_image_path: bgPath }),
    ...(threatVal !== undefined && { threat: threatVal }),
    ...(createdAt !== undefined && { created_at: createdAt }),
    ...(updatedAt !== undefined && { updated_at: updatedAt }),
    cards,
  };
}

export function mapDeckRowToListDeck(deckRow: DeckListRow): Deck {
  const cards: DeckCard[] = [];

  pushCharacterPreviewCards(cards, deckRow);

  if (deckRow.location_id || deckRow.preview_location_id) {
    const locationId = (deckRow.preview_location_id as string | undefined) ?? deckRow.location_id;
    const locationImage = previewImagePath(deckRow.location_default_image);
    cards.push({
      id: `loc_${deckRow.id}`,
      type: 'location',
      cardId: locationId as string,
      quantity: 1,
      ...(locationImage !== undefined && { defaultImage: locationImage }),
      ...(deckRow.location_name !== undefined && { name: deckRow.location_name }),
    });
  }
  if (deckRow.battleground_id) {
    const battlegroundImage = previewImagePath(deckRow.battleground_default_image);
    cards.push({
      id: `bg_${deckRow.id}`,
      type: 'battleground',
      cardId: deckRow.battleground_id,
      quantity: 1,
      ...(battlegroundImage !== undefined && { defaultImage: battlegroundImage }),
      ...(deckRow.battleground_name !== undefined && { name: deckRow.battleground_name }),
    });
  }
  pushMissionPreviewCards(cards, deckRow);

  const desc = deckRow.description as string | undefined;
  const uiPrefs = deckRow.ui_preferences as Deck['ui_preferences'] | undefined;
  const isLimited = deckRow.is_limited as boolean | undefined;
  const isValid = deckRow.is_valid as boolean | undefined;
  const isPrivate = deckRow.is_private as boolean | undefined;
  const cardCount = deckRow.card_count as number | undefined;
  const threatVal = deckRow.threat as number | undefined;
  const reserveChar = deckRow.reserve_character as string | undefined;
  const displayMission = (deckRow.display_mission_card_id as string | null) ?? null;
  const bgPath = deckRow.background_image_path as string | undefined;
  const createdAt = deckRow.created_at as string | undefined;
  const updatedAt = deckRow.updated_at as string | undefined;
  return {
    id: deckRow.id as string,
    user_id: deckRow.user_id as string,
    name: deckRow.name as string,
    ...(desc !== undefined && { description: desc }),
    ...(uiPrefs !== undefined && { ui_preferences: uiPrefs }),
    ...(isLimited !== undefined && { is_limited: isLimited }),
    ...(isValid !== undefined && { is_valid: isValid }),
    ...(isPrivate !== undefined && { is_private: isPrivate }),
    ...(cardCount !== undefined && { card_count: cardCount }),
    ...(threatVal !== undefined && { threat: threatVal }),
    ...(reserveChar !== undefined && { reserve_character: reserveChar }),
    ...(displayMission !== null && { display_mission_card_id: displayMission }),
    ...(bgPath !== undefined && { background_image_path: bgPath }),
    ...(createdAt !== undefined && { created_at: createdAt }),
    ...(updatedAt !== undefined && { updated_at: updatedAt }),
    cards,
  };
}

export function mapDeckRowBasic(deckRow: DeckRow): Deck {
  const desc = deckRow.description as string | undefined;
  const uiPrefs = deckRow.ui_preferences as Deck['ui_preferences'] | undefined;
  const isLimited = deckRow.is_limited as boolean | undefined;
  const isValid = deckRow.is_valid as boolean | undefined;
  const isPrivate = deckRow.is_private as boolean | undefined;
  const cardCount = deckRow.card_count as number | undefined;
  const threatVal = deckRow.threat as number | undefined;
  const reserveChar = deckRow.reserve_character as string | undefined;
  const displayMission = (deckRow.display_mission_card_id as string | null) ?? null;
  const bgPath = deckRow.background_image_path as string | undefined;
  const createdAt = deckRow.created_at as string | undefined;
  const updatedAt = deckRow.updated_at as string | undefined;
  return {
    id: deckRow.id as string,
    user_id: deckRow.user_id as string,
    name: deckRow.name as string,
    ...(desc !== undefined && { description: desc }),
    ...(uiPrefs !== undefined && { ui_preferences: uiPrefs }),
    ...(isLimited !== undefined && { is_limited: isLimited }),
    ...(isValid !== undefined && { is_valid: isValid }),
    ...(isPrivate !== undefined && { is_private: isPrivate }),
    ...(cardCount !== undefined && { card_count: cardCount }),
    ...(threatVal !== undefined && { threat: threatVal }),
    ...(reserveChar !== undefined && { reserve_character: reserveChar }),
    ...(displayMission !== null && { display_mission_card_id: displayMission }),
    ...(bgPath !== undefined && { background_image_path: bgPath }),
    ...(createdAt !== undefined && { created_at: createdAt }),
    ...(updatedAt !== undefined && { updated_at: updatedAt }),
  };
}

const LOCATION_FALLBACK_JOIN = `
        LEFT JOIN LATERAL (
          SELECT
            l.id::text AS loc_id,
            l.name AS loc_name,
            l.image_path AS loc_image
          FROM deck_cards dc
          JOIN locations l ON l.id = dc.card_id::uuid
          WHERE dc.deck_id = d.id
            AND dc.card_type = 'location'
            AND dc.card_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          ORDER BY dc.display_order ASC NULLS LAST, dc.created_at, dc.card_id
          LIMIT 1
        ) dc_loc ON TRUE`;

const LOCATION_LIST_SELECT = `
          COALESCE(d.location_id, dc_loc.loc_id::uuid) AS preview_location_id,
          COALESCE(l.name, dc_loc.loc_name) AS location_name,
          COALESCE(l.image_path, dc_loc.loc_image) AS location_default_image`;

const BATTLEGROUND_FALLBACK_JOIN = `
        LEFT JOIN LATERAL (
          SELECT
            b.id::text AS battleground_id,
            b.name AS battleground_name,
            b.image_path AS battleground_image
          FROM deck_cards dc
          JOIN battlegrounds b ON b.id = dc.card_id::uuid
          WHERE dc.deck_id = d.id
            AND dc.card_type = 'battleground'
            AND dc.card_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          ORDER BY dc.display_order ASC NULLS LAST, dc.created_at, dc.card_id
          LIMIT 1
        ) dc_bg ON TRUE`;

const BATTLEGROUND_LIST_SELECT = `
          dc_bg.battleground_id::uuid AS battleground_id,
          dc_bg.battleground_name AS battleground_name,
          dc_bg.battleground_image AS battleground_default_image`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createDeck(
  ctx: DeckRepositoryContext,
  userId: string,
  name: string,
  description?: string,
  characterIds?: string[],
  isPrivate?: boolean
): Promise<Deck> {
  const client = await ctx.pool.connect();
  try {
    await client.query('BEGIN');

    const result = isPrivate === undefined
      ? await client.query(
        'INSERT INTO decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, description ?? null]
      )
      : await client.query(
        'INSERT INTO decks (user_id, name, description, is_private) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, description ?? null, isPrivate]
      );

    const deck = result.rows[0] as DeckRow;
    const deckId = deck.id as string;

    if (characterIds?.length) {
      for (const characterId of characterIds) {
        await client.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
          [deckId, 'character', characterId, 1]
        );
      }
    }

    await client.query('COMMIT');

    const updatedDeckResult = await client.query(
      'SELECT * FROM decks WHERE id = $1',
      [deckId]
    );
    const updatedDeck = updatedDeckResult.rows[0] as DeckRow;
    const newDeck = mapDeckRowBasic(updatedDeck);

    ctx.cache.set(deckId, { deck: newDeck, timestamp: Date.now() });
    invalidateUserDeckListCache(ctx.cache, userId);

    return newDeck;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQLDeckRepository.createDeck error:', error);
    console.error('❌ CreateDeck error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      userId,
      deckName: name,
      description,
      characterIds,
    });
    throw error;
  } finally {
    client.release();
  }
}

export async function getDeckById(
  ctx: DeckRepositoryContext,
  id: string
): Promise<Deck | undefined> {
  if (!UUID_REGEX.test(id)) {
    return undefined;
  }

  const now = Date.now();
  const cached = ctx.cache.get(id);
  if (cached && now - cached.timestamp < ctx.cacheTtlMs) {
    return cached.deck as Deck;
  }

  const client = await ctx.pool.connect();
  try {
    const deckResult = await client.query(
      'SELECT * FROM decks WHERE id = $1',
      [id]
    );
    if (deckResult.rows.length === 0) {
      return undefined;
    }

    const deck = deckResult.rows[0] as DeckRow;
    const cardsResult = await client.query(
      `SELECT * FROM deck_cards
       WHERE deck_id = $1
       ORDER BY display_order ASC NULLS LAST, card_type, card_id`,
      [id]
    );
    const cards: DeckCard[] = (cardsResult.rows as DeckCardRow[]).map((card) => ({
      id: card.id,
      type: card.card_type as DeckCard['type'],
      cardId: card.card_id,
      quantity: card.quantity,
      ...(card.display_order !== undefined && card.display_order !== null && {
        displayOrder: card.display_order,
      }),
      exclude_from_draw: card.exclude_from_draw ?? false,
    }));

    const fullDeck = mapDeckRowWithCards(deck, cards);
    ctx.cache.set(id, { deck: fullDeck, timestamp: now });
    return fullDeck;
  } finally {
    client.release();
  }
}

export type DeckListOrderBy = 'created_at' | 'updated_at';

export async function getDecksByUserId(
  ctx: DeckRepositoryContext,
  userId: string,
  orderBy: DeckListOrderBy = 'created_at'
): Promise<Deck[]> {
  const cacheKey = `user_decks_${userId}_${orderBy}`;
  const now = Date.now();
  const cached = ctx.cache.get(cacheKey);
  if (cached && now - cached.timestamp < ctx.cacheTtlMs) {
    return cached.deck as Deck[];
  }

  const client = await ctx.pool.connect();
  try {
    const { selectFragment: characterSelectSql, joinFragment: characterJoinSql } =
      buildCharacterListSqlFragments();
    // SQL fragments from CHARACTER_LIST_SLOTS only (fixed aliases/columns); $1 is the only user input.
    const deckResult = await client.query( // nosemgrep: pg-sql-template-interpolation
      `
        SELECT 
          d.*,
          ${characterSelectSql},
          ${LOCATION_LIST_SELECT},
          ${BATTLEGROUND_LIST_SELECT},
          dm1.mission_id as mission_1_id,
          dm1.mission_name as mission_1_name,
          dm1.mission_image_path as mission_1_default_image
        FROM decks d
${characterJoinSql}
        LEFT JOIN locations l ON d.location_id = l.id
${LOCATION_FALLBACK_JOIN}
${BATTLEGROUND_FALLBACK_JOIN}
        LEFT JOIN LATERAL (
          SELECT 
            dc.card_id as mission_id,
            m.name as mission_name,
            m.image_path as mission_image_path
          FROM deck_cards dc
          JOIN missions m ON m.id = dc.card_id::uuid
          WHERE dc.deck_id = d.id AND dc.card_type = 'mission'
          ORDER BY
            CASE
              WHEN d.display_mission_card_id IS NOT NULL AND dc.card_id::uuid = d.display_mission_card_id THEN 0
              ELSE 1
            END,
            m.set_number_int ASC NULLS LAST,
            m.name ASC,
            dc.card_id ASC
          LIMIT 1
        ) dm1 ON true
        WHERE d.user_id = $1 
        ORDER BY d.${orderBy === 'updated_at' ? 'updated_at' : 'created_at'} DESC
      `,
      [userId]
    );

    if (deckResult.rows.length === 0) {
      return [];
    }

    const decks = (deckResult.rows as DeckListRow[]).map(mapDeckRowToListDeck);
    ctx.cache.set(cacheKey, { deck: decks, timestamp: now });
    return decks;
  } finally {
    client.release();
  }
}

/**
 * Builds the shared deck-list SELECT (with character/location/mission preview
 * joins). `extraJoins`, `where`, and `orderBy` are fixed SQL strings written by
 * callers (never user input — user values go through bound params). `limit` is a
 * number we control. Used by community / favorites / public-profile reads.
 */
function buildDeckListSelectSql(opts: {
  extraSelect?: string;
  extraJoins?: string;
  where: string;
  orderBy: string;
  limit?: number;
}): string {
  const { selectFragment, joinFragment } = buildCharacterListSqlFragments();
  const limitSql =
    opts.limit != null ? `\n        LIMIT ${Math.max(0, Math.floor(opts.limit))}` : '';
  return `
        SELECT 
          d.*,
          ${selectFragment},
          ${LOCATION_LIST_SELECT},
          ${BATTLEGROUND_LIST_SELECT},
          dm1.mission_id as mission_1_id,
          dm1.mission_name as mission_1_name,
          dm1.mission_image_path as mission_1_default_image
          ${opts.extraSelect ? `,\n          ${opts.extraSelect}` : ''}
        FROM decks d
${joinFragment}
        LEFT JOIN locations l ON d.location_id = l.id
${LOCATION_FALLBACK_JOIN}
${BATTLEGROUND_FALLBACK_JOIN}
        LEFT JOIN LATERAL (
          SELECT 
            dc.card_id as mission_id,
            m.name as mission_name,
            m.image_path as mission_image_path
          FROM deck_cards dc
          JOIN missions m ON m.id = dc.card_id::uuid
          WHERE dc.deck_id = d.id AND dc.card_type = 'mission'
          ORDER BY
            CASE
              WHEN d.display_mission_card_id IS NOT NULL AND dc.card_id::uuid = d.display_mission_card_id THEN 0
              ELSE 1
            END,
            m.set_number_int ASC NULLS LAST,
            m.name ASC,
            dc.card_id ASC
          LIMIT 1
        ) dm1 ON true
        ${opts.extraJoins ?? ''}
        WHERE ${opts.where}
        ORDER BY ${opts.orderBy}${limitSql}
  `;
}

/** Public decks owned by a specific user (for the read-only public profile). */
export async function getPublicDecksByUserId(
  ctx: DeckRepositoryContext,
  userId: string
): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      where: 'd.user_id = $1 AND d.is_private = false',
      orderBy: 'd.updated_at DESC',
    });
    // SQL fragments are fixed; $1 is the only user input.
    const result = await client.query(sql, [userId]); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/** Public deck-list items selected by stable UUID, preserving the caller's order. */
export async function getPublicDecksByIds(
  ctx: DeckRepositoryContext,
  ids: string[]
): Promise<Deck[]> {
  if (ids.length === 0) return [];

  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      where: 'd.is_private = false AND d.id = ANY($1::uuid[])',
      orderBy: 'array_position($1::uuid[], d.id)',
    });
    const result = await client.query(sql, [ids]);
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/** Public + legal decks owned by a curated account (tournament/community rails). */
export async function getPublicLegalDecksByUserId(
  ctx: DeckRepositoryContext,
  userId: string,
  orderBy: DeckListOrderBy = 'updated_at'
): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      where: 'd.user_id = $1 AND d.is_private = false AND d.is_valid = true',
      orderBy: `d.${orderBy === 'updated_at' ? 'updated_at' : 'created_at'} DESC`,
    });
    // SQL fragments are fixed; $1 is the only user input.
    const result = await client.query(sql, [userId]); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/** Official preconstructed decks, grouped newest set first and workbook order within a set. */
export async function getPreconstructedDecks(
  ctx: DeckRepositoryContext
): Promise<PreconstructedDeckRecord[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      extraSelect: `pd.set_code AS preconstructed_set_code,
          precon_set.name AS preconstructed_set_label,
          pd.release_order AS preconstructed_release_order,
          pd.deck_order AS preconstructed_deck_order`,
      extraJoins: `JOIN preconstructed_decks pd ON pd.deck_id = d.id
        JOIN sets precon_set ON precon_set.code = pd.set_code`,
      where: 'd.is_private = false',
      orderBy: 'pd.release_order DESC, pd.deck_order ASC',
    });
    const result = await client.query(sql); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as PreconstructedDeckListRow[]).map((row) => ({
      deck: mapDeckRowToListDeck(row),
      setCode: row.preconstructed_set_code,
      setLabel: row.preconstructed_set_label,
      releaseOrder: Number(row.preconstructed_release_order),
      deckOrder: Number(row.preconstructed_deck_order),
    }));
  } finally {
    client.release();
  }
}

/**
 * Community feed: public + legal (is_valid) + non-limited decks across all users,
 * most-recently-updated first. `excludeUserIds` removes internal/curated accounts.
 */
export async function getCommunityFeedDecks(
  ctx: DeckRepositoryContext,
  opts: { limit?: number; excludeUserIds?: string[] } = {}
): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      where:
        'd.is_private = false AND d.is_valid = true AND d.is_limited = false AND d.user_id <> ALL($1::uuid[])',
      orderBy: 'd.updated_at DESC',
      limit: opts.limit ?? 20,
    });
    // SQL fragments are fixed; $1 is the only user input (bound array).
    const result = await client.query(sql, [opts.excludeUserIds ?? []]); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/**
 * Community search: same public/legal/non-limited pool, filtered to decks whose
 * title, owner's username, any-of-4 character, reserve character, or location
 * name matches `search`.
 */
export async function searchCommunityDecks(
  ctx: DeckRepositoryContext,
  opts: { search: string; limit?: number; excludeUserIds?: string[] }
): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      extraJoins:
        'LEFT JOIN characters rc ON d.reserve_character::uuid = rc.id ' +
        'JOIN users owner ON d.user_id = owner.id',
      where:
        'd.is_private = false AND d.is_valid = true AND d.is_limited = false AND d.user_id <> ALL($1::uuid[]) ' +
        'AND (d.name ILIKE $2 OR owner.username ILIKE $2 OR c1.name ILIKE $2 OR c2.name ILIKE $2 OR c3.name ILIKE $2 OR c4.name ILIKE $2 OR rc.name ILIKE $2 OR l.name ILIKE $2)',
      orderBy: 'd.updated_at DESC',
      limit: opts.limit ?? 50,
    });
    const pattern = `%${opts.search}%`;
    // SQL fragments are fixed; user input is bound ($1 array, $2 ILIKE pattern).
    const result = await client.query(sql, [opts.excludeUserIds ?? [], pattern]); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/** A user's favorited decks (public + still-existing), newest-favorited first. */
export async function getFavoriteDecksForUser(
  ctx: DeckRepositoryContext,
  userId: string
): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const sql = buildDeckListSelectSql({
      extraJoins: 'JOIN deck_favorites fav ON fav.deck_id = d.id AND fav.user_id = $1',
      where: 'd.is_private = false',
      orderBy: 'fav.created_at DESC',
    });
    // SQL fragments are fixed; $1 is the only user input.
    const result = await client.query(sql, [userId]); // nosemgrep: pg-sql-template-interpolation
    return (result.rows as DeckListRow[]).map(mapDeckRowToListDeck);
  } finally {
    client.release();
  }
}

/** Adds a favorite (idempotent). Returns true if a new row was inserted. */
export async function addDeckFavorite(
  ctx: DeckRepositoryContext,
  userId: string,
  deckId: string
): Promise<boolean> {
  if (!UUID_REGEX.test(deckId)) return false;
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO deck_favorites (user_id, deck_id) VALUES ($1, $2)
       ON CONFLICT (user_id, deck_id) DO NOTHING`,
      [userId, deckId]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/** Removes a favorite. Returns true if a row was deleted. */
export async function removeDeckFavorite(
  ctx: DeckRepositoryContext,
  userId: string,
  deckId: string
): Promise<boolean> {
  if (!UUID_REGEX.test(deckId)) return false;
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM deck_favorites WHERE user_id = $1 AND deck_id = $2',
      [userId, deckId]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

/** Returns the subset of `deckIds` favorited by `userId` (for hydrating isFavorited). */
export async function getFavoritedDeckIds(
  ctx: DeckRepositoryContext,
  userId: string,
  deckIds: string[]
): Promise<Set<string>> {
  if (deckIds.length === 0) return new Set();
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT deck_id FROM deck_favorites WHERE user_id = $1 AND deck_id = ANY($2::uuid[])',
      [userId, deckIds]
    );
    return new Set((result.rows as Array<{ deck_id: string }>).map((r) => r.deck_id));
  } finally {
    client.release();
  }
}

export async function getDeckSummaryWithAllCards(
  ctx: DeckRepositoryContext,
  deckId: string
): Promise<Deck | undefined> {
  const client = await ctx.pool.connect();
  try {
    const deckResult = await client.query(
      'SELECT * FROM decks WHERE id = $1',
      [deckId]
    );
    if (deckResult.rows.length === 0) {
      return undefined;
    }

    const deck = deckResult.rows[0] as DeckRow;
    const cardsResult = await client.query(
      `SELECT * FROM deck_cards
       WHERE deck_id = $1
       ORDER BY display_order ASC NULLS LAST, card_type, card_id`,
      [deckId]
    );
    const cards: DeckCard[] = (cardsResult.rows as DeckCardRow[]).map((card) => ({
      id: card.id,
      type: card.card_type as DeckCard['type'],
      cardId: card.card_id,
      quantity: card.quantity,
      ...(card.display_order !== undefined && card.display_order !== null && {
        displayOrder: card.display_order,
      }),
      exclude_from_draw: card.exclude_from_draw ?? false,
    }));

    const fullDeck = mapDeckRowWithCards(deck, cards);
    ctx.cache.set(deckId, { deck: fullDeck, timestamp: Date.now() });
    return fullDeck;
  } finally {
    client.release();
  }
}

export async function getAllDecks(ctx: DeckRepositoryContext): Promise<Deck[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM decks ORDER BY created_at'
    );
    return (result.rows as DeckRow[]).map(mapDeckRowBasic);
  } finally {
    client.release();
  }
}

export async function updateDeck(
  ctx: DeckRepositoryContext,
  id: string,
  updates: Partial<Deck>
): Promise<Deck | undefined> {
  const client = await ctx.pool.connect();
  try {
    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.ui_preferences !== undefined) {
      setClause.push(`ui_preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.ui_preferences));
    }
    if (updates.is_limited !== undefined) {
      setClause.push(`is_limited = $${paramCount++}`);
      values.push(updates.is_limited);
    }
    if (updates.is_valid !== undefined) {
      setClause.push(`is_valid = $${paramCount++}`);
      values.push(updates.is_valid);
    }
    if (updates.is_private !== undefined) {
      setClause.push(`is_private = $${paramCount++}`);
      values.push(updates.is_private);
    }
    if (updates.reserve_character !== undefined) {
      setClause.push(`reserve_character = $${paramCount++}`);
      values.push(updates.reserve_character);
    }
    if (updates.display_mission_card_id !== undefined) {
      setClause.push(`display_mission_card_id = $${paramCount++}`);
      values.push(updates.display_mission_card_id);
    }
    if (updates.background_image_path !== undefined) {
      setClause.push(`background_image_path = $${paramCount++}`);
      values.push(updates.background_image_path);
    }

    if (setClause.length === 0) {
      return getDeckById(ctx, id);
    }

    setClause.push('updated_at = NOW()');
    values.push(id);

    // setClause is from a fixed whitelist of column assignments; values are parameterized.
    const result = await client.query( // nosemgrep: pg-sql-template-interpolation
      `UPDATE decks SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const deck = result.rows[0] as DeckRow;
    const updatedDeck = mapDeckRowBasic(deck);
    await ctx.invalidateDeck(id);
    return updatedDeck;
  } finally {
    client.release();
  }
}

export async function deleteDeck(
  ctx: DeckRepositoryContext,
  id: string
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    const userResult = await client.query(
      'SELECT user_id FROM decks WHERE id = $1',
      [id]
    );
    const userId = userResult.rows[0]?.user_id as string | undefined;

    const result = await client.query('DELETE FROM decks WHERE id = $1', [id]);
    const success = (result.rowCount ?? 0) > 0;

    if (success) {
      ctx.cache.delete(id);
      if (userId) {
        invalidateUserDeckListCache(ctx.cache, userId);
      }
    }
    return success;
  } finally {
    client.release();
  }
}
