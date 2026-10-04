import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse, delay } from 'msw';
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

export const EvaluationPending: Story = {
  parameters: { msw: { handlers: [http.post('/api/v1/decks/evaluate', async () => { await delay('infinite'); return HttpResponse.json({}); }), ...pageHandlers({ responseEvaluation: false })] } },
};
export const EvaluationUnavailable: Story = {
  parameters: { msw: { handlers: [http.post('/api/v1/decks/evaluate', () => HttpResponse.json({ data: null, errors: [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Fictional offline evaluation' }] }, { status: 503 })), ...pageHandlers({ responseEvaluation: false })] } },
};

// A settled response stays on screen while the edited draft evaluates.
export const EvaluationRefreshing: Story = {
  parameters: { msw: { handlers: [http.post('/api/v1/decks/evaluate', async () => { await delay('infinite'); return HttpResponse.json({}); }), ...pageHandlers()] } },
  play: async ({ canvas }) => {
    await canvas.findByRole('region', { name: 'Icon totals' });
    await userEvent.click(await canvas.findByRole('button', { name: 'Remove Billy the Kid' }));
    await canvas.findByRole('button', { name: 'Legal' });
    await canvas.findByRole('region', { name: 'Icon totals' });
  },
};
export const MobileEvaluationRefreshing: Story = {
  ...EvaluationRefreshing,
  globals: { viewport: { value: 'mobile' } },
};
export const EvaluationRefreshUnavailable: Story = {
  parameters: { msw: { handlers: [http.post('/api/v1/decks/evaluate', () => HttpResponse.json({ data: null, errors: [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Fictional offline evaluation' }] }, { status: 503 })), ...pageHandlers()] } },
  play: async ({ canvas }) => {
    await canvas.findByRole('region', { name: 'Icon totals' });
    await userEvent.click(await canvas.findByRole('button', { name: 'Remove Billy the Kid' }));
    await canvas.findByRole('button', { name: 'Retry evaluation' }, { timeout: 5000 });
    await canvas.findByRole('region', { name: 'Icon totals' });
  },
};
