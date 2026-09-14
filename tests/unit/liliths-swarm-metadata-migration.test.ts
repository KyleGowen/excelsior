import * as fs from 'fs';
import * as path from 'path';

describe("Lilith's Swarm metadata migration", () => {
  const sql = fs.readFileSync(
    path.join(
      process.cwd(),
      'migrations/V358__Restore_liliths_swarm_numerical_metadata.sql',
    ),
    'utf8',
  );

  it('restores the printed level 5 Any-Power metadata on the exact printing', () => {
    expect(sql).toContain("set = 'ERB'");
    expect(sql).toContain("set_number = '453'");
    expect(sql).toContain("character_name = 'Any Character'");
    expect(sql).toContain("name = 'Lilith''s Swarm'");
    expect(sql).toContain("icons = ARRAY['Any-Power']");
    expect(sql).toContain('value = 5');
  });

  it('guards the target and verifies the repaired row', () => {
    expect(sql).toContain('target_rows <> 1');
    expect(sql).toContain('repaired_rows <> 1');
    expect(sql).toContain('RAISE EXCEPTION');
  });
});
