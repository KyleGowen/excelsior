import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from '../components/Logo/Logo';

const meta = {
  title: 'Brand/Logo',
  component: Logo,
  args: { variant: 'wordmark', height: 64 },
} satisfies Meta<typeof Logo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {};
export const Emblem: Story = { args: { variant: 'emblem' } };
