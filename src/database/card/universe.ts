import type {
  AdvancedUniverse,
  AllyUniverse,
  BasicUniverse,
  Teamwork,
  TrainingCard,
} from '../../types';
import type { CardRepositoryContext } from './context';
import {
  mapAdvancedUniverseRow,
  mapAdvancedUniverseRowWithSet,
  mapAllyUniverseRow,
  mapAllyUniverseRowWithSet,
  mapBasicUniverseRow,
  mapBasicUniverseRowWithSet,
  mapTeamworkRow,
  mapTeamworkRowWithSet,
  mapTrainingRow,
  mapTrainingRowWithSet,
} from './mappers';

export async function getAdvancedUniverseById(
  ctx: CardRepositoryContext,
  id: string
): Promise<AdvancedUniverse | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM advanced_universe_cards WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapAdvancedUniverseRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllAdvancedUniverse(
  ctx: CardRepositoryContext
): Promise<AdvancedUniverse[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM advanced_universe_cards
       ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name`
    );
    return result.rows.map((row) => mapAdvancedUniverseRowWithSet(row));
  } finally {
    client.release();
  }
}

export async function getTeamworkById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Teamwork | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM teamwork_cards WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapTeamworkRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllTeamwork(ctx: CardRepositoryContext): Promise<Teamwork[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM teamwork_cards
       ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name`
    );
    return result.rows.map((row) => mapTeamworkRowWithSet(row));
  } finally {
    client.release();
  }
}

export async function getAllyUniverseById(
  ctx: CardRepositoryContext,
  id: string
): Promise<AllyUniverse | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM ally_universe_cards WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapAllyUniverseRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllAllyUniverse(
  ctx: CardRepositoryContext
): Promise<AllyUniverse[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM ally_universe_cards
       ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name`
    );
    return result.rows.map((row) => mapAllyUniverseRowWithSet(row));
  } finally {
    client.release();
  }
}

export async function getTrainingById(
  ctx: CardRepositoryContext,
  id: string
): Promise<TrainingCard | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT id, name, type_1, type_2, value_to_use, bonus, image_path, one_per_deck FROM training_cards WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapTrainingRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllTraining(
  ctx: CardRepositoryContext
): Promise<TrainingCard[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM training_cards
       ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name`
    );
    return result.rows.map((row) => mapTrainingRowWithSet(row));
  } finally {
    client.release();
  }
}

export async function getBasicUniverseById(
  ctx: CardRepositoryContext,
  id: string
): Promise<BasicUniverse | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM basic_universe_cards WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return undefined;
    return mapBasicUniverseRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllBasicUniverse(
  ctx: CardRepositoryContext
): Promise<BasicUniverse[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM basic_universe_cards
       ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name`
    );
    return result.rows.map((row) => mapBasicUniverseRowWithSet(row));
  } finally {
    client.release();
  }
}
