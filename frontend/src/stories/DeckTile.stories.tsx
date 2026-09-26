import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeckTile } from '../components/DeckTile/DeckTile';
import { sampleDeck } from './fixtures';

const meta = {
  title: 'Decks/Deck Tile',
  component: DeckTile,
  args: { deck: sampleDeck, onOpen: () => {} },
  decorators: [(Story) => <div style={{ width: 310 }}><Story /></div>],
} satisfies Meta<typeof DeckTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const Compact: Story = { args: { variant: 'compact' } };
export const OwnerVisibility: Story = { args: { showVisibility: true, onMenu: () => {} } };
export const CommunityFavorite: Story = {
  args: { ownerName: 'Example player', isFavorited: true, onToggleFavorite: () => {} },
};
export const Limited: Story = {
  args: { deck: { ...sampleDeck, metadata: { ...sampleDeck.metadata, is_limited: true } } },
};
