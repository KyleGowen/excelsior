/**
 * Only the guest account's preloaded samples are copied on open. Other users'
 * shared database decks stay read-only and never create a guest session deck.
 * See docs/current/GUEST_DECK_LESSONS_LEARNED.md.
 */
import type { ModuleApi } from '../../modules/api';
import {
  fetchDeckFull,
  createDeck,
  replaceDeckCards,
  isGuestDeckId,
  type DeckCardInput,
} from '../api/decks';


export { isGuestDeckId };

export function guestNeedsCloneOnOpen(
  deckId: string,
  isGuest: boolean,
  forceReadonly: boolean,
  ownerUserId: string | undefined,
  guestUserId: string | undefined,
): boolean {
  return (
    isGuest &&
    deckId.length > 0 &&
    !isGuestDeckId(deckId) &&
    !forceReadonly &&
    Boolean(guestUserId) &&
    ownerUserId === guestUserId
  );
}

/** Copy a guest-owned sample into a session deck; reject other owners before creating anything. */
export async function clonePreloadedGuestDeck(sourceDeckId: string, guestUserId: string, operations: Pick<ModuleApi, 'fetchDeckFull' | 'createDeck' | 'replaceDeckCards'> = { fetchDeckFull, createDeck, replaceDeckCards }): Promise<string> {
  const source = await operations.fetchDeckFull(sourceDeckId, false);
  if (!guestUserId || source.metadata.userId !== guestUserId) {
    throw new Error('Only guest sample decks can be copied');
  }
  const description = source.metadata.description;
  const created = await operations.createDeck(
    {
      name: source.metadata.name,
      ...(description !== undefined && description !== null ? { description } : {}),
    },
    true,
  );
  const cards: DeckCardInput[] = (source.cards ?? []).map((c) => ({
    cardType: c.type,
    cardId: c.cardId,
    quantity: c.quantity,
    exclude_from_draw: c.exclude_from_draw === true,
  }));
  if (cards.length > 0) {
    await operations.replaceDeckCards(created.id, cards, true);
  }
  return created.id;
}
