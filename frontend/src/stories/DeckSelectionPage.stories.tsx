import { expect, userEvent, within } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import DeckSelectionPage from '../features/deck-selection/DeckSelectionPage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Decks',
  component: DeckSelectionPage,
  parameters: {
    layout: 'fullscreen',
    route: '/users/storybook-user/decks',
    msw: pageHandlers(),
  },
  render: () => <AppShell><Routes><Route path="/users/:userId/decks" element={<DeckSelectionPage />} /></Routes></AppShell>,
} satisfies Meta<typeof DeckSelectionPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MyDecks: Story = {};
export const Empty: Story = { parameters: { msw: pageHandlers({ decks: [] }) } };
export const PublicProfileWithoutTopDeck: Story = { parameters: { route: '/users/storybook-owner/decks', msw: pageHandlers({ decks: [] }) } };
export const PublicProfileWithTopDeck: Story = {
  parameters: { route: '/users/storybook-owner/decks', msw: pageHandlers({ decks: [], profile: {
    id: 'storybook-owner', displayName: 'Example owner', topdeckHandle: 'Example_Player', topdeckProfileUrl: 'https://topdeck.gg/profile/@Example_Player',
  } }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('link', { name: 'TopDeck: @Example_Player' })).toHaveAttribute('href', 'https://topdeck.gg/profile/@Example_Player');
    await expect(canvas.getByText('No public decks yet')).toBeVisible();
  },
};
export const PublicProfileTopDeckMobile: Story = { ...PublicProfileWithTopDeck, globals: { viewport: { value: 'mobile' } } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };

export const DeckActionsOpen: Story = {
  play: async ({ canvas }) => {
    const tile = await canvas.findByRole('link', { name: 'Storybook Sample Deck' });
    await userEvent.click(await canvas.findByRole('button', { name: 'Deck actions' }));
    const panel = within(await canvas.findByRole('dialog', { name: 'Deck actions' }));
    const newTab = panel.getByRole('link', { name: 'Open in new tab' });
    await expect(newTab).toHaveAttribute('target', '_blank');
    await expect(newTab).toHaveAttribute('href', await tile.getAttribute('href'));
    await expect(panel.getByRole('link', { name: 'View (read-only)' })).toHaveAttribute(
      'href', '/users/storybook-user/decks/storybook-deck?readonly=true',
    );
  },
};
export const MobileDeckActionsOpen: Story = { ...DeckActionsOpen, globals: { viewport: { value: 'mobile' } } };

export const TopDeckImportOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /^Import/ }));
    const panel = within(await canvas.findByRole('dialog', { name: 'Import deck from JSON or TopDeck' }));
    await expect(panel.getByRole('button', { name: 'TopDeck' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(panel.getByRole('textbox', { name: 'TopDeck decklist' }), '-- Other Cards --\n1x Cheshire Cat [ERB]');
  },
};
export const JsonImportOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: /^Import/ }));
    const panel = within(await canvas.findByRole('dialog', { name: 'Import deck from JSON or TopDeck' }));
    await userEvent.click(panel.getByRole('button', { name: 'JSON' }));
    await userEvent.click(panel.getByRole('textbox', { name: 'Deck JSON' }));
    await userEvent.paste('{"name":"JSON Import Example","cards":{"characters":["Zeus"]}}');
    await expect(panel.getByRole('button', { name: 'JSON' })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('textbox', { name: 'Deck name' })).toHaveValue('JSON Import Example');
  },
};
export const MobileTopDeckImportOpen: Story = { ...TopDeckImportOpen, globals: { viewport: { value: 'mobile' } } };
export const MobileJsonImportOpen: Story = { ...JsonImportOpen, globals: { viewport: { value: 'mobile' } } };
