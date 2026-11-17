import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeftRight,
  Briefcase,
  Calculator,
  Calendar,
  Coins,
  Globe2,
  Info,
  Percent,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  BacktestPeriodMetrics,
  CountryTaxRule,
  ETFInstrument,
  LanguageMode,
  LiveQuoteData,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';
import { calculatePortfolioBacktestAndForecast } from '../../utils/investmentMath';
import { EtfSelector } from './EtfSelector';
import { type ForecastHorizonOption, PerformanceChart } from './PerformanceChart';

export interface InvestmentCalculatorProps {
  etfs: ETFInstrument[];
  quotesByEtfId: Record<string, LiveQuoteData>;
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
  onAddCustomTicker: (ticker: string) => Promise<void>;
  isFetchingCustomTicker?: boolean;
  customTickerError?: string | null;
  theme?: ThemeMode;
}

const BUDGET_PRESETS_EUR = [1000, 5000, 10000, 25000, 50000];
const MONTHLY_PRESETS_EUR = [0, 100, 250, 500, 1000];
const FEATURED_COUNTRY_CODES = ['PT', 'NL', 'DE'];

const REGION_LABELS_RU: Record<CountryTaxRule['regionGroup'], string> = {
  'Featured Core': 'Приоритетные (PT / NL / DE)',
  'Western Europe': 'Западная Европа',
  DACH: 'DACH (DE / AT / CH)',
  'Southern Europe': 'Южная Европа',
  'Central & Eastern Europe': 'Центр. и Вост. Европа',
  'Nordics & UK': 'Сев. Европа и UK',
};

function formatEur(value: number, decimals = 0): string {
  return `€${value.toLocaleString('en-IE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatEurDetailed(value: number): string {
  return `€${value.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getVerdictBadgeClasses(
  verdict: CountryTaxRule['verdict'],
  isLight: boolean
): string {
  switch (verdict) {
    case 'ACC_STRONGLY_PREFERRED':
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return isLight
        ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
        : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]';
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return isLight
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-amber-500/40 bg-amber-500/15 text-amber-200';
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return isLight
        ? 'border-sky-300 bg-sky-50 text-sky-800'
        : 'border-sky-500/40 bg-sky-500/15 text-sky-200';
  }
}

function getLocalizedVerdictTitle(country: CountryTaxRule, lang: LanguageMode): string {
  if (lang === 'en') return country.verdictTitle;
  switch (country.verdict) {
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return 'Acc ETF имеет двойное преимущество: отсрочка + скидка до 30% за срок владения';
    case 'ACC_STRONGLY_PREFERRED':
      return 'Acc ETF намного выгоднее Dist: полная отсрочка налога на дивиденды';
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
      return 'Dist в пределах годовой льготы, далее Acc выгоднее и проще';
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return 'Acc выгоднее, но важен статус отчётности фонда (Meldefonds / ERI)';
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return 'Налог на капитал одинаковый — Acc удобнее за счёт авто-реинвестирования';
  }
}

function getAssetShortCategoryLabel(etf: ETFInstrument, lang: LanguageMode): string {
  const isStock =
    etf.instrumentType === 'Stock' ||
    etf.assetClass === 'Individual Stock (US)' ||
    etf.assetClass === 'Individual Stock (Europe)' ||
    etf.provider === 'US Corporation (NASDAQ/NYSE)' ||
    etf.provider === 'European Corporation';

  if (isStock) {
    const clean = (etf.shortName || etf.name).replace(/\s*\([^)]*\)\s*$/g, '').trim();
    return clean || etf.ticker;
  }

  switch (etf.assetClass) {
    case 'Global Equities':
    case 'Developed World Equities':
      return tr(lang, 'Global ETF', 'Мировой ETF');
    case 'US Equities':
      return tr(lang, 'US ETF (S&P 500)', 'ETF США (S&P 500)');
    case 'Tech / Nasdaq Equities':
      return tr(lang, 'Nasdaq-100 ETF', 'ETF Nasdaq-100');
    case 'Emerging Markets':
      return tr(lang, 'EM ETF', 'ETF EM');
    case 'European Equities':
      return tr(lang, 'Europe ETF', 'Европейский ETF');
    case 'EUR Money Market / Bonds':
      return tr(lang, '€STR Cash ETF', 'Кэш-ETF €STR');
    default:
      return etf.shortName || 'ETF';
  }
}

export function InvestmentCalculator({
  etfs,
  quotesByEtfId,
  countries,
  selectedCountryCode,
  onSelectCountry,
  onAddCustomTicker,
  isFetchingCustomTicker = false,
  customTickerError = null,
  theme,
}: InvestmentCalculatorProps) {
  const { lang, theme: ctxTheme } = useAppPreferences();
  const isLight = (theme ?? ctxTheme) === 'light';

  const [initialBudgetEur, setInitialBudgetEur] = useState<number>(10000);
  const [monthlyContributionEur, setMonthlyContributionEur] = useState<number>(250);
  const [allocations, setAllocations] = useState<PortfolioAllocationItem[]>([
    { etfId: 'vwce', weightPct: 100 },
  ]);
  const [selectedHorizonYears, setSelectedHorizonYears] = useState<ForecastHorizonOption>(10);

  const cardSurface = isLight ? 'border border-slate-200 bg-white shadow-sm' : 'fintech-card';
  const subSurface = isLight
    ? 'border border-slate-200 bg-slate-50/90'
    : 'border border-slate-800 bg-slate-900/65';
  const inputSurface = isLight
    ? 'border border-slate-300 bg-white text-slate-900'
    : 'border border-slate-700 bg-slate-950 text-slate-100';

  const etfById = useMemo(() => new Map(etfs.map((e) => [e.id, e])), [etfs]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === selectedCountryCode) ?? countries[0],
    [countries, selectedCountryCode]
  );

  const featuredCountries = useMemo(
    () =>
      FEATURED_COUNTRY_CODES.map((code) => countries.find((c) => c.code === code)).filter(
        (c): c is CountryTaxRule => Boolean(c)
      ),
    [countries]
  );

  const calculation = useMemo(() => {
    if (!selectedCountry) return null;
    return calculatePortfolioBacktestAndForecast({
      allocations,
      etfs,
      quotesByEtfId,
      country: selectedCountry,
      initialBudgetEur,
      monthlyContributionEur,
    });
  }, [
    allocations,
    etfs,
    quotesByEtfId,
    selectedCountry,
    initialBudgetEur,
    monthlyContributionEur,
  ]);

  const activeCompositionPills = useMemo(() => {
    const valid = allocations
      .map((item) => {
        const etf = etfById.get(item.etfId);
        if (!etf || item.weightPct <= 0) return null;
        return { etf, rawWeight: item.weightPct };
      })
      .filter((x): x is { etf: ETFInstrument; rawWeight: number } => x !== null);

    const sum = valid.reduce((acc, x) => acc + x.rawWeight, 0) || 1;
    return valid.map((x) => ({
      id: x.etf.id,
      ticker: x.etf.ticker,
      pct: Math.round((x.rawWeight / sum) * 100),
      label: getAssetShortCategoryLabel(x.etf, lang),
      policy: x.etf.distributionPolicy,
    }));
  }, [allocations, etfById, lang]);

  if (!selectedCountry || !calculation) {
    return null;
  }

  const singleActiveEtf =
    activeCompositionPills.length === 1 ? etfById.get(activeCompositionPills[0].id) : undefined;
  const singlePairedEtf = singleActiveEtf?.pairedEtfId
    ? etfById.get(singleActiveEtf.pairedEtfId)
    : undefined;

  const backtestCards: Array<{
    key: '3Y' | '5Y';
    title: string;
    subtitle: string;
    accentBorder: string;
    metrics: BacktestPeriodMetrics;
  }> = [
    {
      key: '3Y',
      title: tr(lang, 'If You Invested 3 Years Ago (3Y Backtest)', 'Если бы вы вложили 3 года назад (3Y Backtest)'),
      subtitle: tr(
        lang,
        'Last 36 months simulated with your country’s local tax rules',
        'Последние 36 месяцев с учётом налогов выбранной страны'
      ),
      accentBorder: isLight ? 'border-sky-200' : 'border-sky-500/35',
      metrics: calculation.backtest3Y,
    },
    {
      key: '5Y',
      title: tr(lang, 'If You Invested 5 Years Ago (5Y Backtest)', 'Если бы вы вложили 5 лет назад (5Y Backtest)'),
      subtitle: tr(
        lang,
        'Full 60-month cycle (2022 dip + 2023–2026 recovery)',
        'Полный 60-месячный цикл (просадка 2022 + рост 2023–2026)'
      ),
      accentBorder: isLight ? 'border-[#2d8a61]/40' : 'border-[#3b9b72]/40',
      metrics: calculation.backtest5Y,
    },
  ];

  const handleNumericBudgetChange = (raw: string, setter: (v: number) => void) => {
    if (raw.trim() === '') {
      setter(0);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      setter(Math.max(0, Math.min(10_000_000, Math.round(parsed))));
    }
  };

  const renderCompositionPills = (compact = false) => (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${
        compact ? 'mt-2.5 rounded-xl border p-2' : ''
      } ${
        compact
          ? isLight
            ? 'border-slate-200 bg-slate-50/90'
            : 'border-slate-800/90 bg-slate-950/65'
          : ''
      }`}
    >
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}
      >
        <Briefcase className={`h-3 w-3 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`} />
        {tr(lang, 'Active Mix:', 'В расчёте:')}
      </span>
      {activeCompositionPills.map((pill) => (
        <span
          key={pill.id}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
            isLight
              ? 'border-slate-200 bg-white text-slate-800 shadow-2xs'
              : 'border-slate-700/90 bg-slate-900 text-slate-100'
          }`}
        >
          <span
            className={`font-mono font-bold ${
              isLight ? 'text-[#1f6e4b]' : 'text-[#7fd4ad]'
            }`}
          >
            {pill.pct}%
          </span>
          <span className="font-mono font-bold">{pill.ticker}</span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>({pill.label})</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ===================================================================
          BEGINNER 3-STEP QUICK NAVIGATION BAR
      =================================================================== */}
      <nav
        aria-label={tr(lang, '3-Step Investment Flow', '3 шага расчёта')}
        className={`${cardSurface} flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-xs`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#step-1-budget"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold transition ${
              isLight
                ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-[#2d8a61]'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-[#3b9b72]'
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
              }`}
            >
              1
            </span>
            <span>{tr(lang, 'Budget & Country', 'Бюджет и Страна')}</span>
            <span className={`hidden font-mono text-[11px] sm:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ({formatEur(initialBudgetEur)} · {selectedCountry.flag} {selectedCountry.code})
            </span>
          </a>

          <span className="text-slate-400">→</span>

          <a
            href="#step-2-portfolio"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold transition ${
              isLight
                ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-[#2d8a61]'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-[#3b9b72]'
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
              }`}
            >
              2
            </span>
            <span>{tr(lang, 'Choose ETF / Stocks', 'Выбор ETF и Акций')}</span>
            <span className={`hidden font-mono text-[11px] md:inline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ({activeCompositionPills.map((p) => `${p.pct}% ${p.ticker}`).join(' + ')})
            </span>
          </a>

          <span className="text-slate-400">→</span>

          <a
            href="#step-3-results"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold transition ${
              isLight
                ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b] hover:bg-[#2d8a61]/15'
                : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0] hover:bg-[#2d8a61]/25'
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
              }`}
            >
              3
            </span>
            <span>{tr(lang, '3Y / 5Y Returns & Forecast', 'Доход 3Y / 5Y и Прогноз')}</span>
          </a>
        </div>
      </nav>

      {/* ===================================================================
          STEP 1: BUDGET, MONTHLY PLAN & TAX RESIDENCE (COMPACT)
      =================================================================== */}
      <section id="step-1-budget" className={`${cardSurface} scroll-mt-6 rounded-2xl p-4 sm:p-5`}>
        <div
          className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isLight
                  ? 'bg-[#2d8a61]/12 text-[#2d8a61]'
                  : 'bg-[#3b9b72]/15 text-[#6ec9a0]'
              }`}
            >
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
                  }`}
                >
                  {tr(lang, 'Step 1', 'Шаг 1')}
                </span>
                <h2
                  className={`text-base font-bold tracking-tight sm:text-lg ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {tr(
                    lang,
                    'Budget, Monthly Plan & Tax Residence',
                    'Бюджет, Ежемесячный план и Налоговая резиденция'
                  )}
                </h2>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {tr(
                  lang,
                  'Set your starting capital (€), regular monthly savings (DCA / Sparplan), and European tax country.',
                  'Укажите стартовый капитал (€), регулярный план накоплений (DCA / Sparplan) и страну налогового резидентства.'
                )}
              </p>
            </div>
          </div>

          <a
            href="#step-2-portfolio"
            className={`inline-flex shrink-0 items-center gap-1 self-start rounded-xl border px-2.5 py-1 text-xs font-semibold transition sm:self-auto ${
              isLight
                ? 'border-slate-300 bg-slate-50 text-slate-700 hover:border-[#2d8a61] hover:text-[#1f6e4b]'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-[#3b9b72]/70 hover:text-[#86d6b0]'
            }`}
          >
            {tr(lang, 'Step 2: Portfolio', 'Шаг 2: Портфель')}
            <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Inputs Grid */}
        <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-12">
          {/* Initial Lump-Sum Budget */}
          <div className={`${subSurface} rounded-xl p-3 lg:col-span-4`}>
            <label
              htmlFor="initial-budget-input"
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Coins className={`h-3.5 w-3.5 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`} />
              {tr(lang, 'Initial Capital (€)', 'Стартовый капитал (€)')}
            </label>
            <div
              className={`${inputSurface} mt-1.5 flex items-center rounded-xl px-3 py-1.5 focus-within:border-[#2d8a61]`}
            >
              <span
                className={`mr-1.5 font-mono text-sm font-bold ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                €
              </span>
              <input
                id="initial-budget-input"
                type="number"
                min={0}
                max={10000000}
                step={500}
                value={initialBudgetEur}
                onChange={(e) => handleNumericBudgetChange(e.target.value, setInitialBudgetEur)}
                className={`w-full bg-transparent font-mono text-base font-bold tabular-nums focus:outline-none ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {BUDGET_PRESETS_EUR.map((amt) => {
                const active = initialBudgetEur === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialBudgetEur(amt)}
                    className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-semibold transition ${
                      active
                        ? isLight
                          ? 'bg-[#2d8a61] text-white'
                          : 'bg-[#3b9b72] text-slate-950'
                        : isLight
                          ? 'border border-slate-300 bg-white text-slate-700 hover:border-[#2d8a61]/60'
                          : 'border border-slate-700/80 bg-slate-900 text-slate-300 hover:border-[#3b9b72]/60'
                    }`}
                  >
                    {formatEur(amt)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Savings Plan */}
          <div className={`${subSurface} rounded-xl p-3 lg:col-span-4`}>
            <label
              htmlFor="monthly-sparplan-input"
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Calendar className={`h-3.5 w-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              {tr(lang, 'Monthly Plan / Sparplan (€/mo)', 'Ежемесячный план (€/мес)')}
            </label>
            <div
              className={`${inputSurface} mt-1.5 flex items-center rounded-xl px-3 py-1.5 focus-within:border-sky-500`}
            >
              <span
                className={`mr-1.5 font-mono text-sm font-bold ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                €
              </span>
              <input
                id="monthly-sparplan-input"
                type="number"
                min={0}
                max={1000000}
                step={50}
                value={monthlyContributionEur}
                onChange={(e) =>
                  handleNumericBudgetChange(e.target.value, setMonthlyContributionEur)
                }
                className={`w-full bg-transparent font-mono text-base font-bold tabular-nums focus:outline-none ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              />
              <span
                className={`ml-1 shrink-0 font-mono text-xs ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {tr(lang, '/ mo', '/ мес')}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {MONTHLY_PRESETS_EUR.map((amt) => {
                const active = monthlyContributionEur === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyContributionEur(amt)}
                    className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-semibold transition ${
                      active
                        ? isLight
                          ? 'bg-sky-600 text-white'
                          : 'bg-sky-500 text-slate-950'
                        : isLight
                          ? 'border border-slate-300 bg-white text-slate-700 hover:border-sky-400'
                          : 'border border-slate-700/80 bg-slate-900 text-slate-300 hover:border-sky-500/50'
                    }`}
                  >
                    {formatEur(amt)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tax Residence Country Selector */}
          <div className={`${subSurface} rounded-xl p-3 lg:col-span-4`}>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="country-tax-select"
                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <Globe2
                  className={`h-3.5 w-3.5 ${isLight ? 'text-violet-600' : 'text-violet-400'}`}
                />
                {tr(lang, 'Tax Residence', 'Налоговая резиденция')}
              </label>
              <div className="flex items-center gap-1">
                {featuredCountries.map((fc) => {
                  const active = fc.code === selectedCountry.code;
                  return (
                    <button
                      key={fc.code}
                      type="button"
                      onClick={() => onSelectCountry(fc.code)}
                      title={tr(lang, `Select ${fc.name}`, `Выбрать ${fc.name}`)}
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition ${
                        active
                          ? isLight
                            ? 'bg-violet-600 text-white'
                            : 'bg-violet-500 text-slate-950'
                          : isLight
                            ? 'border border-slate-300 bg-white text-slate-700 hover:border-violet-400'
                            : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-400/60'
                      }`}
                    >
                      <span>{fc.flag}</span>
                      <span>{fc.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <select
              id="country-tax-select"
              value={selectedCountry.code}
              onChange={(e) => onSelectCountry(e.target.value)}
              className={`${inputSurface} mt-1.5 w-full rounded-xl px-2.5 py-2 text-xs font-semibold focus:border-violet-500 focus:outline-none`}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code}) —{' '}
                  {lang === 'en' ? c.regionGroup : REGION_LABELS_RU[c.regionGroup]}
                </option>
              ))}
            </select>

            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold leading-snug ${getVerdictBadgeClasses(
                  selectedCountry.verdict,
                  isLight
                )}`}
              >
                {selectedCountry.flag} {getLocalizedVerdictTitle(selectedCountry, lang)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          STEP 2: PORTFOLIO BUILDER (ULTRA-COMPACT BY DEFAULT)
      =================================================================== */}
      <section id="step-2-portfolio" className="scroll-mt-6 space-y-2.5">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
              }`}
            >
              {tr(lang, 'Step 2', 'Шаг 2')}
            </span>
            <h3
              className={`text-base font-bold tracking-tight sm:text-lg ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              {tr(
                lang,
                'What Are You Investing In? — Choose ETFs & Top Stocks',
                'На чём зарабатываем? — Выберите ETF и Топ-20 Акций'
              )}
            </h3>
          </div>

          <a
            href="#step-3-results"
            className={`inline-flex shrink-0 items-center gap-1 self-start rounded-xl border px-2.5 py-1 text-xs font-semibold transition sm:self-auto ${
              isLight
                ? 'border-[#2d8a61]/40 bg-[#2d8a61]/10 text-[#1f6e4b] hover:bg-[#2d8a61]/15'
                : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0] hover:bg-[#2d8a61]/25'
            }`}
          >
            {tr(lang, 'Step 3: 3Y / 5Y Returns', 'Шаг 3: Доходность 3Y / 5Y')}
            <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </div>

        <EtfSelector
          etfs={etfs}
          quotesByEtfId={quotesByEtfId}
          allocations={allocations}
          onChangeAllocations={setAllocations}
          onAddCustomTicker={onAddCustomTicker}
          isFetchingCustomTicker={isFetchingCustomTicker}
          customTickerError={customTickerError}
          theme={theme}
        />
      </section>

      {/* ===================================================================
          STEP 3: 3Y / 5Y HISTORICAL BACKTEST & FUTURE FORECAST
      =================================================================== */}
      <section id="step-3-results" className="scroll-mt-6 space-y-5">
        {/* Step 3 Header + Portfolio Summary Strip */}
        <div className={`${cardSurface} rounded-2xl p-4`}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isLight ? 'bg-[#2d8a61] text-white' : 'bg-[#3b9b72] text-slate-950'
                }`}
              >
                {tr(lang, 'Step 3', 'Шаг 3')}
              </span>
              <h3
                className={`inline-flex items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                <TrendingUp
                  className={`h-4 w-4 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`}
                />
                {tr(
                  lang,
                  'Historical Earnings (3Y & 5Y Ago) & Future Forecast',
                  'Историческая доходность (3 и 5 лет назад) и Прогноз'
                )}
              </h3>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {tr(lang, 'Budget:', 'Бюджет:')}{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                {formatEur(initialBudgetEur)}
              </strong>{' '}
              +{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                {formatEur(monthlyContributionEur)}
                {tr(lang, '/mo', '/мес')}
              </strong>{' '}
              · {tr(lang, 'Taxes:', 'Налоги:')}{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                {selectedCountry.flag} {selectedCountry.name}
              </strong>
            </p>
          </div>

          <div
            className="mt-3 flex flex-col gap-2.5 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
          >
            {renderCompositionPills(false)}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1 tabular-nums ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <Percent className={`h-3.5 w-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
                TER:{' '}
                <strong className={`font-mono ${isLight ? 'text-sky-700' : 'text-sky-300'}`}>
                  {calculation.blendedTerPct.toFixed(2)}%
                </strong>
              </span>
              <span
                className={`inline-flex items-center gap-1 tabular-nums ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <Activity
                  className={`h-3.5 w-3.5 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`}
                />
                5Y CAGR:{' '}
                <strong
                  className={`font-mono ${isLight ? 'text-[#1f6e4b]' : 'text-[#7fd4ad]'}`}
                >
                  {calculation.blendedHistoricalCagr5YPct >= 0 ? '+' : ''}
                  {calculation.blendedHistoricalCagr5YPct.toFixed(2)}%
                </strong>
              </span>
              {singlePairedEtf && singleActiveEtf && (
                <button
                  type="button"
                  onClick={() => setAllocations([{ etfId: singlePairedEtf.id, weightPct: 100 }])}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    isLight
                      ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                  }`}
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {tr(
                    lang,
                    `Compare with ${singlePairedEtf.ticker} (${singlePairedEtf.distributionPolicy})`,
                    `Сравнить с ${singlePairedEtf.ticker} (${singlePairedEtf.distributionPolicy})`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3Y & 5Y Historical Backtest Cards Side by Side */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {backtestCards.map((card) => {
            const bt = card.metrics;
            const profitPositive = bt.grossProfitEur >= 0;
            const accWins = bt.accTaxAdvantageEur > 0.5;
            const distWins = bt.accTaxAdvantageEur < -0.5;
            const monthsCount = bt.years * 12;

            return (
              <div
                key={card.key}
                className={`${cardSurface} rounded-2xl border ${card.accentBorder} p-4 sm:p-5`}
              >
                <div
                  className="flex flex-wrap items-start justify-between gap-2 border-b pb-3"
                  style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
                >
                  <div>
                    <h4
                      className={`text-sm font-bold sm:text-base ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                    >
                      {card.title}
                    </h4>
                    <p
                      className={`mt-0.5 text-xs ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {card.subtitle}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg border px-2 py-0.5 font-mono text-[11px] font-medium ${
                      isLight
                        ? 'border-slate-200 bg-slate-100 text-slate-700'
                        : 'border-slate-700 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {bt.startDate} → {bt.endDate}
                  </span>
                </div>

                {renderCompositionPills(true)}

                {/* Primary KPI Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <div className={`${subSurface} rounded-xl p-2.5`}>
                    <span
                      className={`block text-[11px] ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {tr(lang, 'Total Invested', 'Вложено всего')}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-sm font-bold tabular-nums sm:text-base ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                    >
                      {formatEurDetailed(bt.totalInvestedEur)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {formatEur(bt.initialBudgetEur)} + {monthsCount}×
                      {formatEur(bt.monthlyContributionEur)}
                    </span>
                  </div>

                  <div className={`${subSurface} rounded-xl p-2.5`}>
                    <span
                      className={`block text-[11px] ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {tr(lang, 'Gross Final Value', 'Итого до налогов')}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-sm font-bold tabular-nums sm:text-base ${
                        isLight ? 'text-sky-700' : 'text-sky-300'
                      }`}
                    >
                      {formatEurDetailed(bt.grossFinalValueEur)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {tr(lang, 'Pre-tax portfolio', 'Gross стоимость')}
                    </span>
                  </div>

                  <div
                    className={`col-span-2 rounded-xl border p-2.5 sm:col-span-1 ${
                      isLight
                        ? 'border-[#2d8a61]/30 bg-[#2d8a61]/10'
                        : 'border-[#3b9b72]/35 bg-[#2d8a61]/15'
                    }`}
                  >
                    <span
                      className={`block text-[11px] font-medium ${
                        isLight ? 'text-[#1f6e4b]' : 'text-[#86d6b0]'
                      }`}
                    >
                      {tr(lang, 'Historical Profit', 'Исторический доход')}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-sm font-bold tabular-nums sm:text-base ${
                        profitPositive
                          ? isLight
                            ? 'text-[#1f6e4b]'
                            : 'text-[#7fd4ad]'
                          : isLight
                            ? 'text-rose-700'
                            : 'text-rose-400'
                      }`}
                    >
                      {profitPositive ? '+' : ''}
                      {formatEurDetailed(bt.grossProfitEur)}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-[11px] font-semibold tabular-nums ${
                        profitPositive
                          ? isLight
                            ? 'text-[#2d8a61]'
                            : 'text-[#6ec9a0]'
                          : isLight
                            ? 'text-rose-600'
                            : 'text-rose-400'
                      }`}
                    >
                      {profitPositive ? '+' : ''}
                      {bt.grossTotalReturnPct.toFixed(2)}%{' '}
                      {tr(lang, 'total return', 'к вложениям')}
                    </span>
                  </div>
                </div>

                {/* CAGR & Drawdown Row */}
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <div
                    className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs ${
                      isLight
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-800/80 bg-slate-950/60'
                    }`}
                  >
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      {tr(lang, 'Annualized (CAGR)', 'Среднегодовая (CAGR)')}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        bt.annualizedCagrPct >= 0
                          ? isLight
                            ? 'text-[#1f6e4b]'
                            : 'text-[#7fd4ad]'
                          : isLight
                            ? 'text-rose-600'
                            : 'text-rose-400'
                      }`}
                    >
                      {bt.annualizedCagrPct >= 0 ? '+' : ''}
                      {bt.annualizedCagrPct.toFixed(2)}%
                      {tr(lang, '/yr', '/год')}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs ${
                      isLight
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-800/80 bg-slate-950/60'
                    }`}
                  >
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                      {tr(lang, 'Max Drawdown', 'Макс. просадка')}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        isLight ? 'text-rose-600' : 'text-rose-300'
                      }`}
                    >
                      -{bt.maxDrawdownPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Country Tax & Acc vs Dist Net Breakdown */}
                <div
                  className={`mt-3 rounded-xl border p-3 ${
                    isLight
                      ? 'border-slate-200 bg-slate-50/80'
                      : 'border-slate-800 bg-slate-950/80'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-xs font-semibold ${
                      isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    <span>
                      {selectedCountry.flag} {selectedCountry.name}:{' '}
                      {tr(lang, 'Net After Tax (Acc vs Dist)', 'Чистыми после налога (Acc vs Dist)')}
                    </span>
                    <span
                      className={`text-[11px] font-normal ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {tr(lang, `Sold after ${bt.years}Y`, `Продажа через ${bt.years}Y`)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div
                      className={`rounded-lg border p-2 ${
                        isLight
                          ? 'border-[#2d8a61]/30 bg-[#2d8a61]/10'
                          : 'border-[#3b9b72]/35 bg-[#2d8a61]/12'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            isLight ? 'text-[#1f6e4b]' : 'text-[#86d6b0]'
                          }`}
                        >
                          {tr(lang, 'Accumulating (Acc) Net', 'Accumulating (Acc) чистыми')}
                        </span>
                        <span
                          className={`font-mono ${
                            isLight ? 'text-rose-600' : 'text-rose-300/90'
                          }`}
                        >
                          -{formatEurDetailed(bt.estimatedTaxDragAccEur)}{' '}
                          {tr(lang, 'tax', 'налог')}
                        </span>
                      </div>
                      <div
                        className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {formatEurDetailed(bt.estimatedNetFinalAccEur)}
                      </div>
                    </div>

                    <div
                      className={`rounded-lg border p-2 ${
                        isLight
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-amber-500/30 bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            isLight ? 'text-amber-800' : 'text-amber-300'
                          }`}
                        >
                          {tr(lang, 'Distributing (Dist) Net', 'Distributing (Dist) чистыми')}
                        </span>
                        <span
                          className={`font-mono ${
                            isLight ? 'text-rose-600' : 'text-rose-300/90'
                          }`}
                        >
                          -{formatEurDetailed(bt.estimatedTaxDragDistEur)}{' '}
                          {tr(lang, 'tax', 'налог')}
                        </span>
                      </div>
                      <div
                        className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {formatEurDetailed(bt.estimatedNetFinalDistEur)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-2 flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      accWins
                        ? isLight
                          ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                          : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                        : distWins
                          ? isLight
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                          : isLight
                            ? 'border-slate-200 bg-white text-slate-700'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span>
                      {accWins
                        ? tr(
                            lang,
                            `Acc Advantage in ${selectedCountry.name}:`,
                            `Преимущество Acc в ${selectedCountry.name}:`
                          )
                        : distWins
                          ? tr(
                              lang,
                              `Dist Allowance Benefit in ${selectedCountry.name}:`,
                              `Выгода льготы Dist в ${selectedCountry.name}:`
                            )
                          : tr(
                              lang,
                              `Tax Parity in ${selectedCountry.name}:`,
                              `Налоговый паритет в ${selectedCountry.name}:`
                            )}
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {accWins
                        ? tr(
                            lang,
                            `+${formatEurDetailed(bt.accTaxAdvantageEur)} kept`,
                            `+${formatEurDetailed(bt.accTaxAdvantageEur)} сохранено`
                          )
                        : distWins
                          ? tr(
                              lang,
                              `+${formatEurDetailed(Math.abs(bt.accTaxAdvantageEur))} allowance saved`,
                              `+${formatEurDetailed(Math.abs(bt.accTaxAdvantageEur))} экономия по льготе`
                            )
                          : tr(
                              lang,
                              '€0.00 diff (Acc simpler)',
                              '€0.00 разницы (Acc удобнее)'
                            )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Historical -> Future Forecast Chart */}
        <PerformanceChart
          timelineSeries={calculation.timelineSeries}
          country={selectedCountry}
          historicalCagr5YPct={calculation.blendedHistoricalCagr5YPct}
          historicalCagr3YPct={calculation.blendedHistoricalCagr3YPct}
          volatilityPct={calculation.blendedVolatilityPct}
          selectedHorizonYears={selectedHorizonYears}
          onSelectHorizonYears={setSelectedHorizonYears}
          theme={theme}
        />

        {/* Future Forecast Horizon Cards */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3
              className={`text-base font-bold sm:text-lg ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              {tr(
                lang,
                `Future Compounding Forecast (${selectedCountry.flag} ${selectedCountry.name} — After Tax)`,
                `Прогноз сложного процента на будущее (${selectedCountry.flag} ${selectedCountry.name} — после налогов)`
              )}
            </h3>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {tr(
                lang,
                'Click any horizon (3Y–20Y) to zoom the chart above',
                'Нажмите на любой горизонт (3Y–20Y), чтобы приблизить график выше'
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {calculation.forecasts.map((f) => {
              const isActive = selectedHorizonYears === f.horizonYears;
              return (
                <button
                  key={f.horizonYears}
                  type="button"
                  onClick={() => setSelectedHorizonYears(f.horizonYears)}
                  className={`${cardSurface} flex flex-col justify-between rounded-2xl p-3.5 text-left transition-all ${
                    isActive
                      ? isLight
                        ? 'border-sky-500 ring-1 ring-sky-500/35'
                        : 'border-sky-400/80 ring-1 ring-sky-400/40'
                      : isLight
                        ? 'hover:border-slate-300'
                        : 'hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                          isActive
                            ? isLight
                              ? 'bg-sky-600 text-white'
                              : 'bg-sky-500 text-slate-950'
                            : isLight
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        +{f.horizonYears}Y
                      </span>
                      <span
                        className={`font-mono text-[11px] ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {tr(lang, 'Tax:', 'Налог:')} {f.effectiveTaxRateAppliedPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <span
                        className={`block text-[11px] ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {tr(lang, 'Base Gross (Hist. CAGR)', 'База Gross (Hist. CAGR)')}
                      </span>
                      <span
                        className={`font-mono text-lg font-bold tabular-nums ${
                          isLight ? 'text-sky-700' : 'text-sky-300'
                        }`}
                      >
                        {formatEur(f.baseGrossEur)}
                      </span>
                      <span
                        className={`block font-mono text-[11px] tabular-nums ${
                          isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'
                        }`}
                      >
                        +{formatEur(f.baseGrossProfitEur)} {tr(lang, 'gain', 'доход')}
                      </span>
                    </div>

                    <div
                      className="mt-2 border-t pt-2"
                      style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
                    >
                      <span
                        className={`block text-[11px] ${
                          isLight ? 'text-violet-700' : 'text-violet-300'
                        }`}
                      >
                        {tr(
                          lang,
                          `Net After Tax (${selectedCountry.code})`,
                          `Чистыми после налога (${selectedCountry.code})`
                        )}
                      </span>
                      <span
                        className={`font-mono text-base font-bold tabular-nums ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {formatEur(f.estimatedNetPostTaxBaseEur)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-2 flex items-center justify-between border-t pt-2 font-mono text-[10px] tabular-nums ${
                      isLight
                        ? 'border-slate-200 text-slate-500'
                        : 'border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span>
                      {tr(lang, 'Low:', 'Мин:')} {formatEur(f.conservativeGrossEur)}
                    </span>
                    <span>
                      {tr(lang, 'High:', 'Макс:')} {formatEur(f.optimisticGrossEur)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Forecast Horizon & Tax Breakdown Table */}
        <div className={`${cardSurface} overflow-hidden rounded-2xl`}>
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5"
            style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
          >
            <div
              className={`flex items-center gap-2 text-sm font-bold ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <Info className={`h-4 w-4 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              {tr(
                lang,
                `Full Forecast Matrix (3Y–20Y) & ${selectedCountry.name} Taxation`,
                `Полная таблица прогноза (3Y–20Y) и налогообложение в ${selectedCountry.name}`
              )}
            </div>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {tr(
                lang,
                `Based on 5Y CAGR ${calculation.blendedHistoricalCagr5YPct.toFixed(2)}% & volatility ±${calculation.blendedVolatilityPct.toFixed(1)}%`,
                `На базе 5Y CAGR ${calculation.blendedHistoricalCagr5YPct.toFixed(2)}% и волатильности ±${calculation.blendedVolatilityPct.toFixed(1)}%`
              )}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead
                className={`border-b text-[11px] uppercase tracking-wider ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-600'
                    : 'border-slate-800 bg-slate-900/90 text-slate-400'
                }`}
              >
                <tr>
                  <th className="px-4 py-3 font-semibold">{tr(lang, 'Horizon', 'Горизонт')}</th>
                  <th className="px-4 py-3 font-semibold">{tr(lang, 'Invested', 'Вложено')}</th>
                  <th className="px-4 py-3 font-semibold">
                    {tr(lang, 'Conservative (-σ)', 'Консерват. (-σ)')}
                  </th>
                  <th
                    className={`px-4 py-3 font-semibold ${
                      isLight ? 'text-sky-700' : 'text-sky-300'
                    }`}
                  >
                    {tr(lang, 'Base (Hist. CAGR)', 'База (Hist. CAGR)')}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {tr(lang, 'Optimistic (+σ)', 'Оптимист. (+σ)')}
                  </th>
                  <th
                    className={`px-4 py-3 font-semibold ${
                      isLight ? 'text-rose-700' : 'text-rose-300'
                    }`}
                  >
                    {tr(lang, 'Est. Tax', 'Оценка налога')}
                  </th>
                  <th
                    className={`px-4 py-3 font-semibold ${
                      isLight ? 'text-violet-700' : 'text-violet-300'
                    }`}
                  >
                    {tr(lang, `Net (${selectedCountry.code})`, `Чистыми (${selectedCountry.code})`)}
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    {tr(lang, 'Applied Tax Rule', 'Применённое налоговое правило')}
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y tabular-nums ${
                  isLight ? 'divide-slate-200' : 'divide-slate-800/75'
                }`}
              >
                {calculation.forecasts.map((f) => {
                  const selected = selectedHorizonYears === f.horizonYears;
                  return (
                    <tr
                      key={f.horizonYears}
                      onClick={() => setSelectedHorizonYears(f.horizonYears)}
                      className={`cursor-pointer transition ${
                        selected
                          ? isLight
                            ? 'bg-sky-50'
                            : 'bg-sky-500/10'
                          : isLight
                            ? 'hover:bg-slate-50'
                            : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        +{f.horizonYears}Y
                      </td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        {formatEur(f.totalInvestedEur)}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {formatEur(f.conservativeGrossEur)}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          isLight ? 'text-sky-700' : 'text-sky-300'
                        }`}
                      >
                        {formatEur(f.baseGrossEur)}
                        <span
                          className={`ml-1.5 text-[10px] font-medium ${
                            isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'
                          }`}
                        >
                          (+{formatEur(f.baseGrossProfitEur)})
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          isLight ? 'text-sky-600' : 'text-sky-200'
                        }`}
                      >
                        {formatEur(f.optimisticGrossEur)}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          isLight ? 'text-rose-700' : 'text-rose-300'
                        }`}
                      >
                        -{formatEur(f.estimatedExitTaxEur)}
                        <span
                          className={`ml-1 text-[10px] ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          ({f.effectiveTaxRateAppliedPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          isLight ? 'text-violet-700' : 'text-violet-300'
                        }`}
                      >
                        {formatEur(f.estimatedNetPostTaxBaseEur)}
                      </td>
                      <td
                        className={`max-w-xs px-4 py-3 text-[11px] leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        {f.taxNote}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={`flex items-start gap-2 border-t px-4 py-2.5 text-[11px] sm:px-5 ${
              isLight
                ? 'border-slate-200 bg-slate-50 text-slate-600'
                : 'border-slate-800 bg-slate-950/75 text-slate-400'
            }`}
          >
            <ShieldAlert
              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                isLight ? 'text-amber-600' : 'text-amber-400'
              }`}
            />
            <span>
              {tr(
                lang,
                'Historical investment ratings and past performance are not a promise or reliable indicator of future results. Tax estimates (e.g., Portugal Lei n.º 31/2024 holding discounts, Dutch Box 3, German Vorabpauschale, Irish 8-Year Deemed Disposal) are simplified educational models—consult a licensed tax advisor before filing.',
                'Исторические оценки доходности и прошлые результаты не гарантируют будущей прибыли. Налоговые расчёты (например, скидка за срок владения в Португалии Lei n.º 31/2024, нидерландский Box 3, немецкий Vorabpauschale, ирландский 8-Year Deemed Disposal) являются упрощённой образовательной моделью — перед подачей декларации сверьтесь с сертифицированным налоговым консультантом.'
              )}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
