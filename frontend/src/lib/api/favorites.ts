/** Favorites + community + public-profile deck APIs (all `/api/v1`). */
import { api as defaultApi } from './client';

import type { DeckListItem, PreconstructedDeckGroup } from './types';

/** Bind these existing operations to one host's transport; no global client mutation. */
export function createFavoritesApi(api: typeof defaultApi = defaultApi) {


/** The current user's favorited decks (public, still-existing). */
function fetchFavoriteDecks(signal?: AbortSignal): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>('/api/v1/decks/favorites', signal);
}


function addFavorite(deckId: string): Promise<{ deckId: string; isFavorited: boolean }> {
  return api.post<{ deckId: string; isFavorited: boolean }>(`/api/v1/decks/${deckId}/favorite`, {});
}


function removeFavorite(deckId: string): Promise<{ deckId: string; isFavorited: boolean }> {
  return api.del<{ deckId: string; isFavorited: boolean }>(`/api/v1/decks/${deckId}/favorite`);
}


/** Community feed. With `search`, filters by deck, owner, character, or location name; otherwise 20 most recent. */
function fetchCommunityFeed(search?: string): Promise<DeckListItem[]> {
  const q = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return api.get<DeckListItem[]>(`/api/v1/community/decks${q}`);
}


/** Official preconstructed decks grouped by release set, newest set first. */
function fetchPreconstructedDecks(): Promise<PreconstructedDeckGroup[]> {
  return api.get<PreconstructedDeckGroup[]>('/api/v1/community/preconstructed-decks');
}


/** A user's public decks (read-only public profile). */
function fetchPublicDecksForUser(userId: string): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>(`/api/v1/users/${userId}/public-decks`);
}
return { fetchFavoriteDecks, addFavorite, removeFavorite, fetchCommunityFeed, fetchPreconstructedDecks, fetchPublicDecksForUser };
}

export const { fetchFavoriteDecks, addFavorite, removeFavorite, fetchCommunityFeed, fetchPreconstructedDecks, fetchPublicDecksForUser } = createFavoritesApi();
