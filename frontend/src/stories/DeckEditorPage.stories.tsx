import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse, delay } from 'msw';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Route, Routes } from 'react-router-dom';
import DeckEditorPage from '../features/deck-editor/DeckEditorPage';
import { pageHandlers } from './pageMocks';
import { sampleDeck } from './fixtures';
import { candidateInputKey, type CandidateEvaluationInput } from '../contracts/inputKey';

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
const unexpectedGuestCopy = fn();
export const GuestSharedLinkReadOnly: Story = {
  parameters: {
    route: '/users/storybook-other-owner/decks/storybook-deck',
    authUser: { id: 'storybook-guest', username: 'guest', role: 'GUEST' },
    msw: [
      http.post('/api/v1/guest/decks', () => {
        unexpectedGuestCopy();
        return HttpResponse.json({ data: { id: 'guest_unexpected-copy' } });
      }),
      ...pageHandlers({ decks: [{
        ...sampleDeck,
        metadata: { ...sampleDeck.metadata, userId: 'storybook-other-owner', isOwner: false },
      }] }),
    ],
  },
  beforeEach: () => { unexpectedGuestCopy.mockClear(); },
  play: async ({ canvas }) => {
    await canvas.findByText('Read-only', { exact: true });
    await expect(canvas.queryByRole('textbox', { name: 'Deck name' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Add Cards' })).not.toBeInTheDocument();
    await expect(unexpectedGuestCopy).not.toHaveBeenCalled();
  },
};
export const GuestSharedLinkReadOnlyMobile: Story = {
  ...GuestSharedLinkReadOnly,
  globals: { viewport: { value: 'mobile' } },
};
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
};

export const ExportOpen: Story = {
  parameters: { route: '/users/storybook-user/decks/storybook-deck?readonly=true' },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Export' }));
    await canvas.findByRole('dialog', { name: 'Export deck TopDeck' });
    await userEvent.click(await canvas.findByRole('button', { name: 'JSON' }));
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


export const AddCardsEligibilityUnavailable: Story = {
  parameters: { msw: { handlers: [http.post('/api/v1/decks/candidates/evaluate', () => HttpResponse.json({ data: null, errors: [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Fictional unavailable catalog' }] }, { status: 503 })), ...pageHandlers()] } },
  play: async ({ canvas }) => { await userEvent.click(await canvas.findByRole('button', { name: 'Add Cards' })); await canvas.findByRole('dialog', { name: 'Add cards' }); },
};

function candidateRefreshHandler(unavailable = false) {
  const originalCount = sampleDeck.cards.reduce((count, card) => count + card.quantity, 0);
  return http.post('/api/v1/decks/candidates/evaluate', async ({ request }) => {
    const input = await request.json() as CandidateEvaluationInput & { revision: number };
    if (input.cards.reduce((count, card) => count + card.quantity, 0) > originalCount) {
      if (unavailable) return HttpResponse.json({ data: null, errors: [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Fictional unavailable refresh' }] }, { status: 503 });
      await delay('infinite');
    }
    return HttpResponse.json({ data: { schemaVersion: 1, revision: input.revision, inputKey: candidateInputKey(input), versions: { catalog: 'fictional', rules: 'fictional' }, candidates: input.candidates.map(card => ({ ...card, usable: true, reasons: [], maxCopies: 99 })), missionLimitReached: false } });
  });
}

export const AddCardsEligibilityRefreshing: Story = {
  parameters: { msw: { handlers: [candidateRefreshHandler(), ...pageHandlers()] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Add Cards' }));
    await userEvent.click(await canvas.findByRole('tab', { name: 'Characters' }));
    const tile = await canvas.findByRole('button', { name: 'View Billy the Kid' });
    await waitFor(() => expect(tile.querySelector('button[aria-label="Increase"]')).toBeEnabled());
    await userEvent.click(tile);
    await waitFor(() => expect(tile).toBeInTheDocument());
    await waitFor(() => expect(tile.querySelector('button[aria-label="Increase"]')).toBeDisabled());
  },
};
export const MobileAddCardsEligibilityRefreshing: Story = {
  ...AddCardsEligibilityRefreshing,
  globals: { viewport: { value: 'mobile' } },
};
export const AddCardsEligibilityRefreshUnavailable: Story = {
  parameters: { msw: { handlers: [candidateRefreshHandler(true), ...pageHandlers()] } },
  play: async context => {
    await AddCardsEligibilityRefreshing.play!(context);
    await context.canvas.findByRole('button', { name: 'Retry card eligibility' }, { timeout: 5000 });
  },
};

export const TopDeckExportOpen: Story = {
 parameters: { route: "/users/storybook-user/decks/storybook-deck?readonly=true" },
 play: async ({canvas}) => { await userEvent.click(await canvas.findByRole("button", {name:"Export"})); await canvas.findByRole("dialog",{name:"Export deck TopDeck"}); await canvas.findByText(/Cards: 8\/56/); },
};
export const MobileTopDeckExportOpen: Story = {...TopDeckExportOpen, globals:{viewport:{value:"mobile"}}};
