import type { Meta, StoryObj } from '@storybook/react-vite';
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
  parameters: { viewport: { defaultViewport: 'mobile' } },
};
