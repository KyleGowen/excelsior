import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse, delay } from 'msw';
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
const topdeckMember: AppUser = { id: 'storybook-member', username: 'Example player', email: 'player@example.invalid', role: 'USER' };
const memberHandlers = [http.get('/api/v1/decks', () => HttpResponse.json({ data: [] }))];
export const TopDeckUnset: Story = { parameters: { authUser: topdeckMember, msw: { handlers: memberHandlers } } };
export const TopDeckSaved: Story = { parameters: { authUser: { ...topdeckMember, topdeckHandle: 'Example_Player' }, msw: { handlers: memberHandlers } } };
export const TopDeckEdit: Story = {
  ...TopDeckSaved,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Edit TopDeck Account' }));
    await expect(canvas.getByRole('textbox', { name: 'TopDeck handle' })).toHaveValue('Example_Player');
  },
};
export const TopDeckGoogleAccount: Story = { parameters: { authUser: { ...topdeckMember, authProvider: 'google', topdeckHandle: 'Example_Player' }, msw: { handlers: memberHandlers } } };
export const TopDeckSaveError: Story = {
  parameters: { authUser: topdeckMember, msw: { handlers: [
    ...memberHandlers,
    http.post('/api/v1/users/topdeck', () => HttpResponse.json({ data: null, errors: [{ code: 'SET_TOPDECK_ERROR', message: 'Could not save TopDeck handle. Try again.' }] }, { status: 500 })),
  ] } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Add TopDeck Account' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'TopDeck handle' }), '@Example_Player');
    await userEvent.click(canvas.getByRole('button', { name: /^Save$/ }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Could not save TopDeck handle. Try again.');
  },
};
export const TopDeckMobile: Story = { ...TopDeckEdit, args: { variant: 'sheet' }, globals: { viewport: { value: 'mobile' } } };
export const TopDeckSaving: Story = {
  parameters: { authUser: topdeckMember, msw: { handlers: [
    ...memberHandlers,
    http.post('/api/v1/users/topdeck', async () => { await delay('infinite'); return HttpResponse.json({ data: null }); }),
  ] } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Add TopDeck Account' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'TopDeck handle' }), 'Example_Player');
    await userEvent.click(canvas.getByRole('button', { name: /^Save$/ }));
    await expect(canvas.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  },
};
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
