import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import HomeUpdatesPage from '../features/home/HomeUpdatesPage';
import { exampleUpdates, pageHandlers, topDeckProfileFeature } from './pageMocks';
import type { RecentUpdate } from '../lib/api/types';

const meta = {
  title: 'Screens/Recent Updates',
  component: HomeUpdatesPage,
  parameters: { layout: 'fullscreen', route: '/home/updates' },
  render: () => <AppShell><HomeUpdatesPage /></AppShell>,
} satisfies Meta<typeof HomeUpdatesPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  parameters: { msw: pageHandlers({ updates: exampleUpdates }) },
};
export const Empty: Story = {
  parameters: { msw: pageHandlers({ updates: [] }) },
};

export const TopDeckProfileAnnouncement: Story = {
  parameters: { msw: pageHandlers({ updates: [topDeckProfileFeature, ...exampleUpdates] }) },
};

const prizePackUpdate: RecentUpdate = {
  id: 'storybook-skybound-prize-pack-update',
  title: 'Skybound Prize Pack cards',
  type: 'new_cards',
  description: '267 foil cards were added to the Skybound set, including 15 alternate-art character cards. Browse them in Database and Collection, or choose them under Printings in Add Cards.',
  cardImageUrl: '/src/resources/images/home/skybound-prize-pack-dupli-kate-art.png',
  createdAt: '2026-11-14T12:00:00Z',
  updatedAt: '2026-11-14T12:00:00Z',
};

export const SkyboundPrizePackAnnouncement: Story = {
  parameters: { msw: pageHandlers({ updates: [prizePackUpdate, ...exampleUpdates] }) },
};
