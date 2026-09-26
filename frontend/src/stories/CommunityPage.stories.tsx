import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import CommunityPage from '../features/community/CommunityPage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Community',
  component: CommunityPage,
  parameters: { layout: 'fullscreen', route: '/community#community', msw: pageHandlers() },
  render: () => <AppShell><CommunityPage /></AppShell>,
} satisfies Meta<typeof CommunityPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CommunityDecks: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
