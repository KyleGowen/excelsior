/**
 * Progressive image session registry — reveal cache, LRU, in-flight dedupe.
 * @jest-environment jsdom
 */
import {
  clearProgressiveImageSession,
  isFullResRevealed,
  markFullResRevealed,
  preloadAndRevealFullRes,
  PROGRESSIVE_SESSION_MAX_ENTRIES,
  revealedUrlCountForTests,
  shouldSkipFullResUpgrade,
} from '../../../frontend/src/lib/images/progressiveImageLoad';

describe('progressive image session registry', () => {
  beforeEach(() => {
    clearProgressiveImageSession('database');
  });

  it('tracks revealed URLs and clears on session reset', () => {
    expect(isFullResRevealed('/foo.webp')).toBe(false);
    markFullResRevealed('/foo.webp');
    expect(isFullResRevealed('/foo.webp')).toBe(true);
    clearProgressiveImageSession('database');
    expect(isFullResRevealed('/foo.webp')).toBe(false);
  });

  it('evicts oldest entries when LRU cap is exceeded', () => {
    for (let i = 0; i < PROGRESSIVE_SESSION_MAX_ENTRIES; i += 1) {
      markFullResRevealed(`/card-${i}.webp`);
    }
    expect(revealedUrlCountForTests()).toBe(PROGRESSIVE_SESSION_MAX_ENTRIES);

    markFullResRevealed('/card-new.webp');
    expect(revealedUrlCountForTests()).toBe(PROGRESSIVE_SESSION_MAX_ENTRIES);
    expect(isFullResRevealed('/card-0.webp')).toBe(false);
    expect(isFullResRevealed('/card-new.webp')).toBe(true);
  });
});

describe('preloadAndRevealFullRes in-flight dedupe', () => {
  const OriginalImage = global.Image;
  let constructCount = 0;

  beforeEach(() => {
    clearProgressiveImageSession('database');
    constructCount = 0;
    global.Image = jest.fn().mockImplementation(() => {
      constructCount += 1;
      return { onload: null as (() => void) | null, onerror: null as (() => void) | null, src: '' };
    }) as unknown as typeof Image;
  });

  afterEach(() => {
    global.Image = OriginalImage;
    jest.restoreAllMocks();
  });

  it('uses one network preload for concurrent requests to the same URL', async () => {
    type PreloadMock = { onload: (() => void) | null; _src: string };
    const instances: PreloadMock[] = [];

    global.Image = jest.fn().mockImplementation(() => {
      constructCount += 1;
      const inst: PreloadMock = { onload: null, _src: '' };
      Object.defineProperty(inst, 'src', {
        set(value: string) {
          inst._src = value;
        },
        get() {
          return inst._src;
        },
      });
      instances.push(inst);
      return inst;
    }) as unknown as typeof Image;

    const decode = jest.fn().mockResolvedValue(undefined);
    const targetA = { src: '', decode };
    const targetB = { src: '', decode };
    const revealedA = jest.fn();
    const revealedB = jest.fn();

    preloadAndRevealFullRes('/src/resources/cards/images/characters/foo.webp', targetA, revealedA);
    preloadAndRevealFullRes('/src/resources/cards/images/characters/foo.webp', targetB, revealedB);

    expect(constructCount).toBe(1);
    instances[0]!.onload?.();

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(revealedA).toHaveBeenCalled();
    expect(revealedB).toHaveBeenCalled();
    expect(isFullResRevealed('/src/resources/cards/images/characters/foo.webp')).toBe(true);
  });

  it('reveals immediately when URL is already in session', async () => {
    markFullResRevealed('/cached.webp');
    const decode = jest.fn().mockResolvedValue(undefined);
    const target = { src: '', decode };
    const onRevealed = jest.fn();

    preloadAndRevealFullRes('/cached.webp', target, onRevealed);

    expect(constructCount).toBe(0);
    await decode();
    expect(onRevealed).toHaveBeenCalled();
    expect(target.src).toBe('/cached.webp');
  });
});

describe('shouldSkipFullResUpgrade', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: undefined,
    });
  });

  it('returns true when saveData is enabled', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true },
    });
    expect(shouldSkipFullResUpgrade()).toBe(true);
  });

  it('returns true when prefers-reduced-data is reduce', () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-data: reduce)',
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    expect(shouldSkipFullResUpgrade()).toBe(true);
  });

  it('returns false by default', () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    expect(shouldSkipFullResUpgrade()).toBe(false);
  });
});

describe('CardImage session wiring', () => {
  it('imports session helpers and clears database scope on DatabasePage unmount', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const cardImage = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/components/CardImage/CardImage.tsx'),
      'utf8',
    );
    const databasePage = fs.readFileSync(
      path.join(__dirname, '../../../frontend/src/features/database/CardDatabaseModule.tsx'),
      'utf8',
    );
    expect(cardImage).toContain('isFullResRevealed');
    expect(cardImage).toContain('shouldSkipFullResUpgrade');
    expect(databasePage).toContain("clearProgressiveImageSession('database')");
    expect(databasePage).toContain('effectivePage');
  });
});
