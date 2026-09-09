import { useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
import type { CatalogCard, CatalogType, SetInfo } from '../../lib/api/types';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { CatalogFilterRail } from '../database/components/CatalogFilterRail';
import { DbvFunctionIconStrip } from '../database/components/DbvFunctionIconStrip';
import { DbvMissionSetSelect } from '../database/components/DbvMissionSetSelect';
import { DbvNumericStatInline } from '../database/components/DbvNumericStatInline';
import { DbvPowerTypeStrip } from '../database/components/DbvPowerTypeStrip';
import '../database/components/DbvFilterRail.css';
import { collectMissionSetOptions } from '../database/filters/dbvFilterPredicates';
import { getDbvFilterConfig } from '../database/filters/dbvFilterConfig';
import type { UseDbvFiltersReturn } from '../database/filters/useDbvFilters';

export interface AddCardsFilterBarProps {
  sets: SetInfo[];
  setFilter: string;
  onSetFilterChange: (value: string) => void;
  hideUnusables: boolean;
  onHideUnusablesChange: (checked: boolean) => void;
  hideUnusablesDisabled: boolean;
  hideUnusablesDisabledReason?: string;
  activeType: CatalogType | null;
  dynamicFilters: UseDbvFiltersReturn | null;
  dynamicFilterCards: CatalogCard[];
}

export function AddCardsFilterBar({
  sets,
  setFilter,
  onSetFilterChange,
  hideUnusables,
  onHideUnusablesChange,
  hideUnusablesDisabled,
  hideUnusablesDisabledReason,
  activeType,
  dynamicFilters,
  dynamicFilterCards,
}: AddCardsFilterBarProps) {
  const { isMobile } = useLayoutMode();
  const [mobileFilterPaneExpanded, setMobileFilterPaneExpanded] = useState(false);
  const dynamicConfig = activeType ? getDbvFilterConfig(activeType) : null;
  const hasDynamicFilters = Boolean(
    activeType &&
      dynamicFilters &&
      dynamicConfig &&
      dynamicConfig.groups.length > 0,
  );
  const missionSetOptions =
    dynamicConfig?.groups.includes('missionSet') && dynamicFilterCards.length > 0
      ? collectMissionSetOptions(dynamicFilterCards)
      : [];
  const clearButton =
    dynamicFilters && dynamicFilters.activeCount > 0 ? (
      <button
        type="button"
        className="add-cards__dynamic-clear"
        onClick={dynamicFilters.clearAll}
      >
        Clear
      </button>
    ) : null;

  const setAndUsabilityControls = (
    <div className="add-cards__filters-row">
      <div className="add-cards__filters-block">
        <label className="add-cards__filters-label" htmlFor="add-cards-set-filter">
          Set
        </label>
        <select
          id="add-cards-set-filter"
          className="add-cards__filters-select"
          value={setFilter}
          onChange={(e) => onSetFilterChange(e.target.value)}
          aria-label="Filter by set"
        >
          <option value="">All sets</option>
          {sets.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name || s.code}
            </option>
          ))}
        </select>
      </div>
      <div
        className="add-cards__filters-block add-cards__filters-block--toggle"
        title={hideUnusablesDisabled ? hideUnusablesDisabledReason : undefined}
      >
        <Checkbox
          className="add-cards__filters-toggle"
          label="Hide Unusables"
          checked={hideUnusables}
          disabled={hideUnusablesDisabled}
          onChange={onHideUnusablesChange}
        />
      </div>
    </div>
  );

  const dynamicControls = hasDynamicFilters && dynamicConfig && dynamicFilters ? (
    <div
      className={`add-cards__dynamic-filters add-cards__dynamic-filters--${activeType}`}
      aria-label="Type-specific filters"
    >
      {dynamicConfig.groups.includes('numeric') && dynamicConfig.numericFields ? (
        <DbvNumericStatInline
          fields={dynamicConfig.numericFields}
          filters={dynamicFilters}
          trailingAction={clearButton}
        />
      ) : null}

      {dynamicConfig.groups.includes('powerTypes') && dynamicConfig.powerTypeKeys ? (
        <div className="add-cards__dynamic-group">
          <span className="add-cards__filters-label">Type</span>
          <DbvPowerTypeStrip powerTypeKeys={dynamicConfig.powerTypeKeys} filters={dynamicFilters} />
        </div>
      ) : null}

      {dynamicConfig.groups.includes('functionIcons') ? (
        <div className="add-cards__dynamic-group">
          <span className="add-cards__filters-label">Function</span>
          <DbvFunctionIconStrip filters={dynamicFilters} />
        </div>
      ) : null}

      {dynamicConfig.groups.includes('missionSet') ? (
        <DbvMissionSetSelect options={missionSetOptions} filters={dynamicFilters} />
      ) : null}

      {dynamicConfig.groups.includes('numeric') ? null : clearButton}
    </div>
  ) : null;

  if (isMobile) {
    return (
      <CatalogFilterRail
        ariaLabel="Add cards filters"
        className="add-cards__filter-rail"
        collapsed={!mobileFilterPaneExpanded}
        onCollapsedChange={(collapsed) => setMobileFilterPaneExpanded(!collapsed)}
        controls={dynamicControls}
        trailing={setAndUsabilityControls}
      />
    );
  }

  return (
    <div className="add-cards__filters" aria-label="Add cards filters">
      {setAndUsabilityControls}
      {dynamicControls}
    </div>
  );
}
