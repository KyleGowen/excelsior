import type { Meta, StoryObj } from '@storybook/react-vite';
import { TournamentPieChart } from '../components/TournamentCharts/TournamentPieChart';

const data = [
  { name: 'Characters', count: 47, catalogType: 'characters' as const },
  { name: 'Events', count: 22, catalogType: 'events' as const },
  { name: 'Aspects', count: 15, catalogType: 'aspects' as const },
];

const meta = {
  title: 'Dashboard/Tournament Pie Chart',
  component: TournamentPieChart,
  args: { data },
  decorators: [(Story) => <div style={{ width: 450, height: 370 }}><Story /></div>],
} satisfies Meta<typeof TournamentPieChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Labels: Story = {};
export const WithLegend: Story = { args: { showLegend: true } };
export const Compact: Story = { args: { compact: true } };
