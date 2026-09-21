import type { PoolClient } from 'pg';

/**
 * Public list of card sets for clients (e.g. collection view code → display name).
 */
export async function listAllSets(pool: { connect: () => Promise<PoolClient> }): Promise<{ code: string; name: string }[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ code: string; name: string }>(`
      SELECT code, name FROM sets
      ORDER BY regexp_replace(BTRIM(name), '^The[[:space:]]+', '', 'i'), name
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Resolve a card row's `set` code to `sets.name`. Falls back to the raw code if no row matches.
 * Empty/null set is treated as ERB for lookup (matches card-lookup default).
 */
export async function resolveSetDisplayName(
  client: PoolClient,
  setCode: string | null | undefined,
  cache?: Map<string, string>
): Promise<string> {
  const raw =
    setCode != null && String(setCode).trim() !== '' ? String(setCode).trim() : 'ERB';
  const key = raw.toUpperCase();
  if (cache?.has(key)) {
    return cache.get(key)!;
  }

  try {
    const result = await client.query<{ name: string }>(
      'SELECT name FROM sets WHERE UPPER(TRIM(code)) = $1 LIMIT 1',
      [key]
    );
    if (result.rows.length > 0) {
      const name = result.rows[0].name;
      cache?.set(key, name);
      return name;
    }
  } catch (error) {
    console.error('resolveSetDisplayName:', error);
  }

  cache?.set(key, raw);
  return raw;
}
