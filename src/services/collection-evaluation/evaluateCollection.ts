import type { CollectionEvaluationDto, CollectionEvaluationEntry } from '../../api/dto/v1/CollectionEvaluationDto';
/** No catalog reads, writes, player adoption or Guest collection persistence. */
export function evaluateCollection(entries: readonly CollectionEvaluationEntry[], storage: 'device' | 'account', canSetQuantity: boolean): CollectionEvaluationDto {
  const quantities: Record<string, number> = Object.create(null);
  let totalOwned = 0;
  let uniqueCards = 0;
  for (const entry of entries) {
    if (entry.quantity <= 0) continue;
    totalOwned += entry.quantity;
    uniqueCards++;
    // Preserve the observed client display semantics across foil/alternate rows.
    quantities[`${entry.cardType}:${entry.cardId}`] = entry.quantity;
  }
  return { totalOwned, uniqueCards, quantities, capabilities: { canSetQuantity, storage, minimumQuantity: 0, maximumQuantity: 99 } };
}
