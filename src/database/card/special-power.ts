import type { SpecialCard, PowerCard } from '../../types';
import type { CardRepositoryContext } from './context';
import { mapPowerCardRow, mapSpecialCardRow } from './mappers';

export async function getSpecialCardById(
  ctx: CardRepositoryContext,
  id: string
): Promise<SpecialCard | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM special_cards WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapSpecialCardRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllSpecialCards(ctx: CardRepositoryContext): Promise<SpecialCard[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM special_cards
      ORDER BY
        regexp_replace(BTRIM(character_name), '^The[[:space:]]+', '', 'i'),
        character_name,
        regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'),
        name
    `);
    return result.rows.map((row) => mapSpecialCardRow(row));
  } finally {
    client.release();
  }
}

export async function getSpecialCardEffectiveImage(
  ctx: CardRepositoryContext,
  specialCardId: string
): Promise<string> {
  const card = await getSpecialCardById(ctx, specialCardId);
  if (!card) return '';
  return card.image || '';
}

export async function getPowerCardById(
  ctx: CardRepositoryContext,
  id: string
): Promise<PowerCard | undefined> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query('SELECT * FROM power_cards WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return mapPowerCardRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAllPowerCards(ctx: CardRepositoryContext): Promise<PowerCard[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(`
      SELECT
        pc.*,
        s.name as set_name
      FROM power_cards pc
      LEFT JOIN sets s ON pc.set = s.code
      ORDER BY pc.power_type, pc.value
    `);
    return result.rows.map((row) => mapPowerCardRow(row));
  } finally {
    client.release();
  }
}

export async function getPowerCardEffectiveImage(
  ctx: CardRepositoryContext,
  powerCardId: string
): Promise<string> {
  const card = await getPowerCardById(ctx, powerCardId);
  if (!card) return '';
  return card.image || '';
}
