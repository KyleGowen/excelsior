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

/** A fictional missing URL exercises the image error fallback, beyond absent input. */
export const BrokenUrlFallback: Story = { args: { imagePath: 'fictional-m8-missing.webp', alt: 'Unavailable fictional art', useThumbnail: false } };
