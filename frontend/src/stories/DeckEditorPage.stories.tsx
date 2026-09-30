import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';
import { Route, Routes } from 'react-router-dom';
import DeckEditorPage from '../features/deck-editor/DeckEditorPage';
import { pageHandlers } from './pageMocks';

const meta = {
  title: 'Screens/Deck Editor',
  component: DeckEditorPage,
  parameters: {
    layout: 'fullscreen',
    route: '/users/storybook-user/decks/storybook-deck',
    msw: pageHandlers(),
  },
  render: () => <Routes><Route path="/users/:userId/decks/:deckId" element={<DeckEditorPage />} /></Routes>,
} satisfies Meta<typeof DeckEditorPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {};
export const ReadOnly: Story = {
  parameters: { route: '/users/storybook-user/decks/storybook-deck?readonly=true' },
};
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
};

export const ExportOpen: Story = {
  parameters: { route: '/users/storybook-user/decks/storybook-deck?readonly=true' },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Export' }));
    await canvas.findByRole('dialog', { name: 'Export deck JSON' });
    await canvas.findByText(/"name": "Storybook Sample Deck"/);
  },
};

export const MobileExportOpen: Story = {
  parameters: {
    route: '/users/storybook-user/decks/storybook-deck?readonly=true',
  },
  globals: { viewport: { value: 'mobile' } },
  play: ExportOpen.play,
};
