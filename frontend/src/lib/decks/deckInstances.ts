import type { DeckCardEntry } from '../api/types';

/** Client-only id for one deck tile instance (not persisted to API). */
export function createInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `inst-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Split aggregated API rows into one entry per physical copy (quantity always 1). */
export function expandDeckToInstances(cards: DeckCardEntry[]): DeckCardEntry[] {
  const result: DeckCardEntry[] = [];
  for (const card of cards) {
    const qty = Math.max(1, card.quantity ?? 1);
    for (let i = 0; i < qty; i++) {
      result.push({
        ...card,
        quantity: 1,
        instanceId: createInstanceId(),
        // Aggregated rows use this boolean to mean one physical copy is
        // pre-placed. Marking every expanded copy makes a saved duplicate
        // suddenly violate the unique pre-placed-card rule after reload.
        exclude_from_draw: card.exclude_from_draw === true && i === 0,
      });
    }
  }
  return result;
}

/** Merge instance rows back into API payload grouped by (type, cardId). */
export function aggregateInstancesForSave(cards: DeckCardEntry[]): DeckCardEntry[] {
  const map = new Map<string, DeckCardEntry>();
  for (const card of cards) {
    const key = `${card.type}:${card.cardId}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += card.quantity;
      // The grouped flag records that one copy in this cardId group is
      // pre-placed. The legality rules prevent more than one pre-placed copy
      // of the same card.
      existing.exclude_from_draw = (existing.exclude_from_draw === true) || (card.exclude_from_draw === true);
    } else {
      const { instanceId: _instanceId, ...rest } = card;
      map.set(key, { ...rest, quantity: card.quantity });
    }
  }
  return Array.from(map.values());
}

/** Remove one deck tile by its client instance id. */
export function removeInstance(cards: DeckCardEntry[], instanceId: string): DeckCardEntry[] {
  return cards.filter((c) => c.instanceId !== instanceId);
}

/** Ensure every row has instanceId and quantity 1 (client editor invariant). */
export function ensureInstanceIds(cards: DeckCardEntry[]): DeckCardEntry[] {
  return cards.map((c) => ({
    ...c,
    quantity: 1,
    instanceId: c.instanceId ?? createInstanceId(),
  }));
}
