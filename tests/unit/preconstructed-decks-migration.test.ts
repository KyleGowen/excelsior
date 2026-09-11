import * as fs from 'fs';
import * as path from 'path';

function sourceRows(sql: string, tempName: string): string[] {
  const match = sql.match(
    new RegExp(
      `INSERT INTO ${tempName} \\([\\s\\S]+?\\) VALUES\\n([\\s\\S]+?);\\n\\nCREATE TEMP TABLE`,
    ),
  );
  if (!match) throw new Error(`Could not find manifest for ${tempName}`);
  return match[1].trim().split(',\n');
}

function rowQuantity(row: string): number {
  const match = row.match(/::uuid, \d+, '[^']+', (\d+),/);
  if (!match) throw new Error(`Could not parse quantity from ${row}`);
  return Number(match[1]);
}

describe('preconstructed deck migrations', () => {
  const skySql = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V352__Seed_sky_preconstructed_decks.sql'),
    'utf8',
  );
  const erbSql = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V353__Seed_erb_preconstructed_decks.sql'),
    'utf8',
  );

  it('creates four public Limited Skybound decks from the 160 workbook rows', () => {
    const rows = sourceRows(skySql, 'tmp_preconstructed_source_sky');
    expect(rows).toHaveLength(160);
    expect(rows.reduce((sum, row) => sum + rowQuantity(row), 0)).toBe(220);
    expect(skySql).toContain("'We Are Invincible'");
    expect(skySql).toContain("'We are the Walking Dead'");
    expect(skySql).toContain("'Limitless Possibilities'");
    expect(skySql).toContain("'Worlds Collide'");
  });

  it('creates four public Limited ERB decks from the 185 workbook rows', () => {
    const rows = sourceRows(erbSql, 'tmp_preconstructed_source_erb');
    expect(rows).toHaveLength(185);
    expect(rows.reduce((sum, row) => sum + rowQuantity(row), 0)).toBe(232);
    expect(erbSql).toContain("'Horror Menagerie'");
    expect(erbSql).toContain("'The Resistance'");
    expect(erbSql).toContain("'Ungodly Power'");
    expect(erbSql).toContain("'Time Detectives'");
  });

  it('resolves portable non-foil set printings and fails on lookup drift', () => {
    for (const sql of [skySql, erbSql]) {
      expect(sql).toContain("WHERE username = 'precon_decks'");
      expect(sql).toContain('COALESCE(is_foil, FALSE) = FALSE');
      expect(sql).toContain('WHERE matched.match_count <> 1');
      expect(sql).toContain('preconstructed card resolution failed');
      expect(sql).toContain('is_private = FALSE');
      expect(sql).toContain('is_limited = TRUE');
    }
    expect(erbSql).toContain(
      "NOT (set_number = '244' AND image_path LIKE '%/alternate/%')",
    );
  });

  it('provides a disabled deterministic owner in fresh databases without changing existing credentials', () => {
    expect(skySql).toContain("'a3520000-0000-4000-8000-000000000001'::uuid");
    expect(skySql).toContain("'precon_decks'");
    expect(skySql).toMatch(/'\$2b\$10\$[./A-Za-z0-9]{53}'/);
    expect(skySql).toContain('ON CONFLICT (username) DO NOTHING');
    expect(skySql).not.toMatch(/ON CONFLICT \(username\) DO UPDATE/);
  });
});
