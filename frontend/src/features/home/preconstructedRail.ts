import type { DeckListItem, PreconstructedDeckGroup } from '../../lib/api/types';

/** Preserve API release order while excluding editorial upgrade recommendations. */
export function flattenOfficialPreconstructedDecks(
  groups: PreconstructedDeckGroup[],
): DeckListItem[] {
  return groups.flatMap((group) => group.decks);
}
