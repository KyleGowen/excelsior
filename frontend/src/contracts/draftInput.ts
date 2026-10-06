// Frontend transport contract. Checked against the server by check:contracts.
/** Complete evaluation identity, independent of request revision and client catalog values. */
export interface DeckEvaluationInput {
  schemaVersion: 1;
  draftId: string;
  cards: Array<{ type: string; cardId: string; quantity: number; exclude_from_draw?: boolean | undefined }>;
  reserveCharacterId: string | null;
  limited: boolean;
  format: 'venture';
  koCharacterIds: string[];
}

export function evaluationInputKey(input: DeckEvaluationInput): string {
  return JSON.stringify({
    schemaVersion: input.schemaVersion,
    draftId: input.draftId,
    cards: input.cards.map(c => ({ type: c.type.replace(/_/g, '-'), cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true })),
    reserveCharacterId: input.reserveCharacterId,
    limited: input.limited,
    format: input.format,
    koCharacterIds: [...new Set(input.koCharacterIds)].sort(),
  });
}
