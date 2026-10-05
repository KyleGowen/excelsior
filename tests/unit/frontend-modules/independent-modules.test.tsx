/// <reference path="../../../frontend/src/vite-env.d.ts" />
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModuleHostProvider, type ModuleHost, type ModuleCardActionContext, createModuleApi, CardDatabaseModule, CollectionModule, DeckBuilderModule } from '../../../frontend/src/modules';
import { LayoutModeProvider } from '../../../frontend/src/lib/layout/LayoutModeProvider';
import catalog from '../../../frontend/src/stories/catalogPresentation.json';
import { sampleDeck } from '../../../frontend/src/stories/fixtures';
import { evaluationInputKey } from '../../../src/services/deck-evaluation/draftInput';
import type { ModuleApi } from '../../../frontend/src/modules/api';

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
let host: ModuleHost;
let unexpectedFetch: jest.Mock;
const wait = async () => act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
const mount = async (children: ReactNode) => { await act(async () => root.render(<QueryClientProvider client={client}><LayoutModeProvider><ModuleHostProvider host={host}>{children}</ModuleHostProvider></LayoutModeProvider></QueryClientProvider>)); await wait(); };
function fixtureApi(): ModuleApi {
  unexpectedFetch = jest.fn(async () => { throw new Error('Undeclared fixture request'); });
  return {
    ...createModuleApi({ fetcher: unexpectedFetch }),
    evaluateDraft: jest.fn(async input => { const max = { energy: 4, combat: 7, bruteForce: 3, intelligence: 8 }; return { schemaVersion: 1 as const, draftId: input.draftId, revision: input.revision, inputKey: evaluationInputKey(input), versions: { catalog: 'fictional', rules: 'fictional' }, policy: { format: 'venture' as const, limited: input.limited }, legality: { valid: true, rawValid: true, reasons: [] }, threat: { editor: 19, legality: 19 }, grids: { printedMaximums: max, effectiveMaximums: max, activeMaximums: max, editorMaximums: max, characters: [] }, icons: { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 }, counts: { physicalPlayable: 51, drawPile: 51, prePlaced: 0, exportCards: 51 }, capabilities: { drawHand: true } }; }),
    fetchCatalog: jest.fn(async type => (catalog as Record<string, unknown>)[type] ?? []) as unknown as ModuleApi['fetchCatalog'],
    fetchCatalogFresh: jest.fn(async type => (catalog as Record<string, unknown>)[type] ?? []) as unknown as ModuleApi['fetchCatalogFresh'],
    fetchSets: jest.fn(async () => [{ code: 'ERB', name: 'Fictional release' }]),
    fetchFoilCardMap: jest.fn(async () => []),
    fetchCollectionCards: jest.fn(async () => []),
    fetchDeckFull: jest.fn(async () => JSON.parse(JSON.stringify(sampleDeck))),
    fetchFavoriteDecks: jest.fn(async () => []),
  };
}
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = jest.fn(() => ({ matches: false, media: '', onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }));
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof IntersectionObserver;
  window.scrollTo = jest.fn(); Element.prototype.scrollIntoView = jest.fn();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
  host = { api: fixtureApi(), identity: { user: null, isGuest: true, isAdmin: false }, onOpenDeck: jest.fn(), onBack: jest.fn(), onHome: jest.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); expect(unexpectedFetch).not.toHaveBeenCalled(); });

it('mounts Card Database alone without authentication or a router, deck calls, or saved collection calls', async () => {
  await mount(<CardDatabaseModule />);
  expect(container.textContent).toContain('Card Database');
  expect(container.querySelector('[aria-label="View Billy the Kid"]')).not.toBeNull();
  expect(host.api.fetchDeckFull).not.toHaveBeenCalled();
  expect(host.api.fetchCollectionCards).not.toHaveBeenCalled();
});
it('mounts Collection alone with host identity and catalog primitives', async () => {
  await mount(<CollectionModule />);
  expect(container.textContent).toContain('My Collection');
  expect(container.textContent).toContain('Stored on this device');
  expect(host.api.fetchDeckFull).not.toHaveBeenCalled();
});
it('mounts Deck Builder alone and delivers navigation to host callbacks', async () => {
  await mount(<DeckBuilderModule deckId="storybook-deck" readonly />);
  expect(container.textContent).toContain('Storybook Sample Deck');
  const back = container.querySelector('[aria-label="Back"]') as HTMLButtonElement;
  await act(async () => back.click());
  expect(host.onBack).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.deck-editor__rail')).toBeNull();
});
it('composes all three with one declared host and catalog cache', async () => {
  await mount(<><CardDatabaseModule /><CollectionModule /><DeckBuilderModule deckId="storybook-deck" readonly /></>);
  expect(container.textContent).toContain('Card Database');
  expect(container.textContent).toContain('My Collection');
  expect(container.textContent).toContain('Storybook Sample Deck');
});
it('shows catalog failure and retries the supplied host operation', async () => {
  const fetch = jest.fn().mockRejectedValueOnce(new Error('Fictional outage')).mockResolvedValue(catalog.characters);
  host.api.fetchCatalog = fetch;
  await mount(<CardDatabaseModule />); await wait();
  expect(container.textContent).toContain('Cards unavailable');
  const retry = [...container.querySelectorAll('button')].find(b => b.textContent === 'Retry cards')!;
  await act(async () => retry.click()); await wait();
  expect(container.querySelector('[aria-label="View Billy the Kid"]')).not.toBeNull();
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('cancels a catalog read when its last module is unmounted', async () => {
  let signal: AbortSignal | undefined;
  host.api.fetchCatalog = jest.fn((_type, supplied) => { signal = supplied; return new Promise(() => {}); });
  await mount(<CardDatabaseModule />);
  expect(container.textContent).toContain('Loading cards');
  await mount(null);
  expect(signal?.aborted).toBe(true);
});

it('disposes open card detail and Guest collection listeners when the host removes a module', async () => {
 const remove = jest.spyOn(window, 'removeEventListener');
 await mount(<CardDatabaseModule />);
 const card = container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement;
 await act(async () => card.click()); await wait();
 expect(container.querySelector('[role="dialog"]')).not.toBeNull();
 await mount(null);
 expect(document.querySelector('[role="dialog"]')).toBeNull();
 expect(remove.mock.calls.some(([name]) => name === 'guest-collection-change')).toBe(true);
 remove.mockRestore();
});
it('keeps a failed deck request local and retries through the supplied client', async () => {
 host.api.fetchDeckFull = jest.fn().mockRejectedValueOnce(new Error('Fictional outage')).mockResolvedValue(JSON.parse(JSON.stringify(sampleDeck)));
 await mount(<DeckBuilderModule deckId="storybook-deck" readonly />); await wait();
 expect(container.textContent).toContain('Deck not found');
 const retry = [...container.querySelectorAll('button')].find(b => b.textContent === 'Retry deck')!;
 await act(async () => retry.click()); await wait();
 expect(container.textContent).toContain('Storybook Sample Deck');
 expect(host.api.fetchDeckFull).toHaveBeenCalledTimes(2);
});
it('mounts account Collection using the supplied collection operation without requiring Deck Builder', async () => {
 host.identity = { user: { id: 'fictional-user', username: 'Fictional Player', email: null, role: 'USER' }, isGuest: false, isAdmin: false };
 await mount(<CollectionModule />);
 expect(host.api.fetchCollectionCards).toHaveBeenCalledTimes(1);
 expect(host.api.fetchDeckFull).not.toHaveBeenCalled();
 expect(container.textContent).not.toContain('Stored on this device');
});


it.each(['database', 'collection', 'deck'] as const)('routes %s card actions and auth requests to the supplied host without writes or navigation', async source => {
 const request = jest.fn(); const action = jest.fn(); const render = jest.fn((context: ModuleCardActionContext) => <><button onClick={() => action(context)}>Fictional host action</button><button onClick={context.requestAuthentication}>Fictional host sign in</button><button onClick={context.close}>Fictional host close</button></>);
 host.cardActions = { render, requestAuthentication: request };
 await mount(source === 'database' ? <CardDatabaseModule /> : source === 'collection' ? <CollectionModule /> : <DeckBuilderModule deckId="storybook-deck" readonly />);
 if (source === 'collection') { const tab = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(t => t.textContent?.includes('Characters'))!; await act(async () => tab.click()); await wait(); }
 const card = container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement;
 expect(card).not.toBeNull();
 await act(async () => card.click()); await wait();
 const click = async (label: string) => { const b = [...container.querySelectorAll('button')].find(b => b.textContent === label)!; await act(async () => b.click()); };
 const context = render.mock.calls.at(-1)![0];
 expect(context).toMatchObject({ source, catalogType: 'characters', isGuest: true });
 expect(context.card.name).toBe('Billy the Kid');
 if (source === 'deck') expect(context.deck).toEqual({ id: 'storybook-deck', readOnly: true });
 else expect(context.deck).toBeUndefined();
 expect(context).not.toHaveProperty('api'); expect(context).not.toHaveProperty('user');
 await click('Fictional host action'); expect(action).toHaveBeenCalledTimes(1);
 await click('Fictional host sign in');
 expect(request).toHaveBeenCalledWith({ source, catalogType: 'characters', cardId: context.card.id, ...(source === 'deck' ? { deckId: 'storybook-deck' } : {}) });
 expect(host.onOpenDeck).not.toHaveBeenCalled(); expect(host.onHome).not.toHaveBeenCalled();
 expect(host.api.fetchCollectionCards).not.toHaveBeenCalled();
 expect(container.querySelector('.db__detail-actions')).toBeNull();
 expect(container.querySelector('.col__detail-qty')).toBeNull();
 await click('Fictional host close'); expect(container.querySelector('[role="dialog"]')).toBeNull();
});
it('deliberately suppresses defaults when the renderer returns null, then restores default actions without losing search', async () => {
 host.cardActions = { render: () => null };
 await mount(<CardDatabaseModule />);
 const search = container.querySelector('[aria-label="Search cards"]') as HTMLInputElement;
 await act(async () => (container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement).click()); await wait();
 expect(container.textContent).not.toContain('Log in to add to decks');
 expect(container.querySelector('.db__add-collection')).toBeNull();
 delete host.cardActions; await mount(<CardDatabaseModule />);
 expect(container.querySelector('[aria-label="Search cards"]')).toBe(search);
 expect((container.querySelector('.db__add-deck') as HTMLButtonElement).disabled).toBe(true);
 expect(container.querySelector('.db__add-collection')).not.toBeNull();
});
it('updates host renderers without remounting a detail and supplies no sign-in entry when none is configured', async () => {
 let oldContext: ModuleCardActionContext | undefined; let newContext: ModuleCardActionContext | undefined;
 host.cardActions = { render: context => { oldContext=context; return <button>First fictional action</button>; } };
 await mount(<CardDatabaseModule />);
 await act(async () => (container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement).click()); await wait();
 const dialog=container.querySelector('[role="dialog"]');
 expect(oldContext!.requestAuthentication).toBeUndefined();
 host.cardActions = { render: context => { newContext=context; return <button>Second fictional action</button>; } };
 await mount(<CardDatabaseModule />);
 expect(container.querySelector('[role="dialog"]')).toBe(dialog);
 expect(container.textContent).toContain('Second fictional action');
 expect(newContext!.card.id).toBe(oldContext!.card.id);
});

it('keeps Guest and account host action renderers and callbacks isolated across two instances', async () => {
 const first = jest.fn(); const second = jest.fn();
 const secondClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
 host.cardActions = { render: c => <button onClick={() => first(c)}>First host action</button> };
 const otherHost: ModuleHost = { ...host, identity: { user: { id: 'fictional-other-host', username: 'Fictional Host Player', email: null, role: 'USER' }, isGuest: false, isAdmin: false }, cardActions: { render: c => <button onClick={() => second(c)}>Second host action</button> } };
 try {
  await mount(<><section aria-label="First fixture"><CardDatabaseModule /></section><QueryClientProvider client={secondClient}><ModuleHostProvider host={otherHost}><section aria-label="Second fixture"><CardDatabaseModule /></section></ModuleHostProvider></QueryClientProvider></>);
  for (const name of ['First fixture','Second fixture']) { const surface=container.querySelector(`[aria-label="${name}"]`)!; await act(async () => (surface.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement).click()); await wait(); }
  for (const name of ['First host action','Second host action']) { const button=[...container.querySelectorAll('button')].find(b=>b.textContent===name)!;await act(async()=>button.click()); }
  expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
  expect(first.mock.calls[0][0].isGuest).toBe(true); expect(second.mock.calls[0][0].isGuest).toBe(false);
  expect(host.api.fetchCollectionCards).not.toHaveBeenCalled();
 } finally { await mount(null); secondClient.clear(); }
});
