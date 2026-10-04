/**
 * GUEST clone-on-open: when a guest opens a preloaded DB deck, clone it to a
 * session `guest_*` deck so edits never persist to the database.
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
): boolean {
  return (
    isGuest &&
    deckId.length > 0 &&
    !isGuestDeckId(deckId) &&
    !forceReadonly
  );
}

/** Clone a DB deck into a new guest session deck; returns the new `guest_*` id. */
export async function clonePreloadedGuestDeck(sourceDeckId: string, operations: Pick<ModuleApi, 'fetchDeckFull' | 'createDeck' | 'replaceDeckCards'> = { fetchDeckFull, createDeck, replaceDeckCards }): Promise<string> {
  const source = await operations.fetchDeckFull(sourceDeckId, false);
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
