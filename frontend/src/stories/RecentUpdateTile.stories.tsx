import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecentUpdateTile } from '../features/home/RecentUpdateTile';

const item = {
  id: 'storybook-recent-update',
  title: 'New card added',
  type: 'new_card',
  description: 'Billy the Kid is now available in the Excelsior card database.',
  cardImageUrl: 'characters/billy_the_kid.webp',
  createdAt: '2026-09-01T12:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z',
};

const meta = {
  title: 'Home/Recent Update Tile',
  component: RecentUpdateTile,
  args: { item, isOpen: false, onToggle: () => {} },
  decorators: [(Story) => <div style={{ width: 440 }}><Story /></div>],
} satisfies Meta<typeof RecentUpdateTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};
export const Expanded: Story = { args: { isOpen: true } };
