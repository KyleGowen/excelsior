import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { CatalogType } from '../../lib/api/types';
import type { CountEntry } from '../../lib/tournaments/types';
import type { DashboardTileVariant } from '../dashboard';
import { isDashboardRailVariant, pieSizingForVariant } from '../dashboard/dashboardTileVariants';
import { barColorAt, CHART_THEME } from './chartTheme';
import './TournamentCharts.css';

interface PieDatum {
  name: string;
  count: number;
  catalogType: CatalogType;
  clickable: boolean;
}

interface TournamentPieChartProps {
  data: CountEntry[];
  compact?: boolean;
  fillContainer?: boolean;
  showLegend?: boolean;
  /** Small leader-line labels on slices (default: true when legend is hidden). */
  showPortionLabels?: boolean;
  onSegmentClick?: (entry: CountEntry) => void;
  isClickable?: (entry: CountEntry) => boolean;
  tileVariant?: DashboardTileVariant;
}

function truncateLabel(name: string, max: number): string {
  if (name.length <= max) return name;
  return `${name.slice(0, Math.max(1, max - 1))}…`;
}

function renderPortionLabel(
  maxChars: number,
  minPercent: number,
  pushToEdge: boolean,
  sliceCount: number,
) {
  return function PortionLabel(props: PieLabelRenderProps) {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      outerRadius = 0,
      percent = 0,
      name = '',
      fill = CHART_THEME.axisTick,
    } = props;

    if (percent < minPercent) return null;

    const RADIAN = Math.PI / 180;
    let angle = -midAngle * RADIAN;

    // Two-slice pies: stagger labels off the vertical axis (top-right, bottom-left).
    if (sliceCount === 2) {
      const staggerRad = 0.38;
      const sinBefore = Math.sin(angle);
      if (Math.abs(sinBefore) > 0.5) {
        // Same clockwise offset: top slice drifts right, bottom slice drifts left.
        angle += staggerRad;
      }
    }

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const sliceEdge = Number(outerRadius);
    const centerX = Number(cx);
    const centerY = Number(cy);

    // Radial reach scales with chart radius; preview tiles push labels toward the art edge.
    const labelReach = pushToEdge ? 2.12 : 1.62;
    const lineGap = 4;
    const fontSize = Math.round(Math.min(13, Math.max(10, sliceEdge * 0.105)));

    const labelRadius = sliceEdge * labelReach;
    const sx = centerX + (sliceEdge + 1) * cos;
    const sy = centerY + (sliceEdge + 1) * sin;
    const textX = centerX + labelRadius * cos;
    const textY = centerY + labelRadius * sin;
    const lineEndX = centerX + (labelRadius - lineGap) * cos;
    const lineEndY = centerY + (labelRadius - lineGap) * sin;

    const absCos = Math.abs(cos);
    let textAnchor: 'start' | 'end' | 'middle' = 'middle';
    let textNudge = 0;
    if (sliceCount === 2) {
      textAnchor = cos >= 0 ? 'start' : 'end';
      textNudge = cos >= 0 ? 3 : -3;
    } else if (absCos > 0.35) {
      textAnchor = cos > 0 ? 'start' : 'end';
      textNudge = cos > 0 ? 3 : -3;
    }

    return (
      <g className="tournament-pie-chart__portion">
        <path
          d={`M${sx},${sy}L${lineEndX},${lineEndY}`}
          className="tournament-pie-chart__portion-line"
          stroke={String(fill)}
          strokeWidth={1.25}
          fill="none"
        />
        <text
          x={textX + textNudge}
          y={textY}
          className="tournament-pie-chart__portion-label"
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={fontSize}
        >
          {truncateLabel(String(name), maxChars)}
        </text>
      </g>
    );
  };
}

export function TournamentPieChart({
  data,
  compact: _compactOverride = false,
  fillContainer = false,
  showLegend = true,
  showPortionLabels,
  onSegmentClick,
  isClickable,
  tileVariant = 'rail',
}: TournamentPieChartProps) {
  const compact = _compactOverride || isDashboardRailVariant(tileVariant);
  const portionLabels = showPortionLabels ?? !showLegend;

  const chartData: PieDatum[] = data.map((entry) => ({
    name: entry.name,
    count: entry.count,
    catalogType: entry.catalogType,
    clickable: isClickable ? isClickable(entry) : true,
  }));

  const outerRadius = portionLabels && fillContainer
    ? pieSizingForVariant(tileVariant, true, true).outer
    : fillContainer
      ? pieSizingForVariant(tileVariant, false, true).outer
      : compact
        ? 58
        : 88;
  const innerRadius = fillContainer
    ? pieSizingForVariant(tileVariant, portionLabels, true).inner
    : compact
      ? 28
      : 44;
  const chartHeight = fillContainer ? '100%' : compact ? 150 : 220;
  const labelMaxChars = fillContainer ? 9 : compact ? 11 : 14;
  const minLabelPercent = chartData.length > 4 ? 0.06 : 0.04;

  return (
    <div
      className={[
        'tournament-pie-chart',
        compact ? 'tournament-pie-chart--compact' : '',
        fillContainer ? 'tournament-pie-chart--fill' : '',
        portionLabels ? 'tournament-pie-chart--labeled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart
          margin={
            portionLabels
              ? { top: 2, right: 2, bottom: 2, left: 2 }
              : { top: 0, right: 0, bottom: 0, left: 0 }
          }
        >
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            paddingAngle={2}
            stroke={CHART_THEME.pieStroke}
            strokeWidth={2}
            isAnimationActive={false}
            label={
              portionLabels
                ? renderPortionLabel(labelMaxChars, minLabelPercent, fillContainer, chartData.length)
                : false
            }
            labelLine={false}
            onClick={(_, index) => {
              const row = chartData[index];
              if (!row?.clickable || !onSegmentClick) return;
              const entry = data.find((d) => d.name === row.name);
              if (entry) onSegmentClick(entry);
            }}
          >
            {chartData.map((row, i) => (
              <Cell
                key={row.name}
                fill={barColorAt(i)}
                className={row.clickable ? 'tournament-pie-chart__cell--clickable' : 'tournament-pie-chart__cell--muted'}
              />
            ))}
          </Pie>
          <Tooltip
            isAnimationActive={false}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as PieDatum;
              return (
                <div className="tournament-chart-tooltip">
                  <strong>{row.name}</strong>
                  <span>{row.count}</span>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {showLegend ? (
        <ul className="tournament-pie-chart__legend" aria-hidden="true">
          {chartData.map((row, i) => (
            <li key={row.name}>
              <span className="tournament-pie-chart__swatch" style={{ background: barColorAt(i) }} />
              <span className="tournament-pie-chart__legend-label">{row.name}</span>
              <span className="tournament-pie-chart__legend-count">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
