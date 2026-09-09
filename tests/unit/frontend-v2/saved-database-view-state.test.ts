import {
  captureSavedDatabaseViewState,
  normalizeSavedDatabaseViewState,
  shouldSkipDbvFilterReset,
} from '../../../frontend/src/features/database/savedDatabaseViewState';

describe('Saved database view client state', () => {
  const current = {
    tab: 'special-cards' as const,
    search: 'Dark Phoenix',
    setFilter: 'ERB',
    filters: {
      numeric: [],
      powerTypes: ['Energy', 'Any-Power'],
      functionIcons: ['icon_offensive_swords' as const],
      missionSet: '',
    },
    hasFoilFilter: true,
    hideAltsFilter: false,
  };

  it('round-trips every persisted field without page or presentation state', () => {
    const captured = captureSavedDatabaseViewState(current);
    expect(captured).toEqual({ schemaVersion: 1, ...current });
    expect(captured).not.toHaveProperty('page');
    expect(captured).not.toHaveProperty('selected');
    expect(captured).not.toHaveProperty('filterRailCollapsed');
    expect(normalizeSavedDatabaseViewState(captured, ['ERB'])?.state).toEqual(captured);
  });

  it('falls back unavailable set and filter values without failing the whole view', () => {
    const result = normalizeSavedDatabaseViewState({
      ...captureSavedDatabaseViewState(current),
      setFilter: 'REMOVED',
      filters: {
        numeric: [{ field: 'removed', op: 'eq', value: 1 }],
        powerTypes: ['Energy', 'Removed'],
        functionIcons: ['icon_offensive_swords', 'removed'],
        missionSet: 'Removed',
      },
    }, ['ERB']);
    expect(result?.state.setFilter).toBe('');
    expect(result?.state.filters).toEqual({
      numeric: [], powerTypes: ['Energy'], functionIcons: ['icon_offensive_swords'], missionSet: '',
    });
    expect(result?.notices.length).toBeGreaterThan(0);
  });

  it('rejects unsupported versions and incomplete state', () => {
    expect(normalizeSavedDatabaseViewState({ ...captureSavedDatabaseViewState(current), schemaVersion: 2 }, ['ERB'])).toBeNull();
    expect(normalizeSavedDatabaseViewState({ schemaVersion: 1 }, ['ERB'])).toBeNull();
  });

  it('captures neutral advanced filters for the All tab, which has no filter rail', () => {
    expect(captureSavedDatabaseViewState({ ...current, tab: 'all' }).filters).toEqual({
      numeric: [], powerTypes: [], functionIcons: [], missionSet: '',
    });
  });

  it('skips the tab reset only for an explicit hydration target', () => {
    expect(shouldSkipDbvFilterReset('missions', 'missions')).toBe(true);
    expect(shouldSkipDbvFilterReset('events', 'missions')).toBe(false);
    expect(shouldSkipDbvFilterReset('missions', null)).toBe(false);
  });
});
