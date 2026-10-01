import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useLocation } from 'react-router-dom';
import { expect, userEvent } from 'storybook/test';
import { ProfileMenuContent, type ProfileMenuContentProps } from '../components/ProfileMenu/ProfileMenuContent';
import type { AppUser } from '../lib/api/types';

const guest: AppUser = { id: 'storybook-guest', username: 'guest', role: 'GUEST' };

const meta = {
  title: 'Navigation/Profile Menu',
  component: ProfileMenuContent,
  args: { onClose: () => {}, onOpenHelp: () => {} },
  parameters: {
    authUser: guest,
    msw: { handlers: [http.get('/api/v1/guest/decks', () => HttpResponse.json({ data: [] }))] },
  },
  decorators: [(Story) => <div style={{ width: 360, background: 'var(--color-bg-elevated)' }}><Story /></div>],
} satisfies Meta<typeof ProfileMenuContent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {};
export const GuestWithSessionDeck: Story = {
  parameters: {
    msw: {
      handlers: [http.get('/api/v1/guest/decks', () => HttpResponse.json({ data: [{ metadata: { id: 'guest_example-deck' }, cards: [] }] }))],
    },
  },
};
export const GuestLogIn: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Log In' }));
    await expect(canvas.getByRole('textbox', { name: 'Email or Username' })).toHaveFocus();
  },
};
export const GuestCreateAccount: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Create Account' }));
    await expect(canvas.getByRole('textbox', { name: 'Username' })).toHaveFocus();
  },
};
export const GuestMobile: Story = {
  args: { variant: 'sheet' },
  parameters: { viewport: { defaultViewport: 'mobile' } },
};

function AccountSwitchExample(args: ProfileMenuContentProps) {
  const location = useLocation();
  return (
    <>
      <output data-testid="current-path">{location.pathname}{location.search}{location.hash}</output>
      <ProfileMenuContent {...args} />
    </>
  );
}

export const AccountSwitchKeepsDecksView: Story = {
  render: (args) => <AccountSwitchExample {...args} />,
  parameters: {
    route: '/users/storybook-guest/decks?tab=community',
    interactiveAuth: true,
    msw: {
      handlers: [
        http.get('/api/v1/guest/decks', () => HttpResponse.json({ data: [] })),
        http.get('/api/v1/decks', () => HttpResponse.json({ data: [] })),
      ],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Log In' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email or Username' }), 'example');
    await userEvent.type(canvas.getByLabelText('Password'), 'fictional-password');
    await userEvent.click(canvas.getByRole('button', { name: 'Log In' }));
    await expect(canvas.getByTestId('current-path')).toHaveTextContent('/users/storybook-member/decks?tab=community');
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Log Out' }));
    await expect(canvas.getByTestId('current-path')).toHaveTextContent('/users/storybook-guest/decks?tab=community');
  },
};
