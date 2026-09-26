import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';
import LoginPage from '../features/login/LoginPage';

const meta = {
  title: 'Screens/Login',
  component: LoginPage,
  parameters: { layout: 'fullscreen', authUser: null },
} satisfies Meta<typeof LoginPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
export const CreateAccount: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Create Account' }));
  },
};
export const SignInError: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email or Username' }), 'example');
    await userEvent.type(canvas.getByLabelText('Password'), 'example-password');
    await userEvent.click(canvas.getByRole('button', { name: 'Log In' }));
  },
};
