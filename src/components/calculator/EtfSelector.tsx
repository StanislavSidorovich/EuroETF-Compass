import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Scale,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  CatalogCategory,
  ETFInstrument,
  LiveQuoteData,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';
import { EtfCatalogDrawer } from './EtfCatalogDrawer';
import {
  type DropdownAddMode,
  PORTFOLIO_PRESET_SPECS,
  SLICE_COLORS,
  formatCurrencyPrice,
  getInstrumentCategory,
  getInstrumentType,
  isPresetMatch,
  resolveCandidateAsset,
  resolveTickerQuery,
} from './etfSelectorHelpers';

export interface EtfSelectorProps {
  etfs: ETFInstrument[];
  quotesByEtfId: Record<string, LiveQuoteData>;
  allocations: PortfolioAllocationItem[];
  onChangeAllocations: (allocations: PortfolioAllocationItem[]) => void;
  onAddCustomTicker: (ticker: string) => Promise<void>;
  isFetchingCustomTicker?: boolean;
  customTickerError?: string | null;
  theme?: ThemeMode;
}

export function EtfSelector({
  etfs,
  quotesByEtfId,
  allocations,
  onChangeAllocations,
  onAddCustomTicker,
  isFetchingCustomTicker = false,
  customTickerError = null,
  theme,
}: EtfSelectorProps) {
  const { lang, theme: ctxTheme } = useAppPreferences();
  const isLight = (theme ?? ctxTheme) === 'light';

  // Compact UI controls
  const [addMode, setAddMode] = useState<DropdownAddMode>('mix');
  const [tickerInput, setTickerInput] = useState('');
  const [localLookupError, setLocalLookupError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [pendingAutoAdd, setPendingAutoAdd] = useState<{
    ticker: string;
    mode: DropdownAddMode;
  } | null>(null);
  const [editingWeightEtfId, setEditingWeightEtfId] = useState<string | null>(null);

  const knownEtfIdsBeforeFetchRef = useRef<Set<string>>(new Set());

  const etfById = useMemo(() => new Map(etfs.map((e) => [e.id, e])), [etfs]);
  const allocationById = useMemo(
    () => new Map(allocations.map((a) => [a.etfId, a.weightPct])),
    [allocations]
  );

  // Only active portfolio holdings (keep item visible while typing its weight so it doesn't jump away)
  const visibleActiveHoldings = useMemo(
    () =>
      allocations.filter(
        (item) => (item.weightPct > 0 || item.etfId === editingWeightEtfId) && etfById.has(item.etfId)
      ),
    [allocations, editingWeightEtfId, etfById]
  );

  const totalWeightPct = useMemo(
    () =>
      allocations.reduce(
        (sum, item) => sum + (Number.isFinite(item.weightPct) ? item.weightPct : 0),
        0
      ),
    [allocations]
  );

  const resolvedPresets = useMemo(() => {
    return PORTFOLIO_PRESET_SPECS.map((spec) => {
      const resolvedItems: PortfolioAllocationItem[] = [];
      for (const item of spec.items) {
        const match = resolveCandidateAsset(etfs, item.candidates);
        if (!match) return null;
        resolvedItems.push({ etfId: match.id, weightPct: item.weightPct });
      }
      return {
        ...spec,
        items: resolvedItems,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [etfs]);

  // Group all assets cleanly into the 5 categories
  const groupedAssets = useMemo(() => {
    const groups: Record<CatalogCategory, ETFInstrument[]> = {
      'Global ETFs': [],
      'US ETFs': [],
      'Europe & Bond ETFs': [],
      'US Stocks': [],
      'Europe Stocks': [],
    };
    for (const item of etfs) {
      groups[getInstrumentCategory(item)].push(item);
    }
    return groups;
  }, [etfs]);

  const addAssetToPortfolio = (etfId: string, mode: DropdownAddMode = addMode) => {
    const targetEtf = etfById.get(etfId) ?? etfs.find((e) => e.id === etfId);
    const tickerLabel = targetEtf?.ticker ?? etfId;

    if (mode === 'replace') {
      onChangeAllocations([{ etfId, weightPct: 100 }]);
      setActionNotice(
        tr(
          lang,
          `Switched to 100% ${tickerLabel}.`,
          `Выбран 100% фокус на ${tickerLabel}.`
        )
      );
      return;
    }

    const existing = allocations.find((a) => a.etfId === etfId);
    if (existing && existing.weightPct > 0) {
      setActionNotice(
        tr(
          lang,
          `${tickerLabel} is already in your portfolio (${existing.weightPct}%).`,
          `${tickerLabel} уже в вашем портфеле (${existing.weightPct}%).`
        )
      );
      return;
    }

    const nonZero = allocations.filter((a) => a.weightPct > 0 && a.etfId !== etfId);
    if (nonZero.length === 0) {
      onChangeAllocations([{ etfId, weightPct: 100 }]);
      setActionNotice(
        tr(lang, `Added ${tickerLabel} (100%).`, `Добавлен ${tickerLabel} (100%).`)
      );
      return;
    }

    // Rescale existing holdings to ~80% and assign 20% to the newly added asset
    const nextExisting = nonZero.map((item) => ({
      ...item,
      weightPct: Math.max(5, Math.round((item.weightPct * 0.8) / 5) * 5),
    }));
    const existingSum = nextExisting.reduce((sum, item) => sum + item.weightPct, 0);
    const newWeight = Math.max(5, 100 - existingSum);
    onChangeAllocations([...nextExisting, { etfId, weightPct: newWeight }]);
    setActionNotice(
      tr(
        lang,
        `Added ${tickerLabel} (${newWeight}%). Weights rebalanced to 100%.`,
        `Добавлен ${tickerLabel} (${newWeight}%). Доли пересчитаны до 100%.`
      )
    );
  };

  // Auto-add newly fetched custom ticker once it arrives in `etfs`
  useEffect(() => {
    if (!pendingAutoAdd) return;

    const targetUpper = pendingAutoAdd.ticker.toUpperCase();
    const newlyArrived =
      etfs.find((e) => !knownEtfIdsBeforeFetchRef.current.has(e.id)) ??
      etfs.find(
        (e) =>
          e.ticker.toUpperCase() === targetUpper ||
          e.ticker.toUpperCase().startsWith(`${targetUpper}.`) ||
          e.id === `custom-${targetUpper.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      );

    if (newlyArrived) {
      if (pendingAutoAdd.mode === 'replace') {
        onChangeAllocations([{ etfId: newlyArrived.id, weightPct: 100 }]);
        setActionNotice(
          tr(
            lang,
            `Loaded ${newlyArrived.ticker} and set portfolio to 100%.`,
            `Тикер ${newlyArrived.ticker} загружен (100% портфеля).`
          )
        );
      } else {
        const alreadyInMix = allocations.some(
          (a) => a.etfId === newlyArrived.id && a.weightPct > 0
        );
        if (!alreadyInMix) {
          const nonZero = allocations.filter((a) => a.weightPct > 0);
          if (nonZero.length === 0) {
            onChangeAllocations([{ etfId: newlyArrived.id, weightPct: 100 }]);
          } else {
            const nextExisting = nonZero.map((item) => ({
              ...item,
              weightPct: Math.max(5, Math.round((item.weightPct * 0.8) / 5) * 5),
            }));
            const existingSum = nextExisting.reduce((sum, item) => sum + item.weightPct, 0);
            const newWeight = Math.max(5, 100 - existingSum);
            onChangeAllocations([...nextExisting, { etfId: newlyArrived.id, weightPct: newWeight }]);
          }
        }
        setActionNotice(
          tr(
            lang,
            `Ticker ${newlyArrived.ticker} loaded and added to your portfolio!`,
            `Тикер ${newlyArrived.ticker} загружен и добавлен в портфель!`
          )
        );
      }
      setPendingAutoAdd(null);
      return;
    }

    if (!isFetchingCustomTicker && customTickerError) {
      setPendingAutoAdd(null);
    }
  }, [
    etfs,
    pendingAutoAdd,
    isFetchingCustomTicker,
    customTickerError,
    allocations,
    onChangeAllocations,
    lang,
  ]);

  const handleWeightChange = (etfId: string, rawValue: number) => {
    const safeVal = Number.isFinite(rawValue) ? rawValue : 0;
    const clamped = Math.max(0, Math.min(100, Math.round(safeVal)));
    onChangeAllocations(
      allocations.map((item) => (item.etfId === etfId ? { ...item, weightPct: clamped } : item))
    );
  };

  const handleWeightBlur = (etfId: string) => {
    setEditingWeightEtfId((prev) => (prev === etfId ? null : prev));
    const current = allocations.find((a) => a.etfId === etfId);
    if (current && current.weightPct <= 0) {
      if (allocations.length <= 1) {
        onChangeAllocations([{ etfId, weightPct: 100 }]);
      } else {
        handleRemoveFromMix(etfId);
      }
    }
  };

  const handleRemoveFromMix = (etfId: string) => {
    const activeCount = allocations.filter((a) => a.weightPct > 0).length;
    if (
      allocations.length <= 1 ||
      (activeCount <= 1 && (allocationById.get(etfId) ?? 0) > 0)
    ) {
      return;
    }
    const remaining = allocations.filter((item) => item.etfId !== etfId && item.weightPct > 0);
    if (remaining.length === 0) return;

    const sum = remaining.reduce((s, item) => s + Math.max(0, item.weightPct), 0);
    if (sum <= 0) {
      const equal = Math.floor(100 / remaining.length);
      const rem = 100 - equal * remaining.length;
      onChangeAllocations(
        remaining.map((item, idx) => ({ ...item, weightPct: equal + (idx === 0 ? rem : 0) }))
      );
      return;
    }
    const scaled = remaining.map((item) => ({
      ...item,
      weightPct: Math.round((Math.max(0, item.weightPct) / sum) * 100),
    }));
    const diff = 100 - scaled.reduce((s, item) => s + item.weightPct, 0);
    if (diff !== 0 && scaled.length > 0) {
      scaled[0] = { ...scaled[0], weightPct: Math.max(1, scaled[0].weightPct + diff) };
    }
    onChangeAllocations(scaled);
  };

  const handleNormalizeWeights = () => {
    const valid = allocations.filter((a) => a.weightPct > 0);
    if (valid.length === 0) return;
    const sum = valid.reduce((s, item) => s + item.weightPct, 0);
    const scaled = valid.map((item) => ({
      ...item,
      weightPct: Math.round((item.weightPct / sum) * 100),
    }));
    const diff = 100 - scaled.reduce((s, item) => s + item.weightPct, 0);
    if (diff !== 0 && scaled.length > 0) {
      scaled[0] = { ...scaled[0], weightPct: Math.max(1, scaled[0].weightPct + diff) };
    }
    onChangeAllocations(scaled);
  };

  const handleEqualizeWeights = () => {
    const valid = allocations.filter((a) => a.weightPct > 0);
    if (valid.length === 0) return;
    const base = Math.floor(100 / valid.length);
    const rem = 100 - base * valid.length;
    onChangeAllocations(
      valid.map((item, idx) => ({
        ...item,
        weightPct: base + (idx === 0 ? rem : 0),
      }))
    );
  };

  const handleSwitchToTwin = (etf: ETFInstrument) => {
    if (!etf.pairedEtfId || !etfById.has(etf.pairedEtfId)) return;
    const twinId = etf.pairedEtfId;
    const twin = etfById.get(twinId);

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
    if (twin) {
      setActionNotice(
        tr(
          lang,
          `Switched ${etf.ticker} → twin ${twin.ticker} (${twin.distributionPolicy}).`,
          `Переключено ${etf.ticker} → близнец ${twin.ticker} (${twin.distributionPolicy}).`
        )
      );
    }
  };

  const executeTickerLookupAndAdd = async (rawQuery: string, mode: DropdownAddMode = addMode) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setLocalLookupError(
        tr(
          lang,
          'Enter a ticker or company name (e.g., NVDA, AMD, NFLX, VUAA.DE).',
          'Введите тикер или компанию (например: NVDA, AMD, NFLX, VUAA.DE).'
        )
      );
      return;
    }

    setLocalLookupError(null);
    setActionNotice(null);

    const resolvedTicker = resolveTickerQuery(trimmed);

    const existingExact = etfs.find((e) => {
      const upper = resolvedTicker.toUpperCase();
      const base = e.ticker.toUpperCase().split('.')[0];
      return (
        e.ticker.toUpperCase() === upper ||
        base === upper ||
        e.altTickers.some((alt) => alt.toUpperCase() === upper)
      );
    });

    if (existingExact) {
      addAssetToPortfolio(existingExact.id, mode);
      setTickerInput('');
      return;
    }

    knownEtfIdsBeforeFetchRef.current = new Set(etfs.map((e) => e.id));
    setPendingAutoAdd({ ticker: resolvedTicker, mode });

    try {
      await onAddCustomTicker(resolvedTicker);
      setTickerInput('');
    } catch (err) {
      setPendingAutoAdd(null);
      setLocalLookupError(
        err instanceof Error
          ? err.message
          : tr(
              lang,
              `Failed to load ticker "${resolvedTicker}".`,
              `Не удалось загрузить тикер «${resolvedTicker}».`
            )
      );
    }
  };

  const handleLookupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await executeTickerLookupAndAdd(tickerInput, addMode);
  };

  const handleDropdownSelect = (selectedId: string) => {
    if (!selectedId) return;
    addAssetToPortfolio(selectedId, addMode);
  };

  const combinedLookupError = customTickerError ?? localLookupError;
  const cardSurface = isLight ? 'border border-slate-200 bg-white shadow-sm' : 'fintech-card';
  const subSurface = isLight
    ? 'border border-slate-200 bg-slate-50/90'
    : 'border border-slate-800 bg-slate-900/70';

  const optGroupSpecs: Array<{ category: CatalogCategory; label: string }> = [
    {
      category: 'Global ETFs',
      label: tr(
        lang,
        `🌍 Global ETFs (${groupedAssets['Global ETFs'].length})`,
        `🌍 Мировые ETF (${groupedAssets['Global ETFs'].length})`
      ),
    },
    {
      category: 'US ETFs',
      label: tr(
        lang,
        `🇺🇸 US ETFs (${groupedAssets['US ETFs'].length})`,
        `🇺🇸 ETF США (${groupedAssets['US ETFs'].length})`
      ),
    },
    {
      category: 'Europe & Bond ETFs',
      label: tr(
        lang,
        `🇪🇺 Europe & Bond ETFs (${groupedAssets['Europe & Bond ETFs'].length})`,
        `🇪🇺 ETF Европы и Облигации (${groupedAssets['Europe & Bond ETFs'].length})`
      ),
    },
    {
      category: 'US Stocks',
      label: tr(
        lang,
        `💻 Top ${groupedAssets['US Stocks'].length} US Stocks (NVDA, AAPL, MSFT, GOOGL, META...)`,
        `💻 Топ-${groupedAssets['US Stocks'].length} Акций США (NVDA, AAPL, MSFT, GOOGL, META...)`
      ),
    },
    {
      category: 'Europe Stocks',
      label: tr(
        lang,
        `🏰 Top ${groupedAssets['Europe Stocks'].length} Europe Stocks (ASML, Novo, SAP, LVMH, EDP.LS...)`,
        `🏰 Топ-${groupedAssets['Europe Stocks'].length} Акций Европы (ASML, Novo, SAP, LVMH, EDP.LS...)`
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* ===================================================================
          COMPACT BUILDER CARD (ROW 1 + ROW 2)
      =================================================================== */}
      <div className={`${cardSurface} rounded-2xl p-3.5 sm:p-4`}>
        {/* -----------------------------------------------------------------
            ROW 1: 1-CLICK BEGINNER PORTFOLIOS (6 CLEAN PILL BUTTONS)
        ----------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`mr-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`} />
            {tr(lang, '1-Click Portfolios:', 'Готовые портфели:')}
          </span>

          {resolvedPresets.map((preset) => {
            const active = isPresetMatch(preset.items, allocations);
            const label = lang === 'en' ? preset.labelEn : preset.labelRu;
            const desc = lang === 'en' ? preset.descEn : preset.descRu;
            return (
              <button
                key={preset.id}
                type="button"
                title={desc}
                onClick={() => {
                  onChangeAllocations(preset.items);
                  setActionNotice(
                    tr(lang, `Loaded preset: ${label}`, `Выбран портфель: ${label}`)
                  );
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? 'ui-selected-pill shadow-xs'
                    : 'ui-border-default ui-surface-deep ui-text-body hover:border-emerald-500/60 ui-hover-elevated'
                }`}
              >
                <span>{label}</span>
                {active && <Check className="h-3 w-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* -----------------------------------------------------------------
            ROW 2: ACTIVE PORTFOLIO HOLDINGS + GROUPED DROPDOWN & TICKER INPUT
        ----------------------------------------------------------------- */}
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
        >
          {/* Compact Active Header + Allocation Progress Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale
                className={`h-4 w-4 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                {tr(lang, 'Active Portfolio', 'Ваш активный портфель')} ({visibleActiveHoldings.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {visibleActiveHoldings.length > 1 && (
                <button
                  type="button"
                  onClick={handleEqualizeWeights}
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                    isLight
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {tr(lang, 'Equalize', 'Поровну')}
                </button>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                  Math.abs(totalWeightPct - 100) < 0.01
                    ? isLight
                      ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                      : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                    : isLight
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                }`}
              >
                {tr(lang, 'Total:', 'Сумма:')} {totalWeightPct}%
              </span>
              {Math.abs(totalWeightPct - 100) >= 0.01 && (
                <button
                  type="button"
                  onClick={handleNormalizeWeights}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                    isLight
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  {tr(lang, 'Normalize 100%', 'Выровнять 100%')}
                </button>
              )}
            </div>
          </div>

          {/* Thin Visual Allocation Bar */}
          <div
            className={`mt-2 flex h-1.5 w-full overflow-hidden rounded-full ${
              isLight ? 'bg-slate-200' : 'bg-slate-800'
            }`}
          >
            {visibleActiveHoldings.map((item, idx) => {
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

          {/* Compact Horizontal Chips for Active Holdings ONLY */}
          <div
            className={`mt-2.5 grid gap-2 ${
              visibleActiveHoldings.length === 1
                ? 'grid-cols-1'
                : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {visibleActiveHoldings.map((item, idx) => {
              const etf = etfById.get(item.etfId);
              if (!etf) return null;

              const quote = quotesByEtfId[etf.id];
              const fallbackLast = etf.baselineHistory5Y[etf.baselineHistory5Y.length - 1];
              const displayPrice = quote?.currentPrice ?? fallbackLast?.close ?? 0;
              const displayCurrency = quote?.currency ?? etf.currency;
              const dayChangePct = quote?.dayChangePct ?? 0;
              const instType = getInstrumentType(etf);
              const pairedEtf = etf.pairedEtfId ? etfById.get(etf.pairedEtfId) : undefined;
              const canRemove = visibleActiveHoldings.length > 1;

              return (
                <div
                  key={item.etfId}
                  className={`${subSurface} flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl px-3 py-2`}
                >
                  {/* Identity + Badge + Price */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        SLICE_COLORS[idx % SLICE_COLORS.length]
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-mono text-xs font-bold sm:text-sm ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {etf.ticker}
                        </span>
                        {instType === 'Stock' ? (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              isLight
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            <Building2 className="h-2.5 w-2.5" />
                            {tr(lang, 'Stock', 'Акция')}
                          </span>
                        ) : (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              etf.distributionPolicy === 'Acc'
                                ? isLight
                                  ? 'bg-[#2d8a61]/15 text-[#1f6e4b]'
                                  : 'bg-[#2d8a61]/25 text-[#86d6b0]'
                                : isLight
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            ETF · {etf.distributionPolicy}
                          </span>
                        )}
                        <span
                          className={`truncate text-xs ${
                            isLight ? 'text-slate-600' : 'text-slate-300'
                          }`}
                        >
                          {etf.shortName || etf.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Price + Weight Slider + Input + Twin Switch + Remove */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <div className="text-right font-mono tabular-nums">
                      <span
                        className={`text-xs font-bold ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {formatCurrencyPrice(displayPrice, displayCurrency)}
                      </span>
                      <span
                        className={`ml-1.5 text-[10px] font-semibold ${
                          dayChangePct >= 0
                            ? isLight
                              ? 'text-[#2d8a61]'
                              : 'text-[#6ec9a0]'
                            : isLight
                              ? 'text-rose-600'
                              : 'text-rose-400'
                        }`}
                      >
                        {dayChangePct >= 0 ? '+' : ''}
                        {dayChangePct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Weight Slider & Input */}
                    {visibleActiveHoldings.length > 1 && (
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={item.weightPct}
                        onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                        aria-label={`Weight slider for ${etf.ticker}`}
                        className={`h-1.5 w-20 cursor-pointer sm:w-24 ${
                          isLight ? 'accent-[#2d8a61]' : 'accent-[#3b9b72]'
                        }`}
                      />
                    )}
                    <div
                      className={`flex items-center rounded-lg border px-1.5 py-0.5 ${
                        isLight
                          ? 'border-slate-300 bg-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.weightPct}
                        onFocus={() => setEditingWeightEtfId(item.etfId)}
                        onBlur={() => handleWeightBlur(item.etfId)}
                        onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                        aria-label={`Weight percentage for ${etf.ticker}`}
                        className={`w-9 bg-transparent text-right font-mono text-xs font-bold tabular-nums focus:outline-none ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      />
                      <span
                        className={`ml-0.5 text-[11px] ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        %
                      </span>
                    </div>

                    {/* Twin Acc <-> Dist Switch Button */}
                    {pairedEtf && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToTwin(etf)}
                        title={tr(
                          lang,
                          `Switch to ${pairedEtf.distributionPolicy} twin (${pairedEtf.ticker})`,
                          `Переключить на ${pairedEtf.distributionPolicy}-близнец (${pairedEtf.ticker})`
                        )}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                          isLight
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                        }`}
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span className="hidden sm:inline">{pairedEtf.ticker}</span>
                        <span>({pairedEtf.distributionPolicy})</span>
                      </button>
                    )}

                    {/* Compact Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromMix(item.etfId)}
                      disabled={!canRemove}
                      aria-label={tr(
                        lang,
                        `Remove ${etf.ticker}`,
                        `Удалить ${etf.ticker}`
                      )}
                      title={
                        canRemove
                          ? tr(lang, `Remove ${etf.ticker}`, `Удалить ${etf.ticker}`)
                          : tr(
                              lang,
                              'Portfolio needs at least 1 asset',
                              'В портфеле должен быть минимум 1 актив'
                            )
                      }
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                          : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300'
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------------------------------------------------------------
              QUICK ADD BAR: GROUPED DROPDOWN + MODE TOGGLE + TICKER LOOKUP
          --------------------------------------------------------------- */}
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
            {/* Grouped Dropdown + Add/Replace Toggle */}
            <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:flex-nowrap">
              <div
                className={`inline-flex shrink-0 rounded-xl border p-0.5 text-[11px] font-semibold ${
                  isLight
                    ? 'border-slate-300 bg-slate-100'
                    : 'border-slate-700 bg-slate-950'
                }`}
                role="group"
                aria-label={tr(lang, 'Asset addition mode', 'Режим добавления')}
              >
                <button
                  type="button"
                  onClick={() => setAddMode('mix')}
                  className={`rounded-lg px-2 py-1 transition ${
                    addMode === 'mix'
                      ? isLight
                        ? 'bg-[#2d8a61] text-white shadow-2xs'
                        : 'bg-[#3b9b72] text-slate-950 shadow-2xs'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tr(lang, '+ Mix', '+ В микс')}
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('replace')}
                  className={`rounded-lg px-2 py-1 transition ${
                    addMode === 'replace'
                      ? isLight
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-sky-500 text-white shadow-2xs'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tr(lang, 'Replace (100%)', 'Заменить (100%)')}
                </button>
              </div>

              <select
                value=""
                onChange={(e) => handleDropdownSelect(e.target.value)}
                aria-label={tr(
                  lang,
                  'Add Popular ETF or Stock by Category',
                  'Добавить популярный ETF или Акцию по категориям'
                )}
                className={`min-w-[210px] flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-800 focus:border-[#2d8a61]'
                    : 'border-slate-700 bg-slate-950 text-slate-100 focus:border-[#3b9b72]'
                }`}
              >
                <option value="">
                  {tr(
                    lang,
                    '+ Add Popular ETF or Stock by Category...',
                    '+ Добавить популярный ETF или Акцию из списка...'
                  )}
                </option>
                {optGroupSpecs.map((group) => {
                  const items = groupedAssets[group.category];
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={group.category} label={group.label}>
                      {items.map((item) => {
                        const instType = getInstrumentType(item);
                        const quote = quotesByEtfId[item.id];
                        const price =
                          quote?.currentPrice ??
                          item.baselineHistory5Y[item.baselineHistory5Y.length - 1]?.close ??
                          0;
                        const curr = quote?.currency ?? item.currency;
                        const inMix = (allocationById.get(item.id) ?? 0) > 0;
                        const tag =
                          instType === 'Stock'
                            ? tr(lang, 'Stock', 'Акция')
                            : item.distributionPolicy;
                        return (
                          <option key={item.id} value={item.id}>
                            {inMix ? '✓ ' : ''}
                            {item.ticker} — {item.shortName} [{tag}] ·{' '}
                            {formatCurrencyPrice(price, curr)}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Inline Custom Ticker Lookup */}
            <form
              onSubmit={handleLookupSubmit}
              className="flex shrink-0 items-center gap-1.5 lg:w-[330px] xl:w-[360px]"
            >
              <div className="relative flex-1">
                <Search
                  className={`pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => {
                    setTickerInput(e.target.value);
                    if (localLookupError) setLocalLookupError(null);
                  }}
                  placeholder={tr(
                    lang,
                    'Any ticker: NVDA, AMD, NFLX, VUAA.DE',
                    'Тикер: NVDA, AMD, NFLX, VUAA.DE'
                  )}
                  aria-label={tr(lang, 'Add custom ticker', 'Добавить по тикеру')}
                  className={`w-full rounded-xl border py-2 pl-8 pr-2.5 font-mono text-xs focus:outline-none ${
                    isLight
                      ? 'border-slate-300 bg-white text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#2d8a61]'
                      : 'border-slate-700 bg-slate-950 text-slate-100 placeholder:font-sans placeholder:text-slate-500 focus:border-[#3b9b72]'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isFetchingCustomTicker || !tickerInput.trim()}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isLight
                    ? 'bg-[#2d8a61] text-white hover:bg-[#236f4d]'
                    : 'bg-[#3b9b72] text-slate-950 hover:bg-[#4eb386]'
                }`}
              >
                {isFetchingCustomTicker ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{tr(lang, 'Loading...', 'Загрузка...')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>{tr(lang, 'Add Ticker', 'По тикеру')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Inline Action Confirmation or Error Notice */}
          {actionNotice && (
            <div
              className={`mt-2.5 flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                isLight
                  ? 'border-[#2d8a61]/30 bg-[#2d8a61]/10 text-[#1f6e4b]'
                  : 'border-[#3b9b72]/35 bg-[#2d8a61]/15 text-[#86d6b0]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{actionNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                aria-label={tr(lang, 'Dismiss notice', 'Закрыть')}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {combinedLookupError && (
            <div
              className={`mt-2.5 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                isLight
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
            >
              <AlertCircle
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                  isLight ? 'text-rose-600' : 'text-rose-400'
                }`}
              />
              <span>{combinedLookupError}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          ROW 3: COLLAPSIBLE CATEGORY DRAWER (CLOSED BY DEFAULT!)
      =================================================================== */}
      <EtfCatalogDrawer
        etfs={etfs}
        groupedAssets={groupedAssets}
        quotesByEtfId={quotesByEtfId}
        etfById={etfById}
        allocationById={allocationById}
        visibleActiveHoldings={visibleActiveHoldings}
        onAddAssetToPortfolio={addAssetToPortfolio}
        onSwitchToTwin={handleSwitchToTwin}
        isLight={isLight}
        cardSurface={cardSurface}
      />
    </div>
  );
}
