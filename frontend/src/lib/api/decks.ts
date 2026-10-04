import { evaluationInputKey } from '../../../../src/services/deck-evaluation/draftInput';
/**
 * Deck APIs. Logged-in users use `/api/v1/decks/*`; GUEST sessions use the
 * in-memory `/api/v1/guest/decks/*` endpoints. Guest session deck ids are
 * prefixed `guest_`, which lets us route reads correctly even for shared links.
 */
import { api, apiRequest, ApiError } from './client';
import type {
  DeckListItem,
  DeckDetail,
  DeckCardEntry,
  DeckValidationResult,
} from './types';

function isGuestDeckId(deckId: string): boolean {
  return deckId.startsWith('guest_');
}

export { isGuestDeckId };

export function fetchUserDecks(): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>('/api/v1/decks');
}

export function fetchGuestDecks(): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>('/api/v1/guest/decks');
}

export function fetchDecksForUser(isGuest: boolean): Promise<DeckListItem[]> {
  return isGuest ? fetchGuestDecks() : fetchUserDecks();
}

/** Tournament deck pool (backed by the tournament_decks account's saved decks). */
export function fetchTournamentDecks(): Promise<DeckListItem[]> {
  return api.get<DeckListItem[]>('/api/v1/decks/tournament');
}

export function fetchDeckFull(deckId: string, isGuest: boolean): Promise<DeckDetail> {
  if (isGuest && isGuestDeckId(deckId)) {
    return api.get<DeckDetail>(`/api/v1/guest/decks/${deckId}`);
  }
  return api.get<DeckDetail>(`/api/v1/decks/${deckId}/full`);
}

export interface CreateDeckInput {
  name: string;
  description?: string;
  /** Deck listing. true = unlisted, false = public; persistent deck links are always readable. */
  is_private?: boolean;
}

/** Minimal reference needed to navigate to a freshly-created deck. */
export interface CreatedDeckRef {
  id: string;
  userId: string;
}

/**
 * Create a deck. The owned (`/api/v1/decks`) endpoint returns a flat deck row
 * (`id`, `user_id`), while the guest endpoint returns the `{ metadata }`
 * envelope; normalise both to a single navigation reference.
 */
export async function createDeck(
  input: CreateDeckInput,
  isGuest: boolean,
): Promise<CreatedDeckRef> {
  const path = isGuest ? '/api/v1/guest/decks' : '/api/v1/decks';
  const raw = await api.post<Record<string, unknown>>(path, input);
  const meta = (raw?.metadata ?? {}) as Record<string, unknown>;
  const id = (raw?.id ?? meta.id ?? '') as string;
  const userId = (raw?.user_id ?? meta.userId ?? '') as string;
  return { id, userId };
}

export interface UpdateDeckMetaInput {
  name?: string;
  description?: string | null;
  is_limited?: boolean;
  is_private?: boolean;
  reserve_character?: string | null;
  display_mission_card_id?: string | null;
  background_image_path?: string | null;
}

export function updateDeckMeta(
  deckId: string,
  input: UpdateDeckMetaInput,
  isGuest: boolean,
): Promise<DeckDetail> {
  const path = isGuest && isGuestDeckId(deckId)
    ? `/api/v1/guest/decks/${deckId}`
    : `/api/v1/decks/${deckId}`;
  return api.put<DeckDetail>(path, input);
}

export interface DeckCardInput {
  cardType: string;
  cardId: string;
  quantity: number;
  displayOrder?: number;
  exclude_from_draw?: boolean;
}

/** Replace the full card list for a deck. */
export function replaceDeckCards(
  deckId: string,
  cards: DeckCardInput[],
  isGuest: boolean,
): Promise<DeckDetail> {
  const path = isGuest && isGuestDeckId(deckId)
    ? `/api/v1/guest/decks/${deckId}/cards`
    : `/api/v1/decks/${deckId}/cards`;
  return api.put<DeckDetail>(path, { cards });
}

export function deleteDeck(deckId: string, isGuest: boolean): Promise<unknown> {
  const path = isGuest && isGuestDeckId(deckId)
    ? `/api/v1/guest/decks/${deckId}`
    : `/api/v1/decks/${deckId}`;
  return api.del(path);
}

/** Add a single card to an existing (owned, DB-backed) deck. */
export function addCardToDeck(
  deckId: string,
  input: { cardType: string; cardId: string; quantity?: number },
): Promise<DeckDetail> {
  return api.post<DeckDetail>(`/api/v1/decks/${deckId}/cards`, {
    cardType: input.cardType,
    cardId: input.cardId,
    quantity: input.quantity ?? 1,
  });
}

export async function validateDeck(cards: DeckCardEntry[]): Promise<DeckValidationResult> {
  // The validate endpoint's rules read each card's `type` (not `cardType`, which
  // the deck *card* mutation endpoints use). Sending `cardType` here makes the
  // server-side rules see `type === undefined` and 500.
  const payload = cards.map((c) => ({
    type: c.type,
    cardId: c.cardId,
    quantity: c.quantity,
    exclude_from_draw: c.exclude_from_draw === true,
  }));
  try {
    return await api.post<DeckValidationResult>('/api/v1/decks/validate', { cards: payload });
  } catch (err) {
    // The endpoint returns HTTP 400 (code DECK_VALIDATION_FAILED) when the deck
    // breaks legality rules. That is a successful validation that found the deck
    // "not legal" — not a request failure. Surface it as { valid: false } so the
    // deck editor's live badge reflects legality instead of silently falling back
    // to a stale persisted value.
    if (err instanceof ApiError && err.code === 'DECK_VALIDATION_FAILED') {
      const payload = err.data as
        | { validationErrors?: Array<{ message: string } | string> }
        | null
        | undefined;
      const validationErrors = (payload?.validationErrors ?? []).map((entry) =>
        typeof entry === 'string' ? entry : entry.message,
      );
      return {
        valid: false,
        message: err.message,
        ...(validationErrors.length > 0 ? { validationErrors } : {}),
      };
    }
    throw err;
  }
}

// Public stateless evaluation: no deck ID lookup or persistence. The server resolves all card values.
export type { DeckDraftEvaluationDto as DraftEvaluation } from '../../../../src/api/dto/v1/DeckDraftEvaluationDto';
export interface DraftEvaluationInput {
  schemaVersion: 1; draftId: string; revision: number;
  cards: Array<{ type: string; cardId: string; quantity: number; exclude_from_draw?: boolean }>;
  reserveCharacterId: string | null; limited: boolean; format: 'venture'; koCharacterIds: string[];
}
export async function evaluateDraft(input: DraftEvaluationInput, signal?: AbortSignal): Promise<import('../../../../src/api/dto/v1/DeckDraftEvaluationDto').DeckDraftEvaluationDto> {
  const result = await apiRequest<import('../../../../src/api/dto/v1/DeckDraftEvaluationDto').DeckDraftEvaluationDto>('/api/v1/decks/evaluate', { method: 'POST', body: input, ...(signal ? { signal } : {}) });
  if (result.inputKey !== evaluationInputKey(input) || result.draftId !== input.draftId || result.revision !== input.revision) throw new Error('Evaluation revision does not match the current draft');
  return result;
}
