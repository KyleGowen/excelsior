import * as fs from 'fs';
import * as path from 'path';

describe('preconstructed decks Recent Updates migration', () => {
  const seedMigration = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V354__Announce_preconstructed_decks.sql'),
    'utf8',
  );
  const titleMigration = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V355__Rename_preconstructed_decks_update.sql'),
    'utf8',
  );

  it('announces the Community preconstructed decks as an Update', () => {
    expect(seedMigration).toContain("'update'");
    expect(seedMigration).toContain('official preconstructed decks');
  });

  it('credits Andrew Taylor for the Skybound upgrade recommendations', () => {
    expect(seedMigration).toContain('featured Skybound precon upgrade recommendations from Andrew Taylor');
  });

  it('uses the supplied Skybound Training card artwork', () => {
    expect(seedMigration).toContain("'sky/training/394_training_any_power.png'");
  });

  const localImageRoot = path.join(process.cwd(), 'src/resources/cards/images/sky');
  const verifiesLocalImageTree = fs.existsSync(localImageRoot) ? it : it.skip;

  verifiesLocalImageTree('has the supplied artwork and generated thumbnail in the local image tree', () => {
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/resources/cards/images/sky/training/394_training_any_power.png',
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          'src/resources/cards/images/sky/thumb/training/394_training_any_power.webp',
        ),
      ),
    ).toBe(true);
  });

  it('is deterministic, idempotent, and verifies the seeded row', () => {
    expect(seedMigration).toContain("'a1000001-0000-4000-8000-000000000011'");
    expect(seedMigration).toContain("'2026-09-11 00:00:00'");
    expect(seedMigration).toContain('ON CONFLICT (id) DO UPDATE SET');
    expect(seedMigration).toContain('Preconstructed decks recent update was not applied');
  });

  it('uses the approved display title', () => {
    expect(titleMigration).toContain("SET title = 'Preconstructed deck lists available'");
    expect(titleMigration).toContain('Preconstructed decks recent update title was not applied');
  });
});
