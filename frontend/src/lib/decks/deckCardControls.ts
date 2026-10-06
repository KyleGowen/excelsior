import type { CatalogCard, DeckCardType } from '../api/types';

/** Every deck tile is one instance — remove via trash only (no quantity stepper). */
export function deckCardUsesTrashOnlyRemoval(_deckType: DeckCardType): boolean {
  return true;
}

/** Max quantity per deck tile (always 1 — one instance per tile). */
export function deckCardQuantityMax(
  _deckType: DeckCardType,
  _catalogCard?: CatalogCard | null,
): number {
  return 1;
}
