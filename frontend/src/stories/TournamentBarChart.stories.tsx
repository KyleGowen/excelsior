import type { Meta, StoryObj } from '@storybook/react-vite';
import { TournamentBarChart } from '../components/TournamentCharts/TournamentBarChart';

const data = [
  { name: 'Billy the Kid', count: 18, catalogType: 'characters' as const },
  { name: 'Sherlock Holmes', count: 14, catalogType: 'characters' as const },
  { name: 'Joan of Arc', count: 11, catalogType: 'characters' as const },
  { name: 'Victory Harben', count: 8, catalogType: 'characters' as const },
];

const meta = {
  title: 'Dashboard/Tournament Bar Chart',
  component: TournamentBarChart,
  args: { data },
  decorators: [(Story) => <div style={{ width: 540, minHeight: 240 }}><Story /></div>],
} satisfies Meta<typeof TournamentBarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = { args: { tileVariant: 'md' } };
export const Compact: Story = { args: { compact: true } };
export const Empty: Story = { args: { data: [] } };
