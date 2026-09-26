import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardTile } from '../components/dashboard/DashboardTile';
import { TournamentBarChart } from '../components/TournamentCharts/TournamentBarChart';

const data = [
  { name: 'Billy the Kid', count: 18, catalogType: 'characters' as const },
  { name: 'Sherlock Holmes', count: 14, catalogType: 'characters' as const },
  { name: 'Joan of Arc', count: 11, catalogType: 'characters' as const },
];

const meta = {
  title: 'Dashboard/Dashboard Tile',
  component: DashboardTile,
  args: {
    title: 'Popular characters',
    subtitle: 'Tournament deck appearances',
    children: <TournamentBarChart data={data} />,
  },
  decorators: [(Story) => <div style={{ width: 330, height: 410 }}><Story /></div>],
} satisfies Meta<typeof DashboardTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Chart: Story = {};
export const Text: Story = {
  args: { layout: 'text', children: <p>Excelsior shows current tournament statistics in reusable dashboard tiles.</p> },
};
