import type { Mission, Event } from '../../types';
import type { CardRepositoryContext } from './context';
import {
  mapEventRow,
  mapEventRowWithSet,
  mapMissionRow,
  mapMissionRowWithSet,
} from './mappers';

export async function getMissionById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Mission | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM missions WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapMissionRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllMissions(ctx: CardRepositoryContext): Promise<Mission[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM missions
      ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    return result.rows.map((row) => mapMissionRowWithSet(row));
  } finally {
    client.release();
  }
}

export async function getEventById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Event | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapEventRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllEvents(ctx: CardRepositoryContext): Promise<Event[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM events
      ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    return result.rows.map((row) => mapEventRowWithSet(row));
  } finally {
    client.release();
  }
}
