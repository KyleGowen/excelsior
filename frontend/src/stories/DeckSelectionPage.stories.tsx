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
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };

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
