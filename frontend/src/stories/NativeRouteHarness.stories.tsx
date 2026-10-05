import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NativeRouteHarness } from '../modules/NativeRouteHarness';
import { LocalModuleHarness } from '../modules/ModuleHarness';
import { pageHandlers } from './pageMocks';
const meta = { title: 'Modules/Native host routes', component: NativeRouteHarness, parameters: { layout: 'fullscreen', withoutRouter: true, withoutAuth: true, msw: pageHandlers() }, args: { user: null } } satisfies Meta<typeof NativeRouteHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NestedCards: Story = { decorators: [Story => <MemoryRouter initialEntries={['/tools/cards']}><Story /></MemoryRouter>] };
export const NestedCollection: Story = { decorators: [Story => <MemoryRouter initialEntries={['/tools/collection']}><Story /></MemoryRouter>] };
/** Named parent example also exercises the private ReadonlyRouteDeck component. */
export const NestedReadonlyDeck: Story = { decorators: [Story => <MemoryRouter initialEntries={['/tools/decks/00000000-0000-0000-0000-000000000004']}><Story /></MemoryRouter>] };
export const UnknownRoute: Story = { decorators: [Story => <MemoryRouter initialEntries={['/unknown']}><Story /></MemoryRouter>] };
export const LocalSessionHost: Story = { render: () => <MemoryRouter initialEntries={['/tools/cards']}><LocalModuleHarness loadSession={async () => null} renderHost={user => <NativeRouteHarness user={user} />} /></MemoryRouter> };
