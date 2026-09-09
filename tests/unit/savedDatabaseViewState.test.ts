import {
  SAVED_DATABASE_VIEW_NAME_MAX_LENGTH,
  normalizeSavedDatabaseViewName,
  parseSavedDatabaseViewState,
  savedDatabaseViewStateV1Schema,
} from '../../src/savedDatabaseViews/savedDatabaseViewState';

const validState = {
  schemaVersion: 1 as const,
  tab: 'characters' as const,
  search: 'invincible',
  setFilter: 'SKY',
  filters: {
    numeric: [{ field: 'energy', op: 'gte' as const, value: 5 }],
    powerTypes: [],
    functionIcons: [],
    missionSet: '',
  },
  hasFoilFilter: true,
  hideAltsFilter: false,
};

describe('saved database view state contract', () => {
  it('accepts a complete supported V1 state', () => {
    expect(parseSavedDatabaseViewState(validState)).toEqual(validState);
  });

  it('rejects unsupported versions, unknown fields, invalid operators, and tab-incompatible filters', () => {
    expect(parseSavedDatabaseViewState({ ...validState, schemaVersion: 2 })).toBeNull();
    expect(parseSavedDatabaseViewState({ ...validState, extra: true })).toBeNull();
    expect(parseSavedDatabaseViewState({
      ...validState,
      filters: { ...validState.filters, numeric: [{ field: 'energy', op: 'gt', value: 5 }] },
    })).toBeNull();
    expect(parseSavedDatabaseViewState({
      ...validState,
      tab: 'missions',
    })).toBeNull();
  });

  it('accepts every supported tab with neutral filters', () => {
    const tabs = [
      'all', 'characters', 'special-cards', 'power-cards', 'locations', 'battlegrounds',
      'missions', 'events', 'aspects', 'advanced-universe', 'teamwork', 'ally-universe',
      'training', 'basic-universe',
    ];
    for (const tab of tabs) {
      const result = savedDatabaseViewStateV1Schema.safeParse({
        ...validState,
        tab,
        filters: { numeric: [], powerTypes: [], functionIcons: [], missionSet: '' },
      });
      expect(result.success).toBe(true);
    }
  });

  it('trims valid names and rejects empty or oversized names', () => {
    expect(normalizeSavedDatabaseViewName('  My view  ')).toBe('My view');
    expect(normalizeSavedDatabaseViewName('   ')).toBeNull();
    expect(normalizeSavedDatabaseViewName('x'.repeat(SAVED_DATABASE_VIEW_NAME_MAX_LENGTH + 1))).toBeNull();
  });
});
