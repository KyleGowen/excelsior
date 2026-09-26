import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatIconBadge } from '../components/StatIconBadge/StatIconBadge';

const meta = {
  title: 'Cards/Stat Icon Badge',
  component: StatIconBadge,
  args: { type: 'energy', value: 8 },
} satisfies Meta<typeof StatIconBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Energy: Story = {};
export const Combat: Story = { args: { type: 'combat', value: 5 } };
export const BruteForce: Story = { args: { type: 'brute_force', value: 7 } };
export const Intelligence: Story = { args: { type: 'intelligence', value: 6 } };
export const Threat: Story = { args: { type: 'threat_level', value: 19 } };
