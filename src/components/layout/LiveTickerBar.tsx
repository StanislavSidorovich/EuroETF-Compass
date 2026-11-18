import React, { useState } from 'react';
import {
  ExternalLink,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
  Loader2,
  Info,
} from 'lucide-react';
import type { ETFInstrument, LiveQuoteData } from '../../types';
import { getEtfExternalLinks } from '../../data/europeanPortals';
import { tr, useAppPreferences } from '../../utils/i18n';

interface LiveTickerBarProps {
  etfs: ETFInstrument[];
  quotesByEtfId: Record<string, LiveQuoteData>;
  onAddCustomTicker: (ticker: string) => Promise<void>;
  isFetchingCustomTicker: boolean;
  customTickerError: string | null;
}

function getCurrencySymbol(currency: string): string {
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  if (currency === 'CHF') return 'CHF ';
  if (currency === 'DKK') return 'kr ';
  return '€';
}

export const LiveTickerBar: React.FC<LiveTickerBarProps> = ({
  etfs,
  quotesByEtfId,
  onAddCustomTicker,
  isFetchingCustomTicker,
  customTickerError,
}) => {
  const { theme, lang } = useAppPreferences();
  const isLight = theme === 'light';
  const [inspectedEtf, setInspectedEtf] = useState<ETFInstrument | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [tickerInput, setTickerInput] = useState('');

  const handleSubmitCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tickerInput.trim().toUpperCase();
    if (!cleaned) return;
    await onAddCustomTicker(cleaned);
    setTickerInput('');
  };

  const inspectedQuote = inspectedEtf ? quotesByEtfId[inspectedEtf.id] : undefined;
  const inspectedLinks = inspectedEtf
    ? getEtfExternalLinks(inspectedEtf.isin, inspectedEtf.ticker)
    : null;

  return (
    <div
      className={`border-b transition-colors ${
        isLight
          ? 'border-slate-200/90 bg-[#f0f5f2]'
          : 'border-slate-700/80 bg-[#1a2636]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 sm:px-6">
        {/* Scrollable Ticker Strip */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          {etfs.map((etf) => {
            const quote = quotesByEtfId[etf.id];
            const price = quote?.currentPrice ?? 0;
            const dayPct = quote?.dayChangePct ?? 0;
            const dayEur = quote?.dayChangeEur ?? 0;
            const isUp = dayPct >= 0;
            const currSym = getCurrencySymbol(quote?.currency ?? etf.currency);
            const isLive = quote && quote.source === 'live-yahoo-proxy';
            const isSnapshot = quote && quote.source === 'snapshot-quotes-json';

            return (
              <button
                key={etf.id}
                type="button"
                onClick={() => setInspectedEtf(etf)}
                title={`${etf.name} — Click to inspect ISIN & European portal links`}
                className={`group flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1 text-left transition ${
                  isLight
                    ? 'border-slate-200/90 bg-white hover:border-[#2d8a61]/50 hover:bg-[#f6faf8] shadow-2xs'
                    : 'border-slate-700/90 bg-slate-800/85 hover:border-slate-500 hover:bg-slate-700/90'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLive || isSnapshot ? 'bg-[#2d8a61]' : 'bg-slate-400'
                    }`}
                    title={
                      isLive
                        ? 'Live (dev proxy)'
                        : isSnapshot
                          ? `quotes.json (${quote?.snapshotDate ?? quote?.lastUpdated?.slice(0, 10) ?? ''})`
                          : 'Built-in baseline (approx.)'
                    }
                  />
                  <span
                    className={`font-mono text-xs font-bold ${
                      isLight
                        ? 'text-slate-800 group-hover:text-[#1b5e3f]'
                        : 'text-white group-hover:text-emerald-300'
                    }`}
                  >
                    {etf.ticker}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      etf.distributionPolicy === 'Acc'
                        ? isLight
                          ? 'bg-[#e3f2eb] text-[#1b5e3f]'
                          : 'bg-emerald-500/20 text-emerald-200'
                        : isLight
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-amber-500/20 text-amber-200'
                    }`}
                  >
                    {etf.distributionPolicy}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {currSym}
                    {price.toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                      isUp
                        ? isLight
                          ? 'text-[#1b6e49]'
                          : 'text-emerald-300'
                        : isLight
                          ? 'text-rose-600'
                          : 'text-rose-400'
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isUp ? '+' : ''}
                    {dayPct.toFixed(2)}% ({isUp ? '+' : ''}
                    {currSym}
                    {dayEur.toFixed(2)})
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* + Custom Ticker Trigger */}
        <button
          type="button"
          onClick={() => setShowCustomInput((prev) => !prev)}
          className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
            isLight
              ? 'border-[#b7dfd0] bg-[#eaf5ef] text-[#1b5e3f] hover:bg-[#daf0e4]'
              : 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tr(lang, '+ Ticker', '+ Тикер')}</span>
        </button>
      </div>

      {/* Inline Custom Ticker Drawer */}
      {showCustomInput && (
        <div className="border-t ui-border-subtle ui-surface-card px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSubmitCustom} className="flex flex-1 flex-wrap items-center gap-2">
              <label htmlFor="tickerbar-custom-input" className="text-xs font-medium ui-text-body">
                {tr(lang, 'Add ETF / Stock by ticker or name:', 'Добавить ETF / акцию по тикеру или названию:')}
              </label>
              <input
                id="tickerbar-custom-input"
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="e.g. VUAA.DE, EMIM.AS, CSPX.L, SPYI.DE"
                className="ui-input w-60 rounded-lg border px-3 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isFetchingCustomTicker || !tickerInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {isFetchingCustomTicker ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching...
                  </>
                ) : (
                  'Fetch & Add'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="rounded-lg p-1.5 ui-text-muted ui-hover-elevated"
                aria-label="Close custom ticker bar"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
            {customTickerError && (
              <p className="text-xs font-medium ui-text-rose">{customTickerError}</p>
            )}
          </div>
        </div>
      )}

      {/* Quick ETF Portal & Fundamentals Inspector Modal */}
      {inspectedEtf && inspectedLinks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspected-etf-title"
        >
          <div className="w-full max-w-lg rounded-2xl border ui-border-default ui-surface-card-solid p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b ui-border-subtle pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold ui-text-sage">
                    {inspectedEtf.ticker}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      inspectedEtf.distributionPolicy === 'Acc'
                        ? 'bg-emerald-500/15 ui-text-sage'
                        : 'bg-amber-500/15 ui-text-sand'
                    }`}
                  >
                    {inspectedEtf.distributionPolicy === 'Acc' ? 'Accumulating' : 'Distributing'}
                  </span>
                  <span className="rounded ui-surface-elevated px-2 py-0.5 font-mono text-[10px] ui-text-body">
                    ISIN: {inspectedEtf.isin}
                  </span>
                </div>
                <h3 id="inspected-etf-title" className="mt-1 text-sm font-bold ui-text-primary">
                  {inspectedEtf.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEtf(null)}
                aria-label="Close ETF inspector"
                className="rounded-lg p-1.5 ui-text-muted transition ui-hover-elevated"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border ui-border-subtle ui-surface-deep p-2.5">
                <span className="text-[11px] ui-text-muted">Price</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums ui-text-primary">
                  {getCurrencySymbol(inspectedQuote?.currency ?? inspectedEtf.currency)}
                  {(inspectedQuote?.currentPrice ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border ui-border-subtle ui-surface-deep p-2.5">
                <span className="text-[11px] ui-text-muted">TER / Domicile</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums ui-text-cool">
                  {inspectedEtf.ter.toFixed(2)}% • {inspectedEtf.domicile.split(' ')[0]}
                </p>
              </div>
              <div className="rounded-xl border ui-border-subtle ui-surface-deep p-2.5">
                <span className="text-[11px] ui-text-muted">Fund Size / WKN</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums ui-text-secondary">
                  €{inspectedEtf.fundSizeBillionsEur.toFixed(1)}B • {inspectedEtf.wkn}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border ui-border-subtle ui-surface-deep p-3 text-xs ui-text-body">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 ui-text-cool" />
                <p className="leading-relaxed">{inspectedEtf.taxEfficiencyNotes}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold ui-text-body">
                Inspect Live Profile on European Portals
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: 'justETF Profile', url: inspectedLinks.justEtf },
                  { label: 'Yahoo Finance', url: inspectedLinks.yahooFinance },
                  { label: 'extraETF Profile', url: inspectedLinks.extraEtf },
                  { label: 'Finanzfluss', url: inspectedLinks.finanzfluss },
                  { label: 'OeKB (Austria)', url: inspectedLinks.oekb },
                  { label: 'Curvo Backtest', url: inspectedLinks.curvo },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between rounded-xl border ui-border-default ui-surface-elevated px-3 py-2 text-xs font-semibold ui-text-secondary transition hover:border-emerald-500/50 ui-hover-elevated"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-75" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
