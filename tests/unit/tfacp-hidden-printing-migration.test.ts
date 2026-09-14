import * as fs from 'fs';
import * as path from 'path';

describe('TFCP 7 - Intelligence face-down migration', () => {
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'migrations/V357__Hide_TFCP_7_intelligence_promo_art.sql'),
    'utf8',
  );
  const databasePage = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/features/database/DatabasePage.tsx'),
    'utf8',
  );
  const catalogApi = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/lib/api/catalog.ts'),
    'utf8',
  );
  const apiClient = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/lib/api/client.ts'),
    'utf8',
  );

  it('replaces only the targeted promo face with the established card back', () => {
    expect(sql).toContain("image_path = 'tfacp/power/7_intelligence_naol.png'");
    expect(sql).toContain("image_path = 'sky/card-back/overpowerback.png'");
    expect(sql).toContain("set = 'TFCP'");
    expect(sql).toContain("name = '7 - Intelligence'");
    expect(sql).toContain("power_type = 'Intelligence'");
    expect(sql).toContain('value = 7');
    expect(sql).toContain('is_foil = FALSE');
  });

  it('also replaces cached collection art for that printing', () => {
    expect(sql).toContain('UPDATE collection_cards');
    expect(sql).toContain("WHERE image_path LIKE '%tfacp/power/7_intelligence_naol.png'");
  });

  it('guards the visible printing and exact target count', () => {
    expect(sql).toContain("image_path = 'tfacp/power/7_intelligence.png'");
    expect(sql).toContain('target_rows <> 1');
    expect(sql).toContain('hidden_rows <> 1');
    expect(sql).toContain('visible_rows <> 1');
    expect(sql).toContain('RAISE EXCEPTION');
  });

  it('removes the hidden printing assets while preserving the visible face and card back', () => {
    const imageRoot = path.join(process.cwd(), 'src/resources/cards/images');
    const hiddenFacePath = path.join(imageRoot, 'tfacp/power/7_intelligence_naol.png');
    const hiddenThumbPath = path.join(imageRoot, 'tfacp/thumb/power/7_intelligence_naol.webp');

    expect(fs.existsSync(hiddenFacePath)).toBe(false);
    expect(fs.existsSync(hiddenThumbPath)).toBe(false);

    // Most CI jobs intentionally sparse-checkout this entire image tree. Keep
    // byte-level preservation checks active locally and in asset-sync jobs.
    if (
      !fs.existsSync(path.join(imageRoot, 'tfacp'))
      || !fs.existsSync(path.join(imageRoot, 'sky'))
    ) return;

    const visibleFace = fs.readFileSync(path.join(imageRoot, 'tfacp/power/7_intelligence.png'));
    const visibleThumb = fs.readFileSync(path.join(imageRoot, 'tfacp/thumb/power/7_intelligence.webp'));
    const cardBack = fs.readFileSync(path.join(imageRoot, 'sky/card-back/overpowerback.png'));
    const cardBackThumb = fs.readFileSync(path.join(imageRoot, 'sky/thumb/card-back/overpowerback.webp'));

    expect(visibleFace.equals(cardBack)).toBe(false);
    expect(visibleThumb.equals(cardBackThumb)).toBe(false);
  });

  it('refreshes and rehydrates a selected printing instead of retaining stale catalog art', () => {
    expect(databasePage).toContain('enabled: Boolean(selected)');
    expect(databasePage).toContain('staleTime: 0');
    expect(databasePage).toContain('card.id === selected.id');
    expect(databasePage).toContain('setSelected(freshSelected)');
    expect(databasePage).toContain('currentCatalog = await queryClient.fetchQuery');
    expect(databasePage).toContain('currentCatalog.find((c) => c.id === printingId)');
    expect(databasePage).toContain('fetchCatalogFresh(detailCatalogType)');
    expect(catalogApi).toContain('api.getFresh<CatalogCard[]>');
    expect(apiClient).toContain("cache: 'no-store'");
  });
});
