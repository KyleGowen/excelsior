import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CatalogType } from '../../lib/api/types';
import type { CountEntry } from '../../lib/tournaments/types';
import type { DashboardTileVariant } from '../dashboard';
import { barMaxRowsForVariant, isDashboardRailVariant } from '../dashboard/dashboardTileVariants';
import { barColorAt, CHART_THEME } from './chartTheme';
import './TournamentCharts.css';

export interface BarChartDatum {
  name: string;
  count: number;
  catalogType: CatalogType;
  clickable: boolean;
}

interface TournamentBarChartProps {
  data: CountEntry[];
  limit?: number;
  compact?: boolean;
  /** Fill parent art zone (deck-tile proportions); truncates to maxRows. */
  fillContainer?: boolean;
  maxRows?: number;
  onSegmentClick?: (entry: CountEntry) => void;
  isClickable?: (entry: CountEntry) => boolean;
  /** Optional extra tooltip lines (e.g. homebase top8). */
  tooltipExtra?: (entry: CountEntry) => string[] | undefined;
  tileVariant?: DashboardTileVariant;
}

function truncateLabel(name: string, max = 16): string {
  if (name.length <= max) return name;
  return `${name.slice(0, Math.max(1, max - 1))}…`;
}

export function TournamentBarChart({
  data,
  limit,
  compact: _compactOverride = false,
  fillContainer = false,
  maxRows,
  onSegmentClick,
  isClickable,
  tooltipExtra,
  tileVariant = 'rail',
}: TournamentBarChartProps) {
  const compact = _compactOverride || isDashboardRailVariant(tileVariant);
  const effectiveMaxRows = maxRows ?? barMaxRowsForVariant(tileVariant, !isDashboardRailVariant(tileVariant));
  const capped = limit ? data.slice(0, limit) : data;
  const slice = fillContainer ? capped.slice(0, effectiveMaxRows) : capped;
  const chartData: BarChartDatum[] = slice.map((entry) => ({
    name: entry.name,
    count: entry.count,
    catalogType: entry.catalogType,
    clickable: isClickable ? isClickable(entry) : true,
  }));

  const height = fillContainer
    ? '100%'
    : compact
      ? Math.max(140, slice.length * 28 + 16)
      : Math.max(200, slice.length * 32 + 24);

  const yAxisWidth = fillContainer ? 88 : compact ? 72 : 96;
  const tickFontSize = fillContainer ? 10 : CHART_THEME.axisTickFontSize;
  const labelMax = fillContainer ? 14 : compact ? 12 : 14;

  return (
    <div
      className={[
        'tournament-bar-chart',
        compact ? 'tournament-bar-chart--compact' : '',
        fillContainer ? 'tournament-bar-chart--fill' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={fillContainer ? { top: 2, right: 6, left: 0, bottom: 2 } : { top: 4, right: 8, left: 4, bottom: 4 }}
        >
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            interval={0}
            tick={{ fill: CHART_THEME.axisTick, fontSize: tickFontSize }}
            tickFormatter={(v: string) => truncateLabel(v, labelMax)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ fill: 'rgba(0, 200, 232, 0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as BarChartDatum;
              const entry = data.find((d) => d.name === row.name);
              const extras = entry && tooltipExtra ? tooltipExtra(entry) : undefined;
              return (
                <div className="tournament-chart-tooltip">
                  <strong>{row.name}</strong>
                  <span>{row.count}</span>
                  {extras?.map((line) => (
                    <span key={line} className="tournament-chart-tooltip__extra">{line}</span>
                  ))}
                </div>
              );
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            minPointSize={3}
            maxBarSize={fillContainer ? 18 : undefined}
            onClick={(barData) => {
              const payload = barData as { payload?: BarChartDatum };
              const row = payload.payload;
              if (!row?.clickable || !onSegmentClick) return;
              const entry = data.find((d) => d.name === row.name);
              if (entry) onSegmentClick(entry);
            }}
          >
            {chartData.map((row, i) => (
              <Cell
                key={row.name}
                fill={barColorAt(i)}
                className={row.clickable ? 'tournament-bar-chart__cell--clickable' : 'tournament-bar-chart__cell--muted'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
