import type { Aspect } from '../../types';
import type { CardRepositoryContext } from './context';
import { mapAspectRow, mapAspectRowWithSet } from './mappers';

export async function getAspectById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Aspect | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM aspects WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapAspectRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllAspects(ctx: CardRepositoryContext): Promise<Aspect[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM aspects
      ORDER BY set, regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    return result.rows.map((row) => mapAspectRowWithSet(row));
  } finally {
    client.release();
  }
}
