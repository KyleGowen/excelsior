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
