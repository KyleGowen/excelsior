import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import UserAnalyticsPage from '../features/admin-user-analytics/UserAnalyticsPage';
import { adminHandlers, exampleAdminUser } from './adminMocks';

const meta = {
  title: 'Screens/Admin User Analytics',
  component: UserAnalyticsPage,
  parameters: {
    layout: 'fullscreen',
    route: '/admin/user-analytics',
    authUser: exampleAdminUser,
    msw: adminHandlers,
  },
  render: () => <AppShell><UserAnalyticsPage /></AppShell>,
} satisfies Meta<typeof UserAnalyticsPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ExampleMetrics: Story = {};
