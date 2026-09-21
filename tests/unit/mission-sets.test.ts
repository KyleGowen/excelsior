import type { CatalogCard } from '../../frontend/src/lib/api/types';
import {
  ADD_CARDS_MISSION_SETS_PAGE_SIZE,
  UNKNOWN_MISSION_SET,
  buildMissionSets,
  compareMissionsWithinSet,
  filterMissionSets,
  missionSetKey,
} from '../../frontend/src/lib/catalog/missionSets';

function card(
  id: string,
  name: string,
  extra: Partial<CatalogCard> = {},
): CatalogCard {
  return { id, name, ...extra } as CatalogCard;
}

describe('missionSets', () => {
  describe('missionSetKey', () => {
    it('returns trimmed mission_set or Unknown Mission Set', () => {
      expect(missionSetKey(card('1', 'A', { mission_set: '  Time Wars  ' }))).toBe('Time Wars');
      expect(missionSetKey(card('2', 'B', { mission_set: '' }))).toBe(UNKNOWN_MISSION_SET);
    });
  });

  describe('compareMissionsWithinSet', () => {
    it('sorts by set_number then name', () => {
      const a = card('a', 'Zebra', { set_number: '2' });
      const b = card('b', 'Alpha', { set_number: '1' });
      const c = card('c', 'Beta', { set_number: '2' });
      expect(compareMissionsWithinSet(a, b)).toBeGreaterThan(0);
      expect(compareMissionsWithinSet(a, c)).toBeGreaterThan(0);
      expect(compareMissionsWithinSet(b, c)).toBeLessThan(0);
    });
  });

  describe('buildMissionSets', () => {
    it('groups by mission_set and sorts sets alphabetically', () => {
      const sets = buildMissionSets([
        card('m1', 'Mission B', { mission_set: 'Set B', set_number: '2' }),
        card('m2', 'Mission A', { mission_set: 'Set B', set_number: '1' }),
        card('m3', 'Mission X', { mission_set: 'Set A', set_number: '1' }),
      ]);

      expect(sets.map((s) => s.missionSetName)).toEqual(['Set A', 'Set B']);
      expect(sets[1].missions.map((m) => m.id)).toEqual(['m2', 'm1']);
    });

    it('ignores a leading The when ordering mission-set names', () => {
      const sets = buildMissionSets([
        card('m1', 'First', { mission_set: 'Lethal Intentions', set_number: '1' }),
        card('m2', 'Second', { mission_set: 'The Call of Cthulhu', set_number: '1' }),
        card('m3', 'Third', { mission_set: 'Battleworld', set_number: '1' }),
      ]);

      expect(sets.map((s) => s.missionSetName)).toEqual([
        'Battleworld',
        'The Call of Cthulhu',
        'Lethal Intentions',
      ]);
    });

    it('places empty mission_set in Unknown Mission Set', () => {
      const sets = buildMissionSets([card('m1', 'Orphan', { mission_set: '' })]);
      expect(sets).toHaveLength(1);
      expect(sets[0].missionSetName).toBe(UNKNOWN_MISSION_SET);
    });
  });

  describe('filterMissionSets', () => {
    const sets = buildMissionSets([
      card('m1', 'Divine Retribution', { mission_set: 'The Call of Cthulhu', set_number: '1' }),
      card('m2', 'Battle of Olympus', { mission_set: 'Time Wars: Rise of the Gods', set_number: '1' }),
    ]);

    it('returns all sets when query is empty', () => {
      expect(filterMissionSets(sets, '')).toHaveLength(2);
    });

    it('keeps set when mission set name matches', () => {
      const filtered = filterMissionSets(sets, 'cthulhu');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].missionSetName).toBe('The Call of Cthulhu');
    });

    it('keeps set when a mission name matches', () => {
      const filtered = filterMissionSets(sets, 'olympus');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].missionSetName).toBe('Time Wars: Rise of the Gods');
    });

    it('filters out non-matching sets', () => {
      expect(filterMissionSets(sets, 'mars')).toHaveLength(0);
    });
  });

  describe('ADD_CARDS_MISSION_SETS_PAGE_SIZE', () => {
    it('is 4', () => {
      expect(ADD_CARDS_MISSION_SETS_PAGE_SIZE).toBe(4);
    });
  });
});
