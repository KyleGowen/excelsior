import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from '../components/EmptyState/EmptyState';

const meta = {
  title: 'Feedback/Empty State',
  component: EmptyState,
  args: { title: 'No cards found', message: 'Try another search or remove a filter.' },
  decorators: [(Story) => <div style={{ width: 440 }}><Story /></div>],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NoResults: Story = {};
export const Error: Story = {
  args: { title: 'Could not load cards', message: 'Please try again.', variant: 'error', action: <button type="button" className="btn btn-secondary">Retry</button> },
};
