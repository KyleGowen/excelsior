import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardDetailPanel } from '../components/CardDetailPanel/CardDetailPanel';
import { billy, eventCard } from './fixtures';

const meta = {
  title: 'Cards/Card Detail Panel',
  component: CardDetailPanel,
  args: { card: billy, type: 'characters', open: true, onClose: () => {} },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CardDetailPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Character: Story = {};
export const Event: Story = { args: { card: eventCard, type: 'events' } };
export const WithActions: Story = {
  args: { actions: <button className="btn btn-primary" type="button">Add to Deck</button> },
};
