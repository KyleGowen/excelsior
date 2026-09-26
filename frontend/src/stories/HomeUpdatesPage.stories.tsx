import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import HomeUpdatesPage from '../features/home/HomeUpdatesPage';
import { exampleUpdates, pageHandlers } from './pageMocks';

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
