/**
 * v2 card image helpers — progressive load path detection and preload/reveal.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  canProgressiveLoad,
  imagePathFromCard,
  imageElementMatchesUrl,
  reverseImagePathForImagePath,
  normalizeRawImagePath,
  resolveImageUrl,
  resolveThumbUrl,
} from '../../../frontend/src/lib/images/cardImages';
import {
  clearProgressiveImageSession,
  preloadAndRevealFullRes,
} from '../../../frontend/src/lib/images/progressiveImageLoad';
import {
  catalogTypeUsesPortraitThumb,
  isLandscapeCatalogType,
} from '../../../frontend/src/lib/catalog/catalogTypeMap';

/** Painted size for object-fit: contain (matches DB tile framing). */
function containPaintedSize(nw: number, nh: number, fw: number, fh: number) {
  const ia = nw / nh;
  const fa = fw / fh;
  if (ia > fa) return { pw: fw, ph: fw / ia };
  return { ph: fh, pw: fh * ia };
}

describe('normalizeRawImagePath for locations', () => {
  it('prepends locations/ for bare filenames and alternate subfolders', () => {
    expect(normalizeRawImagePath('barsoom.webp', 'locations')).toBe('locations/barsoom.webp');
    expect(normalizeRawImagePath('alternate/draculas_armory.png', 'locations')).toBe(
      'locations/alternate/draculas_armory.png',
    );
    expect(normalizeRawImagePath('/src/resources/cards/images/alternate/221_b_baker_st.png', 'locations')).toBe(
      '/src/resources/cards/images/locations/alternate/221_b_baker_st.png',
    );
  });

  it('leaves already-prefixed location paths unchanged', () => {
    expect(normalizeRawImagePath('locations/barsoom.webp', 'locations')).toBe('locations/barsoom.webp');
    expect(normalizeRawImagePath('sky/locations/348_global_defense_agency.png', 'locations')).toBe(
      'sky/locations/348_global_defense_agency.png',
    );
  });

  it('does not rewrite non-location catalog types', () => {
    expect(normalizeRawImagePath('barsoom.webp', 'characters')).toBe('barsoom.webp');
  });
});

describe('location progressive load paths', () => {
  it('resolves thumb and full URLs for bare location filenames', () => {
    expect(canProgressiveLoad('barsoom.webp', 'locations')).toBe(true);
    expect(resolveImageUrl('barsoom.webp', 'locations')).toBe(
      '/src/resources/cards/images/locations/barsoom.webp',
    );
    expect(resolveThumbUrl('barsoom.webp', 'locations')).toBe(
      '/src/resources/cards/images/locations/thumb/barsoom.webp',
    );
  });

  it('requires catalogType for deck-list location defaultImage (bare filename)', () => {
    expect(resolveThumbUrl('danger_room.webp')).not.toContain('/locations/');
    expect(resolveThumbUrl('danger_room.webp', 'locations')).toBe(
      '/src/resources/cards/images/locations/thumb/danger_room.webp',
    );
  });

  it('resolves set-scoped Skybound location thumbnails', () => {
    const raw = 'sky/locations/348_global_defense_agency.png';
    expect(resolveImageUrl(raw, 'locations')).toBe(
      '/src/resources/cards/images/sky/locations/348_global_defense_agency.png',
    );
    expect(resolveThumbUrl(raw, 'locations')).toBe(
      '/src/resources/cards/images/sky/thumb/locations/348_global_defense_agency.webp',
    );
  });

  it('resolves set-scoped ERB location thumbnails', () => {
    const raw = 'erb/locations/465_dracula_s_armory.png';
    expect(canProgressiveLoad(raw, 'locations')).toBe(true);
    expect(resolveImageUrl(raw, 'locations')).toBe(
      '/src/resources/cards/images/erb/locations/465_dracula_s_armory.png',
    );
    expect(resolveThumbUrl(raw, 'locations')).toBe(
      '/src/resources/cards/images/erb/thumb/locations/465_dracula_s_armory.webp',
    );
  });
});

describe('Skybound alternate art', () => {
  it('uses each catalog printing image without collector-number redaction', () => {
    const card = {
      id: '419',
      set: 'SKY',
      set_number: '419',
      image_path: 'sky/characters/419_invincible.png',
    };
    expect(imagePathFromCard(card)).toBe('sky/characters/419_invincible.png');
  });
});

describe('Skybound two-faced character art', () => {
  it('derives the Walkers reverse face when a surface only has the front image path', () => {
    expect(reverseImagePathForImagePath('sky/characters/226_walkers_herd.png')).toBe(
      'sky/characters/226_walkers.png',
    );
    expect(reverseImagePathForImagePath('sky/characters/450_walkers_herd.png')).toBe(
      'sky/characters/450_walkers.png',
    );
    expect(reverseImagePathForImagePath('sky/characters/001_invincible.png')).toBeNull();
  });
});

describe('tfacp promo power progressive paths', () => {
  it('resolves thumb and full URLs for tfacp/power promo art', () => {
    const raw = 'tfacp/power/7_energy.png';
    expect(canProgressiveLoad(raw, 'power-cards')).toBe(true);
    expect(resolveImageUrl(raw, 'power-cards')).toBe(
      '/src/resources/cards/images/tfacp/power/7_energy.png',
    );
    expect(resolveThumbUrl(raw, 'power-cards')).toBe(
      '/src/resources/cards/images/tfacp/thumb/power/7_energy.webp',
    );
  });
});

describe('canProgressiveLoad', () => {
  it('returns true when thumb and full asset paths differ', () => {
    expect(canProgressiveLoad('characters/angry_mob.webp')).toBe(true);
    expect(resolveThumbUrl('characters/angry_mob.webp')).not.toBe(
      resolveImageUrl('characters/angry_mob.webp'),
    );
  });

  it('returns false for empty, absolute, or already-thumb paths', () => {
    expect(canProgressiveLoad('')).toBe(false);
    expect(canProgressiveLoad(null)).toBe(false);
    expect(canProgressiveLoad('https://cdn.example.com/foo.webp')).toBe(false);
    expect(canProgressiveLoad('characters/thumb/foo.webp')).toBe(false);
  });

  it('returns false when thumbify cannot derive a distinct path', () => {
    expect(canProgressiveLoad('not-a-card-path')).toBe(false);
  });
});

describe('imageElementMatchesUrl', () => {
  it('matches absolute browser src to site-relative asset path', () => {
    const img = { src: 'http://localhost:5173/src/resources/cards/images/characters/foo.webp' } as HTMLImageElement;
    expect(imageElementMatchesUrl(img, '/src/resources/cards/images/characters/foo.webp')).toBe(true);
  });
});

describe('preloadAndRevealFullRes', () => {
  const OriginalImage = global.Image;

  beforeEach(() => {
    clearProgressiveImageSession('database');
  });

  afterEach(() => {
    global.Image = OriginalImage;
    jest.restoreAllMocks();
  });

  it('sets target src, decodes, and calls onRevealed after preload onload', async () => {
    type PreloadMock = { onload: (() => void) | null; _src: string };
    let preloadInstance: PreloadMock | null = null;

    global.Image = jest.fn().mockImplementation(() => {
      preloadInstance = { onload: null, _src: '' };
      Object.defineProperty(preloadInstance, 'src', {
        set(value: string) {
          (preloadInstance as PreloadMock)._src = value;
        },
        get() {
          return (preloadInstance as PreloadMock)._src;
        },
      });
      return preloadInstance;
    }) as unknown as typeof Image;

    const decode = jest.fn().mockResolvedValue(undefined);
    const target = { src: '', decode };
    const onRevealed = jest.fn();

    const handle = preloadAndRevealFullRes('/src/resources/cards/images/characters/foo.webp', target, onRevealed);

    expect(preloadInstance).not.toBeNull();
    preloadInstance!.onload?.();

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(target.src).toBe('/src/resources/cards/images/characters/foo.webp');
    expect(decode).toHaveBeenCalled();
    await Promise.resolve();
    expect(onRevealed).toHaveBeenCalled();
    handle.cancel();
  });

  it('does not reveal after cancel', () => {
    let preloadInstance: { onload: (() => void) | null; src: string } | null = null;

    global.Image = jest.fn().mockImplementation(() => {
      preloadInstance = { onload: null, src: '' };
      return preloadInstance;
    }) as unknown as typeof Image;

    const decode = jest.fn().mockResolvedValue(undefined);
    const target = { src: '', decode };
    const onRevealed = jest.fn();

    const handle = preloadAndRevealFullRes('/full.webp', target, onRevealed);
    handle.cancel();
    preloadInstance!.onload?.();

    return decode().then(() => {
      expect(onRevealed).not.toHaveBeenCalled();
    });
  });

  it('does not reveal when preload fails (keeps thumb visible)', async () => {
    let preloadInstance: { onload: (() => void) | null; onerror: (() => void) | null; src: string } | null =
      null;

    global.Image = jest.fn().mockImplementation(() => {
      preloadInstance = { onload: null, onerror: null, src: '' };
      return preloadInstance;
    }) as unknown as typeof Image;

    const decode = jest.fn().mockResolvedValue(undefined);
    const target = { src: '', decode };
    const onRevealed = jest.fn();

    preloadAndRevealFullRes('/missing.png', target, onRevealed);
    preloadInstance!.onerror?.();

    await new Promise((r) => setTimeout(r, 0));

    expect(onRevealed).not.toHaveBeenCalled();
    expect(target.src).toBe('');
    expect(decode).not.toHaveBeenCalled();
  });
});

describe('CardImage progressive CSS', () => {
  it('defines two-layer progressive classes', () => {
    const cssPath = path.join(__dirname, '../../../frontend/src/components/CardImage/CardImage.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('.card-image__img--thumb');
    expect(css).toContain('.card-image__img--full');
    expect(css).toContain('.card-image__full--loaded');
    expect(css).toContain('.card-image--progressive');
    expect(css).toContain('position: absolute');
    expect(css).toContain('visibility: hidden');
    expect(css).toContain('.card-image--progressive.card-image--loading .card-image__img--thumb');
    expect(css).toContain('.card-image--contain.card-image--progressive .card-image__img--full');
  });

  it('defines the accessible in-image flip control used by two-faced cards', () => {
    const imageSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardImage/CardImage.tsx'),
      'utf8',
    );
    const detailSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardDetailPanel/CardDetailPanel.tsx'),
      'utf8',
    );
    expect(imageSource).toContain('className="card-image__flip"');
    expect(imageSource).toContain('Show reverse of');
    expect(detailSource).toContain('reverseImagePath={card.reverse_image_path');
  });

});

describe('contain painted size parity', () => {
  it('portrait thumb and full paint to similar height in a 5:7 frame', () => {
    const frame = { w: 197, h: 276 };
    const thumb = containPaintedSize(350, 490, frame.w, frame.h);
    const full = containPaintedSize(819, 1114, frame.w, frame.h);
    expect(Math.abs(thumb.ph - full.ph)).toBeLessThan(12);
  });

  it('location full art letterboxes in a 236:151 frame (contain thumbs must match, not cover-fill)', () => {
    const frame = { w: 304, h: 195 };
    const full = containPaintedSize(1114, 819, frame.w, frame.h);
    expect(full.ph).toBeCloseTo(frame.h, 0);
    expect(full.pw).toBeLessThan(frame.w);
  });
});

describe('catalogTypeUsesPortraitThumb', () => {
  it('returns true for portrait DB tabs and false for landscape tabs', () => {
    expect(catalogTypeUsesPortraitThumb('special-cards')).toBe(true);
    expect(catalogTypeUsesPortraitThumb('missions')).toBe(true);
    expect(isLandscapeCatalogType('characters')).toBe(true);
    expect(catalogTypeUsesPortraitThumb('characters')).toBe(false);
  });
});

describe('CardTile database progressive wiring', () => {
  it('uses the Location landscape frame for Battleground tiles', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardTile/CardTile.tsx'),
      'utf8',
    );
    expect(source).toContain(
      "catalogType === 'locations' || catalogType === 'battlegrounds'",
    );
    expect(source).toContain("return 'card-tile--locations'");
  });

  it('passes progressive and catalogType for database grid', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardTile/CardTile.tsx'),
      'utf8',
    );
    expect(source).toContain('progressive={Boolean(catalogType)}');
    expect(source).toContain('catalogType={catalogType}');
    expect(source).not.toContain('catalogTypeUsesFullImageInDbGrid');
  });

  it('gates foil laminate with showFoilEffect', () => {
    const tileSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardTile/CardTile.tsx'),
      'utf8',
    );
    expect(tileSource).toContain('showFoilEffect && isFoilCard(card)');

    const imageSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardImage/CardImage.tsx'),
      'utf8',
    );
    expect(imageSource).toContain('showFoilEffect === false');
    expect(imageSource).toContain('showFoilEffect = true');
  });

  it('places the foil indicator with the name and keeps rarity in the set row', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardTile/CardTile.tsx'),
      'utf8',
    );
    const nameRowIndex = source.indexOf('className="card-tile__name-row"');
    const foilBadgeIndex = source.indexOf('className="card-tile__foil-badge"');
    const subRowIndex = source.indexOf('className="card-tile__sub"');
    const rarityIndex = source.indexOf('className="card-tile__rarity"');

    expect(nameRowIndex).toBeGreaterThan(-1);
    expect(foilBadgeIndex).toBeGreaterThan(nameRowIndex);
    expect(foilBadgeIndex).toBeLessThan(subRowIndex);
    expect(rarityIndex).toBeGreaterThan(subRowIndex);
  });
});

describe('per-screen foil effect wiring', () => {
  it('disables laminate in DBV grid and Add Cards browse contexts', () => {
    const dbvSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/features/database/DatabasePage.tsx'),
      'utf8',
    );
    expect(dbvSource).toContain('<CardTile');
    expect(dbvSource).toContain('showFoilEffect={false}');
    expect(dbvSource).not.toMatch(/<CardDetailPanel[\s\S]*?showFoilEffect=\{false\}/);

    const addCardsSource = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/features/deck-editor/AddCardsPanel.tsx'),
      'utf8',
    );
    expect(addCardsSource).toContain('showFoilEffect={false}');
  });
});

describe('CardImage single-layer cached sync', () => {
  it('syncs loaded state from img.complete on path and src changes (deck tile cycling)', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardImage/CardImage.tsx'),
      'utf8',
    );
    expect(source).toContain('function SingleLayerCardImage');
    expect(source).toContain('syncImageLoaded(imgRef.current)');
    expect(source).toMatch(
      /useLayoutEffect\(\(\) => \{[\s\S]*setThumbFailed\(false\);[\s\S]*\}, \[imagePath, catalogType, useThumbnail\]\);/,
    );
    expect(source).toMatch(/useLayoutEffect\(\(\) => \{[\s\S]*setLoaded\(true\);[\s\S]*\}, \[src\]\);/);
  });
});
