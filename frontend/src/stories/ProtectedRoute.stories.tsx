import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProtectedRoute } from '../app/ProtectedRoute';

const meta = {
  title: 'Screens/Guest Session Recovery',
  component: ProtectedRoute,
  args: { children: <div>Excelsior Home</div> },
  parameters: { authUser: null },
  decorators: [(Story) => <div style={{ display: 'flex', minHeight: '70vh' }}><Story /></div>],
} satisfies Meta<typeof ProtectedRoute>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RetryGuestSession: Story = {};
