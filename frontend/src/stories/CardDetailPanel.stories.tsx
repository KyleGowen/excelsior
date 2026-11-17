import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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
export const WithArtist: Story = {
  args: { card: { ...billy, artist: 'Avery Rivera' } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Artist', { exact: true })).toBeVisible();
    await expect(await canvas.findByText('Avery Rivera', { exact: true })).toBeVisible();
  },
};
export const Event: Story = { args: { card: eventCard, type: 'events' } };
export const WithActions: Story = {
  args: { actions: <button className="btn btn-primary" type="button">Add to Deck</button> },
};
