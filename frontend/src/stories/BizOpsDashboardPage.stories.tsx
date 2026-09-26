import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import BizOpsDashboardPage from '../features/admin-biz-ops/BizOpsDashboardPage';
import { adminHandlers, exampleAdminUser } from './adminMocks';

const meta = {
  title: 'Screens/Admin Biz Ops',
  component: BizOpsDashboardPage,
  parameters: {
    layout: 'fullscreen',
    route: '/admin/biz-ops',
    authUser: exampleAdminUser,
    msw: adminHandlers,
  },
  render: () => <AppShell><BizOpsDashboardPage /></AppShell>,
} satisfies Meta<typeof BizOpsDashboardPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ExampleCosts: Story = {};
