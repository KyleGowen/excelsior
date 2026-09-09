import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogType } from '../../../lib/api/types';
import { getDbvFilterConfig } from './dbvFilterConfig';
import {
  EMPTY_DBV_FILTER_STATE,
  FUNCTION_ICON_DEFS,
  OP_LABELS,
  type CompareOp,
  type DbvFilterState,
  type FilterChip,
  type FunctionIconField,
  type NumericConstraint,
} from './dbvFilterTypes';

type DbvFilterStateUpdater = DbvFilterState | ((prev: DbvFilterState) => DbvFilterState);

interface UseDbvFiltersOptions {
  persistByCatalogType?: boolean;
}

export function shouldSkipDbvFilterReset(
  catalogType: CatalogType,
  hydratedCatalogType: CatalogType | null,
): boolean {
  return hydratedCatalogType === catalogType;
}

function numericChipId(c: NumericConstraint): string {
  return `numeric:${c.field}:${c.op}:${c.value}`;
}

function countActiveFilters(state: DbvFilterState): number {
  let n = state.numeric.length + state.powerTypes.length + state.functionIcons.length;
  if (state.missionSet) n += 1;
  return n;
}

function buildChips(state: DbvFilterState, type: CatalogType): FilterChip[] {
  const config = getDbvFilterConfig(type);
  const chips: FilterChip[] = [];

  for (const c of state.numeric) {
    const def = config.numericFields?.find((f) => f.key === c.field);
    chips.push({
      id: numericChipId(c),
      kind: 'numeric',
      removeKey: numericChipId(c),
      label: `${def?.label ?? c.field} ${OP_LABELS[c.op]} ${c.value}`,
    });
  }

  for (const pt of state.powerTypes) {
    chips.push({ id: `power:${pt}`, kind: 'powerType', removeKey: pt, label: pt });
  }

  for (const field of state.functionIcons) {
    const def = FUNCTION_ICON_DEFS.find((d) => d.field === field);
    chips.push({
      id: `func:${field}`,
      kind: 'functionIcon',
      removeKey: field,
      label: def?.label ?? field,
    });
  }

  if (state.missionSet) {
    chips.push({
      id: `mission:${state.missionSet}`,
      kind: 'missionSet',
      removeKey: state.missionSet,
      label: state.missionSet,
    });
  }

  return chips;
}

export function useDbvFilters(catalogType: CatalogType, options: UseDbvFiltersOptions = {}) {
  const persistByCatalogType = options.persistByCatalogType === true;
  const [singleState, setSingleState] = useState<DbvFilterState>(EMPTY_DBV_FILTER_STATE);
  const [stateByType, setStateByType] = useState<Partial<Record<CatalogType, DbvFilterState>>>({});
  const hydratedCatalogTypeRef = useRef<CatalogType | null>(null);
  const state = persistByCatalogType
    ? stateByType[catalogType] ?? EMPTY_DBV_FILTER_STATE
    : singleState;

  const setCurrentState = useCallback(
    (updater: DbvFilterStateUpdater) => {
      if (!persistByCatalogType) {
        setSingleState(updater);
        return;
      }

      setStateByType((prev) => {
        const previousForType = prev[catalogType] ?? EMPTY_DBV_FILTER_STATE;
        const nextForType =
          typeof updater === 'function' ? updater(previousForType) : updater;
        return { ...prev, [catalogType]: nextForType };
      });
    },
    [catalogType, persistByCatalogType],
  );

  useEffect(() => {
    if (persistByCatalogType) return;
    if (shouldSkipDbvFilterReset(catalogType, hydratedCatalogTypeRef.current)) {
      hydratedCatalogTypeRef.current = null;
      return;
    }
    hydratedCatalogTypeRef.current = null;
    setSingleState(EMPTY_DBV_FILTER_STATE);
  }, [catalogType, persistByCatalogType]);

  const hydrateState = useCallback((nextState: DbvFilterState, targetCatalogType: CatalogType) => {
    const cloned = {
      numeric: nextState.numeric.map((constraint) => ({ ...constraint })),
      powerTypes: [...nextState.powerTypes],
      functionIcons: [...nextState.functionIcons],
      missionSet: nextState.missionSet,
    };
    if (persistByCatalogType) {
      setStateByType((prev) => ({ ...prev, [targetCatalogType]: cloned }));
      return;
    }
    hydratedCatalogTypeRef.current = targetCatalogType === catalogType ? null : targetCatalogType;
    setSingleState(cloned);
  }, [catalogType, persistByCatalogType]);

  const activeCount = useMemo(() => countActiveFilters(state), [state]);
  const chips = useMemo(() => buildChips(state, catalogType), [state, catalogType]);

  const clearAll = useCallback(() => setCurrentState(EMPTY_DBV_FILTER_STATE), [setCurrentState]);

  const removeChip = useCallback((chip: FilterChip) => {
    setCurrentState((prev) => {
      switch (chip.kind) {
        case 'numeric':
          return { ...prev, numeric: prev.numeric.filter((c) => numericChipId(c) !== chip.removeKey) };
        case 'powerType':
          return { ...prev, powerTypes: prev.powerTypes.filter((p) => p !== chip.removeKey) };
        case 'functionIcon':
          return {
            ...prev,
            functionIcons: prev.functionIcons.filter((f) => f !== chip.removeKey),
          };
        case 'missionSet':
          return { ...prev, missionSet: '' };
        default:
          return prev;
      }
    });
  }, [setCurrentState]);

  const togglePowerType = useCallback((powerType: string) => {
    setCurrentState((prev) => {
      const has = prev.powerTypes.includes(powerType);
      return {
        ...prev,
        powerTypes: has
          ? prev.powerTypes.filter((p) => p !== powerType)
          : [...prev.powerTypes, powerType],
      };
    });
  }, [setCurrentState]);

  const toggleFunctionIcon = useCallback((field: FunctionIconField) => {
    setCurrentState((prev) => {
      const has = prev.functionIcons.includes(field);
      return {
        ...prev,
        functionIcons: has
          ? prev.functionIcons.filter((f) => f !== field)
          : [...prev.functionIcons, field],
      };
    });
  }, [setCurrentState]);

  const setMissionSet = useCallback((missionSet: string) => {
    setCurrentState((prev) => ({ ...prev, missionSet }));
  }, [setCurrentState]);

  const upsertNumericConstraint = useCallback((field: string, op: CompareOp, value: number) => {
    setCurrentState((prev) => ({
      ...prev,
      numeric: [...prev.numeric.filter((c) => c.field !== field), { field, op, value }],
    }));
  }, [setCurrentState]);

  const removeNumericConstraint = useCallback((field: string) => {
    setCurrentState((prev) => ({
      ...prev,
      numeric: prev.numeric.filter((c) => c.field !== field),
    }));
  }, [setCurrentState]);

  const getNumericConstraint = useCallback(
    (field: string): NumericConstraint | undefined =>
      state.numeric.find((c) => c.field === field),
    [state.numeric],
  );

  return {
    state,
    activeCount,
    chips,
    clearAll,
    removeChip,
    togglePowerType,
    toggleFunctionIcon,
    setMissionSet,
    upsertNumericConstraint,
    removeNumericConstraint,
    getNumericConstraint,
    hydrateState,
  };
}

export type UseDbvFiltersReturn = ReturnType<typeof useDbvFilters>;
