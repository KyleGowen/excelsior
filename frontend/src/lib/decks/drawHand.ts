import type { DeckCardEntry } from '../api/types';
import { cardDisplayName, compareDeckPowerCatalogCards } from '../catalog/catalogTypeMap';
import {
  compareDeckSpecialEntries,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from './deckCardCatalog';
import { deckEditorSectionIndex } from './deckEditorSectionOrder';
import { compareAlphabetically } from '../sort/alphabetical';

function compareDrawnHandEntries(
  a: DeckCardEntry,
  b: DeckCardEntry,
  cardIndex: DeckCardIndex,
): number {
  const sectionCmp = deckEditorSectionIndex(a.type) - deckEditorSectionIndex(b.type);
  if (sectionCmp !== 0) return sectionCmp;

  if (a.type === 'power') {
    const cardA = resolveDeckCatalogCard(a, cardIndex);
    const cardB = resolveDeckCatalogCard(b, cardIndex);
    if (cardA && cardB) {
      const powerCmp = compareDeckPowerCatalogCards(cardA, cardB);
      if (powerCmp !== 0) return powerCmp;
    }
  } else if (a.type === 'special') {
    const specialCmp = compareDeckSpecialEntries(a, b, cardIndex);
    if (specialCmp !== 0) return specialCmp;
  } else {
    const nameA = cardDisplayName(resolveDeckCatalogCard(a, cardIndex));
    const nameB = cardDisplayName(resolveDeckCatalogCard(b, cardIndex));
    const nameCmp = compareAlphabetically(nameA, nameB);
    if (nameCmp !== 0) return nameCmp;
  }

  const idA = a.instanceId ?? a.cardId;
  const idB = b.instanceId ?? b.cardId;
  return idA.localeCompare(idB);
}

/** Sort drawn hand for display: deck section order, then per-type deck-editor sort. */
export function sortDrawnHandCards(
  drawn: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckCardEntry[] {
  if (drawn.length <= 1) return drawn;
  return [...drawn].sort((a, b) => compareDrawnHandEntries(a, b, cardIndex));
}
