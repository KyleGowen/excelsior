import { DBV_TAB_ORDER, type DbvTabSelection } from '../../lib/catalog/catalogTypeMap';
import type { CatalogCard, CatalogType } from '../../lib/api/types';
import type { SavedDatabaseViewStateV1 } from '../../lib/api/savedDatabaseViews';
import { collectMissionSetOptions } from './filters/dbvFilterPredicates';
import { getDbvFilterConfig } from './filters/dbvFilterConfig';
import {
  EMPTY_DBV_FILTER_STATE,
  FUNCTION_ICON_DEFS,
  type CompareOp,
  type DbvFilterState,
  type FunctionIconField,
} from './filters/dbvFilterTypes';

export interface CurrentDatabaseViewState {
  tab: DbvTabSelection;
  search: string;
  setFilter: string;
  filters: DbvFilterState;
  hasFoilFilter: boolean;
  hideAltsFilter: boolean;
}

export interface NormalizedSavedDatabaseViewState {
  state: SavedDatabaseViewStateV1;
  notices: string[];
}

export function captureSavedDatabaseViewState(
  current: CurrentDatabaseViewState,
): SavedDatabaseViewStateV1 {
  const filters = current.tab === 'all' ? EMPTY_DBV_FILTER_STATE : current.filters;
  return {
    schemaVersion: 1,
    tab: current.tab,
    search: current.search,
    setFilter: current.setFilter,
    filters: {
      numeric: filters.numeric.map((constraint) => ({ ...constraint })),
      powerTypes: [...filters.powerTypes],
      functionIcons: [...filters.functionIcons],
      missionSet: filters.missionSet,
    },
    hasFoilFilter: current.hasFoilFilter,
    hideAltsFilter: current.hideAltsFilter,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.length <= max ? value : null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function normalizeSavedDatabaseViewState(
  raw: unknown,
  availableSetCodes: readonly string[],
  targetCards: CatalogCard[] = [],
): NormalizedSavedDatabaseViewState | null {
  if (!isRecord(raw) || raw.schemaVersion !== 1) return null;
  if (typeof raw.tab !== 'string' || !DBV_TAB_ORDER.includes(raw.tab as DbvTabSelection)) return null;
  const tab = raw.tab as DbvTabSelection;
  const search = asString(raw.search, 200);
  const rawSet = asString(raw.setFilter, 32);
  if (search === null || rawSet === null || typeof raw.hasFoilFilter !== 'boolean'
    || typeof raw.hideAltsFilter !== 'boolean' || !isRecord(raw.filters)) return null;

  const notices: string[] = [];
  const catalogType: CatalogType = tab === 'all' ? 'characters' : tab;
  const config = tab === 'all' ? { groups: [] } : getDbvFilterConfig(catalogType);
  const filterRaw = raw.filters;
  if (!Array.isArray(filterRaw.numeric) || !Array.isArray(filterRaw.powerTypes)
    || !Array.isArray(filterRaw.functionIcons) || typeof filterRaw.missionSet !== 'string') return null;

  const numeric: DbvFilterState['numeric'] = [];
  const seenNumeric = new Set<string>();
  for (const value of filterRaw.numeric) {
    if (!isRecord(value) || typeof value.field !== 'string' || typeof value.value !== 'number'
      || !Number.isInteger(value.value) || !['eq', 'gte', 'lte'].includes(String(value.op))) {
      notices.push('One unavailable numeric filter was cleared.');
      continue;
    }
    const definition = config.numericFields?.find((field) => field.key === value.field);
    if (!definition || value.value < definition.min || value.value > definition.max || seenNumeric.has(value.field)) {
      notices.push('One unavailable numeric filter was cleared.');
      continue;
    }
    seenNumeric.add(value.field);
    numeric.push({ field: value.field, op: value.op as CompareOp, value: value.value });
  }

  const powerTypes = unique(filterRaw.powerTypes.filter((value): value is string => typeof value === 'string'))
    .filter((value) => config.powerTypeKeys?.includes(value));
  if (powerTypes.length !== filterRaw.powerTypes.length) notices.push('One unavailable power-type filter was cleared.');

  const allowedFunctionIcons = new Set(FUNCTION_ICON_DEFS.map((definition) => definition.field));
  const functionIcons = unique(filterRaw.functionIcons.filter(
    (value): value is FunctionIconField => typeof value === 'string' && allowedFunctionIcons.has(value as FunctionIconField),
  )).filter(() => config.groups.includes('functionIcons'));
  if (functionIcons.length !== filterRaw.functionIcons.length) notices.push('One unavailable function filter was cleared.');

  let missionSet = filterRaw.missionSet.slice(0, 120);
  if (!config.groups.includes('missionSet')) {
    if (missionSet) notices.push('An unavailable mission-set filter was cleared.');
    missionSet = '';
  } else if (missionSet && targetCards.length > 0 && !collectMissionSetOptions(targetCards).includes(missionSet)) {
    notices.push('An unavailable mission-set filter was cleared.');
    missionSet = '';
  }

  let setFilter = rawSet;
  if (setFilter && !availableSetCodes.includes(setFilter)) {
    notices.push('An unavailable card set was reset to All sets.');
    setFilter = '';
  }

  return {
    state: {
      schemaVersion: 1,
      tab,
      search,
      setFilter,
      filters: { ...EMPTY_DBV_FILTER_STATE, numeric, powerTypes, functionIcons, missionSet },
      hasFoilFilter: raw.hasFoilFilter,
      hideAltsFilter: raw.hideAltsFilter,
    },
    notices: unique(notices),
  };
}
