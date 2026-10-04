import { candidateInputKey, type CandidateEvaluationInput } from '../../../src/services/deck-candidates/inputKey';
import presentedCatalog from './catalogPresentation.json';
import { evaluationInputKey, type DeckEvaluationInput } from '../../../src/services/deck-evaluation/draftInput';
import type { DraftEvaluation, DraftEvaluationInput } from '../lib/api/decks';
import { http, HttpResponse } from 'msw';
import type { CatalogCard, CatalogType, CollectionCard, DeckCardEntry, DeckListItem, RecentUpdate } from '../lib/api/types';
import { aspectCard, billy, eventCard, sampleDeck, sherlock } from './fixtures';

/** All screen examples use invented data and never contact the Excelsior API. */
const catalog: Partial<Record<CatalogType, CatalogCard[]>> = {
  characters: [billy, sherlock],
  events: [eventCard],
  aspects: [aspectCard],
};

export const exampleUpdates: RecentUpdate[] = [
  {
    id: 'story-update-1',
    title: 'New cards in the catalog',
    type: 'catalog',
    description: 'Explore the latest example cards in Excelsior.',
    cardImageUrl: '/src/resources/cards/images/characters/billy_the_kid.webp',
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z',
  },
];

export const exampleCollection: CollectionCard[] = [
  {
    id: 'story-collection-billy',
    collection_id: 'storybook-collection',
    card_id: billy.id,
    card_type: 'character',
    quantity: 2,
    image_path: billy.image_path ?? '',
    card_name: billy.name,
    set: billy.set,
  },
];

const respond = (data: unknown) => HttpResponse.json({ data });

export function pageHandlers({
  decks = [sampleDeck],
  updates = exampleUpdates,
  collection = exampleCollection,
  responseEvaluation = true,
}: {
  decks?: DeckListItem[];
  updates?: RecentUpdate[];
  collection?: CollectionCard[];
  responseEvaluation?: boolean;
} = {}) {
  return [
    http.get('/api/v1/community/decks', () => respond(decks)),
    http.get('/api/v1/community/preconstructed-decks', () => respond([
      { setCode: 'ERB', setName: 'Example release', decks, featuredUpgradeRecommendations: [] },
    ])),
    http.get('/api/v1/decks/tournament', () => respond(decks)),
    http.get('/api/v1/decks/favorites', () => respond(decks)),
    http.get('/api/v1/decks', () => respond(decks)),
    http.get('/api/v1/decks/:deckId/full', ({ params }) =>
      respond(withEvaluation(decks.find((deck) => deck.metadata.id === params.deckId) ?? null, responseEvaluation))),
    http.post('/api/v1/decks/candidates/evaluate', async ({ request }) => {
      const input = await request.json() as CandidateEvaluationInput & { revision: number };
      return respond({ schemaVersion: 1, revision: input.revision, inputKey: candidateInputKey(input), versions: { catalog: 'fictional-story-catalog', rules: 'fictional-story-decisions' }, candidates: input.candidates.map(c => ({ ...c, usable: true, reasons: [], maxCopies: 99 })), missionLimitReached: false });
    }),
    http.post('/api/v1/decks/validate', () => respond({ valid: true })),
    http.post('/api/v1/decks/evaluate', async ({ request }) => respond(exampleEvaluation(await request.json() as DraftEvaluationInput))),
    http.put('/api/v1/decks/:deckId', async ({ params, request }) => {
      const deck = decks.find(d => d.metadata.id === params.deckId);
      if (!deck) return respond(null);
      const patch = await request.json() as Partial<typeof deck.metadata>;
      return respond(withEvaluation({ ...deck, metadata: { ...deck.metadata, ...patch } }));
    }),
    http.put('/api/v1/decks/:deckId/cards', async ({ params, request }) => {
      const deck = decks.find(d => d.metadata.id === params.deckId);
      if (!deck) return respond(null);
      const body = await request.json() as { cards: Array<{ cardType: string; cardId: string; quantity: number; exclude_from_draw?: boolean }> };
      return respond(withEvaluation({ ...deck, cards: body.cards.map(c => ({ type: c.cardType as DeckCardEntry['type'], cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true })) }));
    }),
    http.get('/api/v1/users/:userId/public-decks', () => respond(decks)),
    http.get('/api/v1/recent-updates', () => respond(updates)),
    http.get('/api/v1/collections/me/cards', () => respond(collection)),
    http.get('/api/v1/dbv/sets', () => respond([{ code: 'ERB', name: 'Example release' }])),
    http.get('/api/v1/catalog/foil-card-map', () => respond([])),
    http.get('/api/v1/catalog/presentation/:type', ({ params }) =>
      respond(presentedCatalog[params.type as keyof typeof presentedCatalog] ?? [])),
    http.get('/api/v1/catalog/:type', ({ params }) =>
      respond(catalog[params.type as CatalogType] ?? [])),
  ];
}

function exampleEvaluation(input: DraftEvaluationInput): DraftEvaluation {
  const max = { energy: 4, combat: 7, bruteForce: 3, intelligence: 8 };
  return { schemaVersion: 1, draftId: input.draftId, revision: input.revision, inputKey: evaluationInputKey(input),
        versions: { catalog: 'fictional-story-catalog', rules: 'venture-editor-compatibility-v1' },
        policy: { format: 'venture', limited: input.limited }, legality: { valid: true, rawValid: true, reasons: [] },
        threat: { editor: 19, legality: 19 }, grids: { printedMaximums: max, effectiveMaximums: max, activeMaximums: max, editorMaximums: max, characters: [] },
        icons: { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 }, counts: { physicalPlayable: 51, drawPile: 51, prePlaced: 0, exportCards: 51 }, capabilities: { drawHand: true } };
}

function withEvaluation(deck: DeckListItem | null, enabled = true) {
  if (!deck) return null;
  if (!enabled) return { ...deck, evaluation: null };
  const input: DeckEvaluationInput = { schemaVersion: 1, draftId: deck.metadata.id, cards: deck.cards.map(c => ({ type: c.type, cardId: c.cardId, quantity: c.quantity ?? 1, exclude_from_draw: c.exclude_from_draw === true })), reserveCharacterId: deck.metadata.reserve_character ?? null, limited: deck.metadata.is_limited ?? false, format: 'venture', koCharacterIds: [] };
  return { ...deck, evaluation: exampleEvaluation({ ...input, revision: 0 }) };
}
