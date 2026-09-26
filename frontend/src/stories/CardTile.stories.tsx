import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardTile } from '../components/CardTile/CardTile';
import { aspectCard, billy, eventCard } from './fixtures';

const meta = {
  title: 'Cards/Card Tile',
  component: CardTile,
  args: { card: billy, catalogType: 'characters', onClick: () => {} },
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 210 }}><Story /></div>],
} satisfies Meta<typeof CardTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Character: Story = {};
export const Event: Story = { args: { card: eventCard, catalogType: 'events' } };
export const Aspect: Story = { args: { card: aspectCard, catalogType: 'aspects' } };
export const Unowned: Story = { args: { dimmed: true } };
export const Owned: Story = { args: { overlay: <strong aria-label="2 owned">2</strong> } };
export const FoilIndicator: Story = { args: { hasFoilVersion: true } };
