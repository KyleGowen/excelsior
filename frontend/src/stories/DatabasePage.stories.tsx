import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/AppShell';
import DatabasePage from '../features/database/DatabasePage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Card Database',
  component: DatabasePage,
  parameters: { layout: 'fullscreen', route: '/data', msw: pageHandlers() },
  render: () => <AppShell><DatabasePage /></AppShell>,
} satisfies Meta<typeof DatabasePage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
