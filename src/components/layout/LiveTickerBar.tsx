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
  return '€';
}

export const LiveTickerBar: React.FC<LiveTickerBarProps> = ({
  etfs,
  quotesByEtfId,
  onAddCustomTicker,
  isFetchingCustomTicker,
  customTickerError,
}) => {
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
    <div className="border-b border-slate-800/80 bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        {/* Scrollable Ticker Strip */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          {etfs.map((etf) => {
            const quote = quotesByEtfId[etf.id];
            const price = quote?.currentPrice ?? 0;
            const dayPct = quote?.dayChangePct ?? 0;
            const dayEur = quote?.dayChangeEur ?? 0;
            const isUp = dayPct >= 0;
            const currSym = getCurrencySymbol(quote?.currency ?? etf.currency);
            const isLive = quote && quote.source !== 'verified-baseline';

            return (
              <button
                key={etf.id}
                type="button"
                onClick={() => setInspectedEtf(etf)}
                title={`${etf.name} — Click to inspect ISIN & European portal links`}
                className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-800/90 bg-slate-900/75 px-3 py-1.5 text-left transition hover:border-slate-600 hover:bg-slate-800/90"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLive ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                    title={isLive ? `Live (${quote?.source})` : 'Verified 5Y Baseline'}
                  />
                  <span className="font-mono text-xs font-bold text-white group-hover:text-emerald-300">
                    {etf.ticker}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      etf.distributionPolicy === 'Acc'
                        ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                    }`}
                  >
                    {etf.distributionPolicy}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                  <span className="font-semibold text-slate-100">
                    {currSym}
                    {price.toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
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
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Custom Ticker</span>
        </button>
      </div>

      {/* Inline Custom Ticker Drawer */}
      {showCustomInput && (
        <div className="border-t border-slate-800/80 bg-slate-900/95 px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSubmitCustom} className="flex flex-1 flex-wrap items-center gap-2">
              <label htmlFor="tickerbar-custom-input" className="text-xs font-medium text-slate-300">
                Add Live UCITS ETF via Yahoo Finance:
              </label>
              <input
                id="tickerbar-custom-input"
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="e.g. VUAA.DE, EMIM.AS, CSPX.L, SPYI.DE"
                className="w-60 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isFetchingCustomTicker || !tickerInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
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
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close custom ticker bar"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
            {customTickerError && (
              <p className="text-xs font-medium text-rose-400">{customTickerError}</p>
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-300">
                    {inspectedEtf.ticker}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      inspectedEtf.distributionPolicy === 'Acc'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {inspectedEtf.distributionPolicy === 'Acc' ? 'Accumulating' : 'Distributing'}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                    ISIN: {inspectedEtf.isin}
                  </span>
                </div>
                <h3 id="inspected-etf-title" className="mt-1 text-sm font-bold text-white">
                  {inspectedEtf.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEtf(null)}
                aria-label="Close ETF inspector"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                <span className="text-[11px] text-slate-400">Price</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">
                  {getCurrencySymbol(inspectedQuote?.currency ?? inspectedEtf.currency)}
                  {(inspectedQuote?.currentPrice ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                <span className="text-[11px] text-slate-400">TER / Domicile</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-cyan-300">
                  {inspectedEtf.ter.toFixed(2)}% • {inspectedEtf.domicile.split(' ')[0]}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                <span className="text-[11px] text-slate-400">Fund Size / WKN</span>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-200">
                  €{inspectedEtf.fundSizeBillionsEur.toFixed(1)}B • {inspectedEtf.wkn}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <p className="leading-relaxed">{inspectedEtf.taxEfficiencyNotes}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-slate-300">
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
                    className="inline-flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300"
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
