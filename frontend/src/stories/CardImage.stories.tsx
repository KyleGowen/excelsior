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


/** Same URL: the eager surface fills the session after the offscreen copy mounts. */
export const CachedElsewhereBeforeScroll: Story = {
  args: { progressive: true, progressiveSessionScope: 'deck-editor' },
  render: (args) => <div>
    <p>Another surface loads this image first.</p>
    <CardImage {...args} loading="eager" />
    <div style={{ height: '120vh' }} />
    <p>The already mounted grid copy upgrades when approached.</p>
    <CardImage {...args} loading="lazy" />
  </div>,
};
