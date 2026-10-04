export interface CountCard { type: string; quantity: number; exclude_from_draw?: boolean }
const NON_PLAYABLE = new Set(['character', 'location', 'battleground', 'mission']);
export function countPlayableCards(cards: CountCard[]): number {
  return cards.filter(card => !NON_PLAYABLE.has(card.type)).reduce((sum, card) => sum + Math.max(1, card.quantity ?? 1), 0);
}
export function countCardsInDeck(cards: CountCard[]): number {
  return cards.filter(card => !NON_PLAYABLE.has(card.type)).reduce((sum, card) => sum + Math.max(0, Math.max(1, card.quantity ?? 1) - (card.exclude_from_draw ? 1 : 0)), 0);
}
export function canDrawHand(cards: CountCard[]): boolean { return countPlayableCards(cards) >= 8; }
