import type { CatalogCard } from '../catalog-presentation/types';
/** Editor tile ceiling; structural constraints remain editable legality concerns. */
export function maxCopiesForAddCards(card: CatalogCard): number {
  return card.one_per_deck || card.is_one_per_deck ? 1 : 99;
}
