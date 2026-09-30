import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { RouteErrorScreen } from '../app/RouteErrorScreen';

const missingPageRouter = createMemoryRouter([{
  path: '/',
  element: <RouteErrorScreen error={new TypeError('Failed to fetch dynamically imported module: /assets/DatabasePage-old.js')} />,
}]);

const unexpectedErrorRouter = createMemoryRouter([{
  path: '/',
  element: <RouteErrorScreen error={new Error('Unexpected render error')} />,
}]);

const meta = {
  title: 'Screens/Load Error',
  component: RouteErrorScreen,
  parameters: { layout: 'fullscreen', withoutRouter: true },
  render: () => <RouterProvider router={missingPageRouter} />,
} satisfies Meta<typeof RouteErrorScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MissingPageBundle: Story = {};
export const MissingPageBundleMobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
};

export const UnexpectedError: Story = {
  render: () => <RouterProvider router={unexpectedErrorRouter} />,
};
