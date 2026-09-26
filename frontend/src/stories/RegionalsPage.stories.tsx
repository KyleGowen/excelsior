import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import RegionalsPage from '../features/home/RegionalsPage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Tournament Data',
  component: RegionalsPage,
  parameters: { layout: 'fullscreen', route: '/home/regionals', msw: pageHandlers() },
  render: () => <AppShell><RegionalsPage /></AppShell>,
} satisfies Meta<typeof RegionalsPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const EventRecap: Story = {};
export const SeasonTotals: Story = {
  parameters: { route: '/home/regionals?view=season' },
};
