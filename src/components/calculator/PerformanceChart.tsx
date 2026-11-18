import { useMemo, useRef, useState } from 'react';
import { BarChart3, Eye, EyeOff, ShieldAlert, TrendingUp } from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  ChartTimelinePoint,
  CountryTaxRule,
  ETFInstrument,
  LanguageMode,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';
import {
  PORTFOLIO_PRESET_SPECS,
  getInstrumentType,
  isPresetMatch,
  resolveCandidateAsset,
} from './etfSelectorHelpers';

export type ForecastHorizonOption = 3 | 5 | 10 | 15 | 20;

export interface PerformanceChartProps {
  timelineSeries: ChartTimelinePoint[];
  country: CountryTaxRule;
  etfs?: ETFInstrument[];
  allocations?: PortfolioAllocationItem[];
  onChangeAllocations?: (next: PortfolioAllocationItem[]) => void;
  historicalCagr5YPct: number;
  historicalCagr3YPct: number;
  volatilityPct: number;
  selectedHorizonYears?: ForecastHorizonOption;
  onSelectHorizonYears?: (horizon: ForecastHorizonOption) => void;
  theme?: ThemeMode;
}

const HORIZON_OPTIONS: ForecastHorizonOption[] = [3, 5, 10, 15, 20];

const SVG_WIDTH = 1040;
const SVG_HEIGHT = 435;
const PAD_LEFT = 74;
const PAD_RIGHT = 178;
const PAD_TOP = 54;
const PAD_BOTTOM = 44;
const PLOT_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_HEIGHT = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

interface RightEndpointLabelInput {
  id: string;
  rawY: number;
  label: string;
  valueText: string;
  color: string;
  bold?: boolean;
}

interface RightEndpointLabelLayout extends RightEndpointLabelInput {
  labelY: number;
}

/**
 * Resolves vertical overlap among right-edge line labels while keeping each
 * label inside [minY, maxY] and preserving top-to-bottom ordering.
 */
function resolveEndpointLabelPositions(
  items: RightEndpointLabelInput[],
  minY: number,
  maxY: number,
  minGap = 16
): RightEndpointLabelLayout[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.rawY - b.rawY);
  const ys = sorted.map((item) => Math.max(minY, Math.min(maxY, item.rawY)));

  for (let i = 1; i < ys.length; i += 1) {
    if (ys[i] - ys[i - 1] < minGap) {
      ys[i] = ys[i - 1] + minGap;
    }
  }

  if (ys[ys.length - 1] > maxY) {
    ys[ys.length - 1] = maxY;
    for (let i = ys.length - 2; i >= 0; i -= 1) {
      if (ys[i + 1] - ys[i] < minGap) {
        ys[i] = ys[i + 1] - minGap;
      }
    }
  }

  return sorted.map((item, idx) => ({
    ...item,
    labelY: Math.max(minY, Math.min(maxY, ys[idx])),
  }));
}

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

function formatYearOffsetLabel(yearOffset: number, lang: LanguageMode): string {
  if (Math.abs(yearOffset) < 0.05) return tr(lang, 'TODAY', 'СЕГОДНЯ');
  if (yearOffset < 0) {
    const abs = Math.abs(yearOffset);
    return Number.isInteger(abs) ? `-${abs}Y` : `-${abs.toFixed(1)}Y`;
  }
  return `+${yearOffset}Y`;
}

export function PerformanceChart({
  timelineSeries,
  country,
  etfs = [],
  allocations = [],
  onChangeAllocations,
  historicalCagr5YPct,
  historicalCagr3YPct,
  volatilityPct,
  selectedHorizonYears,
  onSelectHorizonYears,
  theme,
}: PerformanceChartProps) {
  const { lang, theme: ctxTheme } = useAppPreferences();
  const isLight = (theme ?? ctxTheme) === 'light';

  const [internalHorizon, setInternalHorizon] = useState<ForecastHorizonOption>(10);
  const [showDistNet, setShowDistNet] = useState(true);
  const [showPostTax, setShowPostTax] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Refined sage/forest green palette & theme-adaptive chart tokens
  const histColor = 'var(--ui-chart-sage-stroke)';
  const histLabelColor = isLight ? '#1f6e4b' : '#86d6b0';
  const histBadgeBg = isLight ? 'rgba(45, 138, 97, 0.11)' : 'rgba(59, 155, 114, 0.16)';
  const histBadgeStroke = isLight ? 'rgba(45, 138, 97, 0.42)' : 'rgba(59, 155, 114, 0.45)';
  const forecastColor = isLight ? '#486178' : '#7792ab';
  const forecastLabelColor = isLight ? '#3b4f63' : '#9fb3c6';
  const postTaxColor = isLight ? '#8a6d3b' : '#c8a04e';
  const distColor = isLight ? '#94702e' : '#b3893a';
  const investedColor = isLight ? '#64748b' : '#94a3b8';
  const axisTextColor = isLight ? '#334155' : '#cbd5e1';
  const axisMutedColor = 'var(--ui-chart-text-muted)';
  const dotInnerFill = isLight ? '#ffffff' : '#0f172a';
  const dotOuterStroke = isLight ? '#ffffff' : '#f8fafc';
  const gridStroke = isLight ? 'rgba(51, 65, 85, 0.14)' : 'rgba(203, 213, 225, 0.14)';
  const todayLineStroke = isLight ? '#334155' : '#cbd5e1';

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

  const todayTickLabel = tr(lang, 'TODAY', 'СЕГОДНЯ');

  const xAxisTicks = useMemo(() => {
    const forwardTicksByHorizon: Record<ForecastHorizonOption, number[]> = {
      3: [1, 2, 3],
      5: [1, 2, 3, 4, 5],
      10: [3, 5, 10],
      15: [5, 10, 15],
      20: [5, 10, 15, 20],
    };

    const rawTicks: Array<{ year: number; label: string; isToday?: boolean }> = [
      {
        year: minYear,
        label: minYear <= -4.75 ? '-5Y' : formatYearOffsetLabel(minYear, lang),
      },
    ];

    if (entry3YPoint && Math.abs(minYear - entry3YPoint.yearOffset) >= 1.2) {
      rawTicks.push({ year: entry3YPoint.yearOffset, label: '-3Y' });
    }

    rawTicks.push({ year: 0, label: todayTickLabel, isToday: true });

    for (const fy of forwardTicksByHorizon[horizonYears]) {
      rawTicks.push({ year: fy, label: `+${fy}Y` });
    }

    return rawTicks;
  }, [minYear, entry3YPoint, horizonYears, lang, todayTickLabel]);

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

  const todayBadgeX = Math.max(PAD_LEFT + 98, Math.min(SVG_WIDTH - PAD_RIGHT - 98, todayX));

  const etfById = useMemo(() => new Map(etfs.map((e) => [e.id, e])), [etfs]);

  const activeHoldings = useMemo(() => {
    const valid = allocations
      .map((a) => {
        const etf = etfById.get(a.etfId);
        if (!etf || a.weightPct <= 0) return null;
        return { etf, rawWeight: a.weightPct };
      })
      .filter((x): x is { etf: ETFInstrument; rawWeight: number } => x !== null);

    if (valid.length === 0 && etfs.length > 0) {
      return [{ etf: etfs[0], pct: 100 }];
    }
    const sum = valid.reduce((acc, x) => acc + x.rawWeight, 0) || 1;
    return valid.map((x) => ({
      etf: x.etf,
      pct: Math.round((x.rawWeight / sum) * 100),
    }));
  }, [allocations, etfById, etfs]);

  const resolvedPresets = useMemo(
    () =>
      PORTFOLIO_PRESET_SPECS.map((spec) => {
        const items = spec.items
          .map((item) => {
            const found = resolveCandidateAsset(etfs, item.candidates);
            return found ? { etfId: found.id, weightPct: item.weightPct } : null;
          })
          .filter((x): x is PortfolioAllocationItem => x !== null);
        return { spec, items };
      }).filter((entry) => entry.items.length === entry.spec.items.length),
    [etfs]
  );

  const etfOptions = useMemo(
    () => etfs.filter((e) => getInstrumentType(e) === 'ETF'),
    [etfs]
  );
  const stockOptions = useMemo(
    () => etfs.filter((e) => getInstrumentType(e) === 'Stock'),
    [etfs]
  );

  const currentSelectValue = useMemo(() => {
    for (const preset of resolvedPresets) {
      if (isPresetMatch(preset.items, allocations)) {
        return `preset:${preset.spec.id}`;
      }
    }
    if (activeHoldings.length === 1) {
      return `asset:${activeHoldings[0].etf.id}`;
    }
    return 'custom';
  }, [resolvedPresets, allocations, activeHoldings]);

  const handleQuickPortfolioSelect = (value: string) => {
    if (!onChangeAllocations) return;
    if (value.startsWith('preset:')) {
      const presetId = value.slice('preset:'.length);
      const found = resolvedPresets.find((p) => p.spec.id === presetId);
      if (found) onChangeAllocations(found.items);
      return;
    }
    if (value.startsWith('asset:')) {
      const etfId = value.slice('asset:'.length);
      if (etfById.has(etfId)) {
        onChangeAllocations([{ etfId, weightPct: 100 }]);
      }
    }
  };

  const singleChartEtf = activeHoldings.length === 1 ? activeHoldings[0].etf : null;
  const activeMixLabel =
    activeHoldings.length === 1
      ? `${activeHoldings[0].etf.ticker} · ${activeHoldings[0].etf.shortName}`
      : activeHoldings.map((h) => `${h.pct}% ${h.etf.ticker}`).join(' + ');

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        isLight
          ? 'border-slate-200 bg-white shadow-sm'
          : 'border-slate-700/60 bg-slate-900/90 shadow-xl'
      }`}
    >
      {/* Header & Horizon Controls */}
      <div
        className={`border-b p-4 sm:p-5 ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800/90 bg-slate-900/60'
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp
                className={`h-4 w-4 ${isLight ? 'text-[#2d8a61]' : 'text-[#5fc497]'}`}
              />
              <h3
                className={`text-base font-bold sm:text-lg ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {tr(
                  lang,
                  `5-Year Historical Backtest & ${horizonYears}-Year Forecast`,
                  `5-летний исторический бэктест и прогноз на ${horizonYears} лет`
                )}
              </h3>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isLight
                    ? 'border-slate-200 bg-slate-100 text-slate-700'
                    : 'border-slate-700 bg-slate-800/90 text-slate-300'
                }`}
              >
                {country.flag} {country.name} · {tr(lang, 'Tax Model', 'Налоги')}
              </span>
            </div>

            {/* Active Index / Portfolio Badge + Inline Switcher */}
            {etfs.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                    isLight
                      ? 'border-[#2d8a61]/35 bg-[#eaf5ef] text-[#1b5e3f]'
                      : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {tr(lang, 'Based on:', 'Основа графика:')} {activeMixLabel}
                  </span>
                </div>

                {singleChartEtf && (
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {tr(lang, 'Index:', 'Индекс:')} {singleChartEtf.indexTracked}
                  </span>
                )}

                {onChangeAllocations && (
                  <select
                    aria-label={tr(
                      lang,
                      'Switch ETF, index, or portfolio preset for chart',
                      'Выбрать ETF, индекс или готовый портфель для графика'
                    )}
                    value={currentSelectValue}
                    onChange={(e) => handleQuickPortfolioSelect(e.target.value)}
                    className={`max-w-[270px] cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none transition ${
                      isLight
                        ? 'border-slate-300 bg-white text-slate-800 hover:border-[#2d8a61] focus:border-[#2d8a61]'
                        : 'border-slate-700 bg-slate-900 text-slate-100 hover:border-[#3b9b72] focus:border-[#3b9b72]'
                    }`}
                  >
                    {currentSelectValue === 'custom' && (
                      <option value="custom" disabled>
                        {tr(lang, `Custom mix: ${activeMixLabel}`, `Свой микс: ${activeMixLabel}`)}
                      </option>
                    )}
                    <optgroup label={tr(lang, 'Portfolio Presets', 'Готовые портфели')}>
                      {resolvedPresets.map((p) => (
                        <option key={p.spec.id} value={`preset:${p.spec.id}`}>
                          {tr(lang, p.spec.labelEn, p.spec.labelRu)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={tr(lang, 'Single UCITS ETF (by Index)', 'Отдельный UCITS ETF (по индексу)')}>
                      {etfOptions.map((e) => (
                        <option key={e.id} value={`asset:${e.id}`}>
                          {e.ticker} · {e.shortName} ({e.distributionPolicy})
                        </option>
                      ))}
                    </optgroup>
                    {stockOptions.length > 0 && (
                      <optgroup label={tr(lang, 'Single Stock', 'Отдельная акция')}>
                        {stockOptions.map((s) => (
                          <option key={s.id} value={`asset:${s.id}`}>
                            {s.ticker} · {s.shortName}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>
            )}

            <p className={`mt-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {tr(lang, 'Annualized CAGR:', 'Среднегодовая доходность (CAGR):')}{' '}
              <span
                className={`font-mono font-semibold ${
                  isLight ? 'text-[#1f6e4b]' : 'text-[#7fd4ad]'
                }`}
              >
                {historicalCagr5YPct >= 0 ? '+' : ''}
                {historicalCagr5YPct.toFixed(2)}%{tr(lang, '/yr (5Y)', '/год (5Y)')}
              </span>{' '}
              ·{' '}
              <span
                className={`font-mono font-semibold ${
                  isLight ? 'text-sky-700' : 'text-sky-300'
                }`}
              >
                {historicalCagr3YPct >= 0 ? '+' : ''}
                {historicalCagr3YPct.toFixed(2)}%{tr(lang, '/yr (3Y)', '/год (3Y)')}
              </span>{' '}
              · {tr(lang, 'Volatility:', 'Волатильность:')}{' '}
              <span
                className={`font-mono font-semibold ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                ±{volatilityPct.toFixed(1)}%{tr(lang, '/yr', '/год')}
              </span>
            </p>
          </div>

          {/* Forecast Horizon Zoom Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`mr-1 text-xs font-medium ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {tr(lang, 'Forecast Horizon:', 'Горизонт прогноза:')}
            </span>
            {HORIZON_OPTIONS.map((h) => {
              const active = horizonYears === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizonYears(h)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                    active
                      ? isLight
                        ? 'bg-[#2d8a61] text-white shadow-sm'
                        : 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                      : isLight
                        ? 'border border-slate-300 bg-white text-slate-700 hover:border-[#2d8a61]/60 hover:text-[#1f6e4b]'
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
          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
              isLight
                ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                : 'border-[#3b9b72]/35 bg-[#2d8a61]/15 text-[#86d6b0]'
            }`}
          >
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: histColor }} />
            {tr(lang, 'Historical Value (-5Y → Today)', 'Историческая стоимость (-5Y → Сегодня)')}
          </div>

          <button
            type="button"
            onClick={() => setShowDistNet((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
              showDistNet
                ? isLight
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : isLight
                  ? 'border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span
              className="h-0.5 w-4 border-t-2 border-dashed"
              style={{ borderColor: distColor }}
            />
            {tr(lang, 'Dist Net (after dividend tax)', 'Dist Net (после налога на дивиденды)')}
            {showDistNet ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
              isLight
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
            }`}
          >
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: forecastColor }}
            />
            {tr(lang, 'Base Forecast (Hist. CAGR) + Cone', 'Базовый прогноз (Hist. CAGR) + коридор')}
          </div>

          <button
            type="button"
            onClick={() => setShowPostTax((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition ${
              showPostTax
                ? isLight
                  ? 'border-violet-200 bg-violet-50 text-violet-800'
                  : 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                : isLight
                  ? 'border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-700 bg-slate-900/60 text-slate-500'
            }`}
          >
            <span
              className="h-0.5 w-4 border-t-2 border-dashed"
              style={{ borderColor: postTaxColor }}
            />
            {tr(lang, `Net After Tax (${country.code})`, `Чистыми после налога (${country.code})`)}
            {showPostTax ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
              isLight
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-900/80 text-slate-300'
            }`}
          >
            <span
              className="h-0.5 w-4 border-t-2 border-dashed"
              style={{ borderColor: investedColor }}
            />
            {tr(lang, 'Total Invested Principal', 'Вложенный капитал')}
          </div>
        </div>
      </div>

      {/* Responsive Interactive SVG Canvas */}
      <div
        className={`relative w-full select-none px-2 pb-2 pt-3 sm:px-4 ${
          isLight ? 'bg-[#f8fafc]' : 'bg-[#0f172a]'
        }`}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-auto w-full touch-none overflow-visible"
          role="img"
          aria-label={tr(
            lang,
            `Interactive portfolio chart showing 5-year historical backtest and ${horizonYears}-year forecast`,
            `Интерактивный график портфеля: 5-летний исторический бэктест и прогноз на ${horizonYears} лет`
          )}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={histColor} stopOpacity={isLight ? '0.22' : '0.26'} />
              <stop offset="100%" stopColor={histColor} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="investedAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={investedColor}
                stopOpacity={isLight ? '0.12' : '0.16'}
              />
              <stop offset="100%" stopColor={investedColor} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="forecastConeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor={forecastColor}
                stopOpacity={isLight ? '0.12' : '0.14'}
              />
              <stop
                offset="100%"
                stopColor={forecastColor}
                stopOpacity={isLight ? '0.2' : '0.22'}
              />
            </linearGradient>
          </defs>

          {/* Phase Backdrop Shading */}
          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={Math.max(0, todayX - PAD_LEFT)}
            height={PLOT_HEIGHT}
            fill={isLight ? 'rgba(45, 138, 97, 0.04)' : 'rgba(59, 155, 114, 0.045)'}
          />
          <rect
            x={todayX}
            y={PAD_TOP}
            width={Math.max(0, SVG_WIDTH - PAD_RIGHT - todayX)}
            height={PLOT_HEIGHT}
            fill={isLight ? 'rgba(72, 97, 120, 0.045)' : 'rgba(119, 146, 171, 0.045)'}
          />

          {/* Phase Region Top Labels */}
          {todayX - PAD_LEFT > 120 && (
            <text
              x={PAD_LEFT + 8}
              y={PAD_TOP + 15}
              fill={histLabelColor}
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.06em"
              opacity={isLight ? '0.9' : '0.82'}
            >
              {tr(lang, 'HISTORICAL REALITY', 'ИСТОРИЯ (ФАКТ)')}
            </text>
          )}
          <text
            x={SVG_WIDTH - PAD_RIGHT - 8}
            y={PAD_TOP + 15}
            textAnchor="end"
            fill={forecastLabelColor}
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.06em"
            opacity={isLight ? '0.9' : '0.82'}
          >
            {tr(lang, 'EDUCATIONAL PROJECTION MODEL', 'ОБРАЗОВАТЕЛЬНЫЙ ПРОГНОЗ')}
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
                  stroke={gridStroke}
                  strokeDasharray={tickVal === 0 ? undefined : '3 4'}
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={axisTextColor}
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
            const isToday = Boolean(tick.isToday);
            return (
              <g key={`${tick.label}-${tick.year}`}>
                <line
                  x1={x}
                  y1={baselineY}
                  x2={x}
                  y2={baselineY + 5}
                  stroke={isToday ? todayLineStroke : axisMutedColor}
                  strokeOpacity={isToday ? 0.9 : 0.45}
                  strokeWidth={isToday ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={baselineY + 21}
                  textAnchor="middle"
                  fill={isToday ? 'var(--ui-chart-text-primary)' : axisTextColor}
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
                stroke={investedColor}
                strokeWidth={1.75}
                strokeDasharray="4 4"
              />
            </>
          )}

          {/* Shaded Forecast Confidence Fan */}
          {confidenceConePath && <path d={confidenceConePath} fill="url(#forecastConeGrad)" />}
          {forecastOptCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastOptCoords)}
              fill="none"
              stroke={forecastColor}
              strokeWidth={1.25}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          )}
          {forecastConsCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastConsCoords)}
              fill="none"
              stroke={axisMutedColor}
              strokeWidth={1.25}
              strokeDasharray="4 4"
              opacity={0.75}
            />
          )}

          {/* Historical Area & Portfolio Value Curves */}
          {histGrossCoords.length >= 2 && (
            <path d={buildAreaPath(histGrossCoords, baselineY)} fill="url(#histAreaGrad)" />
          )}
          {showDistNet && histDistCoords.length >= 2 && (
            <path
              d={buildLinePath(histDistCoords)}
              fill="none"
              stroke={distColor}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
          {histGrossCoords.length >= 2 && (
            <path
              d={buildLinePath(histGrossCoords)}
              fill="none"
              stroke={histColor}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Forecast Curves */}
          {forecastBaseCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastBaseCoords)}
              fill="none"
              stroke={forecastColor}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {showPostTax && forecastPostTaxCoords.length >= 2 && (
            <path
              d={buildLinePath(forecastPostTaxCoords)}
              fill="none"
              stroke={postTaxColor}
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
                stroke={histBadgeStroke}
                strokeDasharray="2 3"
              />
              <circle
                cx={xScale(entry5YPoint.yearOffset)}
                cy={yScale(entry5YPoint.historicalValueEur ?? 0)}
                r={4.5}
                fill={dotInnerFill}
                stroke={histColor}
                strokeWidth={2.5}
              />
              <rect
                x={xScale(entry5YPoint.yearOffset) + 2}
                y={PAD_TOP + 24}
                width={66}
                height={18}
                rx={5}
                fill={histBadgeBg}
                stroke={histBadgeStroke}
              />
              <text
                x={xScale(entry5YPoint.yearOffset) + 35}
                y={PAD_TOP + 36}
                textAnchor="middle"
                fill={histLabelColor}
                fontSize="10"
                fontWeight="700"
              >
                {minYear <= -4.75 ? tr(lang, '-5Y Entry', 'Вход -5Y') : tr(lang, 'Start', 'Старт')}
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
                stroke={isLight ? 'rgba(72, 97, 120, 0.35)' : 'rgba(119, 146, 171, 0.4)'}
                strokeDasharray="2 3"
              />
              <circle
                cx={xScale(entry3YPoint.yearOffset)}
                cy={yScale(entry3YPoint.historicalValueEur ?? 0)}
                r={4.5}
                fill={dotInnerFill}
                stroke={forecastColor}
                strokeWidth={2.5}
              />
              <rect
                x={xScale(entry3YPoint.yearOffset) + 2}
                y={PAD_TOP + 24}
                width={66}
                height={18}
                rx={5}
                fill={isLight ? 'rgba(72, 97, 120, 0.1)' : 'rgba(119, 146, 171, 0.16)'}
                stroke={isLight ? 'rgba(72, 97, 120, 0.4)' : 'rgba(119, 146, 171, 0.45)'}
              />
              <text
                x={xScale(entry3YPoint.yearOffset) + 35}
                y={PAD_TOP + 36}
                textAnchor="middle"
                fill={forecastLabelColor}
                fontSize="10"
                fontWeight="700"
              >
                {tr(lang, '-3Y Entry', 'Вход -3Y')}
              </text>
            </g>
          )}

          {/* Vertical "TODAY (Snapshot)" Divider Line */}
          <g>
            <line
              x1={todayX}
              y1={38}
              x2={todayX}
              y2={baselineY}
              stroke={todayLineStroke}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={0.8}
            />
            <rect
              x={todayBadgeX - 96}
              y={4}
              width={192}
              height={34}
              rx={10}
              fill={dotInnerFill}
              stroke={forecastColor}
              strokeWidth={1.2}
            />
            <text
              x={todayBadgeX}
              y={17}
              textAnchor="middle"
              fill={axisMutedColor}
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="0.03em"
            >
              {tr(lang, 'TODAY (Snapshot)', 'СЕГОДНЯ (Снимок)')}
            </text>
            <text
              x={todayBadgeX}
              y={31}
              textAnchor="middle"
              fill={histLabelColor}
              fontSize="11"
              fontWeight="700"
              fontFamily="var(--font-mono)"
            >
              {todayPoint && typeof todayPoint.historicalValueEur === 'number'
                ? `${tr(lang, 'Acc Gross:', 'Накопл. Gross:')} €${Math.round(todayPoint.historicalValueEur).toLocaleString('en-IE')}`
                : tr(lang, 'Acc Gross: —', 'Накопл. Gross: —')}
            </text>
            {todayPoint && (
              <circle
                cx={todayX}
                cy={yScale(todayPoint.historicalValueEur ?? 0)}
                r={5.5}
                fill={histColor}
                stroke={dotOuterStroke}
                strokeWidth={2}
              />
            )}
          </g>

          {/* End-of-Horizon Endpoints & Direct Right-Edge Labels */}
          {forecastPoints.length > 0 && (() => {
            const endPt = forecastPoints[forecastPoints.length - 1];
            const endX = xScale(endPt.yearOffset);

            const rawLabels: RightEndpointLabelInput[] = [];
            if (typeof endPt.forecastOptimisticEur === 'number') {
              rawLabels.push({
                id: 'opt',
                rawY: yScale(endPt.forecastOptimisticEur),
                label: tr(lang, 'Optimistic (+σ)', 'Оптимист. (+σ)'),
                valueText: formatEurCompact(endPt.forecastOptimisticEur),
                color: forecastLabelColor,
              });
            }
            if (typeof endPt.forecastBaseEur === 'number') {
              rawLabels.push({
                id: 'base',
                rawY: yScale(endPt.forecastBaseEur),
                label: tr(lang, 'Base (CAGR)', 'База (CAGR)'),
                valueText: formatEurCompact(endPt.forecastBaseEur),
                color: forecastLabelColor,
                bold: true,
              });
            }
            if (showPostTax && typeof endPt.forecastPostTaxBaseEur === 'number') {
              rawLabels.push({
                id: 'net',
                rawY: yScale(endPt.forecastPostTaxBaseEur),
                label: tr(lang, `After Tax (${country.code})`, `После налога (${country.code})`),
                valueText: formatEurCompact(endPt.forecastPostTaxBaseEur),
                color: postTaxColor,
                bold: true,
              });
            }
            if (typeof endPt.forecastConservativeEur === 'number') {
              rawLabels.push({
                id: 'cons',
                rawY: yScale(endPt.forecastConservativeEur),
                label: tr(lang, 'Conserv. (-σ)', 'Консерват. (-σ)'),
                valueText: formatEurCompact(endPt.forecastConservativeEur),
                color: axisTextColor,
              });
            }
            rawLabels.push({
              id: 'invested',
              rawY: yScale(endPt.totalInvestedEur),
              label: tr(lang, 'Invested', 'Вложено'),
              valueText: formatEurCompact(endPt.totalInvestedEur),
              color: investedColor,
            });

            const laidOutLabels = resolveEndpointLabelPositions(
              rawLabels,
              PAD_TOP + 18,
              baselineY - 4,
              16
            );

            return (
              <g>
                {typeof endPt.forecastOptimisticEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastOptimisticEur)}
                    r={3.5}
                    fill={forecastColor}
                  />
                )}
                {typeof endPt.forecastBaseEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastBaseEur)}
                    r={4.5}
                    fill={forecastColor}
                    stroke={dotInnerFill}
                    strokeWidth={1.5}
                  />
                )}
                {showPostTax && typeof endPt.forecastPostTaxBaseEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastPostTaxBaseEur)}
                    r={4}
                    fill={postTaxColor}
                    stroke={dotInnerFill}
                    strokeWidth={1.5}
                  />
                )}
                {typeof endPt.forecastConservativeEur === 'number' && (
                  <circle
                    cx={endX}
                    cy={yScale(endPt.forecastConservativeEur)}
                    r={3.5}
                    fill={axisMutedColor}
                  />
                )}
                <circle
                  cx={endX}
                  cy={yScale(endPt.totalInvestedEur)}
                  r={3}
                  fill={investedColor}
                />

                {laidOutLabels.map((item) => (
                  <g key={item.id} pointerEvents="none">
                    <line
                      x1={endX + 5}
                      y1={item.rawY}
                      x2={endX + 13}
                      y2={item.labelY}
                      stroke={item.color}
                      strokeOpacity={0.55}
                      strokeWidth={1}
                    />
                    <text
                      x={endX + 16}
                      y={item.labelY + 3.5}
                      fill={item.color}
                      fontSize="10.5"
                      fontWeight={item.bold ? '700' : '600'}
                    >
                      {item.label}:{' '}
                      <tspan fontFamily="var(--font-mono)" fontWeight="700">
                        {item.valueText}
                      </tspan>
                    </text>
                  </g>
                ))}
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
                stroke={isLight ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.45)'}
                strokeWidth={1}
              />
              <circle
                cx={hoveredX}
                cy={yScale(hoveredPoint.totalInvestedEur)}
                r={4}
                fill={investedColor}
                stroke={dotOuterStroke}
                strokeWidth={1.5}
              />
              {typeof hoveredPoint.historicalValueEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.historicalValueEur)}
                  r={5.5}
                  fill={histColor}
                  stroke={dotOuterStroke}
                  strokeWidth={2}
                />
              )}
              {showDistNet && typeof hoveredPoint.historicalDistNetEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.historicalDistNetEur)}
                  r={4.5}
                  fill={distColor}
                  stroke={dotInnerFill}
                  strokeWidth={1.5}
                />
              )}
              {typeof hoveredPoint.forecastBaseEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.forecastBaseEur)}
                  r={5.5}
                  fill={forecastColor}
                  stroke={dotOuterStroke}
                  strokeWidth={2}
                />
              )}
              {showPostTax && typeof hoveredPoint.forecastPostTaxBaseEur === 'number' && (
                <circle
                  cx={hoveredX}
                  cy={yScale(hoveredPoint.forecastPostTaxBaseEur)}
                  r={4.5}
                  fill={postTaxColor}
                  stroke={dotOuterStroke}
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
            className={`pointer-events-none absolute top-14 z-20 w-64 rounded-xl border p-3 text-xs backdrop-blur-md sm:w-72 ${
              isLight
                ? 'border-slate-200 bg-white/95 text-slate-800 shadow-xl'
                : 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-1.5 ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <span
                className={`font-mono font-semibold ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {hoveredPoint.date}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  hoveredPoint.phase === 'historical'
                    ? isLight
                      ? 'bg-[#2d8a61]/15 text-[#1f6e4b]'
                      : 'bg-[#2d8a61]/25 text-[#86d6b0]'
                    : isLight
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-sky-500/20 text-sky-300'
                }`}
              >
                {formatYearOffsetLabel(hoveredPoint.yearOffset, lang)} ·{' '}
                {hoveredPoint.phase === 'historical'
                  ? tr(lang, 'Historical', 'История')
                  : tr(lang, 'Forecast', 'Прогноз')}
              </span>
            </div>

            <div className="mt-2 space-y-1.5 tabular-nums">
              <div
                className={`flex items-center justify-between ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                <span>{tr(lang, 'Total Invested:', 'Вложено всего:')}</span>
                <span
                  className={`font-mono font-semibold ${
                    isLight ? 'text-slate-900' : 'text-slate-200'
                  }`}
                >
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
                    <div
                      className={`flex items-center justify-between ${
                        isLight ? 'text-[#1f6e4b]' : 'text-[#86d6b0]'
                      }`}
                    >
                      <span>{tr(lang, 'Value (Acc/Gross):', 'Стоимость (Acc/Gross):')}</span>
                      <span className="font-mono font-bold">{formatEurFull(histVal)}</span>
                    </div>
                    <div
                      className={`flex items-center justify-between text-[11px] ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      <span>{tr(lang, 'Historical Profit:', 'Историческая прибыль:')}</span>
                      <span
                        className={`font-mono font-semibold ${
                          profit >= 0
                            ? isLight
                              ? 'text-[#2d8a61]'
                              : 'text-[#6ec9a0]'
                            : isLight
                              ? 'text-rose-600'
                              : 'text-rose-400'
                        }`}
                      >
                        {profit >= 0 ? '+' : ''}
                        {formatEurFull(profit)} ({pct >= 0 ? '+' : ''}
                        {pct.toFixed(1)}%)
                      </span>
                    </div>
                    {showDistNet && typeof hoveredPoint.historicalDistNetEur === 'number' && (
                      <div
                        className={`flex items-center justify-between ${
                          isLight ? 'text-amber-700' : 'text-amber-300'
                        }`}
                      >
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
                      ? `mt-1.5 space-y-1 border-t pt-1.5 ${
                          isLight ? 'border-slate-200' : 'border-slate-800'
                        }`
                      : 'space-y-1'
                  }
                >
                  {typeof hoveredPoint.forecastOptimisticEur === 'number' && (
                    <div
                      className={`flex items-center justify-between ${
                        isLight ? 'text-sky-700/80' : 'text-sky-200/80'
                      }`}
                    >
                      <span>{tr(lang, 'Optimistic (+σ):', 'Оптимистичный (+σ):')}</span>
                      <span className="font-mono">
                        {formatEurFull(hoveredPoint.forecastOptimisticEur)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-between ${
                      isLight ? 'text-sky-700' : 'text-sky-300'
                    }`}
                  >
                    <span>{tr(lang, 'Base Forecast (CAGR):', 'Базовый прогноз (CAGR):')}</span>
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
                      <div
                        className={`flex items-center justify-between text-[11px] ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        <span>
                          {tr(lang, 'Projected Gain (Gross):', 'Прогнозный доход (до налога):')}
                        </span>
                        <span
                          className={`font-mono font-semibold ${
                            isLight ? 'text-sky-700' : 'text-sky-300'
                          }`}
                        >
                          {fProfit >= 0 ? '+' : ''}
                          {formatEurFull(fProfit)} ({fPct >= 0 ? '+' : ''}
                          {fPct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}
                  {showPostTax && typeof hoveredPoint.forecastPostTaxBaseEur === 'number' && (
                    <div
                      className={`flex items-center justify-between ${
                        isLight ? 'text-violet-700' : 'text-violet-300'
                      }`}
                    >
                      <span>
                        {tr(lang, 'Net', 'Чистыми')} ({country.flag} {country.code}):
                      </span>
                      <span className="font-mono font-bold">
                        {formatEurFull(hoveredPoint.forecastPostTaxBaseEur)}
                      </span>
                    </div>
                  )}
                  {typeof hoveredPoint.forecastConservativeEur === 'number' && (
                    <div
                      className={`flex items-center justify-between ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <span>{tr(lang, 'Conservative (-σ):', 'Консервативный (-σ):')}</span>
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

      {/* Prominent Regulatory Warning Strip Inside Chart Card */}
      <div
        className={`flex items-start gap-2.5 border-t px-4 py-3 text-xs sm:px-5 ${
          isLight
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-amber-500/40 bg-amber-500/15 text-amber-100'
        }`}
      >
        <ShieldAlert
          className={`mt-0.5 h-4 w-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-300'}`}
        />
        <p className="font-medium leading-relaxed">
          {tr(
            lang,
            'IMPORTANT NOTICE: Historical performance and past returns (3-year and 5-year) are not a promise or reliable indicator of future results. Projection cones are mathematical models for educational purposes only.',
            'ВАЖНОЕ УВЕДОМЛЕНИЕ: Историческая доходность и прошлые результаты (за 3 и 5 лет) не являются обещанием или надёжным индикатором будущих результатов. Прогнозные коридоры — математические модели исключительно для образовательных целей.'
          )}
        </p>
      </div>
    </div>
  );
}
