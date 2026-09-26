import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardImage } from '../components/CardImage/CardImage';

const meta = {
  title: 'Cards/Card Image',
  component: CardImage,
  args: { imagePath: 'characters/billy_the_kid.webp', alt: 'Billy the Kid', loading: 'eager' },
  decorators: [(Story) => <div style={{ width: 230 }}><Story /></div>],
} satisfies Meta<typeof CardImage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Thumbnail: Story = {};
export const FullArt: Story = { args: { useThumbnail: false } };
export const Foil: Story = { args: { isFoil: true, foilSeed: 'storybook-billy' } };
export const Missing: Story = { args: { imagePath: null, alt: 'No card art' } };
