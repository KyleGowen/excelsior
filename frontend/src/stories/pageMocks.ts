import { http, HttpResponse } from 'msw';
import type { CatalogCard, CatalogType, CollectionCard, DeckListItem, RecentUpdate } from '../lib/api/types';
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
}: {
  decks?: DeckListItem[];
  updates?: RecentUpdate[];
  collection?: CollectionCard[];
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
      respond(decks.find((deck) => deck.metadata.id === params.deckId) ?? null)),
    http.post('/api/v1/decks/validate', () => respond({ valid: true })),
    http.get('/api/v1/users/:userId/public-decks', () => respond(decks)),
    http.get('/api/v1/recent-updates', () => respond(updates)),
    http.get('/api/v1/collections/me/cards', () => respond(collection)),
    http.get('/api/v1/dbv/sets', () => respond([{ code: 'ERB', name: 'Example release' }])),
    http.get('/api/v1/catalog/foil-card-map', () => respond([])),
    http.get('/api/v1/catalog/:type', ({ params }) =>
      respond(catalog[params.type as CatalogType] ?? [])),
  ];
}
