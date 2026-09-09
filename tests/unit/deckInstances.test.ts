import type { DeckCardEntry } from '../../frontend/src/lib/api/types';
import {
  aggregateInstancesForSave,
  expandDeckToInstances,
  removeInstance,
} from '../../frontend/src/lib/decks/deckInstances';

describe('deckInstances', () => {
  describe('expandDeckToInstances', () => {
    it('splits quantity > 1 into separate rows with quantity 1', () => {
      const input: DeckCardEntry[] = [
        { type: 'power', cardId: 'p1', quantity: 3 },
      ];
      const result = expandDeckToInstances(input);
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.quantity === 1)).toBe(true);
      expect(result.every((r) => r.cardId === 'p1')).toBe(true);
      const ids = new Set(result.map((r) => r.instanceId));
      expect(ids.size).toBe(3);
    });

    it('assigns instanceId to single-quantity rows', () => {
      const input: DeckCardEntry[] = [{ type: 'character', cardId: 'c1', quantity: 1 }];
      const result = expandDeckToInstances(input);
      expect(result).toHaveLength(1);
      expect(result[0].instanceId).toBeTruthy();
    });

    it('marks only one physical copy pre-placed when an aggregated row has duplicates', () => {
      const input: DeckCardEntry[] = [
        { type: 'training', cardId: 'training-1', quantity: 2, exclude_from_draw: true },
      ];

      const result = expandDeckToInstances(input);

      expect(result.map((card) => card.exclude_from_draw)).toEqual([true, false]);
    });
  });

  describe('aggregateInstancesForSave', () => {
    it('merges instances by type and cardId summing quantity', () => {
      const input: DeckCardEntry[] = [
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'a' },
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'b' },
        { type: 'special', cardId: 's1', quantity: 1, instanceId: 'c' },
      ];
      const result = aggregateInstancesForSave(input);
      expect(result).toHaveLength(2);
      const power = result.find((r) => r.type === 'power');
      expect(power?.quantity).toBe(2);
      expect(power?.instanceId).toBeUndefined();
    });

    it('preserves exclude_from_draw when any instance is marked pre-placed', () => {
      const input: DeckCardEntry[] = [
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'a', exclude_from_draw: false },
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'b', exclude_from_draw: true },
      ];
      const result = aggregateInstancesForSave(input);
      expect(result).toHaveLength(1);
      expect(result[0].exclude_from_draw).toBe(true);
    });

    it('round-trips one pre-placed and one normal copy without spreading the flag', () => {
      const instances: DeckCardEntry[] = [
        { type: 'training', cardId: 'training-1', quantity: 1, instanceId: 'draw' },
        {
          type: 'training',
          cardId: 'training-1',
          quantity: 1,
          instanceId: 'pre-placed',
          exclude_from_draw: true,
        },
      ];

      const reloaded = expandDeckToInstances(aggregateInstancesForSave(instances));

      expect(reloaded).toHaveLength(2);
      expect(reloaded.filter((card) => card.exclude_from_draw === true)).toHaveLength(1);
      expect(reloaded.filter((card) => card.exclude_from_draw !== true)).toHaveLength(1);
    });
  });

  describe('removeInstance', () => {
    it('removes only the matching instance', () => {
      const input: DeckCardEntry[] = [
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'keep' },
        { type: 'power', cardId: 'p1', quantity: 1, instanceId: 'drop' },
      ];
      const result = removeInstance(input, 'drop');
      expect(result).toHaveLength(1);
      expect(result[0].instanceId).toBe('keep');
    });
  });
});
