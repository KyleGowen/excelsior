/// <reference path="../../../frontend/src/vite-env.d.ts" />
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddCardsPanel } from '../../../frontend/src/features/deck-editor/AddCardsPanel';
import { LayoutModeProvider } from '../../../frontend/src/lib/layout/LayoutModeProvider';
import { ModuleHostProvider, type ModuleHost } from '../../../frontend/src/modules/ModuleHost';
import { createModuleApi } from '../../../frontend/src/modules/api';
import { candidateInputKey } from '../../../frontend/src/contracts/inputKey';
import type { CatalogCard, DeckCardEntry } from '../../../frontend/src/lib/api/types';
import { CATALOG_TYPE_BY_SLUG } from '../../../frontend/src/lib/catalog/catalogTypeMap';
type CandidateEvaluation = Awaited<ReturnType<ModuleHost['api']['evaluateCandidates']>>;

const power: CatalogCard = {
  id: 'fictional-power', name: '5 - Combat', power_type: 'Combat', value: 5, one_per_deck: false,
  presentation: {
    schemaVersion: 1, catalogVersion: 'fictional', rulesVersion: 'catalog-presentation-compatibility-v1',
    logicalCardId: 'fictional-power', printingId: 'fictional-power', groupKey: 'fictional-power',
    isFoil: false, isAlternateArt: false, normalizedSet: 'ERB', defaultRank: 0,
    addDefaultPrintingId: 'fictional-power', basePrintingId: null, foilPrintingId: null,
    printingIds: ['fictional-power'], searchText: '5 - Combat', searchAliases: [], characterNames: [],
  },
};
const character: CatalogCard = {
  ...power, id: 'fictional-character', name: 'Fictional Character',
  presentation: { ...power.presentation!, logicalCardId: 'fictional-character', printingId: 'fictional-character', groupKey: 'fictional-character', addDefaultPrintingId: 'fictional-character', printingIds: ['fictional-character'] },
};
const catalogIndex = new Map([['power:fictional-power', power], ['character:fictional-character', character]]);
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
let host: ModuleHost;
let pending: { payload: Parameters<ModuleHost['api']['evaluateCandidates']>[0]; resolve: (value: CandidateEvaluation) => void; reject: (error: Error) => void };
const tick = async () => act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

function Harness() {
  const [cards, setCards] = useState<DeckCardEntry[]>([]);
  return <AddCardsPanel open onClose={() => {}} cards={cards} deckCatalogIndex={catalogIndex}
    onAdd={(card, type) => setCards(previous => [...previous, { type: CATALOG_TYPE_BY_SLUG[type].deckType, cardId: card.id, quantity: 1, instanceId: `copy-${previous.length}` }])}
    onAddStack={() => {}} onRemoveInstance={id => setCards(previous => previous.filter(card => card.instanceId !== id))} />;
}
const response = (input: Parameters<ModuleHost['api']['evaluateCandidates']>[0]): CandidateEvaluation => ({
  schemaVersion: 1, revision: input.revision, inputKey: candidateInputKey(input),
  versions: { catalog: 'fictional', rules: 'fictional' }, missionLimitReached: false,
  candidates: input.candidates.map(card => ({ ...card, usable: true, reasons: [], maxCopies: 99 })),
});

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() })) as unknown as typeof window.matchMedia;
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver;
  Element.prototype.scrollIntoView = jest.fn();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  let edited = false;
  const evaluate = jest.fn<ReturnType<ModuleHost['api']['evaluateCandidates']>, Parameters<ModuleHost['api']['evaluateCandidates']>>()
    .mockImplementation(input => {
      if (!edited && input.cards.length === 0) return Promise.resolve(response(input));
      edited = true;
      return new Promise((resolve, reject) => { pending = { payload: input, resolve, reject }; });
    });
  host = { api: {
    ...createModuleApi({ fetcher: jest.fn(async () => { throw new Error('Unexpected request'); }) }),
    fetchCatalog: jest.fn(async type => type === 'power-cards' ? [power] : type === 'characters' ? [character] : []),
    fetchSets: jest.fn(async () => []), fetchFoilCardMap: jest.fn(async () => []),
    evaluateCandidates: evaluate,
    evaluateDraft: jest.fn(async () => ({ threat: { editor: 0 }, addCardsTeam: [] })) as unknown as ModuleHost['api']['evaluateDraft'],
  }, identity: { user: null, isGuest: true, isAdmin: false }, onOpenDeck: jest.fn(), onBack: jest.fn(), onHome: jest.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); });

async function mountFilteredPanel() {
  await act(async () => root.render(<QueryClientProvider client={client}><LayoutModeProvider><ModuleHostProvider host={host}><Harness /></ModuleHostProvider></LayoutModeProvider></QueryClientProvider>));
  await tick(); await tick();
  const hide = container.querySelector<HTMLInputElement>('.add-cards__filters-toggle input')!;
  await act(async () => hide.click()); await tick();
  return container.querySelector<HTMLDivElement>('[aria-label="View 5 - Combat"]')!;
}

it('keeps filtered tiles and pagination mounted across an add, refresh, and removal', async () => {
  const tile = await mountFilteredPanel();
  const pagination = container.querySelector('.add-cards__pagination');
  expect(tile).not.toBeNull(); expect(pagination).not.toBeNull();
  await act(async () => tile.click()); await tick();
  expect(container.querySelector('[aria-label="View 5 - Combat"]')).toBe(tile);
  expect(container.querySelector('.add-cards__pagination')).toBe(pagination);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Increase"]')?.disabled).toBe(true);
  // Artwork must not authorize a second add with the old response.
  await act(async () => tile.click());
  expect(container.querySelector('.add-cards__qty-value')?.textContent).toBe('1');
  await act(async () => pending.resolve(response(pending.payload))); await tick();
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Increase"]')?.disabled).toBe(false);
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Decrease"]')!.click()); await tick();
  expect(container.querySelector('[aria-label="View 5 - Combat"]')).toBe(tile);
  expect(container.querySelector('.add-cards__pagination')).toBe(pagination);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="View 5 - Combat"] [aria-label="Add to deck"]')?.disabled).toBe(true);
});

it('keeps the tiles on failed refresh, offers retry, and enables adds only after recovery', async () => {
  const tile = await mountFilteredPanel();
  await act(async () => tile.click()); await tick();
  // The hook retries once before surfacing an unavailable refresh.
  await act(async () => pending.reject(new Error('Fictional outage')));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 1050)); });
  await act(async () => pending.reject(new Error('Fictional outage'))); await tick();
  expect(container.querySelector('[aria-label="View 5 - Combat"]')).toBe(tile);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Retry card eligibility');
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Increase"]')?.disabled).toBe(true);
  const retry = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Retry card eligibility'))!;
  await act(async () => retry.click()); await tick();
  await act(async () => pending.resolve(response(pending.payload))); await tick();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector<HTMLButtonElement>('[aria-label="Increase"]')?.disabled).toBe(false);
});

it('renders repeated character copies as separate team slots without duplicate-key warnings', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await mountFilteredPanel();
    const tile = container.querySelector<HTMLDivElement>('[aria-label="View Fictional Character"]')!;
    for (let copy = 0; copy < 2; copy++) {
      await act(async () => tile.click()); await tick();
      await act(async () => pending.resolve(response(pending.payload))); await tick();
    }
    const slots = [...container.querySelectorAll('.add-cards__team-name')].slice(0, 2);
    expect(slots.map(slot => slot.textContent)).toEqual(['Fictional Character', 'Fictional Character']);
    expect(errors.mock.calls.some(call => String(call[0]).includes('same key'))).toBe(false);
  } finally { errors.mockRestore(); }
});
