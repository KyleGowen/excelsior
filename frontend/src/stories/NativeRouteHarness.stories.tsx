import { harnessAccess } from '../modules/harnessAccess';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NativeRouteHarness } from '../modules/NativeRouteHarness';
import { LocalModuleHarness } from '../modules/ModuleHarness';
import { pageHandlers } from './pageMocks';
const meta = { title: 'Modules/Native host routes', component: NativeRouteHarness, parameters: { layout: 'fullscreen', withoutRouter: true, withoutAuth: true, msw: pageHandlers() }, args: { user: null } } satisfies Meta<typeof NativeRouteHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NestedCards: Story = { decorators: [Story => <RouterProvider router={createMemoryRouter([{path:'*',element:<Story />}],{initialEntries:['/tools/cards']})} />] };
export const NestedCollection: Story = { decorators: [Story => <RouterProvider router={createMemoryRouter([{path:'*',element:<Story />}],{initialEntries:['/tools/collection']})} />] };
/** Named parent example also exercises the private ReadonlyRouteDeck component. */
export const NestedReadonlyDeck: Story = { decorators: [Story => <RouterProvider router={createMemoryRouter([{path:'*',element:<Story />}],{initialEntries:['/tools/decks/00000000-0000-0000-0000-000000000004']})} />] };
export const UnknownRoute: Story = { decorators: [Story => <RouterProvider router={createMemoryRouter([{path:'*',element:<Story />}],{initialEntries:['/unknown']})} />] };
export const LocalSessionHost: Story = { render: () => <RouterProvider router={createMemoryRouter([{path:'*',element:<LocalModuleHarness loadSession={async()=>null} renderHost={user=><NativeRouteHarness user={user}/>} />}],{initialEntries:['/tools/cards']})} /> };

/** Named parent exercises ModuleStyleBoundary and its internal overlay surface. */
export const IsolatedNativeSurface: Story = { ...NestedCards, args:{ isolated:true } };
export const IsolatedReadonlyDeck: Story = { ...NestedReadonlyDeck, args:{ isolated:true } };
export const IsolatedCollection: Story = { ...NestedCollection, args:{ isolated:true } };

/** Optional local request evidence controls use fictional MSW responses. */
export const LocalRequestObservations: Story = { ...NestedCards, render:()=> {const access=harnessAccess('?adapter=direct');return <NativeRouteHarness user={null} api={access.api} requestEvidence={access.evidence} />;} };
