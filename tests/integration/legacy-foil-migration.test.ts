import fs from 'node:fs';
import path from 'node:path';
import { Pool, PoolClient } from 'pg';
const repair = fs.readFileSync(path.resolve(__dirname, '../../migrations/beforeEachMigrate__repair_legacy_van_helsing_foil.sql'), 'utf8');

describe('historical Van Helsing foil repair', () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let db: PoolClient;
  beforeEach(async () => {
    db = await pool.connect();
    await db.query('BEGIN');
    await db.query('CREATE SCHEMA foil_replay_test');
    await db.query('SET LOCAL search_path TO foil_replay_test');
    await db.query(`CREATE TABLE flyway_schema_history (installed_rank int, version text, success boolean);
      INSERT INTO flyway_schema_history VALUES (1,'358',true);
      CREATE TABLE characters (id uuid, name text, set text, is_foil boolean, set_number text, set_number_foil text, image_path text, updated_at timestamptz);
      CREATE TABLE foil_card_map (foil_card_id text PRIMARY KEY, base_card_id text, card_type text);
      INSERT INTO characters VALUES
      ('00000000-0000-4000-8000-000000000001','Van Helsing','ERB',false,'541',null,'characters/alternate/VanHelsing-Alt.png',null),
      ('00000000-0000-4000-8000-000000000002','Van Helsing','ERB',false,'529','529F','characters/alternate/VanHelsing-PrizePack_Alt.png',null),
      ('00000000-0000-4000-8000-000000000003','Van Helsing','ERB',true,'529F',null,'characters/alternate/VanHelsing-PrizePack_Alt.png',null);
      INSERT INTO foil_card_map VALUES ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','character');`);
  });
  afterEach(async () => { await db.query('ROLLBACK'); db.release(); });
  afterAll(async () => { await pool.end(); });

  it('repairs the wrong foil source and mapping, preserves the prize-pack base, and is idempotent', async () => {
    await db.query(repair);
    const before = (await db.query('SELECT * FROM characters ORDER BY id')).rows;
    expect(before[0].set_number_foil).toBe('529F');
    expect(before[1].image_path).toBe('characters/alternate/VanHelsing-PrizePack_Alt.png');
    expect(before[1].set_number_foil).toBeNull();
    expect(before[2].image_path).toBe('characters/alternate/VanHelsing-Alt.png');
    expect((await db.query('SELECT base_card_id FROM foil_card_map')).rows[0].base_card_id).toBe(before[0].id);
    await db.query(repair);
    expect((await db.query('SELECT * FROM characters ORDER BY id')).rows).toEqual(before);
  });

  it.each(['357', '359', '365'])('does not change a database at version %s', async version => {
    await db.query('UPDATE flyway_schema_history SET version=$1', [version]);
    const before = (await db.query('SELECT * FROM characters ORDER BY id')).rows;
    await db.query(repair);
    expect((await db.query('SELECT * FROM characters ORDER BY id')).rows).toEqual(before);
  });
});
