import { type FormEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Loader2,
  PieChart,
  Plus,
  Scale,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getEtfExternalLinks } from '../../data/europeanPortals';
import type { ETFInstrument, LiveQuoteData, PortfolioAllocationItem } from '../../types';

export interface EtfSelectorProps {
  etfs: ETFInstrument[];
  quotesByEtfId: Record<string, LiveQuoteData>;
  allocations: PortfolioAllocationItem[];
  onChangeAllocations: (allocations: PortfolioAllocationItem[]) => void;
  onAddCustomTicker: (ticker: string) => Promise<void>;
  isFetchingCustomTicker?: boolean;
  customTickerError?: string | null;
}

interface PortfolioPreset {
  id: string;
  label: string;
  description: string;
  items: PortfolioAllocationItem[];
}

const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: 'vwce-100',
    label: 'Global All-World 100% (VWCE Acc)',
    description: '1-ETF global core (~3,650 stocks, Developed + EM)',
    items: [{ etfId: 'vwce', weightPct: 100 }],
  },
  {
    id: 'vgwl-100',
    label: 'All-World Distributing Twin (VGWL Dist)',
    description: 'Identical FTSE All-World index with quarterly payouts',
    items: [{ etfId: 'vgwl', weightPct: 100 }],
  },
  {
    id: 'iwda-is3n',
    label: 'Core World + Emerging (85% IWDA + 15% IS3N)',
    description: 'Two-ETF MSCI World + EM IMI low-TER combination',
    items: [
      { etfId: 'iwda', weightPct: 85 },
      { etfId: 'is3n', weightPct: 15 },
    ],
  },
  {
    id: 'sxr8-eqqb',
    label: 'US S&P 500 + Tech (75% SXR8 + 25% EQQB)',
    description: 'Higher US mega-cap growth tilt (higher volatility)',
    items: [
      { etfId: 'sxr8', weightPct: 75 },
      { etfId: 'eqqb', weightPct: 25 },
    ],
  },
  {
    id: 'vwce-xeon',
    label: 'Balanced Careful (80% VWCE + 20% XEON Cash)',
    description: 'Global equities cushioned with ECB €STR overnight liquidity',
    items: [
      { etfId: 'vwce', weightPct: 80 },
      { etfId: 'xeon', weightPct: 20 },
    ],
  },
];

const QUICK_LOOKUP_EXAMPLES = ['CSPX.L', 'XDWD.DE', 'VUAA.DE', 'MEUD.PA'];

const SLICE_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-400',
];

function formatCurrencyPrice(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  return `${symbol}${value.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isPresetMatch(
  presetItems: PortfolioAllocationItem[],
  current: PortfolioAllocationItem[]
): boolean {
  if (presetItems.length !== current.length) return false;
  const currentMap = new Map(current.map((item) => [item.etfId, Math.round(item.weightPct)]));
  return presetItems.every((p) => currentMap.get(p.etfId) === p.weightPct);
}

export function EtfSelector({
  etfs,
  quotesByEtfId,
  allocations,
  onChangeAllocations,
  onAddCustomTicker,
  isFetchingCustomTicker = false,
  customTickerError = null,
}: EtfSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [policyFilter, setPolicyFilter] = useState<'ALL' | 'Acc' | 'Dist' | 'Custom'>('ALL');
  const [tickerInput, setTickerInput] = useState('');
  const [localLookupError, setLocalLookupError] = useState<string | null>(null);
  const [expandedNotesById, setExpandedNotesById] = useState<Record<string, boolean>>({});

  const etfById = useMemo(() => new Map(etfs.map((e) => [e.id, e])), [etfs]);
  const allocationById = useMemo(
    () => new Map(allocations.map((a) => [a.etfId, a.weightPct])),
    [allocations]
  );

  const totalWeightPct = useMemo(
    () => allocations.reduce((sum, item) => sum + (Number.isFinite(item.weightPct) ? item.weightPct : 0), 0),
    [allocations]
  );

  const filteredEtfs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = etfs.filter((etf) => {
      if (policyFilter === 'Acc' && etf.distributionPolicy !== 'Acc') return false;
      if (policyFilter === 'Dist' && etf.distributionPolicy !== 'Dist') return false;
      if (policyFilter === 'Custom' && etf.provider !== 'Custom' && !etf.id.startsWith('custom-')) {
        return false;
      }

      if (!q) return true;
      return (
        etf.ticker.toLowerCase().includes(q) ||
        etf.name.toLowerCase().includes(q) ||
        etf.shortName.toLowerCase().includes(q) ||
        etf.isin.toLowerCase().includes(q) ||
        etf.wkn.toLowerCase().includes(q) ||
        etf.provider.toLowerCase().includes(q) ||
        etf.indexTracked.toLowerCase().includes(q)
      );
    });

    // Surface newly added custom live ETFs at the top so users see them immediately.
    return [...matched].sort((a, b) => {
      const aCustom = a.id.startsWith('custom-') ? 0 : 1;
      const bCustom = b.id.startsWith('custom-') ? 0 : 1;
      return aCustom - bCustom;
    });
  }, [etfs, policyFilter, searchQuery]);

  const handleSelectSingle = (etfId: string) => {
    onChangeAllocations([{ etfId, weightPct: 100 }]);
  };

  const handleAddToMix = (etfId: string) => {
    if (allocationById.has(etfId)) return;
    if (allocations.length === 0) {
      onChangeAllocations([{ etfId, weightPct: 100 }]);
      return;
    }

    // Re-scale existing weights to 80% and add new ETF at 20% so sum stays 100%
    const nextExisting = allocations.map((item) => ({
      ...item,
      weightPct: Math.max(5, Math.round((item.weightPct * 0.8) / 5) * 5),
    }));
    const existingSum = nextExisting.reduce((sum, item) => sum + item.weightPct, 0);
    const newWeight = Math.max(5, 100 - existingSum);
    onChangeAllocations([...nextExisting, { etfId, weightPct: newWeight }]);
  };

  const handleWeightChange = (etfId: string, rawValue: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rawValue)));
    onChangeAllocations(
      allocations.map((item) => (item.etfId === etfId ? { ...item, weightPct: clamped } : item))
    );
  };

  const handleRemoveFromMix = (etfId: string) => {
    if (allocations.length <= 1) return;
    const remaining = allocations.filter((item) => item.etfId !== etfId);
    const sum = remaining.reduce((s, item) => s + item.weightPct, 0);
    if (sum <= 0) {
      onChangeAllocations(remaining.map((item) => ({ ...item, weightPct: Math.round(100 / remaining.length) })));
      return;
    }
    onChangeAllocations(remaining);
  };

  const handleNormalizeWeights = () => {
    if (allocations.length === 0) return;
    const sum = allocations.reduce((s, item) => s + Math.max(0, item.weightPct), 0);
    if (sum <= 0) {
      const equal = Math.floor(100 / allocations.length);
      const remainder = 100 - equal * allocations.length;
      onChangeAllocations(
        allocations.map((item, idx) => ({
          ...item,
          weightPct: equal + (idx === 0 ? remainder : 0),
        }))
      );
      return;
    }

    const scaled = allocations.map((item) => ({
      ...item,
      weightPct: Math.round((Math.max(0, item.weightPct) / sum) * 100),
    }));
    const diff = 100 - scaled.reduce((s, item) => s + item.weightPct, 0);
    if (diff !== 0 && scaled.length > 0) {
      scaled[0] = { ...scaled[0], weightPct: Math.max(0, scaled[0].weightPct + diff) };
    }
    onChangeAllocations(scaled);
  };

  const handleEqualizeWeights = () => {
    if (allocations.length === 0) return;
    const base = Math.floor(100 / allocations.length);
    const rem = 100 - base * allocations.length;
    onChangeAllocations(
      allocations.map((item, idx) => ({
        ...item,
        weightPct: base + (idx === 0 ? rem : 0),
      }))
    );
  };

  const handleSwitchToTwin = (etf: ETFInstrument) => {
    if (!etf.pairedEtfId || !etfById.has(etf.pairedEtfId)) return;
    const twinId = etf.pairedEtfId;

    if (!allocationById.has(etf.id)) {
      onChangeAllocations([{ etfId: twinId, weightPct: 100 }]);
      return;
    }

    const merged = new Map<string, number>();
    for (const item of allocations) {
      const targetId = item.etfId === etf.id ? twinId : item.etfId;
      merged.set(targetId, (merged.get(targetId) ?? 0) + item.weightPct);
    }
    onChangeAllocations(
      Array.from(merged.entries()).map(([id, weightPct]) => ({ etfId: id, weightPct }))
    );
  };

  const executeTickerLookup = async (rawTicker: string) => {
    const clean = rawTicker.trim().toUpperCase();
    if (!clean) {
      setLocalLookupError('Enter a European ETF ticker symbol (e.g., CSPX.L, XDWD.DE, VUAA.DE).');
      return;
    }
    setLocalLookupError(null);
    try {
      await onAddCustomTicker(clean);
      setTickerInput('');
      setPolicyFilter('ALL');
      setSearchQuery('');
    } catch (err) {
      setLocalLookupError(
        err instanceof Error ? err.message : `Could not fetch live data for "${clean}".`
      );
    }
  };

  const handleLookupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await executeTickerLookup(tickerInput);
  };

  const toggleNotes = (etfId: string) => {
    setExpandedNotesById((prev) => ({ ...prev, [etfId]: !prev[etfId] }));
  };

  const combinedLookupError = customTickerError ?? localLookupError;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <PieChart className="h-3.5 w-3.5" />
            UCITS ETF Portfolio Builder &amp; Live Market Lookup
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-100">
            Select a Single ETF or Weighted Multi-ETF Portfolio
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Compare Accumulating (<span className="font-semibold text-emerald-300">Acc</span>) vs
            Distributing (<span className="font-semibold text-amber-300">Dist</span>) twins in 1 click,
            inspect TER &amp; Tracking Difference, or fetch any live European ETF ticker.
          </p>
        </div>
      </div>

      {/* 1-Click Quick Portfolio Presets */}
      <div className="fintech-card rounded-2xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sparkles className="h-4 w-4 text-sky-400" />
            1-Click Careful Portfolio Presets
          </div>
          <span className="text-xs text-slate-400">Instant backtest &amp; tax recalculation</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PORTFOLIO_PRESETS.map((preset) => {
            const active = isPresetMatch(preset.items, allocations);
            const available = preset.items.every((item) => etfById.has(item.etfId));
            if (!available) return null;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeAllocations(preset.items)}
                className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-emerald-400/70 bg-emerald-500/15 shadow-lg shadow-emerald-950/30'
                    : 'border-slate-700/70 bg-slate-900/60 hover:border-sky-500/50 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-xs font-semibold leading-snug ${
                      active ? 'text-emerald-200' : 'text-slate-100 group-hover:text-sky-200'
                    }`}
                  >
                    {preset.label}
                  </span>
                  {active && (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Portfolio Weights + Custom Ticker Lookup Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Active Portfolio Mix Editor */}
        <div className="fintech-card rounded-2xl p-4 sm:p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-100">
                Active Portfolio Allocation ({allocations.length}{' '}
                {allocations.length === 1 ? 'ETF' : 'ETFs'})
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {allocations.length > 1 && (
                <button
                  type="button"
                  onClick={handleEqualizeWeights}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Equal Split
                </button>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                  Math.abs(totalWeightPct - 100) < 0.01
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : 'border border-amber-500/40 bg-amber-500/15 text-amber-300'
                }`}
              >
                Total: {totalWeightPct}%
              </span>
              {Math.abs(totalWeightPct - 100) >= 0.01 && (
                <button
                  type="button"
                  onClick={handleNormalizeWeights}
                  className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Normalize to 100%
                </button>
              )}
            </div>
          </div>

          {/* Visual Stacked Allocation Bar */}
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            {allocations.map((item, idx) => {
              const widthPct =
                totalWeightPct > 0 ? (Math.max(0, item.weightPct) / totalWeightPct) * 100 : 0;
              return (
                <div
                  key={item.etfId}
                  style={{ width: `${widthPct}%` }}
                  className={`${SLICE_COLORS[idx % SLICE_COLORS.length]} transition-all duration-300`}
                  title={`${etfById.get(item.etfId)?.ticker ?? item.etfId}: ${item.weightPct}%`}
                />
              );
            })}
          </div>

          {/* Individual Weight Rows */}
          <div className="mt-4 space-y-2.5">
            {allocations.map((item, idx) => {
              const etf = etfById.get(item.etfId);
              if (!etf) return null;
              const normalizedShare =
                totalWeightPct > 0 ? (Math.max(0, item.weightPct) / totalWeightPct) * 100 : 0;

              return (
                <div
                  key={item.etfId}
                  className="flex flex-col gap-2.5 rounded-xl border border-slate-800 bg-slate-900/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${
                        SLICE_COLORS[idx % SLICE_COLORS.length]
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-slate-100">
                          {etf.ticker}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            etf.distributionPolicy === 'Acc'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {etf.distributionPolicy}
                        </span>
                        <span className="truncate text-xs text-slate-400">{etf.shortName}</span>
                      </div>
                      {Math.abs(totalWeightPct - 100) >= 0.01 && (
                        <p className="text-[11px] text-amber-300/90">
                          Effective normalized weight: {normalizedShare.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:shrink-0">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={item.weightPct}
                      onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                      aria-label={`Weight percentage for ${etf.ticker}`}
                      className="h-1.5 w-28 cursor-pointer accent-emerald-400 sm:w-32"
                    />
                    <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.weightPct}
                        onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                        aria-label={`Numeric weight percentage for ${etf.ticker}`}
                        className="w-11 bg-transparent text-right font-mono text-xs font-semibold text-slate-100 tabular-nums focus:outline-none"
                      />
                      <span className="ml-0.5 text-xs text-slate-400">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromMix(item.etfId)}
                      disabled={allocations.length <= 1}
                      title={
                        allocations.length <= 1
                          ? 'At least 1 ETF is required in the portfolio'
                          : `Remove ${etf.ticker} from mix`
                      }
                      className="rounded-lg border border-slate-700/80 p-1.5 text-slate-400 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lookup Any Live European ETF Ticker */}
        <div className="fintech-card rounded-2xl p-4 sm:p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-sky-400" />
            <h4 className="text-sm font-semibold text-slate-100">
              Lookup Any Live European ETF Ticker
            </h4>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Pull real-time quotes and 5-year history directly from Yahoo Finance using European
            exchange suffixes (<code className="text-sky-300">.DE</code> Xetra,{' '}
            <code className="text-sky-300">.AS</code> Amsterdam,{' '}
            <code className="text-sky-300">.L</code> London,{' '}
            <code className="text-sky-300">.PA</code> Paris).
          </p>

          <form onSubmit={handleLookupSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => {
                setTickerInput(e.target.value);
                if (localLookupError) setLocalLookupError(null);
              }}
              placeholder="e.g., CSPX.L, XDWD.DE, VUAA.DE, MEUD.PA"
              aria-label="Lookup any live European ETF ticker"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 font-mono text-sm text-slate-100 placeholder:font-sans placeholder:text-xs placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isFetchingCustomTicker}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isFetchingCustomTicker ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Live ETF
                </>
              )}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Quick lookup:</span>
            {QUICK_LOOKUP_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isFetchingCustomTicker}
                onClick={() => {
                  setTickerInput(example);
                  void executeTickerLookup(example);
                }}
                className="rounded-md border border-slate-700/80 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-sky-300 transition hover:border-sky-400/60 hover:bg-sky-500/10 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          {combinedLookupError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{combinedLookupError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Catalog Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter catalog by ticker, ISIN, WKN, provider, or index..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'Acc', 'Dist', 'Custom'] as const).map((tab) => {
            const active = policyFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPolicyFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                }`}
              >
                {tab === 'ALL'
                  ? `All ETFs (${etfs.length})`
                  : tab === 'Acc'
                    ? 'Accumulating (Acc)'
                    : tab === 'Dist'
                      ? 'Distributing (Dist)'
                      : 'Custom Live'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ETF Catalog Cards */}
      {filteredEtfs.length === 0 ? (
        <div className="fintech-card rounded-2xl p-8 text-center text-sm text-slate-400">
          No ETFs match your current filter. Clear the search box or add a live European ticker above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredEtfs.map((etf) => {
            const quote = quotesByEtfId[etf.id];
            const fallbackLast = etf.baselineHistory5Y[etf.baselineHistory5Y.length - 1];
            const fallbackPrev =
              etf.baselineHistory5Y[Math.max(0, etf.baselineHistory5Y.length - 2)];
            const displayPrice = quote?.currentPrice ?? fallbackLast?.close ?? 0;
            const displayCurrency = quote?.currency ?? etf.currency;
            const dayChangePct =
              quote?.dayChangePct ??
              (fallbackPrev && fallbackPrev.close > 0
                ? ((displayPrice - fallbackPrev.close) / fallbackPrev.close) * 100
                : 0);
            const isPositiveDay = dayChangePct >= 0;
            const isLive =
              quote?.source === 'live-yahoo-proxy' || quote?.source === 'live-cors-fallback';

            const activeWeight = allocationById.get(etf.id);
            const isSelected100 =
              allocations.length === 1 && allocations[0].etfId === etf.id;
            const isInMix = activeWeight !== undefined;

            const pairedEtf = etf.pairedEtfId ? etfById.get(etf.pairedEtfId) : undefined;
            const links = getEtfExternalLinks(etf.isin, etf.ticker);
            const notesOpen = Boolean(expandedNotesById[etf.id]);

            return (
              <div
                key={etf.id}
                className={`fintech-card flex flex-col justify-between rounded-2xl p-4 transition-all sm:p-5 ${
                  isInMix
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/25'
                    : 'hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Card Top: Identity + Live Price */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-base font-bold text-white">
                          {etf.ticker}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            etf.distributionPolicy === 'Acc'
                              ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border border-amber-500/40 bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {etf.distributionPolicy}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          {etf.domicile}
                        </span>
                        <span className="rounded-full border border-slate-700/70 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400">
                          {etf.provider}
                        </span>
                        {isInMix && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-slate-950">
                            Active · {activeWeight}%
                          </span>
                        )}
                      </div>

                      <h4 className="mt-1.5 text-sm font-semibold leading-snug text-slate-100">
                        {etf.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-400">{etf.indexTracked}</p>
                    </div>

                    {/* Live Price & Source Box */}
                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/75 px-3 py-2 sm:flex-col sm:items-end sm:gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          title={
                            quote
                              ? `${quote.exchangeName} · Updated ${quote.lastUpdated}`
                              : 'Bundled 5Y historical snapshot'
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isLive
                              ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border border-slate-600/60 bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLive ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'
                            }`}
                          />
                          {isLive ? 'Live' : 'Snapshot'}
                        </span>
                        <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                          {formatCurrencyPrice(displayPrice, displayCurrency)}
                        </span>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums ${
                          isPositiveDay ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositiveDay ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositiveDay ? '+' : ''}
                        {dayChangePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Identifiers & Cost Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/90 bg-slate-900/50 p-2.5 text-xs sm:grid-cols-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        ISIN
                      </span>
                      <span className="font-mono font-semibold text-slate-200">{etf.isin}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        WKN
                      </span>
                      <span className="font-mono font-semibold text-slate-200">{etf.wkn}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        TER (Fee)
                      </span>
                      <span className="font-mono font-semibold text-sky-300 tabular-nums">
                        {etf.ter.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        Tracking Diff
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          etf.trackingDifference <= 0 ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {etf.trackingDifference > 0 ? '+' : ''}
                        {etf.trackingDifference.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls + Twin Compare + External Portals */}
                <div className="mt-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSingle(etf.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected100
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isSelected100 ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Selected (100%)
                        </>
                      ) : (
                        'Use 100%'
                      )}
                    </button>

                    {!isInMix && (
                      <button
                        type="button"
                        onClick={() => handleAddToMix(etf.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to Mix
                      </button>
                    )}

                    {pairedEtf && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToTwin(etf)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
                        title={`Compare / Switch to Twin (${etf.distributionPolicy} ↔ ${pairedEtf.distributionPolicy})`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Compare / Switch to Twin ({pairedEtf.ticker} ·{' '}
                        {pairedEtf.distributionPolicy})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleNotes(etf.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Notes
                      {notesOpen ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {notesOpen && (
                    <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs leading-relaxed text-slate-300">
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                        <span>Replication: {etf.replication}</span>
                        <span>·</span>
                        <span>Size: €{etf.fundSizeBillionsEur.toFixed(1)}B</span>
                        <span>·</span>
                        <span>Holdings: {etf.holdingsCount.toLocaleString()}</span>
                        <span>·</span>
                        <span>PRIIPs Risk: {etf.riskRatingPriips}/7</span>
                      </div>
                      <p>
                        <span className="font-semibold text-emerald-300">Why careful: </span>
                        {etf.whyCarefulChoice}
                      </p>
                      <p>
                        <span className="font-semibold text-sky-300">Tax note: </span>
                        {etf.taxEfficiencyNotes}
                      </p>
                    </div>
                  )}

                  {/* External Deep Links */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2.5">
                    <span className="mr-1 text-[11px] font-medium text-slate-500">Verify ISIN:</span>
                    {[
                      { label: 'justETF', href: links.justEtf },
                      { label: 'extraETF', href: links.extraEtf },
                      { label: 'Finanzfluss', href: links.finanzfluss },
                      { label: 'OeKB', href: links.oekb },
                      { label: 'Yahoo', href: links.yahooFinance },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 text-[11px] font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300"
                      >
                        {link.label}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
