type DeckListItem = ReturnType<typeof import('../../deckTransform').transformDeckList>[number];

/** `data` payload for `GET /api/v1/decks`. Card names are present on opt-in lists. */
export type DeckListV1DataDto = Array<DeckListItem & {
  metadata: DeckListItem['metadata'] & { cardNames?: string[] };
}>;
