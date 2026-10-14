import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../../../frontend/src/features/home/HomePage';
import { fetchCommunityFeed, fetchPreconstructedDecks } from '../../../frontend/src/lib/api/favorites';
import { fetchTournamentDecks } from '../../../frontend/src/lib/api/decks';
import { fetchCatalog } from '../../../frontend/src/lib/api/catalog';
import { TournamentStatsRail } from '../../../frontend/src/features/home/TournamentStatsRail';

jest.mock('../../../frontend/src/app/AuthProvider', () => ({ useAuth: () => ({ user: null, tournamentDecksUserId: null }) }));
jest.mock('../../../frontend/src/lib/images/useImageAssets', () => ({ useImageAssets: () => ({ assetUrl: (url: string) => url }) }));
jest.mock('../../../frontend/src/features/home/useRecentUpdates', () => ({ useRecentUpdates: () => ({ data: [], isLoading: false, isError: false }) }));
jest.mock('../../../frontend/src/lib/api/favorites', () => ({ fetchCommunityFeed: jest.fn(), fetchPreconstructedDecks: jest.fn() }));
jest.mock('../../../frontend/src/lib/api/decks', () => ({ fetchTournamentDecks: jest.fn() }));
jest.mock('../../../frontend/src/lib/api/catalog', () => ({ fetchCatalog: jest.fn() }));
jest.mock('../../../frontend/src/features/home/TournamentStatsRail', () => ({ TournamentStatsRail: jest.fn(() => <section><h2>Fictional tournament statistics</h2></section>) }));
jest.mock('../../../frontend/src/components/DeckTile', () => ({ DeckTile: ({ deck }: { deck: { metadata: { name: string } } }) => <button>{deck.metadata.name}</button> }));

type Observed = { callback: IntersectionObserverCallback; target: Element | null; disconnect: jest.Mock };
let observers: Observed[];
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
const flush = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); };
const mount = async () => { await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider>)); await flush(); };
async function reveal(title: string, intersecting = true) {
  const observed = observers.find(item => item.target?.getAttribute('data-home-section') === title)!;
  expect(observed).toBeDefined();
  await act(async () => observed.callback([{ isIntersecting: intersecting, target: observed.target } as IntersectionObserverEntry], {} as IntersectionObserver));
  await flush();
}
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  for (const api of [fetchCommunityFeed, fetchPreconstructedDecks, fetchTournamentDecks, fetchCatalog]) (api as jest.Mock).mockReset().mockResolvedValue([]);
  observers = [];
  globalThis.IntersectionObserver = class {
    entry: Observed;
    constructor(callback: IntersectionObserverCallback) { this.entry = { callback, target: null, disconnect: jest.fn() }; observers.push(this.entry); }
    observe(target: Element) { this.entry.target = target; }
    disconnect() { this.entry.disconnect(); }
  } as unknown as typeof IntersectionObserver;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); });

it('keeps the hero and updates available without mounting offscreen statistics or fetching any deck feeds/catalogs', async () => {
  await mount();
  await reveal('Tournament Statistics', false);
  expect(container.textContent).toContain('Welcome to Excelsior');
  expect(container.textContent).toContain('Recent Updates');
  for (const api of [fetchCommunityFeed, fetchPreconstructedDecks, fetchTournamentDecks, fetchCatalog, TournamentStatsRail]) expect(api).not.toHaveBeenCalled();
  expect([...container.querySelectorAll('[data-home-section]')].map(element => element.getAttribute('data-home-section')))
    .toEqual(['Tournament Statistics', 'Community Decks', 'Tournament Winning Decks', 'Preconstructed Decks']);
});

it('loads each near-viewport feed independently and reuses its preview catalogs', async () => {
  await mount();
  await reveal('Community Decks');
  expect(fetchCommunityFeed).toHaveBeenCalledTimes(1);
  expect(fetchCatalog).toHaveBeenCalledTimes(4);
  expect(fetchPreconstructedDecks).not.toHaveBeenCalled();
  expect(fetchTournamentDecks).not.toHaveBeenCalled();
  await reveal('Tournament Winning Decks');
  expect(fetchTournamentDecks).toHaveBeenCalledTimes(1);
  expect(fetchCatalog).toHaveBeenCalledTimes(4);
  expect(fetchPreconstructedDecks).not.toHaveBeenCalled();
  await reveal('Preconstructed Decks');
  expect(fetchPreconstructedDecks).toHaveBeenCalledTimes(1);
  expect(fetchCatalog).toHaveBeenCalledTimes(4);
  expect(TournamentStatsRail).not.toHaveBeenCalled();
});

it('mounts the statistics chunk only on approach and disconnects its observer', async () => {
  await mount();
  await reveal('Tournament Statistics');
  expect(TournamentStatsRail).toHaveBeenCalled();
  expect(container.textContent).toContain('Fictional tournament statistics');
  expect(observers[0].disconnect).toHaveBeenCalled();
  expect(fetchCommunityFeed).not.toHaveBeenCalled();
});

it('supports a keyboard-accessible explicit load control and ignores callbacks after unmount', async () => {
  await mount();
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Load Preconstructed Decks')!;
  await act(async () => { button.focus(); button.click(); }); await flush();
  expect(fetchPreconstructedDecks).toHaveBeenCalledTimes(1);
  expect(fetchCommunityFeed).not.toHaveBeenCalled();
  await act(async () => root.render(null));
  for (const observer of observers) expect(observer.disconnect).toHaveBeenCalled();
  await reveal('Community Decks');
  expect(fetchCommunityFeed).not.toHaveBeenCalled();
});

it('loads every section when IntersectionObserver is unavailable', async () => {
  globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
  await mount();
  for (const api of [fetchCommunityFeed, fetchPreconstructedDecks, fetchTournamentDecks]) expect(api).toHaveBeenCalledTimes(1);
  expect(TournamentStatsRail).toHaveBeenCalled();
  expect(container.querySelectorAll('[data-active="false"]')).toHaveLength(0);
});
