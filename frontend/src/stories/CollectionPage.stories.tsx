import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import CollectionPage from '../features/collection/CollectionPage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Collection',
  component: CollectionPage,
  parameters: { layout: 'fullscreen', route: '/users/storybook-user/collection', msw: pageHandlers() },
  render: () => <AppShell><CollectionPage /></AppShell>,
} satisfies Meta<typeof CollectionPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OwnedCards: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
