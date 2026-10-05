/// <reference path="../../../frontend/src/vite-env.d.ts" />
import { act, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { NativeRouteHarness } from '../../../frontend/src/modules/NativeRouteHarness';
import { createUnsavedNavigation } from '../../../frontend/src/modules/unsavedNavigation';
import { nativeDeckPath } from '../../../frontend/src/modules/nativeHostRoutes';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModuleHostProvider, type ModuleHost, type ModuleCardActionContext, createModuleApi, CardDatabaseModule, CollectionModule, DeckBuilderModule } from '../../../frontend/src/modules';
import { LayoutModeProvider } from '../../../frontend/src/lib/layout/LayoutModeProvider';
import catalog from '../../../frontend/src/stories/catalogPresentation.json';
import { sampleDeck } from '../../../frontend/src/stories/fixtures';
import { evaluationInputKey } from '../../../src/services/deck-evaluation/draftInput';
import { IconDatabase, IconSearch, IconHeart } from '../../../frontend/src/components/icons';
import type { UIIconContext } from '../../../frontend/src/modules';
import type { ModuleApi } from '../../../frontend/src/modules/api';
import { renderModuleSaveFeedback, type ModuleSaveFeedbackContext } from '../../../frontend/src/modules/saveFeedback';

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
  window.scrollTo = jest.fn(); Element.prototype.scrollIntoView = jest.fn(); Element.prototype.scrollTo = jest.fn();
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


it.each(['database', 'collection', 'deck'] as const)('replaces decorative %s icons with explicit host branding while preserving controls and no writes', async source => {
 const render = jest.fn((context: UIIconContext) => <span data-fictional-icon={context.name}>◇</span>);
 host.icons = { render };
 host.chrome = { brand: <aside aria-label="Fictional host brand">Fictional brand</aside> };
 await mount(source === 'database' ? <CardDatabaseModule /> : source === 'collection' ? <CollectionModule /> : <DeckBuilderModule deckId="storybook-deck" readonly />);
 expect(container.querySelector('[aria-label="Fictional host brand"]')?.textContent).toBe('Fictional brand');
 expect(container.querySelector('[data-module-icon]')).not.toBeNull();
 expect([...container.querySelectorAll('[data-module-icon]')].every(el => el.getAttribute('aria-hidden') === 'true')).toBe(true);
 expect(render.mock.calls.every(([context]) => Object.keys(context).every(k => ['name', 'className', 'filled'].includes(k)))).toBe(true);
 if (source === 'database') expect(container.querySelector('[aria-label="Search cards"]')).not.toBeNull();
 if (source === 'collection') expect(container.textContent).toContain('Stored on this device');
 if (source === 'deck') { expect(container.querySelector('[aria-label="Back"]')).not.toBeNull(); expect([...container.querySelectorAll('button')].some(b => b.textContent?.includes('Export'))).toBe(true); }
 expect(unexpectedFetch).not.toHaveBeenCalled();
});

it('retains SVG fallback, caller classes/styles and heart state, and allows explicit decorative suppression', async () => {
 const render = jest.fn((context: UIIconContext) => context.name === 'database' ? null : context.name === 'heart' ? <span>Host heart</span> : undefined);
 host.icons = { render };
 await mount(<><IconDatabase /><IconSearch className="fixture-search" style={{ color: 'red' }} /><IconHeart filled className="fixture-heart" style={{ color: 'blue' }} /></>);
 expect(container.querySelector('ellipse')).toBeNull();
 expect(container.querySelector('svg.fixture-search')?.getAttribute('style')).toContain('red');
 expect(container.querySelector('.fixture-heart')?.getAttribute('style')).toContain('blue');
 expect(render.mock.calls.find(([context]) => context.name === 'heart')?.[0]).toEqual({ name: 'heart', filled: true, className: 'fixture-heart' });
 expect(container.querySelector('.fixture-heart')?.getAttribute('aria-hidden')).toBe('true');
 host.icons = { render: () => undefined };
 await mount(<IconDatabase />);
 expect(container.querySelector('svg ellipse')).not.toBeNull();
});

it('updates the host renderer without remounting module state and restores all defaults when omitted', async () => {
 host.icons = { render: context => <span data-first-icon={context.name}>First</span> };
 await mount(<CardDatabaseModule />);
 const input = container.querySelector('[aria-label="Search cards"]');
 host.icons = { render: context => <span data-second-icon={context.name}>Second</span> };
 await mount(<CardDatabaseModule />);
 expect(container.querySelector('[aria-label="Search cards"]')).toBe(input);
 expect(container.querySelector('[data-first-icon]')).toBeNull();
 expect(container.querySelector('[data-second-icon]')).not.toBeNull();
 delete host.icons;
 await mount(<CardDatabaseModule />);
 expect(container.querySelector('[aria-label="Search cards"]')).toBe(input);
 expect(container.querySelector('[data-module-icon]')).toBeNull();
 expect(container.querySelector('.db__title svg ellipse')).not.toBeNull();
});

it('isolates two icon/brand hosts and ordinary outer icons without global configuration', async () => {
 const left = { ...host, icons: { render: () => <span data-left-icon>Left</span> }, chrome: { brand: <aside>Left brand</aside> } };
 const right = { ...host, icons: { render: () => <span data-right-icon>Right</span> }, chrome: { brand: <aside>Right brand</aside> } };
 await mount(<><section data-host="left"><ModuleHostProvider host={left}><IconDatabase /></ModuleHostProvider></section><section data-host="right"><ModuleHostProvider host={right}><IconDatabase /></ModuleHostProvider></section><IconDatabase data-testid="outer-icon" /><ModuleHostProvider host={host}><IconSearch data-testid="default-nested-icon" /></ModuleHostProvider></>);
 expect(container.querySelector('[data-host="left"] [data-right-icon]')).toBeNull();
 expect(container.querySelector('[data-host="right"] [data-left-icon]')).toBeNull();
 expect(container.querySelector('svg[data-testid="outer-icon"] ellipse')).not.toBeNull();
 expect(container.querySelector('svg[data-testid="default-nested-icon"]')).not.toBeNull();
});

it('carries host icon context to an external detail portal and removes owned nodes on unmount', async () => {
 const portal = document.createElement('div'); document.body.appendChild(portal);
 try {
  host.icons = { render: context => <span data-portal-icon={context.name}>◇</span> };
  host.overlays = { root: portal, position: 'absolute' };
  await mount(<CardDatabaseModule />);
  const card = container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement;
  await act(async () => card.click()); await wait();
  expect(portal.querySelector('[role="dialog"]')).not.toBeNull();
  expect(portal.querySelector('[data-module-icon="close"] [data-portal-icon="close"]')).not.toBeNull();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  await mount(null);
  expect(portal.children).toHaveLength(0);
 } finally { portal.remove(); }
});


const changeDeckName = async (name: string) => {
 const input = container.querySelector('[aria-label="Deck name"]') as HTMLInputElement;
 expect(input).not.toBeNull();
 await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, name); input.dispatchEvent(new Event('input', { bubbles: true })); });
};
const clickSave = async () => {
 const button = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Save')!;
 expect(button).toBeDefined(); expect(button.disabled).toBe(false);
 await act(async () => button.click()); await wait();
};
const installSaveFixture = () => {
 const source = JSON.parse(JSON.stringify(sampleDeck));
 host.api.fetchDeckFull = jest.fn(async () => source);
 const mutation = () => { const value = JSON.parse(JSON.stringify(source)); delete value.metadata.isOwner; return value; };
 host.api.updateDeckMeta = jest.fn(async (_id, input) => ({ ...mutation(), metadata: { ...mutation().metadata, ...input } }));
 host.api.replaceDeckCards = jest.fn(async () => mutation());
 return mutation;
};
it('keeps default/undefined feedback and permits null without exposing additional fields', () => {
 const context = { status: 'saved' as const, message: 'Saved', newerEditsPending: false, privateIdentity: 'fictional' };
 const render = jest.fn(() => undefined);
 expect(renderModuleSaveFeedback(undefined, context, 'default')).toBe('default');
 expect(renderModuleSaveFeedback({ render }, context, 'default')).toBe('default');
 expect(render.mock.calls[0]).toEqual([{ status: 'saved', message: 'Saved', newerEditsPending: false }]);
 expect(renderModuleSaveFeedback({ render: () => null }, context, 'default')).toBeNull();
 expect(renderModuleSaveFeedback({ render }, null, 'default')).toBe('default');
});
it('preserves full-read ownership after Guest metadata mutations and supports repeated saves', async () => {
 installSaveFixture(); await mount(<DeckBuilderModule deckId="guest_fictional" />);
 await changeDeckName('Fictional saved name'); await clickSave();
 expect(container.querySelector('[aria-label="Deck name"]')).not.toBeNull();
 expect(container.textContent).toContain('Saved');
 expect(client.getQueryData<any>(['deck', 'guest_fictional']).metadata.isOwner).toBe(true);
 await changeDeckName('Fictional second save'); await clickSave();
 expect(host.api.updateDeckMeta).toHaveBeenCalledTimes(2);
 expect(host.api.replaceDeckCards).toHaveBeenCalledTimes(2);
 expect(container.querySelector('[aria-label="Deck name"]')).not.toBeNull();
});
it('honors an explicit ownership field rather than inferring it from a Guest identifier', async () => {
 const mutation = installSaveFixture();
 host.api.updateDeckMeta = jest.fn(async () => ({ ...mutation(), metadata: { ...mutation().metadata, isOwner: false } }));
 await mount(<DeckBuilderModule deckId="guest_fictional" />); await changeDeckName('Fictional ownership update'); await clickSave();
 expect(client.getQueryData<any>(['deck', 'guest_fictional']).metadata.isOwner).toBe(false);
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();
});
it('renders actual pending/saved state and retains edits newer than the save snapshot', async () => {
 const mutation = installSaveFixture(); let finish!: (value: any) => void;
 host.api.updateDeckMeta = jest.fn(() => new Promise(resolve => { finish = resolve; }));
 const states: ModuleSaveFeedbackContext[] = [];
 host.saveFeedback = { render: context => { states.push(context); return <span data-feedback={context.status}>{context.message}</span>; } };
 await mount(<DeckBuilderModule deckId="guest_fictional" />); await changeDeckName('Captured name'); await clickSave();
 expect(container.querySelector('[data-feedback="saving"]')).not.toBeNull();
 expect([...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Saving...')?.disabled).toBe(true);
 await changeDeckName('Newer name'); expect(states.at(-1)?.newerEditsPending).toBe(true);
 await act(async () => finish({ ...mutation(), metadata: { ...mutation().metadata, name: 'Captured name' } })); await wait();
 expect(container.querySelector('[data-feedback="saved"]')?.textContent).toBe('Saved; newer edits pending');
 expect((container.querySelector('[aria-label="Deck name"]') as HTMLInputElement).value).toBe('Newer name');
 expect([...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Save')?.disabled).toBe(false);
});
it('renders a rejection while preserving unsaved edits and the ordinary retry control', async () => {
 installSaveFixture(); host.api.updateDeckMeta = jest.fn(async () => { throw new Error('Fictional failure'); });
 host.saveFeedback = { render: context => <span role="alert" data-feedback={context.status}>{context.message}</span> };
 await mount(<DeckBuilderModule deckId="guest_fictional" />); await changeDeckName('Unsaved name'); await clickSave();
 expect(container.querySelector('[data-feedback="error"]')?.textContent).toBe('Fictional failure');
 expect((container.querySelector('[aria-label="Deck name"]') as HTMLInputElement).value).toBe('Unsaved name');
 expect([...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Save')?.disabled).toBe(false);
 expect(host.api.replaceDeckCards).not.toHaveBeenCalled();
});
it('changes feedback presentation without remounting the editor or repeating save operations', async () => {
 installSaveFixture(); host.saveFeedback = { render: c => <span data-feedback="first">{c.message}</span> };
 await mount(<DeckBuilderModule deckId="guest_fictional" />); await changeDeckName('Saved name'); await clickSave();
 const input = container.querySelector('[aria-label="Deck name"]');
 host = { ...host, saveFeedback: { render: c => <span data-feedback="second">{c.message}</span> } };
 await mount(<DeckBuilderModule deckId="guest_fictional" />);
 expect(container.querySelector('[aria-label="Deck name"]')).toBe(input);
 expect(container.querySelector('[data-feedback="second"]')).not.toBeNull();
 expect(host.api.updateDeckMeta).toHaveBeenCalledTimes(1); expect(host.api.replaceDeckCards).toHaveBeenCalledTimes(1);
});
it('never grants read-only modules Save through host feedback configuration', async () => {
 installSaveFixture(); const render = jest.fn(() => <button>Unauthorized save fixture</button>); host.saveFeedback = { render };
 await mount(<DeckBuilderModule deckId="guest_fictional" readonly />);
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull(); expect(render).not.toHaveBeenCalled();
 expect(host.api.updateDeckMeta).not.toHaveBeenCalled(); expect(host.api.replaceDeckCards).not.toHaveBeenCalled();
});
it('does not create a feedback-expiration timer after an in-flight module unmount', async () => {
 const mutation = installSaveFixture(); let finish!: (value: any) => void;
 host.api.updateDeckMeta = jest.fn(() => new Promise(resolve => { finish = resolve; }));
 await mount(<DeckBuilderModule deckId="guest_fictional" />); await changeDeckName('Captured name'); await clickSave();
 await mount(null); const timers = jest.spyOn(globalThis, 'setTimeout');
 await act(async () => finish(mutation())); await wait();
 expect(timers.mock.calls.some(call => call[1] === 2500)).toBe(false); timers.mockRestore();
});


it('never exposes preloaded source ownership while a Guest clone is pending', async () => {
 installSaveFixture(); host.identity = { user: { id: 'fictional-guest', username: 'Fictional Guest', email: null, role: 'GUEST' }, isGuest: true, isAdmin: false };
 host.api.createDeck = jest.fn(() => new Promise(() => {}));
 await mount(<DeckBuilderModule deckId="fictional-source" readonly />);
 let exposedOwnerInput = false;
 const observer = new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) {
  if (node instanceof Element && (node.matches('[aria-label="Deck name"]') || node.querySelector('[aria-label="Deck name"]'))) exposedOwnerInput = true;
 } });
 observer.observe(container, { childList: true, subtree: true });
 await mount(<DeckBuilderModule deckId="fictional-source" />); await wait(); observer.disconnect();
 expect(exposedOwnerInput).toBe(false);
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();
 expect(container.textContent).toContain('Preparing deck...');
 expect(host.api.updateDeckMeta).not.toHaveBeenCalled();
 expect(host.api.replaceDeckCards).not.toHaveBeenCalled();
});


it('keeps save-result presentation and mutations isolated between independent hosts', async () => {
 installSaveFixture(); const left = { ...host, saveFeedback: { render: (c: ModuleSaveFeedbackContext) => <span data-feedback="left">{c.message}</span> } };
 const right = { ...host, api: { ...host.api, updateDeckMeta: jest.fn(host.api.updateDeckMeta), replaceDeckCards: jest.fn(host.api.replaceDeckCards) }, saveFeedback: { render: (c: ModuleSaveFeedbackContext) => <span data-feedback="right">{c.message}</span> } };
 await mount(<><section data-host="left"><ModuleHostProvider host={left}><DeckBuilderModule deckId="guest_left" /></ModuleHostProvider></section><section data-host="right"><ModuleHostProvider host={right}><DeckBuilderModule deckId="guest_right" /></ModuleHostProvider></section></>);
 const untouched = (container.querySelector('[data-host="right"] [aria-label="Deck name"]') as HTMLInputElement).value;
 await changeDeckName('Independent left saved'); await clickSave();
 expect(container.querySelector('[data-feedback="left"]')?.textContent).toBe('Saved');
 expect(container.querySelector('[data-feedback="right"]')).toBeNull();
 expect((container.querySelector('[data-host="right"] [aria-label="Deck name"]') as HTMLInputElement).value).toBe(untouched);
 expect(right.api.updateDeckMeta).not.toHaveBeenCalled(); expect(right.api.replaceDeckCards).not.toHaveBeenCalled();
});


const mountNative = async (entry: string) => {
 await act(async () => root.render(<QueryClientProvider client={client}><LayoutModeProvider><RouterProvider router={createMemoryRouter([{path:'*',element:<NativeRouteHarness user={null} api={host.api} />}],{initialEntries:[entry]})} /></LayoutModeProvider></QueryClientProvider>)); await wait();
};
it('routes native host links under the host router and keeps unknown routes explicit', async () => {
 await mountNative('/unknown'); expect(container.textContent).toContain('Unknown fictional host route');
 const cards = [...container.querySelectorAll('a')].find(a => a.textContent === 'Host Cards')!;
 await act(async () => cards.click()); await wait();
 expect(container.querySelector('[aria-label="Host route"]')?.textContent).toBe('/tools/cards');
 expect(container.textContent).toContain('Card Database');
 const collection = [...container.querySelectorAll('a')].find(a => a.textContent === 'Host Collection')!;
 await act(async () => collection.click()); await wait();
 expect(container.querySelector('[aria-label="Host route"]')?.textContent).toBe('/tools/collection');
 expect(container.textContent).toContain('My Collection');
 expect(host.api.fetchDeckFull).not.toHaveBeenCalled();
});
it('opens a public native deck route readonly without creating Guest copies or writes', async () => {
 host.api.createDeck = jest.fn(); host.api.updateDeckMeta = jest.fn(); host.api.replaceDeckCards = jest.fn();
 const id = '00000000-0000-0000-0000-000000000004'; await mountNative('/tools/decks/' + id);
 expect(host.api.fetchDeckFull).toHaveBeenCalledWith(id, true, expect.any(AbortSignal));
 expect(container.textContent).toContain('Storybook Sample Deck');
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();
 expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Save')).toBe(false);
 expect(host.api.createDeck).not.toHaveBeenCalled(); expect(host.api.updateDeckMeta).not.toHaveBeenCalled(); expect(host.api.replaceDeckCards).not.toHaveBeenCalled();
});
it.each(['guest_secret', 'https://elsewhere.invalid/deck', '../escape', '%2fescape', 'bad-id'])('rejects credential-bearing or non-UUID fixture route %s before reading it', async id => {
 expect(nativeDeckPath(id)).toBeNull(); await mountNative('/tools/decks/' + id);
 expect(host.api.fetchDeckFull).not.toHaveBeenCalled();
 expect(container.textContent).toMatch(/Use a public fixture UUID|Unknown fictional host route/);
});
it('preserves the same nested browse path while detail history opens and closes', async () => {
 await mountNative('/tools/cards');
 const view = container.querySelector('[aria-label="View Billy the Kid"]') as HTMLButtonElement;
 await act(async () => view.click()); await wait();
 expect(container.querySelector('[role="dialog"]')).not.toBeNull();
 expect(container.querySelector('[aria-label="Host route"]')?.textContent).toBe('/tools/cards');
 const close = container.querySelector('[aria-label="Close panel"]') as HTMLButtonElement;
 await act(async () => close.click()); await wait();
 expect(container.querySelector('[role="dialog"]')).toBeNull();
 expect(container.querySelector('[aria-label="Host route"]')?.textContent).toBe('/tools/cards');
});

it('publishes editable dirty state to its host and disposes the signal on unmount', async () => {
 installSaveFixture(); const guard=createUnsavedNavigation();host.editing={register:guard.register};await mount(<DeckBuilderModule deckId="guest_fictional" />);expect(guard.getSnapshot().dirty).toBe(0);await changeDeckName('Fictional draft');expect(guard.getSnapshot().dirty).toBe(1);await mount(null);expect(guard.getSnapshot()).toMatchObject({dirty:0,saving:0});expect(host.api.updateDeckMeta).not.toHaveBeenCalled();
});
it('keeps newer edits dirty after a pending save completes and clears only a current successful save', async () => {
 const mutation=installSaveFixture();const guard=createUnsavedNavigation();host.editing={register:guard.register};let finish!:(value:any)=>void;host.api.updateDeckMeta=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));await mount(<DeckBuilderModule deckId="guest_fictional" />);await changeDeckName('Captured draft');await clickSave();expect(guard.getSnapshot()).toMatchObject({dirty:1,saving:1});await changeDeckName('Newer draft');await act(async()=>finish(mutation()));await wait();expect(guard.getSnapshot()).toMatchObject({dirty:1,saving:0});await clickSave();await act(async()=>finish(mutation()));await wait();expect(guard.getSnapshot()).toMatchObject({dirty:0,saving:0});
});
it('keeps failed saves dirty and removes editing signals when permission becomes readonly', async () => {
 installSaveFixture();const guard=createUnsavedNavigation();host.editing={register:guard.register};host.api.updateDeckMeta=jest.fn(async()=>{throw Error('Fictional failure');});await mount(<DeckBuilderModule deckId="guest_fictional" />);await changeDeckName('Retained draft');await clickSave();expect(guard.getSnapshot()).toMatchObject({dirty:1,saving:0});await mount(<DeckBuilderModule deckId="guest_fictional" readonly />);expect(guard.getSnapshot()).toMatchObject({dirty:0,saving:0});
});
it('never registers editing for readonly views or creates persistence through the edit-state port', async () => {
 installSaveFixture();const register=jest.fn(()=>jest.fn());host.editing={register};await mount(<DeckBuilderModule deckId="guest_fictional" readonly />);expect(register).not.toHaveBeenCalled();expect(host.api.updateDeckMeta).not.toHaveBeenCalled();expect(host.api.replaceDeckCards).not.toHaveBeenCalled();
});


it('applies host feature restrictions without granting readonly deck write actions', async () => {
 host.api.updateDeckMeta=jest.fn();
 host.features={drawHand:false,exportDeck:false,simulateKo:false,addCards:false};
 await mount(<DeckBuilderModule deckId="storybook-deck" readonly />);
 expect(container.querySelector('.deck-editor__draw-hand')?.hasAttribute('hidden')).toBe(true);
 expect(container.querySelector('[title="Export deck"]')?.hasAttribute('hidden')).toBe(true);
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();
 expect(host.api.updateDeckMeta).not.toHaveBeenCalled();
 host.features={drawHand:true,exportDeck:true,addCards:true};await mount(<DeckBuilderModule deckId="storybook-deck" readonly />);
 expect(container.querySelector('.deck-editor__draw-hand')?.hasAttribute('hidden')).toBe(false);
 expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();
});
it('blocks native route links and Back while dirty, keeps Stay, and discards only explicitly', async () => {
 installSaveFixture();const user={id:'fixture-user',username:'Fictional Owner',email:null,role:'USER' as const};
 const router=createMemoryRouter([{path:'*',element:<NativeRouteHarness user={user} api={host.api} initialReadonly={false} />}],{initialEntries:['/tools/cards','/tools/decks/00000000-0000-0000-0000-000000000004'],initialIndex:1});
 await act(async()=>root.render(<QueryClientProvider client={client}><RouterProvider router={router}/></QueryClientProvider>));await wait();
 await changeDeckName('Guarded fictional draft');
 await act(async()=>{void router.navigate(-1);});await wait();
 expect(container.querySelector('[aria-label="Unsaved deck changes"]')).not.toBeNull();
 const stay=[...container.querySelectorAll('button')].find(b=>b.textContent==='Stay')!;
 await act(async()=>stay.click());await wait();
 expect((container.querySelector('[aria-label="Deck name"]') as HTMLInputElement).value).toBe('Guarded fictional draft');
 const unload=new Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);expect(unload.defaultPrevented).toBe(true);
 const collection=[...container.querySelectorAll('a')].find(a=>a.textContent==='Host Collection')!;
 await act(async()=>collection.click());await wait();
 const discard=[...container.querySelectorAll('button')].find(b=>b.textContent==='Discard and continue')!;
 await act(async()=>discard.click());await wait();expect(container.textContent).toContain('My Collection');
 expect(host.api.updateDeckMeta).not.toHaveBeenCalled();
 const clean=new Event('beforeunload',{cancelable:true});window.dispatchEvent(clean);expect(clean.defaultPrevented).toBe(false);
 router.dispose();
});

it('disposes a discarded native editor before applying a guarded host configuration change', async () => {
 installSaveFixture();const user={id:'fixture-user',username:'Fictional Owner',email:null,role:'USER' as const};
 const router=createMemoryRouter([{path:'*',element:<NativeRouteHarness user={user} api={host.api} initialReadonly={false} />}],{initialEntries:['/tools/decks/00000000-0000-0000-0000-000000000004']});
 await act(async()=>root.render(<QueryClientProvider client={client}><RouterProvider router={router}/></QueryClientProvider>));await wait();await changeDeckName('Disposable draft');
 const readonly=[...container.querySelectorAll('input[type="checkbox"]')][0] as HTMLInputElement;
 await act(async()=>readonly.click());await wait();expect(container.querySelector('[aria-label="Unsaved deck changes"]')).not.toBeNull();
 const discard=[...container.querySelectorAll('button')].find(b=>b.textContent==='Discard and continue')!;
 await act(async()=>discard.click());await wait();expect(container.querySelector('[aria-label="Deck name"]')).toBeNull();expect(container.querySelector('[aria-label="Unsaved deck changes"]')).toBeNull();
 const unload=new Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);expect(unload.defaultPrevented).toBe(false);expect(host.api.updateDeckMeta).not.toHaveBeenCalled();router.dispose();
});
