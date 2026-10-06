import type { CatalogCard, DeckCardEntry } from '../api/types';
export interface KoDimmingContext { dimmedByIdentity: Readonly<Record<string, boolean>>; }
export function toggleKoCharacterId(ids: Set<string>, cardId: string): Set<string> {
  const next = new Set(ids);
  if (next.has(cardId)) {
    next.delete(cardId);
  } else {
    next.add(cardId);
  }
  return next;
}

export function pruneKoCharacterIds(
  ids: Set<string>,
  deckCards: DeckCardEntry[],
): Set<string> {
  const characterIds = new Set(
    deckCards.filter((c) => c.type === 'character').map((c) => c.cardId),
  );
  const next = new Set<string>();
  ids.forEach((id) => {
    if (characterIds.has(id)) next.add(id);
  });
  return next;
}

export function isKoCharacter(koCharacterIds: Set<string>, cardId: string): boolean {
  return koCharacterIds.has(cardId);
}


/** Rendering only: the backend decides dimming for the exact evaluation input. */
export function shouldDimDeckCard(entry: DeckCardEntry, _card: CatalogCard | undefined, ctx: KoDimmingContext): boolean { return ctx.dimmedByIdentity[`${entry.type.replace(/_/g,'-')}:${entry.cardId}`] === true; }
