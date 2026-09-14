import * as fs from 'fs';
import * as path from 'path';

type ErbAsset = {
  collector_number: string;
  name: string;
  table: string;
  source_file: string;
  source_size_bytes: number;
  target_path: string;
  database_rows: number;
  optional_local_rows?: number;
};

type ErbManifest = {
  source: {
    folder_url: string;
    listed_png_files: number;
    selected_fronts: number;
    missing_collector_numbers: string[];
    ignored_mission_backs: number;
    ignored_copy_duplicates: number;
  };
  counts: {
    base_card_assets: number;
    canonical_database_rows: number;
    base_rows: number;
    canonical_foil_rows_reusing_base_art: number;
    optional_local_foil_rows: number;
    by_table_base: Record<string, number>;
  };
  exceptions: { collector_number: string; name: string; handling: string }[];
  assets: ErbAsset[];
};

describe('ERB LRG art manifest', () => {
  const repoRoot = process.cwd();
  const imageRoot = path.join(repoRoot, 'src/resources/cards/images/erb');
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts/erb/lrg-erb-manifest.json'), 'utf8'),
  ) as ErbManifest;
  const migration = fs.readFileSync(
    path.join(repoRoot, 'migrations/V359__Use_LRG_ERB_card_art.sql'),
    'utf8',
  );

  it('records the complete reviewed Drive inventory and database coverage', () => {
    expect(manifest.source).toMatchObject({
      listed_png_files: 570,
      selected_fronts: 534,
      missing_collector_numbers: ['205'],
      ignored_mission_backs: 28,
      ignored_copy_duplicates: 7,
    });
    expect(manifest.counts).toMatchObject({
      base_card_assets: 534,
      canonical_database_rows: 709,
      base_rows: 534,
      canonical_foil_rows_reusing_base_art: 175,
      optional_local_foil_rows: 1,
    });
    expect(manifest.assets).toHaveLength(534);
    expect(Object.values(manifest.counts.by_table_base).reduce((sum, count) => sum + count, 0))
      .toBe(534);
    expect(manifest.assets.reduce((sum, asset) => sum + asset.database_rows, 0)).toBe(709);
    expect(manifest.assets.reduce((sum, asset) => sum + (asset.optional_local_rows ?? 0), 0))
      .toBe(1);
  });

  it('covers collectors 001-535 except the source-missing collector 205', () => {
    const expected = Array.from({ length: 535 }, (_, index) => String(index + 1).padStart(3, '0'))
      .filter((number) => number !== '205');
    expect(manifest.assets.map((asset) => asset.collector_number)).toEqual(expected);
    expect(new Set(manifest.assets.map((asset) => asset.target_path)).size).toBe(534);
  });

  it('publishes only selected fronts and non-copy sources', () => {
    expect(manifest.assets.some((asset) => /_BACK_/i.test(asset.source_file))).toBe(false);
    expect(manifest.assets.some((asset) => /\bcopy\b/i.test(asset.source_file))).toBe(false);
    expect(manifest.assets.every((asset) => asset.target_path.startsWith('erb/'))).toBe(true);
  });

  it('documents the fallback and legacy numbering exceptions', () => {
    const exceptions = new Map(
      manifest.exceptions.map((exception) => [exception.collector_number, exception]),
    );
    expect(exceptions.get('205')?.handling).toContain('retain existing');
    expect(exceptions.get('494F')?.handling).toContain('local-only');
    expect(exceptions.get('504')?.handling).toContain('118/118F');
    expect(exceptions.get('526')?.handling).toContain('244/244F');
    expect(exceptions.get('461')?.handling).toContain('canonical row only');
    expect(exceptions.get('463')?.handling).toContain('canonical row only');
  });

  it('maps every selected asset through Flyway V359', () => {
    for (const asset of manifest.assets) {
      expect(migration).toContain(`'${asset.target_path}'`);
    }
    expect(migration).toContain("set_number = '504'");
    expect(migration).toContain("set_number = '526'");
    expect(migration).toContain("image_path = 'specials/read_the_bones.webp'");
    expect(migration).toContain("image_path = 'specials/alternate/preternatural_healing.jpg'");
    expect(migration).toContain("image_path = 'specials/alternate/the_gemini.webp'");
  });

  const verifiesLocalImageTree = fs.existsSync(imageRoot) ? it : it.skip;

  verifiesLocalImageTree('has every selected source at its audited byte size and a generated thumbnail', () => {
    for (const asset of manifest.assets) {
      const sourcePath = path.join(repoRoot, 'src/resources/cards/images', asset.target_path);
      expect(fs.statSync(sourcePath).size).toBe(asset.source_size_bytes);

      const [setFolder, ...rest] = asset.target_path.split('/');
      const thumbPath = path.join(
        repoRoot,
        'src/resources/cards/images',
        setFolder,
        'thumb',
        ...rest,
      ).replace(/\.[^.]+$/, '.webp');
      expect(fs.existsSync(thumbPath)).toBe(true);
    }
  });
});
