import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Check,
  Copy,
  FileCode2,
  GitBranch,
  Globe,
  Globe2,
  Landmark,
  Moon,
  RefreshCw,
  Sun,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type {
  CountryTaxRule,
  FontSizeOption,
  LiveQuoteData,
  ThemeMode,
} from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';

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
}

const FEATURED_CODES = ['PT', 'NL', 'DE'] as const;

const FONT_SIZE_OPTIONS: Array<{
  id: FontSizeOption;
  label: string;
  pct: string;
  enTitle: string;
  ruTitle: string;
}> = [
  { id: 'normal', label: 'A', pct: '100%', enTitle: 'Standard (100%)', ruTitle: 'Обычный (100%)' },
  { id: 'large', label: 'A+', pct: '112%', enTitle: 'Larger (112%)', ruTitle: 'Крупнее (112%)' },
  { id: 'xl', label: 'A++', pct: '125%', enTitle: 'Extra Large (125%)', ruTitle: 'Крупный (125%)' },
];

const GIT_PUSH_SNIPPET = `git init
git add .
git commit -m "feat: EuroETF Compass v3.0 - Bilingual EN/RU, 3-Level Zoom, EU Tax Map, Anexo J & Live News"
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
}) => {
  const { lang, setLang, fontSize, setFontSize } = useAppPreferences();
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  const isLight = theme === 'light';
  const quotes = Object.values(quotesByEtfId);
  const liveProxyCount = quotes.filter((q) => q.source === 'live-yahoo-proxy').length;
  const liveCorsCount = quotes.filter((q) => q.source === 'live-cors-fallback').length;
  const liveCount = liveProxyCount + liveCorsCount;
  const baselineCount = Math.max(0, totalEtfCount - liveCount);

  const tabs: Array<{
    id: AppTab;
    num: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'calculator',
      num: '1',
      title: tr(lang, 'Portfolio & Calculator', 'Калькулятор и Портфель'),
      subtitle: tr(
        lang,
        'Budget, ETFs & Stocks, 3Y/5Y Returns',
        'Бюджет, выбор ETF/Акций, доход за 3 и 5 лет'
      ),
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      id: 'taxes',
      num: '2',
      title: tr(lang, 'EU Taxes, Map & Forms', `Налоги ${countries.length} стран и Карта`),
      subtitle: tr(
        lang,
        'Tax Rates, EU Map & Anexo J Form',
        'Ставки, карта Европы, образец IRS Anexo J'
      ),
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      id: 'ecosystem',
      num: '3',
      title: tr(lang, 'Brokers, Portals & News', 'Брокеры, Сайты и Новости'),
      subtitle: tr(
        lang,
        'Broker Matrix, justETF & Live News',
        'Сравнение брокеров, justETF, новости'
      ),
      icon: <Globe2 className="h-4 w-4" />,
    },
    {
      id: 'academy',
      num: '4',
      title: tr(lang, 'Careful ETF Academy', 'Академия для новичков'),
      subtitle: tr(
        lang,
        '5 Lessons on Acc vs Dist & Checklist',
        '5 простых уроков Acc vs Dist и чек-лист'
      ),
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
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          isLight
            ? 'border-slate-200/90 bg-[#f7faf8]/95 text-slate-900 shadow-xs'
            : 'border-slate-700/80 bg-[#162231]/95 text-slate-100'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Top Brand + Controls Row */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border-b py-2.5 ${
              isLight ? 'border-slate-200/80' : 'border-slate-700/70'
            }`}
          >
            {/* Brand Identity */}
            <div className="flex items-center gap-3 group">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105">
                <svg
                  viewBox="0 0 64 64"
                  className="h-11 w-11"
                  fill="none"
                  aria-label="EuroETF Compass Logo"
                >
                  <defs>
                    <linearGradient id="hdrBgGrad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#1e4d38" />
                      <stop offset="55%" stopColor="#286a4d" />
                      <stop offset="100%" stopColor="#173d2c" />
                    </linearGradient>
                    <linearGradient id="hdrGoldGrad" x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f6d365" />
                      <stop offset="50%" stopColor="#e2b049" />
                      <stop offset="100%" stopColor="#c89128" />
                    </linearGradient>
                    <linearGradient id="hdrSageGrad" x1="16" y1="44" x2="48" y2="16" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6ed3a5" />
                      <stop offset="100%" stopColor="#bbf7d0" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="3"
                    y="3"
                    width="58"
                    height="58"
                    rx="15"
                    fill="url(#hdrBgGrad)"
                    stroke="url(#hdrGoldGrad)"
                    strokeWidth="2.4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="21"
                    stroke="#6ed3a5"
                    strokeOpacity="0.35"
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="15.5"
                    stroke="url(#hdrGoldGrad)"
                    strokeOpacity="0.45"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M32 8V12.5M32 51.5V56M8 32H12.5M51.5 32H56"
                    stroke="url(#hdrGoldGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 43C22 42 27 38 32 32C37 26 41 20 47 16"
                    stroke="url(#hdrSageGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M41 15H48V22"
                    stroke="url(#hdrSageGrad)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon points="32,15 36.5,32 32,29 27.5,32" fill="url(#hdrGoldGrad)" />
                  <polygon points="32,49 36.5,32 32,35 27.5,32" fill="#6ed3a5" fillOpacity="0.7" />
                  <circle cx="32" cy="32" r="3" fill="#173d2c" stroke="url(#hdrGoldGrad)" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-base font-bold tracking-tight sm:text-lg ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    EuroETF Compass
                  </h1>
                  <span
                    className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-block ${
                      isLight
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-[#c89128]/40 bg-[#c89128]/15 text-[#e2b049]'
                    }`}
                  >
                    {tr(lang, 'Wealth & Tax Club', 'Клуб ETF и Налогов')}
                  </span>
                </div>
                <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {tr(
                    lang,
                    'Careful ETF & Stock Investing • EU Taxes • 3Y/5Y History & Forecast',
                    'Разумные инвестиции в ETF и Акции • Налоги ЕС • История 3Y/5Y и Прогноз'
                  )}
                </p>
              </div>
            </div>

            {/* Right Utility Controls: EN/RU, A/A+/A++, Light/Dark, Country, Live, Refresh, GitHub */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Language Switcher: 🌐 EN | RU */}
              <div
                className={`inline-flex items-center gap-0.5 rounded-xl border p-1 ${
                  isLight
                    ? 'border-slate-200 bg-white shadow-2xs'
                    : 'border-slate-700 bg-slate-800/90'
                }`}
                role="group"
                aria-label={tr(lang, 'Language switcher', 'Переключатель языка')}
              >
                <span
                  className={`inline-flex items-center px-1.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                  title="Language / Язык"
                >
                  <Globe className="h-3.5 w-3.5" />
                </span>
                {(['en', 'ru'] as const).map((code) => {
                  const isActive = lang === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(code)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase transition ${
                        isActive
                          ? 'bg-[#2d8a61] text-white shadow-xs'
                          : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {code.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {/* 3-Level Font Size Switcher: A | A+ | A++ */}
              <div
                className={`inline-flex items-center gap-0.5 rounded-xl border p-1 ${
                  isLight
                    ? 'border-slate-200 bg-white shadow-2xs'
                    : 'border-slate-700 bg-slate-800/90'
                }`}
                role="group"
                aria-label={tr(lang, 'Text size zoom', 'Размер текста')}
              >
                {FONT_SIZE_OPTIONS.map((opt) => {
                  const isActive = fontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFontSize(opt.id)}
                      title={`${tr(lang, opt.enTitle, opt.ruTitle)} (${opt.pct})`}
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                        isActive
                          ? isLight
                            ? 'bg-[#e3f2eb] text-[#1b5e3f] ring-1 ring-[#2d8a61]/40'
                            : 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/50'
                          : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Light / Dark Mode Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                title={tr(
                  lang,
                  theme === 'light' ? 'Light theme active — switch to dark' : 'Dark theme active — switch to light',
                  theme === 'light' ? 'Сейчас светлая тема — переключить на тёмную' : 'Сейчас тёмная тема — переключить на светлую'
                )}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  isLight
                    ? 'border-amber-300 bg-amber-50/90 text-amber-900 shadow-2xs hover:bg-amber-100'
                    : 'border-slate-600 bg-slate-800 text-amber-200 hover:border-slate-500 hover:bg-slate-700'
                }`}
              >
                {isLight ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-600" />
                    <span>{tr(lang, '☀️ Light', '☀️ Светлая')}</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-cyan-300" />
                    <span>{tr(lang, '🌙 Dark', '🌙 Тёмная')}</span>
                  </>
                )}
              </button>

              {/* Quick Country Switcher */}
              <div
                className={`flex items-center gap-1 rounded-xl border p-1 ${
                  isLight
                    ? 'border-slate-200 bg-white shadow-2xs'
                    : 'border-slate-700 bg-slate-800/90'
                }`}
              >
                {FEATURED_CODES.map((code) => {
                  const country = countries.find((c) => c.code === code);
                  if (!country) return null;
                  const active = selectedCountryCode === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onSelectCountry(code)}
                      title={tr(
                        lang,
                        `Switch tax jurisdiction to ${country.name}`,
                        `Выбрать налоговую страну: ${country.name}`
                      )}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        active
                          ? isLight
                            ? 'bg-[#e3f2eb] text-[#1b5e3f] ring-1 ring-[#2d8a61]/40'
                            : 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/50'
                          : isLight
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.code}</span>
                    </button>
                  );
                })}

                <select
                  aria-label={tr(lang, 'Select European tax residency country', 'Выбор страны налогового резидентства')}
                  value={selectedCountryCode}
                  onChange={(e) => onSelectCountry(e.target.value)}
                  className={`ml-0.5 max-w-[135px] cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none transition ${
                    isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 focus:border-[#2d8a61]'
                      : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-emerald-500'
                  }`}
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
                    ? isLight
                      ? 'border-[#b7dfd0] bg-[#eaf5ef] text-[#1b5e3f]'
                      : 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
                    : isLight
                      ? 'border-slate-200 bg-white text-slate-600'
                      : 'border-slate-600 bg-slate-800 text-slate-300'
                }`}
              >
                {liveCount > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2d8a61] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2d8a61]" />
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
                      {baselineCount}/{totalEtfCount} {tr(lang, 'Baseline', 'База')}
                    </span>
                  </>
                )}
              </div>

              {/* Refresh Live Prices Button */}
              <button
                type="button"
                onClick={onRefreshPrices}
                disabled={isRefreshing}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isLight
                    ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                    : 'border-cyan-500/35 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing
                    ? tr(lang, 'Refreshing...', 'Обновление...')
                    : tr(lang, 'Refresh', 'Обновить')}
                </span>
              </button>

              {/* GitHub Ready Info Button */}
              <button
                type="button"
                onClick={() => setShowGithubModal(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5 text-purple-500" />
                <span className="hidden xl:inline">GitHub</span>
              </button>
            </div>
          </div>

          {/* 4 Distinct Beginner-Friendly Navigation Feature Cards */}
          <nav
            aria-label={tr(lang, 'Primary sections', 'Основные разделы')}
            className="grid grid-cols-2 gap-2.5 py-2.5 lg:grid-cols-4"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all sm:p-3 ${
                    isActive
                      ? isLight
                        ? 'border-[#2d8a61] bg-[#eaf5ef] shadow-xs ring-1 ring-[#2d8a61]/30'
                        : 'border-emerald-500 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500/35'
                      : isLight
                        ? 'border-slate-200/90 bg-white hover:border-[#2d8a61]/50 hover:bg-[#f3f8f5] shadow-2xs'
                        : 'border-slate-700 bg-slate-800/80 hover:border-emerald-500/45 hover:bg-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold transition ${
                          isActive
                            ? 'bg-[#2d8a61] text-white'
                            : isLight
                              ? 'bg-slate-100 text-slate-700 group-hover:bg-[#e3f2eb] group-hover:text-[#1b5e3f]'
                              : 'bg-slate-700 text-slate-200 group-hover:bg-emerald-500/20 group-hover:text-emerald-200'
                        }`}
                      >
                        {tab.num}
                      </span>
                      <span
                        className={`shrink-0 ${
                          isActive
                            ? isLight
                              ? 'text-[#1b5e3f]'
                              : 'text-emerald-300'
                            : isLight
                              ? 'text-slate-500 group-hover:text-[#2d8a61]'
                              : 'text-slate-400 group-hover:text-emerald-300'
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span
                        className={`truncate text-xs font-bold sm:text-sm ${
                          isActive
                            ? isLight
                              ? 'text-[#164e35]'
                              : 'text-emerald-200'
                            : isLight
                              ? 'text-slate-800'
                              : 'text-white'
                        }`}
                      >
                        {tab.title}
                      </span>
                    </div>

                    {isActive && (
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isLight
                            ? 'bg-[#2d8a61]/15 text-[#1b5e3f]'
                            : 'bg-emerald-500/20 text-emerald-200'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2d8a61]" />
                        <span className="hidden sm:inline">
                          {tr(lang, 'Active', 'Открыто')}
                        </span>
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-1 line-clamp-1 pl-8 text-[11px] ${
                      isLight ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {tab.subtitle}
                  </p>
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
                    {tr(
                      lang,
                      'GitHub-Ready Repository & Architecture Docs',
                      'Репозиторий для GitHub и Архитектура проекта'
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vite + React 18 + TypeScript + Tailwind CSS (Static &amp; Vercel/Pages ready)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                aria-label={tr(lang, 'Close modal', 'Закрыть окно')}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="mb-2 flex items-center gap-1.5 font-semibold text-emerald-300">
                  <FileCode2 className="h-4 w-4" />
                  <span>
                    {tr(
                      lang,
                      'Included Project Memory & Roadmap Files',
                      'Файлы памяти проекта и дорожной карты'
                    )}
                  </span>
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-emerald-300">
                      GEMINI.md
                    </code>{' '}
                    —{' '}
                    {tr(
                      lang,
                      'Persistent AI & developer architecture memory, ADRs, and multi-agent plan.',
                      'Архитектурная память для разработчиков и AI, список решений ADR.'
                    )}
                  </li>
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300">
                      MEMORY.md
                    </code>{' '}
                    —{' '}
                    {tr(
                      lang,
                      'Extended context & user-editable custom tax/ETF notes.',
                      'Расширенный контекст и пользовательские заметки.'
                    )}
                  </li>
                  <li>
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-purple-300">
                      ROADMAP.md
                    </code>{' '}
                    —{' '}
                    {tr(
                      lang,
                      'Phased product milestones, live Yahoo proxy architecture & deployment targets.',
                      'Этапы развития, архитектура прокси Yahoo и деплой.'
                    )}
                  </li>
                </ul>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    {tr(lang, 'Push to Your GitHub Repository', 'Отправка в ваш GitHub репозиторий')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGit}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    {copiedGit ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />{' '}
                        {tr(lang, 'Copied', 'Скопировано')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> {tr(lang, 'Copy Commands', 'Копировать')}
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-cyan-200">
                  {GIT_PUSH_SNIPPET}
                </pre>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                {tr(
                  lang,
                  'Live Yahoo Finance ETF feeds work automatically via /api/yahoo in Vite dev mode and fall back gracefully to CORS / verified 5-year baseline series on static GitHub Pages or Vercel deployments.',
                  'Живые котировки Yahoo Finance работают через /api/yahoo в dev-режиме Vite и автоматически переключаются на CORS-шлюзы / проверенную 5-летнюю базу на GitHub Pages или Vercel.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
