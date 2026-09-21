import type { Character } from '../../types';
import type { CardRepositoryContext } from './context';
import { mapCharacterRow } from './mappers';

export async function getCharacterById(
  ctx: CardRepositoryContext,
  id: string
): Promise<Character | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM characters WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapCharacterRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllCharacters(ctx: CardRepositoryContext): Promise<Character[]> {
  const now = Date.now();
  if (ctx.cache.characters && now - ctx.cache.cacheTime < ctx.cacheTtlMs) {
    return ctx.cache.characters;
  }
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM characters
      ORDER BY regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    const characters = result.rows.map((row) => mapCharacterRow(row));
    ctx.cache.characters = characters;
    ctx.cache.cacheTime = now;
    return characters;
  } finally {
    client.release();
  }
}

export async function getCharacterEffectiveImage(
  ctx: CardRepositoryContext,
  characterId: string
): Promise<string> {
  const character = await getCharacterById(ctx, characterId);
  if (!character) return '';
  return character.image || '';
}
