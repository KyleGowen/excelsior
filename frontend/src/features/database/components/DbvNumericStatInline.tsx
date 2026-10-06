import { useImageAssets } from '../../../lib/images/useImageAssets';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CompareOp, NumericFieldDef } from '../filters/dbvFilterTypes';
import { OP_LABELS, STAT_ICON_PATHS } from '../filters/dbvFilterTypes';
import type { UseDbvFiltersReturn } from '../filters/useDbvFilters';

interface DbvNumericStatInlineProps {
  fields: NumericFieldDef[];
  filters: UseDbvFiltersReturn;
  trailingAction?: ReactNode;
}

function StatCell({
  field,
  filters,
}: {
  field: NumericFieldDef;
  filters: UseDbvFiltersReturn;
}) {
  const { assetUrl } = useImageAssets();
  const existing = filters.getNumericConstraint(field.key);
  const [op, setOp] = useState<CompareOp>(existing?.op ?? 'eq');
  const [value, setValue] = useState(existing?.value?.toString() ?? '');

  useEffect(() => {
    const c = filters.getNumericConstraint(field.key);
    setOp(c?.op ?? 'eq');
    setValue(c?.value?.toString() ?? '');
  }, [field.key, filters.state.numeric]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const applyValue = (raw: string, nextOp: CompareOp = op) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      filters.removeNumericConstraint(field.key);
      return;
    }
    const n = parseInt(trimmed, 10);
    if (Number.isNaN(n)) return;
    filters.upsertNumericConstraint(field.key, nextOp, n);
  };

  const scheduleApplyValue = (raw: string, nextOp: CompareOp = op) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyValue(raw, nextOp), 250);
  };

  const iconPath = STAT_ICON_PATHS[field.icon ?? field.key];
  const isMp = field.key === 'Multi-Power';
  const hasFilter = Boolean(filters.getNumericConstraint(field.key));

  return (
    <div className={`dbv-stat-cell ${hasFilter ? 'has-filter' : ''}`}>
      <div className="dbv-stat-cell__icon" title={field.label}>
        {isMp ? (
          <span className="dbv-stat-cell__mp">MP</span>
        ) : iconPath ? (
          <img src={assetUrl(iconPath)} alt="" />
        ) : (
          <span className="dbv-stat-cell__abbr">{field.label.slice(0, 1)}</span>
        )}
        <span className="sr-only">{field.label}</span>
      </div>
      <select
        className="dbv-stat-cell__op"
        value={op}
        aria-label={`${field.label} comparison`}
        onChange={(e) => {
          const nextOp = e.target.value as CompareOp;
          setOp(nextOp);
          if (value.trim()) scheduleApplyValue(value, nextOp);
        }}
      >
        {(Object.keys(OP_LABELS) as CompareOp[]).map((k) => (
          <option key={k} value={k}>
            {OP_LABELS[k]}
          </option>
        ))}
      </select>
      <input
        type="number"
        className="dbv-stat-cell__value"
        min={field.min}
        max={field.max}
        value={value}
        placeholder="—"
        aria-label={`${field.label} value`}
        onChange={(e) => {
          setValue(e.target.value);
          scheduleApplyValue(e.target.value);
        }}
      />
    </div>
  );
}

export function DbvNumericStatInline({ fields, filters, trailingAction }: DbvNumericStatInlineProps) {
  return (
    <div className="dbv-stat-inline" role="group" aria-label="Stat filters">
      {fields.map((field) => (
        <StatCell key={field.key} field={field} filters={filters} />
      ))}
      {trailingAction}
    </div>
  );
}
