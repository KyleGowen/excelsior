import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CardImage } from '../../../frontend/src/components/CardImage/CardImage';
import { ImageAssetsContext } from '../../../frontend/src/lib/images/useImageAssets';
import { clearProgressiveImageSession, markFullResRevealed } from '../../../frontend/src/lib/images/progressiveImageLoad';

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let entries: Array<{ callback: IntersectionObserverCallback; target?: Element }>;
const fullUrl = '/fictional/full.webp';
const assets = { resolveImageUrl: () => fullUrl, resolveThumbUrl: () => '/fictional/thumb.webp', placeholderImageUrl: () => '/fictional/placeholder.webp', assetUrl: (path: string) => path };
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const mount = async () => { await act(async () => root.render(<ImageAssetsContext.Provider value={assets}><CardImage imagePath="characters/fictional.webp" alt="Fictional card" catalogType="characters" progressive loading="lazy" progressiveSessionScope="deck-editor" /></ImageAssetsContext.Provider>)); };
const intersect = async () => { await act(async () => entries[0]!.callback([{ isIntersecting: true, target: entries[0]!.target } as IntersectionObserverEntry], {} as IntersectionObserver)); await flush(); };
const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  clearProgressiveImageSession('deck-editor'); entries = [];
  window.matchMedia = jest.fn(() => ({ matches: false, media: '', onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }));
  globalThis.IntersectionObserver = class {
    entry: { callback: IntersectionObserverCallback; target?: Element };
    constructor(callback: IntersectionObserverCallback) { this.entry = { callback }; entries.push(this.entry); }
    observe(target: Element) { this.entry.target = target; }
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: jest.fn(async () => {}) });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); clearProgressiveImageSession('deck-editor');
  if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
  else delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
});

it('reveals a visible grid image when another mounted surface cached its full image after grid mount', async () => {
  await mount();
  const full = container.querySelector<HTMLImageElement>('.card-image__img--full')!;
  expect(full.getAttribute('src')).toBeNull();
  // Draw Hand can finish this same URL while the grid card is still offscreen.
  markFullResRevealed(fullUrl, 'deck-editor');
  await intersect();
  expect(full.getAttribute('src')).toBe(fullUrl);
  expect(full.classList.contains('card-image__full--loaded')).toBe(true);
});

it('keeps an offscreen grid image deferred when another surface caches the URL', async () => {
  await mount();
  markFullResRevealed(fullUrl, 'deck-editor');
  await flush();
  expect(container.querySelector('.card-image__img--full')!.getAttribute('src')).toBeNull();
});

it('restores a URL already cached before mounting without a new preload', async () => {
  markFullResRevealed(fullUrl, 'deck-editor');
  await mount(); await flush();
  expect(container.querySelector('.card-image__img--full')!.getAttribute('src')).toBe(fullUrl);
});
