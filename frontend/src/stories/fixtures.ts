import type { CatalogCard, DeckListItem } from '../lib/api/types';

/** Small, public, deterministic examples using card art copied from this repository. */
export const billy: CatalogCard = {
  id: 'story-billy-the-kid',
  name: 'Billy the Kid',
  set: 'ERB',
  image_path: 'characters/billy_the_kid.webp',
  energy: 4,
  combat: 7,
  brute_force: 3,
  intelligence: 4,
};

export const sherlock: CatalogCard = {
  id: 'story-sherlock-holmes',
  name: 'Sherlock Holmes',
  set: 'ERB',
  image_path: 'characters/sherlock_holmes.webp',
  energy: 3,
  combat: 3,
  brute_force: 2,
  intelligence: 8,
};

export const eventCard: CatalogCard = {
  id: 'story-heroes-we-need',
  name: 'Heroes We Need',
  set: 'ERB',
  image_path: 'events/heroes_we_need.webp',
};

export const aspectCard: CatalogCard = {
  id: 'story-mallku',
  card_name: 'Mallku',
  set: 'ERB',
  image_path: 'aspects/mallku.webp',
};

export const sampleDeck: DeckListItem = {
  metadata: {
    id: 'storybook-deck',
    name: 'Storybook Sample Deck',
    description: 'A local display example built from Excelsior card art.',
    cardCount: 51,
    threat: 19,
    is_valid: true,
    is_private: false,
    userId: 'storybook-user',
    isOwner: true,
    lastModified: '2026-09-01T12:00:00Z',
  },
  cards: [
    { type: 'character', cardId: billy.id, name: billy.name, defaultImage: billy.image_path, quantity: 1 },
    { type: 'character', cardId: sherlock.id, name: sherlock.name, defaultImage: sherlock.image_path, quantity: 1 },
    { type: 'character', cardId: 'story-joan', name: 'Joan of Arc', defaultImage: 'characters/joan_of_arc.webp', quantity: 1 },
    { type: 'character', cardId: 'story-victory', name: 'Victory Harben', defaultImage: 'characters/victory_harben.webp', quantity: 1 },
  ],
};
