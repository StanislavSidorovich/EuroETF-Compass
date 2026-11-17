import { useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, ShieldAlert, TrendingUp } from 'lucide-react';
import type { ChartTimelinePoint, CountryTaxRule } from '../../types';

export type ForecastHorizonOption = 3 | 5 | 10 | 15 | 20;

export interface PerformanceChartProps {
  timelineSeries: ChartTimelinePoint[];
  country: CountryTaxRule;
  historicalCagr5YPct: number;
  historicalCagr3YPct: number;
  volatilityPct: number;
  selectedHorizonYears?: ForecastHorizonOption;
  onSelectHorizonYears?: (horizon: ForecastHorizonOption) => void;
}

const HORIZON_OPTIONS: ForecastHorizonOption[] = [3, 5, 10, 15, 20];

const SVG_WIDTH = 960;
const SVG_HEIGHT = 435;
const PAD_LEFT = 76;
const PAD_RIGHT = 32;
const PAD_TOP = 54;
const PAD_BOTTOM = 44;
const PLOT_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

function formatEurCompact(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    const m = val / 1_000_000;
    return `€${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, '')}M`;
  }
  if (Math.abs(val) >= 1_000) {
    const k = val / 1_000;
    return `€${k >= 100 || k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `€${Math.round(val)}`;
}

function formatEurFull(val: number): string {
  return `€${val.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function computeNiceYScale(rawMax: number): { yMax: number; ticks: number[] } {
  const safeMax = Math.max(100, rawMax);
  const rawStep = (safeMax * 1.08) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceFractions = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const chosen = niceFractions.find((f) => f >= normalized) ?? 10;
  const step = chosen * magnitude;
  const yMax = step * 4;
  return {
    yMax,
    ticks: [0, step, step * 2, step * 3, yMax],
  };
}

function buildLinePath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  return coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ');
}

function buildAreaPath(
  coords: Array<{ x: number; y: number }>,
  baselineY: number
): string {
  if (coords.length === 0) return '';
  const line = buildLinePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${line} L ${last.x.toFixed(2)} ${baselineY.toFixed(2)} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
}

function formatYearOffsetLabel(yearOffset: number): string {
  if (Math.abs(yearOffset) < 0.05) return 'TODAY';
  if (yearOffset < 0) {
    const abs = Math.abs(yearOffset);
    return Number.isInteger(abs) ? `-${abs}Y` : `-${abs.toFixed(1)}Y`;
  }
  return `+${yearOffset}Y`;
}

export function PerformanceChart({
  timelineSeries,
  country,
  historicalCagr5YPct,
  historicalCagr3YPct,
  volatilityPct,
  selectedHorizonYears,
  onSelectHorizonYears,
}: PerformanceChartProps) {
  const [internalHorizon, setInternalHorizon] = useState<ForecastHorizonOption>(10);
  const [showDistNet, setShowDistNet] = useState(true);
  const [showPostTax, setShowPostTax] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const horizonYears = selectedHorizonYears ?? internalHorizon;
  const setHorizonYears = (h: ForecastHorizonOption) => {
    setInternalHorizon(h);
    onSelectHorizonYears?.(h);
  };

  const visibleSeries = useMemo(
    () => timelineSeries.filter((pt) => pt.yearOffset <= horizonYears),
    [timelineSeries, horizonYears]
  );

  const minYear = useMemo(() => {
    const first = visibleSeries[0]?.yearOffset ?? -5;
    return Math.min(-0.5, first);
  }, [visibleSeries]);

  const maxYear = horizonYears;

  const { yMax, yTicks } = useMemo(() => {
    let maxFound = 0;
    for (const pt of visibleSeries) {
      maxFound = Math.max(
        maxFound,
        pt.totalInvestedEur,
        pt.historicalValueEur ?? 0,
        showDistNet ? pt.historicalDistNetEur ?? 0 : 0,
        pt.forecastBaseEur ?? 0,
        pt.forecastOptimisticEur ?? 0,
        pt.forecastConservativeEur ?? 0,
        showPostTax ? pt.forecastPostTaxBaseEur ?? 0 : 0
      );
    }
    const { yMax: computedMax, ticks } = computeNiceYScale(maxFound);
    return { yMax: computedMax, yTicks: ticks };
  }, [visibleSeries, showDistNet, showPostTax]);

  const xScale = (yearOffset: number): number => {
    const span = Math.max(0.5, maxYear - minYear);
    return PAD_LEFT + ((yearOffset - minYear) / span) * PLOT_WIDTH;
  };

  const yScale = (val: number): number => {
    const clamped = Math.max(0, val);
    return PAD_TOP + PLOT_HEIGHT - (clamped / yMax) * PLOT_HEIGHT;
  };

  const baselineY = yScale(0);
  const todayX = xScale(0);

  const historicalPoints = useMemo(
    () => visibleSeries.filter((p) => typeof p.historicalValueEur === 'number'),
    [visibleSeries]
  );

  const forecastPoints = useMemo(
    () => visibleSeries.filter((p) => typeof p.forecastBaseEur === 'number'),
    [visibleSeries]
  );

  // Locate -5Y (or earliest entry) and -3Y entry markers inside historical points
  const entry5YPoint = historicalPoints.length > 0 ? historicalPoints[0] : null;
  const entry3YPoint = useMemo(() => {
    if (minYear > -2.75 || historicalPoints.length === 0) return null;
    let best = historicalPoints[0];
    let bestDiff = Math.abs(best.yearOffset - -3);
    for (const pt of historicalPoints) {
      const diff = Math.abs(pt.yearOffset - -3);
      if (diff < bestDiff) {
        best = pt;
        bestDiff = diff;
      }
    }
    return best;
  }, [historicalPoints, minYear]);

  const todayPoint = useMemo(() => {
    if (historicalPoints.length === 0) return null;
    return historicalPoints[historicalPoints.length - 1];
  }, [historicalPoints]);

  // SVG Paths
  const investedCoords = useMemo(
    () =>
      visibleSeries.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.totalInvestedEur),
      })),
    [visibleSeries, minYear, maxYear, yMax]
  );

  const histGrossCoords = useMemo(
    () =>
      historicalPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.historicalValueEur ?? 0),
      })),
    [historicalPoints, minYear, maxYear, yMax]
  );

  const histDistCoords = useMemo(
    () =>
      historicalPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.historicalDistNetEur ?? 0),
      })),
    [historicalPoints, minYear, maxYear, yMax]
  );

  const forecastBaseCoords = useMemo(
    () =>
      forecastPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.forecastBaseEur ?? 0),
      })),
    [forecastPoints, minYear, maxYear, yMax]
  );

  const forecastOptCoords = useMemo(
    () =>
      forecastPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.forecastOptimisticEur ?? 0),
      })),
    [forecastPoints, minYear, maxYear, yMax]
  );

  const forecastConsCoords = useMemo(
    () =>
      forecastPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.forecastConservativeEur ?? 0),
      })),
    [forecastPoints, minYear, maxYear, yMax]
  );

  const forecastPostTaxCoords = useMemo(
    () =>
      forecastPoints.map((pt) => ({
        x: xScale(pt.yearOffset),
        y: yScale(pt.forecastPostTaxBaseEur ?? 0),
      })),
    [forecastPoints, minYear, maxYear, yMax]
  );

  const confidenceConePath = useMemo(() => {
    if (forecastOptCoords.length < 2 || forecastConsCoords.length < 2) return '';
    const upper = buildLinePath(forecastOptCoords);
    const lowerReversed = [...forecastConsCoords]
      .reverse()
      .map((pt) => `L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ');
    return `${upper} ${lowerReversed} Z`;
  }, [forecastOptCoords, forecastConsCoords]);

  const xAxisTicks = useMemo(() => {
    const forwardTicksByHorizon: Record<ForecastHorizonOption, number[]> = {
      3: [1, 2, 3],
      5: [1, 2, 3, 4, 5],
      10: [3, 5, 10],
      15: [5, 10, 15],
      20: [5, 10, 15, 20],
    };

    const rawTicks: Array<{ year: number; label: string }> = [
      {
        year: minYear,
        label: minYear <= -4.75 ? '-5Y' : formatYearOffsetLabel(minYear),
      },
    ];

    if (entry3YPoint && Math.abs(minYear - entry3YPoint.yearOffset) >= 1.2) {
      rawTicks.push({ year: entry3YPoint.yearOffset, label: '-3Y' });
    }

    rawTicks.push({ year: 0, label: 'TODAY' });

    for (const fy of forwardTicksByHorizon[horizonYears]) {
      rawTicks.push({ year: fy, label: `+${fy}Y` });
    }

    return rawTicks;
  }, [minYear, entry3YPoint, horizonYears]);

  const handlePointerAtClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || visibleSeries.length === 0) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return;

    const svgX = ((clientX - rect.left) / rect.width) * SVG_WIDTH;
    const clampedX = Math.max(PAD_LEFT, Math.min(SVG_WIDTH - PAD_RIGHT, svgX));
    const targetYear = minYear + ((clampedX - PAD_LEFT) / PLOT_WIDTH) * (maxYear - minYear);

    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < visibleSeries.length; i += 1) {
      const dist = Math.abs(visibleSeries[i].yearOffset - targetYear);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    setHoveredIndex(closestIdx);
  };

  const hoveredPoint =
    hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < visibleSeries.length
      ? visibleSeries[hoveredIndex]
      : null;

  const hoveredX = hoveredPoint ? xScale(hoveredPoint.yearOffset) : 0;
  const flipTooltipLeft = hoveredX > SVG_WIDTH * 0.56;

  const todayBadgeX = Math.max(PAD_LEFT + 62, Math.min(SVG_WIDTH - PAD_RIGHT - 62, todayX));

  return (
    <div className="fintech-card overflow-hidden rounded-2xl">
      {/* Header & Horizon Controls */}
      <div className="border-b border-slate-800/90 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100 sm:text-lg">
                5Y Historical Backtest &amp; {horizonYears}Y Compounding Forecast
              </h3>
              <span className="rounded-full border border-slate-700 bg-slate-800/90 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                {country.flag} {country.name} Tax Model
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Blended Historical CAGR:{' '}
              <span className="font-mono font-semibold text-emerald-300">
                {historicalCagr5YPct >= 0 ? '+' : ''}
                {historicalCagr5YPct.toFixed(2)}%/yr (5Y)
              </span>{' '}
              ·{' '}
              <span className="font-mono font-semibold text-sky-300">
                {historicalCagr3YPct >= 0 ? '+' : ''}
                {historicalCagr3YPct.toFixed(2)}%/yr (3Y)
              </span>{' '}
              · Realized Volatility:{' '}
              <span className="font-mono font-semibold text-slate-200">
                ±{volatilityPct.toFixed(1)}%/yr
              </span>
            </p>
          </div>

          {/* Forecast Horizon Zoom Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-slate-400">Forecast Horizon:</span>
            {HORIZON_OPTIONS.map((h) => {
              const active = horizonYears === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonYears(h)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                    active
                      ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30'
                      : 'border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-sky-500/50 hover:text-sky-200'
                  }`}
                >
                  +{h}Y
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Legend Row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
            <span className="h-0.5 w-4 rounded-full bg-emerald-400" />
            Historical Value (-5Y → Today)
          </div>

          <button
            type="button"
            onClick={() => setShowDistNet((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
              showDistNet
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-400" />
            Distributing Net (After Div Tax)
            {showDistNet ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-200">
            <span className="h-0.5 w-4 rounded-full bg-sky-400" />
            Forecast Base (Hist. CAGR) + Cone
          </div>

          <button
            type="button"
            onClick={() => setShowPostTax((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
              showPostTax
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span className="h-0.5 w-4 border-t-2 border-dashed border-violet-400" />
            Est. Net After-Tax ({country.code})
            {showPostTax ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-slate-300">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
            Total Invested Principal
          </div>
        </div>
      </div>

      {/* Responsive Interactive SVG Canvas */}
      <div className="relative w-full select-none bg-[#070b14] px-2 pb-2 pt-3 sm:px-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-auto w-full touch-none overflow-visible"
          role="img"
          aria-label={`Interactive portfolio chart showing 5-year historical backtest and ${horizonYears}-year forecast`}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="investedAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="forecastConeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* Phase Backdrop Shading */}
          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={Math.max(0, todayX - PAD_LEFT)}
            height={PLOT_HEIGHT}
            fill="rgba(16, 185, 129, 0.035)"
          />
          <rect
            x={todayX}
            y={PAD_TOP}
            width={Math.max(0, SVG_WIDTH - PAD_RIGHT - todayX)}
            height={PLOT_HEIGHT}
            fill="rgba(56, 189, 248, 0.035)"
          />

          {/* Phase Region Top Labels */}
          {todayX - PAD_LEFT > 120 && (
            <text
              x={PAD_LEFT + 8}
              y={PAD_TOP + 15}
              fill="#34d399"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.06em"
              opacity="0.75"
            >
              HISTORICAL REALITY
            </text>
          )}
          <text
            x={SVG_WIDTH - PAD_RIGHT - 8}
            y={PAD_TOP + 15}
            textAnchor="end"
            fill="#38bdf8"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.06em"
            opacity="0.75"
          >
            EDUCATIONAL PROJECTION MODEL
          </text>

          {/* Y-Axis Gridlines & Labels */}
          {yTicks.map((tickVal) => {
            const y = yScale(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeDasharray={tickVal === 0 ? undefined : '3 4'}
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                >
                  {formatEurCompact(tickVal)}
                </text>
              </g>
            );
          })}

          {/* X-Axis Labels */}
          {xAxisTicks.map((tick) => {
            const x = xScale(tick.year);
            const isToday = tick.label === 'TODAY';
            return (
              <g key={`${tick.label}-${tick.year}`}>
                <line
                  x1={x}
                  y1={baselineY}
                  x2={x}
                  y2={baselineY + 5}
                  stroke={isToday ? '#e2e8f0' : 'rgba(148, 163, 184, 0.45)'}
                  strokeWidth={isToday ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={baselineY + 21}
                  textAnchor="middle"
                  fill={isToday ? '#f8fafc' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={isToday ? '700' : '500'}
                  fontFamily="var(--font-mono)"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Total Invested Principal Area & Dashed Baseline */}
          {investedCoords.length >= 2 && (
            <>
              <path
                d={buildAreaPath(investedCoords, baselineY)}
                fill="url(#investedAreaGrad)"
              />
              <path
                d={buildLinePath(investedCoords)}
                fill="none"
                stroke="#64748b"
                strokeWidth={1.75}
                strokeDasharray="4 4"
              />
            </>
          )}

          {/* Shaded Forecast Confidence Fan (+Band to -Band) */}
          {confidenceConePath && (
            <path d={confidenceConePath} fill="url(#forecastConeGrad)" />
          )}
          {forecastOptCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastOptCoords)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.25}
              strokeDasharray="4 4"
              opacity={0.65}
            />
          )}
          {forecastConsCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastConsCoords)}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1.25}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          )}

          {/* Historical Area & Portfolio Value Curves */}
          {histGrossCoords.length >= 2 && (
            <path
              d={buildAreaPath(histGrossCoords, baselineY)}
              fill="url(#histAreaGrad)"
            />
          )}
          {showDistNet && histDistCoords.length >= 2 && (
            <path
              d={buildLinePath(histDistCoords)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
          {histGrossCoords.length >= 2 && (
            <path
              d={buildLinePath(histGrossCoords)}
              fill="none"
              stroke="#10b981"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Forecast Curves (Base Gross & Country Net After-Tax) */}
          {forecastBaseCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastBaseCoords)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {showPostTax && forecastPostTaxCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastPostTaxCoords)}
              fill="none"
              stroke="#a78bfa"
              strokeWidth={2.25}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}

          {/* -5Y Entry Marker */}
          {entry5YPoint && (
            <g>
              <line
                x1={xScale(entry5YPoint.yearOffset)}
                y1={yScale(entry5YPoint.historicalValueEur ?? 0)}
                x2={xScale(entry5YPoint.yearOffset)}
                y2={baselineY}
                stroke="rgba(16, 185, 129, 0.35)"
                strokeDasharray="2 3"
              />
              <circle
                cx={xScale(entry5YPoint.yearOffset)}
                cy={yScale(entry5YPoint.historicalValueEur ?? 0)}
                r={4.5}
                fill="#090d16"
                stroke="#10b981"
                strokeWidth={2.5}
              />
              <rect
                x={xScale(entry5YPoint.yearOffset) + 2}
                y={PAD_TOP + 24}
                width={56}
                height={18}
                rx={5}
                fill="rgba(16, 185, 129, 0.16)"
                stroke="rgba(16, 185, 129, 0.45)"
              />
              <text
                x={xScale(entry5YPoint.yearOffset) + 30}
                y={PAD_TOP + 36}
                textAnchor="middle"
                fill="#6ee7b7"
                fontSize="10"
                fontWeight="700"
              >
                {minYear <= -4.75 ? '-5Y Entry' : 'Start'}
              </text>
            </g>
          )}

          {/* -3Y Entry Marker */}
          {entry3YPoint && (
            <g>
              <line
                x1={xScale(entry3YPoint.yearOffset)}
                y1={yScale(entry3YPoint.historicalValueEur ?? 0)}
                x2={xScale(entry3YPoint.yearOffset)}
                y2={baselineY}
                stroke="rgba(56, 189, 248, 0.4)"
                strokeDasharray="2 3"
              />
              <circle
                cx={xScale(entry3YPoint.yearOffset)}
                cy={yScale(entry3YPoint.historicalValueEur ?? 0)}
                r={4.5}
                fill="#090d16"
                stroke="#38bdf8"
                strokeWidth={2.5}
              />
              <rect
                x={xScale(entry3YPoint.yearOffset) + 2}
                y={PAD_TOP + 24}
                width={56}
                height={18}
                rx={5}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="rgba(56, 189, 248, 0.45)"
              />
              <text
                x={xScale(entry3YPoint.yearOffset) + 30}
                y={PAD_TOP + 36}
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="10"
                fontWeight="700"
              >
                -3Y Entry
              </text>
            </g>
          )}

          {/* Vertical "TODAY (Live Price)" Divider Line */}
          <g>
            <line
              x1={todayX}
              y1={28}
              x2={todayX}
              y2={baselineY}
              stroke="#e2e8f0"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.85}
            />
            <rect
              x={todayBadgeX - 58}
              y={8}
              width={116}
              height={20}
              rx={999}
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth={1.2}
            />
            <text
              x={todayBadgeX}
              y={21.5}
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.03em"
            >
              TODAY (Live Price)
            </text>
            {todayPoint && (
              <circle
                cx={todayX}
                cy={yScale(todayPoint.historicalValueEur ?? 0)}
                r={5.5}
                fill="#10b981"
                stroke="#f8fafc"
                strokeWidth={2}
              />
            )}
          </g>

          {/* End-of-Horizon Endpoints */}
          {forecastPoints.length > 0 && (() => {
            const endPt = forecastPoints[forecastPoints.length - 1];
            const endX = xScale(endPt.yearOffset);
            return (
              <g>
                {typeof endPt.forecastOptimisticEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastOptimisticEur)}
                    r={3.5}
                    fill="#38bdf8"
                  />
                )}
                {typeof endPt.forecastBaseEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastBaseEur)}
                    r={4.5}
                    fill="#38bdf8"
                    stroke="#090d16"
                    strokeWidth={1.5}
                  />
                )}
                {showPostTax && typeof endPt.forecastPostTaxBaseEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastPostTaxBaseEur)}
                    r={4}
                    fill="#a78bfa"
                    stroke="#090d16"
                    strokeWidth={1.5}
                  />
                )}
                {typeof endPt.forecastConservativeEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastConservativeEur)}
                    r={3.5}
                    fill="#94a3b8"
                  />
                )}
              </g>
            );
          })()}

          {/* Interactive Crosshair & Active Dots */}
          {hoveredPoint && (
            <g pointerEvents="none">
              <line
                x1={hoveredX}
                y1={PAD_TOP}
                x2={hoveredX}
                y2={baselineY}
                stroke="rgba(226, 232, 240, 0.45)"
                strokeWidth={1}
              />
              <circle
                cx={hoveredX}
                cy={yScale(hoveredPoint.totalInvestedEur)}
                r={4}
                fill="#64748b"
                stroke="#f8fafc"
                strokeWidth={1.5}
              />
              {typeof hoveredPoint.historicalValueEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.historicalValueEur)}
                  r={5.5}
                  fill="#10b981"
                  stroke="#f8fafc"
                  strokeWidth={2}
                />
              )}
              {showDistNet && typeof hoveredPoint.historicalDistNetEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.historicalDistNetEur)}
                  r={4.5}
                  fill="#f59e0b"
                  stroke="#090d16"
                  strokeWidth={1.5}
                />
              )}
              {typeof hoveredPoint.forecastBaseEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.forecastBaseEur)}
                  r={5.5}
                  fill="#38bdf8"
                  stroke="#f8fafc"
                  strokeWidth={2}
                />
              )}
              {showPostTax && typeof hoveredPoint.forecastPostTaxBaseEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.forecastPostTaxBaseEur)}
                  r={4.5}
                  fill="#a78bfa"
                  stroke="#f8fafc"
                  strokeWidth={1.5}
                />
              )}
            </g>
          )}

          {/* Full Plot Hitbox for Mouse & Touch */}
          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="transparent"
            className="cursor-crosshair"
            onMouseMove={(e) => handlePointerAtClientX(e.clientX)}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) handlePointerAtClientX(t.clientX);
            }}
            onTouchMove={(e) => {
              const t = e.touches[0];
              if (t) handlePointerAtClientX(t.clientX);
            }}
          />
        </svg>

        {/* Interactive Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredX / SVG_WIDTH) * 100}%`,
              transform: flipTooltipLeft
                ? 'translateX(calc(-100% - 14px))'
                : 'translateX(14px)',
            }}
            className="pointer-events-none absolute top-14 z-20 w-64 rounded-xl border border-slate-700/90 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur-md sm:w-72"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-mono font-semibold text-slate-100">{hoveredPoint.date}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  hoveredPoint.phase === 'historical'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-sky-500/20 text-sky-300'
                }`}
              >
                {formatYearOffsetLabel(hoveredPoint.yearOffset)} ·{' '}
                {hoveredPoint.phase === 'historical' ? 'Historical' : 'Forecast'}
              </span>
            </div>

            <div className="mt-2 space-y-1.5 tabular-nums">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Invested:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {formatEurFull(hoveredPoint.totalInvestedEur)}
                </span>
              </div>

              {typeof hoveredPoint.historicalValueEur === 'number' && (() => {
                const histVal = hoveredPoint.historicalValueEur;
                if (typeof histVal !== 'number') return null;
                const profit = histVal - hoveredPoint.totalInvestedEur;
                const pct =
                  hoveredPoint.totalInvestedEur > 0
                    ? (profit / hoveredPoint.totalInvestedEur) * 100
                    : 0;
                return (
                  <>
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>Actual Value (Acc/Gross):</span>
                      <span className="font-mono font-bold">
                        {formatEurFull(histVal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>Historical Profit:</span>
                      <span
                        className={`font-mono font-semibold ${
                          profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {profit >= 0 ? '+' : ''}
                        {formatEurFull(profit)} ({pct >= 0 ? '+' : ''}
                        {pct.toFixed(1)}%)
                      </span>
                    </div>
                    {showDistNet &&
                      typeof hoveredPoint.historicalDistNetEur === 'number' && (
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Distributing Net ({country.code}):</span>
                          <span className="font-mono font-semibold">
                            {formatEurFull(hoveredPoint.historicalDistNetEur)}
                          </span>
                        </div>
                      )}
                  </>
                );
              })()}

              {typeof hoveredPoint.forecastBaseEur === 'number' && (
                <div
                  className={
                    typeof hoveredPoint.historicalValueEur === 'number'
                      ? 'mt-1.5 border-t border-slate-800 pt-1.5 space-y-1'
                      : 'space-y-1'
                  }
                >
                  {typeof hoveredPoint.forecastOptimisticEur === 'number' && (
                    <div className="flex items-center justify-between text-sky-200/80">
                      <span>Optimistic Band:</span>
                      <span className="font-mono">
                        {formatEurFull(hoveredPoint.forecastOptimisticEur)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sky-300">
                    <span>Base (Hist. CAGR):</span>
                    <span className="font-mono font-bold">
                      {formatEurFull(hoveredPoint.forecastBaseEur)}
                    </span>
                  </div>
                  {hoveredPoint.phase === 'forecast' && (() => {
                    const fBaseVal = hoveredPoint.forecastBaseEur;
                    if (typeof fBaseVal !== 'number') return null;
                    const fProfit = fBaseVal - hoveredPoint.totalInvestedEur;
                    const fPct =
                      hoveredPoint.totalInvestedEur > 0
                        ? (fProfit / hoveredPoint.totalInvestedEur) * 100
                        : 0;
                    return (
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Projected Gross Gain:</span>
                        <span className="font-mono font-semibold text-sky-300">
                          {fProfit >= 0 ? '+' : ''}
                          {formatEurFull(fProfit)} ({fPct >= 0 ? '+' : ''}
                          {fPct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}
                  {showPostTax &&
                    typeof hoveredPoint.forecastPostTaxBaseEur === 'number' && (
                      <div className="flex items-center justify-between text-violet-300">
                        <span>
                          Net After Tax ({country.flag} {country.code}):
                        </span>
                        <span className="font-mono font-bold">
                          {formatEurFull(hoveredPoint.forecastPostTaxBaseEur)}
                        </span>
                      </div>
                    )}
                  {typeof hoveredPoint.forecastConservativeEur === 'number' && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Conservative Band:</span>
                      <span className="font-mono">
                        {formatEurFull(hoveredPoint.forecastConservativeEur)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prominent High-Contrast Regulatory Warning Strip Inside Chart Card */}
      <div className="flex items-start gap-2.5 border-t border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs text-amber-100 sm:px-5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="font-medium leading-relaxed">
          IMPORTANT NOTICE: Historical investment ratings and past performance (3-year and 5-year
          lookbacks) are not promised or reliable indicators of future results. Future forecast
          cones are mathematical models for educational purposes only.
        </p>
      </div>
    </div>
  );
}
