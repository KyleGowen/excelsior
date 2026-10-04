import { http, HttpResponse, delay } from 'msw';
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
