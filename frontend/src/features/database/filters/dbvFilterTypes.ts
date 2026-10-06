import { moduleAssets } from '../../../modules/assetRegistry';
import type { CatalogType } from '../../../lib/api/types';

export type CompareOp = 'eq' | 'gte' | 'lte';

export interface NumericConstraint {
  field: string;
  op: CompareOp;
  value: number;
}

export type FunctionIconField =
  | 'icon_offensive_swords'
  | 'icon_defensive_shield'
  | 'icon_remainder_of_battle'
  | 'icon_remainder_of_game'
  | 'icon_astral_plane';

export interface DbvFilterState {
  numeric: NumericConstraint[];
  powerTypes: string[];
  functionIcons: FunctionIconField[];
  missionSet: string;
}

export const EMPTY_DBV_FILTER_STATE: DbvFilterState = {
  numeric: [],
  powerTypes: [],
  functionIcons: [],
  missionSet: '',
};

export type DbvFilterGroupKind = 'numeric' | 'powerTypes' | 'functionIcons' | 'missionSet';

export interface NumericFieldDef {
  key: string;
  label: string;
  icon?: string;
  min: number;
  max: number;
}

export interface DbvTypeFilterConfig {
  groups: DbvFilterGroupKind[];
  numericFields?: NumericFieldDef[];
  powerTypeKeys?: string[];
}

export interface FilterChip {
  id: string;
  label: string;
  kind: 'numeric' | 'powerType' | 'functionIcon' | 'missionSet';
  removeKey: string;
}

export const POWER_TYPE_LABELS = {
  Energy: 'Energy',
  Combat: 'Combat',
  BruteForce: 'Brute Force',
  Intelligence: 'Intelligence',
  MultiPower: 'Multi-Power',
  AnyPower: 'Any-Power',
} as const;

export { STAT_ICON_PATHS } from '../../../lib/icons/statIconTypes';
export type { StatIconType } from '../../../lib/icons/statIconTypes';

export const FUNCTION_ICON_DEFS: {
  field: FunctionIconField;
  label: string;
  img: string;
}[] = [
  { field: 'icon_offensive_swords', label: 'Offensive', img: moduleAssets['function/offensive_action'] },
  { field: 'icon_defensive_shield', label: 'Defensive', img: moduleAssets['function/defensive_action'] },
  { field: 'icon_remainder_of_battle', label: 'Remainder of Battle', img: moduleAssets['function/reminder_of_battle'] },
  { field: 'icon_remainder_of_game', label: 'Remainder of Game', img: moduleAssets['function/reminder_of_game'] },
  { field: 'icon_astral_plane', label: 'Astral Plane', img: moduleAssets['function/astral_plane'] },
];

export const OP_LABELS: Record<CompareOp, string> = {
  eq: '=',
  gte: '≥',
  lte: '≤',
};

export type { CatalogType };
