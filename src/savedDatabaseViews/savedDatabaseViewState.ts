import { z } from 'zod';

export const SAVED_DATABASE_VIEW_LIMIT = 50;
export const SAVED_DATABASE_VIEW_NAME_MAX_LENGTH = 80;
const SAVED_DATABASE_VIEW_SEARCH_MAX_LENGTH = 200;
const SAVED_DATABASE_VIEW_SET_CODE_MAX_LENGTH = 32;
const SAVED_DATABASE_VIEW_MISSION_SET_MAX_LENGTH = 120;

const SAVED_DATABASE_VIEW_TABS = [
  'all',
  'characters',
  'special-cards',
  'power-cards',
  'locations',
  'battlegrounds',
  'missions',
  'events',
  'aspects',
  'advanced-universe',
  'teamwork',
  'ally-universe',
  'training',
  'basic-universe'
] as const;

const SAVED_DATABASE_VIEW_COMPARE_OPS = ['eq', 'gte', 'lte'] as const;
const SAVED_DATABASE_VIEW_FUNCTION_ICONS = [
  'icon_offensive_swords',
  'icon_defensive_shield',
  'icon_remainder_of_battle',
  'icon_remainder_of_game',
  'icon_astral_plane'
] as const;

const SAVED_DATABASE_VIEW_POWER_TYPES = [
  'Energy',
  'Combat',
  'Brute Force',
  'Intelligence',
  'Multi-Power',
  'Any-Power'
] as const;

export type SavedDatabaseViewTab = (typeof SAVED_DATABASE_VIEW_TABS)[number];
type SavedDatabaseViewCompareOp = (typeof SAVED_DATABASE_VIEW_COMPARE_OPS)[number];
type SavedDatabaseViewFunctionIcon = (typeof SAVED_DATABASE_VIEW_FUNCTION_ICONS)[number];

interface SavedDatabaseViewNumericConstraint {
  field: string;
  op: SavedDatabaseViewCompareOp;
  value: number;
}

export interface SavedDatabaseViewFilterState {
  numeric: SavedDatabaseViewNumericConstraint[];
  powerTypes: string[];
  functionIcons: SavedDatabaseViewFunctionIcon[];
  missionSet: string;
}

export interface SavedDatabaseViewStateV1 {
  schemaVersion: 1;
  tab: SavedDatabaseViewTab;
  search: string;
  setFilter: string;
  filters: SavedDatabaseViewFilterState;
  hasFoilFilter: boolean;
  hideAltsFilter: boolean;
}

type FilterContract = {
  numeric?: Record<string, { min: number; max: number }>;
  powerTypes?: readonly string[];
  functionIcons?: boolean;
  missionSet?: boolean;
};

/** Mirrors the config-driven filter surface; keep changes paired with dbvFilterConfig.ts. */
const SAVED_DATABASE_VIEW_FILTER_CONTRACT: Record<SavedDatabaseViewTab, FilterContract> = {
  all: {},
  characters: {
    numeric: {
      energy: { min: 1, max: 8 },
      combat: { min: 1, max: 8 },
      brute_force: { min: 1, max: 8 },
      intelligence: { min: 1, max: 8 },
      threat_level: { min: 15, max: 24 }
    }
  },
  'special-cards': { powerTypes: SAVED_DATABASE_VIEW_POWER_TYPES, functionIcons: true },
  'power-cards': {
    numeric: {
      Energy: { min: 1, max: 8 },
      Combat: { min: 1, max: 8 },
      'Brute Force': { min: 1, max: 8 },
      Intelligence: { min: 1, max: 8 },
      'Multi-Power': { min: 1, max: 5 },
      'Any-Power': { min: 5, max: 8 }
    }
  },
  locations: { numeric: { threat_level: { min: 0, max: 3 } } },
  battlegrounds: {},
  missions: { missionSet: true },
  events: { missionSet: true },
  aspects: { powerTypes: SAVED_DATABASE_VIEW_POWER_TYPES.slice(0, 5) },
  'advanced-universe': { functionIcons: true },
  teamwork: { powerTypes: ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'] },
  'ally-universe': { powerTypes: SAVED_DATABASE_VIEW_POWER_TYPES.slice(0, 4) },
  training: { powerTypes: ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'] },
  'basic-universe': { powerTypes: SAVED_DATABASE_VIEW_POWER_TYPES.slice(0, 4) }
};

const uniqueArray = <T>(values: T[]): boolean => new Set(values).size === values.length;

const numericConstraintSchema = z.object({
  field: z.string().min(1).max(40),
  op: z.enum(SAVED_DATABASE_VIEW_COMPARE_OPS),
  value: z.number().int().min(-1000).max(1000)
}).strict();

export const savedDatabaseViewStateV1Schema = z.object({
  schemaVersion: z.literal(1, { error: 'Unsupported saved-view schema version' }),
  tab: z.enum(SAVED_DATABASE_VIEW_TABS),
  search: z.string().max(SAVED_DATABASE_VIEW_SEARCH_MAX_LENGTH),
  setFilter: z.string().max(SAVED_DATABASE_VIEW_SET_CODE_MAX_LENGTH),
  filters: z.object({
    numeric: z.array(numericConstraintSchema).max(8).refine(
      (values) => uniqueArray(values.map((value) => value.field)),
      { message: 'Numeric filter fields must be unique' }
    ),
    powerTypes: z.array(z.enum(SAVED_DATABASE_VIEW_POWER_TYPES)).max(6).refine(uniqueArray, {
      message: 'Power-type filters must be unique'
    }),
    functionIcons: z.array(z.enum(SAVED_DATABASE_VIEW_FUNCTION_ICONS)).max(5).refine(uniqueArray, {
      message: 'Function-icon filters must be unique'
    }),
    missionSet: z.string().max(SAVED_DATABASE_VIEW_MISSION_SET_MAX_LENGTH)
  }).strict(),
  hasFoilFilter: z.boolean(),
  hideAltsFilter: z.boolean()
}).strict().superRefine((state, context) => {
  const contract = SAVED_DATABASE_VIEW_FILTER_CONTRACT[state.tab];

  for (const constraint of state.filters.numeric) {
    const allowed = contract.numeric?.[constraint.field];
    if (!allowed || constraint.value < allowed.min || constraint.value > allowed.max) {
      context.addIssue({
        code: 'custom',
        path: ['filters', 'numeric'],
        message: `Numeric filter ${constraint.field} is not valid for ${state.tab}`
      });
    }
  }

  for (const powerType of state.filters.powerTypes) {
    if (!contract.powerTypes?.includes(powerType)) {
      context.addIssue({
        code: 'custom',
        path: ['filters', 'powerTypes'],
        message: `Power type ${powerType} is not valid for ${state.tab}`
      });
    }
  }

  if (!contract.functionIcons && state.filters.functionIcons.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['filters', 'functionIcons'],
      message: `Function icons are not valid for ${state.tab}`
    });
  }

  if (!contract.missionSet && state.filters.missionSet !== '') {
    context.addIssue({
      code: 'custom',
      path: ['filters', 'missionSet'],
      message: `Mission set is not valid for ${state.tab}`
    });
  }
});

export function parseSavedDatabaseViewState(value: unknown): SavedDatabaseViewStateV1 | null {
  const parsed = savedDatabaseViewStateV1Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function normalizeSavedDatabaseViewName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length > 0 && name.length <= SAVED_DATABASE_VIEW_NAME_MAX_LENGTH ? name : null;
}
