import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBackground } from '../components/AppBackground/AppBackground';

const meta = {
  title: 'Brand/App Background',
  component: AppBackground,
  args: { variant: 'subtle' },
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ position: 'relative', height: '70vh' }}><Story /></div>],
} satisfies Meta<typeof AppBackground>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Subtle: Story = {};
export const Hero: Story = { args: { variant: 'hero' } };
