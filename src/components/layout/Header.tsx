import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Check,
  Compass,
  Copy,
  FileCode2,
  GitBranch,
  Globe2,
  Landmark,
  Moon,
  RefreshCw,
  Sun,
  Type,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type {
  CountryTaxRule,
  FontFamilyOption,
  LiveQuoteData,
  ThemeMode,
} from '../../types';

export type AppTab = 'calculator' | 'taxes' | 'ecosystem' | 'academy';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
  quotesByEtfId: Record<string, LiveQuoteData>;
  totalEtfCount: number;
  onRefreshPrices: () => void;
  isRefreshing: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  fontFamily: FontFamilyOption;
  onChangeFont: (font: FontFamilyOption) => void;
}

const FEATURED_CODES = ['PT', 'NL', 'DE'] as const;

const FONT_OPTIONS: Array<{ id: FontFamilyOption; label: string; title: string }> = [
  { id: 'inter', label: 'Inter', title: 'Modern Sans (Inter)' },
  { id: 'jakarta', label: 'Jakarta', title: 'Geometric Sans (Plus Jakarta Sans)' },
  { id: 'serif', label: 'Serif', title: 'Editorial Serif (Merriweather)' },
];

const GIT_PUSH_SNIPPET = `git init
git add .
git commit -m "feat: EuroETF Compass v2.0 - UCITS ETFs, Stocks, EU Map, Anexo J & Live News"
git branch -M main
git remote add origin https://github.com/<your-username>/euro-etf-compass.git
git push -u origin main`;

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  countries,
  selectedCountryCode,
  onSelectCountry,
  quotesByEtfId,
  totalEtfCount,
  onRefreshPrices,
  isRefreshing,
  theme,
  onToggleTheme,
  fontFamily,
  onChangeFont,
}) => {
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  const quotes = Object.values(quotesByEtfId);
  const liveProxyCount = quotes.filter((q) => q.source === 'live-yahoo-proxy').length;
  const liveCorsCount = quotes.filter((q) => q.source === 'live-cors-fallback').length;
  const liveCount = liveProxyCount + liveCorsCount;
  const baselineCount = Math.max(0, totalEtfCount - liveCount);

  const tabs: Array<{
    id: AppTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'calculator',
      label: 'Budget, 3Y/5Y Backtest & Forecast',
      shortLabel: 'Backtest & Forecast',
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      id: 'taxes',
      label: `EU Tax Map, Laws & Anexo J (${countries.length})`,
      shortLabel: `EU Taxes & Map (${countries.length})`,
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      id: 'ecosystem',
      label: 'Brokers, Portals & Market News',
      shortLabel: 'Brokers & News',
      icon: <Globe2 className="h-4 w-4" />,
    },
    {
      id: 'academy',
      label: 'Careful Investing Academy (Acc vs Dist)',
      shortLabel: 'ETF Academy',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  const handleCopyGit = async () => {
    try {
      await navigator.clipboard.writeText(GIT_PUSH_SNIPPET);
      setCopiedGit(true);
      globalThis.setTimeout(() => setCopiedGit(false), 2000);
    } catch {
      setCopiedGit(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Top Brand + Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-md shadow-emerald-500/20">
                <Compass className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                    EuroETF Compass
                  </h1>
                  <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:inline-block">
                    UCITS Europe
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 sm:text-xs">
                  Careful UCITS ETF Investing • EU Tax Law • Live 3Y/5Y Backtest &amp; Forecast
                </p>
              </div>
            </div>

            {/* Right Utility Controls: Theme, 3-Font Switcher, Country Switcher, Live Status */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                title={
                  theme === 'light'
                    ? 'Сейчас светлая тема — переключить на тёмную'
                    : 'Сейчас тёмная тема — переключить на светлую'
                }
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'border-amber-400/60 bg-amber-50 text-amber-900 shadow-sm hover:bg-amber-100'
                    : 'border-slate-700 bg-slate-900 text-amber-200 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-600" />
                    <span>☀️ Светлая</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-cyan-300" />
                    <span>🌙 Тёмная</span>
                  </>
                )}
              </button>

              {/* 3-Font Switcher Pill Group */}
              <div
                className="flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1"
                role="group"
                aria-label="Выбор шрифта интерфейса"
              >
                <span className="hidden items-center gap-1 px-1.5 text-[11px] font-medium text-slate-400 md:inline-flex">
                  <Type className="h-3 w-3" />
                  <span>Шрифт:</span>
                </span>
                {FONT_OPTIONS.map((font) => {
                  const isActive = fontFamily === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => onChangeFont(font.id)}
                      title={font.title}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Country Switcher */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
                {FEATURED_CODES.map((code) => {
                  const country = countries.find((c) => c.code === code);
                  if (!country) return null;
                  const active = selectedCountryCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onSelectCountry(code)}
                      title={`Switch tax jurisdiction to ${country.name}`}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.code}</span>
                    </button>
                  );
                })}

                <select
                  aria-label="Select European tax residency country"
                  value={selectedCountryCode}
                  onChange={(e) => onSelectCountry(e.target.value)}
                  className="ml-0.5 max-w-[135px] cursor-pointer rounded-lg border border-slate-700/70 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-200 outline-none transition hover:border-slate-600 focus:border-emerald-500"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Connection Status Badge */}
              <div
                title={`Live proxy: ${liveProxyCount} | CORS fallback: ${liveCorsCount} | Verified baseline: ${baselineCount}`}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${
                  liveCount > 0
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                {liveCount > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <Wifi className="h-3.5 w-3.5" />
                    <span className="tabular-nums">
                      {liveCount}/{totalEtfCount} Live
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-slate-400" />
                    <span className="tabular-nums">
                      {baselineCount}/{totalEtfCount} Baseline
                    </span>
                  </>
                )}
              </div>

              {/* Refresh Live Prices Button */}
              <button
                type="button"
                onClick={onRefreshPrices}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>

              {/* GitHub Ready Info Button */}
              <button
                type="button"
                onClick={() => setShowGithubModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                <GitBranch className="h-3.5 w-3.5 text-purple-400" />
                <span className="hidden xl:inline">GitHub</span>
              </button>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav
            aria-label="Primary sections"
            className="-mb-px flex gap-1.5 overflow-x-auto pb-0 no-scrollbar"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-500/5 text-emerald-300'
                      : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="lg:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* GitHub Ready Modal */}
      {showGithubModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="github-ready-title"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="github-ready-title" className="text-base font-bold text-white">
                    GitHub-Ready Repository &amp; Architecture Docs
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vite + React 18 + TypeScript + Tailwind CSS (Static &amp; Vercel/Pages ready)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="mb-2 flex items-center gap-1.5 font-semibold text-emerald-300">
                  <FileCode2 className="h-4 w-4" />
                  <span>Included Project Memory &amp; Roadmap Files</span>
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-emerald-300">
                      GEMINI.md
                    </code>{' '}
                    — Persistent AI &amp; developer architecture memory, ADRs, and multi-agent
                    plan.
                  </li>
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300">
                      MEMORY.md
                    </code>{' '}
                    — Extended context &amp; user-editable custom tax/ETF notes.
                  </li>
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-purple-300">
                      ROADMAP.md
                    </code>{' '}
                    — Phased product milestones, live Yahoo proxy architecture &amp; deployment
                    targets.
                  </li>
                </ul>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    Push to Your GitHub Repository
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGit}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    {copiedGit ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy Commands
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-cyan-200">
                  {GIT_PUSH_SNIPPET}
                </pre>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                Live Yahoo Finance ETF feeds work automatically via{' '}
                <code className="text-slate-200">/api/yahoo</code> in Vite dev mode and fall back
                gracefully to CORS / verified 5-year baseline series on static GitHub Pages or
                Vercel deployments.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
