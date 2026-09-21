import type { Location } from '../../types';
import type { CardRepositoryContext } from './context';
import { mapLocationRow, mapLocationRowWithSet } from './mappers';

export async function getLocationById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Location | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapLocationRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllLocations(ctx: CardRepositoryContext): Promise<Location[]> {
  const now = Date.now();
  if (ctx.cache.locations && now - ctx.cache.cacheTime < ctx.cacheTtlMs) {
    return ctx.cache.locations;
  }
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM locations
      ORDER BY regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    const locations = result.rows.map((row) => mapLocationRowWithSet(row));
    ctx.cache.locations = locations;
    ctx.cache.cacheTime = now;
    return locations;
  } finally {
    client.release();
  }
}
