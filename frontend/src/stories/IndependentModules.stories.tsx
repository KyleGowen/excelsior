import { http, HttpResponse, delay } from 'msw';
import { useState } from 'react';
import { OverlayHostProvider } from '../lib/layout/OverlayHostProvider';
import { SlideOutPanel } from '../components/SlideOutPanel';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModuleHarness, LocalModuleHarness } from '../modules/ModuleHarness';
import { pageHandlers } from './pageMocks';
import { exampleUser } from './StorybookAuthProvider';
const meta = { title: 'Modules/Independent host', component: ModuleHarness, parameters: { layout: 'fullscreen', withoutRouter: true, withoutAuth: true, msw: pageHandlers() }, args: { user: exampleUser, initialDeckId: 'storybook-deck' } } satisfies Meta<typeof ModuleHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DatabaseAlone: Story = {};
export const DeckBuilderAlone: Story = { play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'Deck Builder module' })).click(); await canvas.findByRole('button', { name: 'Back to host' }); } };
export const CollectionAlone: Story = { play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'Collection module' })).click(); await canvas.findByRole('heading', { name: /My Collection/ }); } };
export const Together: Story = { play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'All three modules' })).click(); await canvas.findByRole('region', { name: 'Independent Deck Builder' }); } };
export const Guest: Story = { args: { user: null } };

export const HostLoading: Story = { render: () => <LocalModuleHarness loadSession={() => new Promise(() => {})} /> };
export const HostUnavailable: Story = { render: () => <LocalModuleHarness loadSession={async () => { throw new Error('Fictional local outage'); }} /> };
export const HostWithoutSession: Story = { render: () => <LocalModuleHarness loadSession={async () => null} /> };

export const DatabaseDetailActions: Story = { play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'View Billy the Kid' })).click(); await canvas.findByRole('dialog', { name: 'Billy the Kid details' }); } };
export const DatabaseUnavailable: Story = { parameters: { msw: [http.get('/api/v1/catalog/presentation/:type', () => HttpResponse.json({ errors: [{ message: 'Fictional catalog outage' }] }, { status: 503 })), ...pageHandlers()] } };
export const DatabaseLoading: Story = { parameters: { msw: [http.get('/api/v1/catalog/presentation/:type', async () => { await delay('infinite'); return HttpResponse.json({ data: [] }); }), ...pageHandlers()] } };
export const DatabaseEmpty: Story = { parameters: { msw: [http.get('/api/v1/catalog/presentation/:type', () => HttpResponse.json({ data: [] })), ...pageHandlers()] } };
export const DeckUnavailable: Story = { ...DeckBuilderAlone, parameters: { msw: [http.get('/api/v1/decks/:deckId/full', () => HttpResponse.json({ errors: [{ message: 'Fictional deck outage' }] }, { status: 503 })), ...pageHandlers()] }, play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'Deck Builder module' })).click(); await canvas.findByRole('button', { name: 'Retry deck' }); } };
export const CollectionUnavailable: Story = { ...CollectionAlone, parameters: { msw: [http.get('/api/v1/collections/me/cards', () => HttpResponse.json({ errors: [{ message: 'Fictional collection outage' }] }, { status: 503 })), ...pageHandlers()] } };

/** Named example for OverlayHostProvider through the declared module host. */
export const HostOwnedOverlay: Story = { args: { initialHostOverlay: true }, ...DatabaseDetailActions };

function HostOverlayExample({ modal = true, pair = false }: { modal?: boolean; pair?: boolean }) {
 const [firstRoot, setFirstRoot] = useState<HTMLDivElement | null>(null);
 const [secondRoot, setSecondRoot] = useState<HTMLDivElement | null>(null);
 const [firstOpen, setFirstOpen] = useState(false); const [secondOpen, setSecondOpen] = useState(false);
 return <div style={{ display: 'grid', gridTemplateColumns: pair ? '1fr 1fr' : '1fr', gap: 16 }}>
  <section style={{ position: 'relative', minHeight: 560 }}><button onClick={() => setFirstOpen(true)}>Open first host panel</button><div ref={setFirstRoot} />
   {firstRoot && <OverlayHostProvider options={{ root: firstRoot, modal }}><SlideOutPanel open={firstOpen} onClose={() => setFirstOpen(false)} ariaLabel="First host panel"><button>Fictional first action</button></SlideOutPanel></OverlayHostProvider>}
  </section>
  {pair && <section style={{ position: 'relative', minHeight: 560 }}><button onClick={() => setSecondOpen(true)}>Open second host panel</button><div ref={setSecondRoot} />
   {secondRoot && <OverlayHostProvider options={{ root: secondRoot }}><SlideOutPanel open={secondOpen} onClose={() => setSecondOpen(false)} ariaLabel="Second host panel"><button>Fictional second action</button></SlideOutPanel></OverlayHostProvider>}
  </section>}
 </div>;
}
export const NonmodalHostPanel: Story = { render: () => <HostOverlayExample modal={false} /> };
export const IndependentOverlayRoots: Story = { render: () => <HostOverlayExample pair /> };

/** Named example for the container provider through the real module host. */
export const NarrowContainerOnDesktop: Story = { args: { initialContainerLayout: true, initialContainerWidth: '390', initialHostOverlay: true } };
export const ResizableContainer: Story = { args: { initialContainerLayout: true, initialContainerWidth: '1120', initialHostOverlay: true } };

/** ModuleAppearanceBoundary is exercised through the production module host. */
export const PaperHostAppearance: Story = { args: { initialAppearance: 'paper', initialContainerLayout: true, initialContainerWidth: '720', initialHostOverlay: true }, ...DatabaseDetailActions };
export const ContrastHostAppearance: Story = { args: { initialAppearance: 'contrast', initialContainerLayout: true, initialContainerWidth: '390', initialHostOverlay: true } };
export const IndependentHostAppearances: Story = { render: () => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}><ModuleHarness user={null} initialAppearance="paper" initialContainerLayout initialHostOverlay /><ModuleHarness user={null} initialAppearance="contrast" initialContainerLayout initialHostOverlay /></div> };

/** Host-owned card actions and auth entry are fictional callbacks; no login or writes. */
export const HostCardActions: Story = { args: { user: null, initialHostActions: true, initialHostOverlay: true }, ...DatabaseDetailActions };
export const HostCollectionActions: Story = { args: { user: null, initialHostActions: true }, play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'Collection module' })).click(); (await canvas.findByRole('tab', { name: 'Characters' })).click(); (await canvas.findByRole('button', { name: 'View Billy the Kid' })).click(); await canvas.findByRole('button', { name: 'Host card action' }); } };
export const HostDeckActions: Story = { args: { user: null, initialHostActions: true }, play: async ({ canvas }) => { (await canvas.findByRole('button', { name: 'Deck Builder module' })).click(); (await canvas.findByRole('button', { name: 'View Billy the Kid' })).click(); await canvas.findByRole('button', { name: 'Host card action' }); } };
export const HostAccountActions: Story = { args: { user: exampleUser, initialHostActions: true }, ...DatabaseDetailActions };

/** Per-host decorative icon context and host-owned brand; no Excelsior rebranding. */
export const HostBrandIcons: Story = { args: { user: null, initialHostIcons: true, initialHostOverlay: true }, ...DatabaseDetailActions };
export const HostCollectionIcons: Story = { args: { user: null, initialHostIcons: true }, ...CollectionAlone };
export const HostDeckIcons: Story = { args: { user: null, initialHostIcons: true }, ...DeckBuilderAlone };
export const IndependentHostIcons: Story = { render: () => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}><ModuleHarness user={null} initialHostIcons initialContainerLayout /><ModuleHarness user={null} initialContainerLayout /></div> };
