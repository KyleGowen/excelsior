import * as fs from 'fs';
import * as path from 'path';

describe('Seattle Weekend Recent Updates migration', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V364__Announce_seattle_weekend_breakdown.sql'),
    'utf8',
  );
  const dateMigration = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V365__Correct_seattle_weekend_update_date.sql'),
    'utf8',
  );

  it('publishes the supplied copy as an Update', () => {
    expect(migration).toContain("'The Seattle Weekend Breakdown'");
    expect(migration).toContain("'update'");
    expect(migration).toContain(
      "Skybound is here, and Seattle''s doubleheader is in the books! What decks did players come up with in the week from release? Come take a look!",
    );
  });

  it('uses the Advanced Alien Arsenal artwork and its catalog thumbnail exists', () => {
    expect(migration).toContain("'sky/specials/053_advanced_alien_arsenal.png'");
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/resources/cards/images/sky/specials/053_advanced_alien_arsenal.png',
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/resources/cards/images/sky/thumb/specials/053_advanced_alien_arsenal.webp',
        ),
      ),
    ).toBe(true);
  });

  it('is deterministic, idempotent, and verifies the seeded row', () => {
    expect(migration).toContain("'a1000001-0000-4000-8000-000000000012'");
    expect(migration).toContain("'2026-09-21 00:00:00'");
    expect(migration).toContain('ON CONFLICT (id) DO UPDATE SET');
    expect(migration).toContain('Seattle Weekend recent update was not applied');
  });

  it('uses a midday timestamp so September 21 remains stable in US time zones', () => {
    expect(dateMigration).toContain("'2026-09-21 12:00:00'");
    expect(dateMigration).toContain("WHERE id = 'a1000001-0000-4000-8000-000000000012'");
    expect(dateMigration).toContain('DISABLE TRIGGER update_recent_updates_updated_at');
    expect(dateMigration).toContain('ENABLE TRIGGER update_recent_updates_updated_at');
    expect(dateMigration).toContain('Seattle Weekend recent update date was not corrected');
  });
});
