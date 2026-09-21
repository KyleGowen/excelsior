import type { Battleground } from '../../types';
import type { CardRepositoryContext } from './context';
import { mapBattlegroundRow } from './mappers';

export async function getBattlegroundById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Battleground | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM battlegrounds WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapBattlegroundRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllBattlegrounds(ctx: CardRepositoryContext): Promise<Battleground[]> {
  const now = Date.now();
  if (ctx.cache.battlegrounds && now - ctx.cache.cacheTime < ctx.cacheTtlMs) {
    return ctx.cache.battlegrounds;
  }
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM battlegrounds
      ORDER BY regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    const battlegrounds = result.rows.map(mapBattlegroundRow);
    ctx.cache.battlegrounds = battlegrounds;
    ctx.cache.cacheTime = now;
    return battlegrounds;
  } finally {
    client.release();
  }
}
