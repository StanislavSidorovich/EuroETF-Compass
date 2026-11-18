import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe2,
  Info,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { getEtfExternalLinks } from '../../data/europeanPortals';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  CatalogCategory,
  ETFInstrument,
  LiveQuoteData,
  PortfolioAllocationItem,
} from '../../types';
import {
  type DrawerCategoryTab,
  type DropdownAddMode,
  INITIAL_DRAWER_VISIBLE_LIMIT,
  formatCurrencyPrice,
  getInstrumentType,
  matchesSearchQuery,
} from './etfSelectorHelpers';

export interface EtfCatalogDrawerProps {
  etfs: ETFInstrument[];
  groupedAssets: Record<CatalogCategory, ETFInstrument[]>;
  quotesByEtfId: Record<string, LiveQuoteData>;
  etfById: Map<string, ETFInstrument>;
  allocationById: Map<string, number>;
  visibleActiveHoldings: PortfolioAllocationItem[];
  onAddAssetToPortfolio: (etfId: string, mode: DropdownAddMode) => void;
  onSwitchToTwin: (etf: ETFInstrument) => void;
  isLight: boolean;
  cardSurface: string;
}

export function EtfCatalogDrawer({
  etfs,
  groupedAssets,
  quotesByEtfId,
  etfById,
  allocationById,
  visibleActiveHoldings,
  onAddAssetToPortfolio,
  onSwitchToTwin,
  isLight,
  cardSurface,
}: EtfCatalogDrawerProps) {
  const { lang } = useAppPreferences();

  // Collapsible Category Drawer (CLOSED BY DEFAULT!)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerCategoryTab>('Global ETFs');
  const [drawerSearch, setDrawerSearch] = useState('');
  const [showAllInDrawerTab, setShowAllInDrawerTab] = useState(false);
  const [expandedInfoById, setExpandedInfoById] = useState<Record<string, boolean>>({});

  const drawerAssets = useMemo(() => {
    const q = drawerSearch.trim().toLowerCase();
    const baseList = q
      ? etfs.filter((item) => matchesSearchQuery(item, q))
      : groupedAssets[drawerTab];
    return [...baseList].sort((a, b) => {
      const aCustom = a.id.startsWith('custom-') ? 0 : 1;
      const bCustom = b.id.startsWith('custom-') ? 0 : 1;
      return aCustom - bCustom;
    });
  }, [etfs, groupedAssets, drawerTab, drawerSearch]);

  const displayedDrawerAssets = useMemo(() => {
    if (showAllInDrawerTab || drawerSearch.trim().length > 0) {
      return drawerAssets;
    }
    return drawerAssets.slice(0, INITIAL_DRAWER_VISIBLE_LIMIT);
  }, [drawerAssets, showAllInDrawerTab, drawerSearch]);

  const drawerSectionTabs: Array<{ id: DrawerCategoryTab; label: string; count: number }> = [
    {
      id: 'Global ETFs',
      label: tr(lang, '🌍 Global ETFs', '🌍 Мировые ETF'),
      count: groupedAssets['Global ETFs'].length,
    },
    {
      id: 'US ETFs',
      label: tr(lang, '🇺🇸 US ETFs', '🇺🇸 ETF США'),
      count: groupedAssets['US ETFs'].length,
    },
    {
      id: 'Europe & Bond ETFs',
      label: tr(lang, '🇪🇺 Europe ETFs', '🇪🇺 ETF Европы'),
      count: groupedAssets['Europe & Bond ETFs'].length,
    },
    {
      id: 'US Stocks',
      label: tr(
        lang,
        `💻 US Stocks (${groupedAssets['US Stocks'].length})`,
        `💻 Акции США (${groupedAssets['US Stocks'].length})`
      ),
      count: groupedAssets['US Stocks'].length,
    },
    {
      id: 'Europe Stocks',
      label: tr(
        lang,
        `🏰 Europe Stocks (${groupedAssets['Europe Stocks'].length})`,
        `🏰 Акции Европы (${groupedAssets['Europe Stocks'].length})`
      ),
      count: groupedAssets['Europe Stocks'].length,
    },
  ];

  return (
    <div className={`${cardSurface} overflow-hidden rounded-2xl`}>
      <button
        type="button"
        onClick={() => setIsDrawerOpen((prev) => !prev)}
        aria-expanded={isDrawerOpen}
        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs font-bold transition ${
          isLight
            ? 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
            : 'text-slate-200 hover:bg-slate-900/80 hover:text-emerald-300'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {isDrawerOpen
            ? tr(
                lang,
                `📂 Hide Asset Showcase (${etfs.length} ETFs & Stocks) ▴`,
                `📂 Свернуть витрину всех ${etfs.length} ETF и Акций ▴`
              )
            : tr(
                lang,
                `📂 Browse All ${etfs.length} ETFs & Stocks by Category ▾`,
                `📂 Развернуть витрину всех ${etfs.length} ETF и Акций по разделам ▾`
              )}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            isLight
              ? 'border-slate-200 bg-slate-100 text-slate-600'
              : 'border-slate-700 bg-slate-800 text-slate-300'
          }`}
        >
          {isDrawerOpen
            ? tr(lang, 'Collapse', 'Свернуть')
            : tr(lang, '5 Categories', '5 разделов')}
          {isDrawerOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {isDrawerOpen && (
        <div
          className="border-t p-3.5 sm:p-4"
          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
        >
          {/* 5 Section Tabs + Search Input */}
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {drawerSectionTabs.map((tab) => {
                const active = drawerTab === tab.id && !drawerSearch.trim();
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setDrawerTab(tab.id);
                      setDrawerSearch('');
                      setShowAllInDrawerTab(false);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'ui-selected-pill shadow-2xs'
                        : isLight
                          ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ui-text-muted" />
              <input
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder={tr(
                  lang,
                  'Filter all by name, ticker, ISIN...',
                  'Фильтр: тикер, название, ISIN...'
                )}
                className={`w-full rounded-xl border py-1.5 pl-8 pr-7 text-xs focus:outline-none ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                    : 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500'
                }`}
              />
              {drawerSearch && (
                <button
                  type="button"
                  onClick={() => setDrawerSearch('')}
                  aria-label={tr(lang, 'Clear search', 'Очистить')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 ui-text-muted hover:opacity-80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Compact Scannable 2-Column List (Max 8 items per tab initially) */}
          {displayedDrawerAssets.length === 0 ? (
            <div
              className={`mt-3 rounded-xl border p-6 text-center text-xs ${
                isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400'
              }`}
            >
              {tr(
                lang,
                `No catalog assets match "${drawerSearch}". Try the ticker lookup above to fetch it live!`,
                `По запросу «${drawerSearch}» ничего не найдено. Попробуйте добавить тикер напрямую через поле «По тикеру» выше!`
              )}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {displayedDrawerAssets.map((etf) => {
                  const quote = quotesByEtfId[etf.id];
                  const fallbackLast =
                    etf.baselineHistory5Y[etf.baselineHistory5Y.length - 1];
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
                  const instType = getInstrumentType(etf);
                  const activeWeight = allocationById.get(etf.id) ?? 0;
                  const isInMix = activeWeight > 0;
                  const isSelected100 =
                    visibleActiveHoldings.length === 1 &&
                    visibleActiveHoldings[0].etfId === etf.id;
                  const pairedEtf = etf.pairedEtfId ? etfById.get(etf.pairedEtfId) : undefined;
                  const infoOpen = Boolean(expandedInfoById[etf.id]);
                  const links = getEtfExternalLinks(etf.isin, etf.ticker);

                  return (
                    <div
                      key={etf.id}
                      className={`rounded-xl border p-3 transition ${
                        isInMix
                          ? 'border-emerald-500/70 ui-tint-sage'
                          : isLight
                            ? 'border-slate-200 bg-slate-50/65 hover:border-slate-300'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`font-mono text-sm font-bold ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {etf.ticker}
                            </span>
                            {instType === 'Stock' ? (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  isLight
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-sky-500/20 text-sky-300'
                                }`}
                              >
                                {tr(lang, 'Stock', 'Акция')}
                              </span>
                            ) : (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  etf.distributionPolicy === 'Acc'
                                    ? 'ui-soft-pill border'
                                    : isLight
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                ETF · {etf.distributionPolicy}
                              </span>
                            )}
                            <span
                              className={`font-mono text-[10px] ${
                                isLight ? 'text-slate-500' : 'text-slate-400'
                              }`}
                            >
                              {instType === 'ETF'
                                ? `TER ${etf.ter.toFixed(2)}%`
                                : `Div ${etf.dividendYieldEst.toFixed(1)}%`}
                            </span>
                          </div>
                          <div
                            className={`mt-0.5 truncate text-xs font-semibold ${
                              isLight ? 'text-slate-800' : 'text-slate-200'
                            }`}
                          >
                            {etf.shortName || etf.name}
                          </div>
                          <div
                            className={`truncate text-[11px] ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {etf.isin} · {etf.indexTracked}
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-mono tabular-nums">
                          <div
                            className={`text-xs font-bold ${
                              isLight ? 'text-slate-900' : 'text-slate-100'
                            }`}
                          >
                            {formatCurrencyPrice(displayPrice, displayCurrency)}
                          </div>
                          <div
                            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                              isPositiveDay
                                ? 'ui-text-sage'
                                : isLight
                                  ? 'text-rose-600'
                                  : 'text-rose-400'
                            }`}
                          >
                            {isPositiveDay ? (
                              <TrendingUp className="h-2.5 w-2.5" />
                            ) : (
                              <TrendingDown className="h-2.5 w-2.5" />
                            )}
                            {isPositiveDay ? '+' : ''}
                            {dayChangePct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Compact Action Buttons */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {!isInMix ? (
                          <button
                            type="button"
                            onClick={() => onAddAssetToPortfolio(etf.id, 'mix')}
                            className="ui-selected-pill inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition hover:opacity-90"
                          >
                            <Plus className="h-3 w-3" />
                            {tr(lang, 'Add to Mix', 'В портфель')}
                          </button>
                        ) : (
                          <span className="ui-soft-pill inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold">
                            <Check className="h-3 w-3" />
                            {activeWeight}%
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onAddAssetToPortfolio(etf.id, 'replace')}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            isSelected100
                              ? isLight
                                ? 'border-sky-500 bg-sky-50 text-sky-800'
                                : 'border-sky-400 bg-sky-500/20 text-sky-200'
                              : isLight
                                ? 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-500/60 hover:text-sky-300'
                          }`}
                        >
                          {isSelected100 && <Check className="h-3 w-3" />}
                          {tr(lang, '100% Only', 'Только 100%')}
                        </button>

                        {pairedEtf && (
                          <button
                            type="button"
                            onClick={() => onSwitchToTwin(etf)}
                            title={tr(
                              lang,
                              `Compare twin: ${pairedEtf.ticker} (${pairedEtf.distributionPolicy})`,
                              `Сравнить близнец: ${pairedEtf.ticker} (${pairedEtf.distributionPolicy})`
                            )}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                              isLight
                                ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                            }`}
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            {pairedEtf.ticker}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedInfoById((prev) => ({
                              ...prev,
                              [etf.id]: !prev[etf.id],
                            }))
                          }
                          className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${
                            isLight
                              ? 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <Info className="h-3 w-3" />
                          {tr(lang, 'Details', 'Детали')}
                        </button>
                      </div>

                      {infoOpen && (
                        <div
                          className={`mt-2 space-y-1.5 rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                            isLight
                              ? 'border-slate-200 bg-white text-slate-700'
                              : 'border-slate-800 bg-slate-900/90 text-slate-300'
                          }`}
                        >
                          <p>{etf.whyCarefulChoice}</p>
                          <p className={isLight ? 'text-sky-700' : 'text-sky-300'}>
                            {etf.taxEfficiencyNotes}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1 ui-text-subtle">
                              <Globe2 className="h-3 w-3" />
                              {tr(lang, 'Verify:', 'Проверить:')}
                            </span>
                            {(instType === 'ETF'
                              ? [
                                  { label: 'justETF', href: links.justEtf },
                                  { label: 'extraETF', href: links.extraEtf },
                                  { label: 'Yahoo', href: links.yahooFinance },
                                ]
                              : [
                                  { label: 'Yahoo Finance', href: links.yahooFinance },
                                  { label: 'extraETF', href: links.extraEtf },
                                ]
                            ).map((l) => (
                              <a
                                key={l.label}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-0.5 hover:underline ${
                                  isLight ? 'text-sky-700' : 'text-sky-300'
                                }`}
                              >
                                {l.label}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {drawerSearch.trim().length === 0 &&
                drawerAssets.length > INITIAL_DRAWER_VISIBLE_LIMIT && (
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllInDrawerTab((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                        isLight
                          ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                    >
                      {showAllInDrawerTab ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          {tr(lang, 'Show fewer items', 'Показать меньше')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          {tr(
                            lang,
                            `Show all ${drawerAssets.length} items in ${drawerTab} (+${drawerAssets.length - INITIAL_DRAWER_VISIBLE_LIMIT} more)`,
                            `Показать все ${drawerAssets.length} в разделе (ещё ${drawerAssets.length - INITIAL_DRAWER_VISIBLE_LIMIT})`
                          )}
                        </>
                      )}
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
