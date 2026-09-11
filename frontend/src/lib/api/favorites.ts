/** Favorites + community + public-profile deck APIs (all `/api/v1`). */
import { api } from './client';
import type { DeckListItem, PreconstructedDeckGroup } from './types';

/** The current user's favorited decks (public, still-existing). */
export function fetchFavoriteDecks(): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>('/api/v1/decks/favorites');
}

export function addFavorite(deckId: string): Promise<{ deckId: string; isFavorited: boolean }> {
  return api.post<{ deckId: string; isFavorited: boolean }>(`/api/v1/decks/${deckId}/favorite`, {});
}

export function removeFavorite(deckId: string): Promise<{ deckId: string; isFavorited: boolean }> {
  return api.del<{ deckId: string; isFavorited: boolean }>(`/api/v1/decks/${deckId}/favorite`);
}

/** Community feed. With `search`, filters by deck, owner, character, or location name; otherwise 20 most recent. */
export function fetchCommunityFeed(search?: string): Promise<DeckListItem[]> {
  const q = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return api.get<DeckListItem[]>(`/api/v1/community/decks${q}`);
}

/** Official preconstructed decks grouped by release set, newest set first. */
export function fetchPreconstructedDecks(): Promise<PreconstructedDeckGroup[]> {
  return api.get<PreconstructedDeckGroup[]>('/api/v1/community/preconstructed-decks');
}

/** A user's public decks (read-only public profile). */
export function fetchPublicDecksForUser(userId: string): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>(`/api/v1/users/${userId}/public-decks`);
}
