import type { Meta, StoryObj } from '@storybook/react-vite';
import { CharacterRibbon } from '../components/CharacterRibbon/CharacterRibbon';

const characters = [
  { cardId: 'billy', name: 'Billy the Kid', imagePath: 'characters/billy_the_kid.webp' },
  { cardId: 'sherlock', name: 'Sherlock Holmes', imagePath: 'characters/sherlock_holmes.webp' },
  { cardId: 'joan', name: 'Joan of Arc', imagePath: 'characters/joan_of_arc.webp' },
  { cardId: 'victory', name: 'Victory Harben', imagePath: 'characters/victory_harben.webp' },
];

const meta = {
  title: 'Cards/Character Ribbon',
  component: CharacterRibbon,
  args: { characters },
  decorators: [(Story) => <div style={{ width: 460 }}><Story /></div>],
} satisfies Meta<typeof CharacterRibbon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Strip: Story = {};
export const Fan: Story = { args: { variant: 'fan' } };
export const WithReserve: Story = { args: { hasReserve: true } };
