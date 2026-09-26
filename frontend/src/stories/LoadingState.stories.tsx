import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from '../components/LoadingState/LoadingState';

const meta = {
  title: 'Feedback/Loading State',
  component: LoadingState,
  args: { label: 'Loading cards…' },
} satisfies Meta<typeof LoadingState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
export const Fullscreen: Story = { args: { fullscreen: true }, parameters: { layout: 'fullscreen' } };
