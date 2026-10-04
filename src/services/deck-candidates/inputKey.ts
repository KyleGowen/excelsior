export interface CandidateEvaluationInput {
  schemaVersion: 1; revision?: number; cards: Array<{ type: string; cardId: string; quantity: number }>;
  candidates: Array<{ catalogType: string; cardId: string }>;
}
/** Transport identity only; this shared function contains no game rules. */
export function candidateInputKey(input: CandidateEvaluationInput): string {
  return JSON.stringify({ schemaVersion: input.schemaVersion,
    cards: input.cards.map(c => ({ type: c.type.replace(/_/g, '-'), cardId: c.cardId, quantity: c.quantity })),
    candidates: input.candidates.map(c => ({ catalogType: c.catalogType, cardId: c.cardId })) });
}
