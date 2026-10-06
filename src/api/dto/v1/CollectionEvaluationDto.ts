/** Derived values for one collection snapshot; printing rows remain distinct. */
export interface CollectionEvaluationDto {
  totalOwned: number;
  uniqueCards: number;
  /** Compatibility display quantity: last positive printing row for each type/id. */
  quantities: Record<string, number>;
  capabilities: {
    canSetQuantity: boolean;
    storage: 'device' | 'account';
    minimumQuantity: number;
    maximumQuantity: number;
  };
}
export interface CollectionEvaluationEntry {
  cardId: string;
  cardType: string;
  imagePath: string;
  quantity: number;
}
