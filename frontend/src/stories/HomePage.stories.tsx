import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import HomePage from '../features/home/HomePage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Home',
  component: HomePage,
  parameters: { layout: 'fullscreen', route: '/home' },
  render: () => <AppShell><HomePage /></AppShell>,
} satisfies Meta<typeof HomePage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  parameters: { msw: pageHandlers() },
};
export const Empty: Story = {
  parameters: { msw: pageHandlers({ decks: [], updates: [] }) },
};
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    msw: pageHandlers(),
  },
};
