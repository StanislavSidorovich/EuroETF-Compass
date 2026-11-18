import { useMemo, useState } from 'react';
import {
  ArrowDown,
  Calculator,
  Calendar,
  Coins,
  Globe2,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  CountryTaxRule,
  ETFInstrument,
  LiveQuoteData,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';
import { calculatePortfolioBacktestAndForecast } from '../../utils/investmentMath';
import { BacktestResultsSection } from './BacktestResultsSection';
import { EtfSelector } from './EtfSelector';
import { ForecastSection } from './ForecastSection';
import { type ForecastHorizonOption } from './PerformanceChart';
import {
  BUDGET_PRESETS_EUR,
  FEATURED_COUNTRY_CODES,
  MONTHLY_PRESETS_EUR,
  REGION_LABELS_RU,
  formatEur,
  getAssetShortCategoryLabel,
  getLocalizedVerdictTitle,
  getVerdictBadgeClasses,
} from './calculatorHelpers';

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

          <span className="ui-text-muted">→</span>

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

          <span className="ui-text-muted">→</span>

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
                          : 'bg-sky-500 text-white'
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
                            : 'bg-violet-500 text-white'
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
        <BacktestResultsSection
          initialBudgetEur={initialBudgetEur}
          monthlyContributionEur={monthlyContributionEur}
          selectedCountry={selectedCountry}
          calculation={calculation}
          activeCompositionPills={activeCompositionPills}
          singleActiveEtf={singleActiveEtf}
          singlePairedEtf={singlePairedEtf}
          onSelectPairedEtf={(pairedEtfId) =>
            setAllocations([{ etfId: pairedEtfId, weightPct: 100 }])
          }
          isLight={isLight}
          cardSurface={cardSurface}
          subSurface={subSurface}
        />

        <ForecastSection
          calculation={calculation}
          selectedCountry={selectedCountry}
          selectedHorizonYears={selectedHorizonYears}
          onSelectHorizonYears={setSelectedHorizonYears}
          theme={theme}
          isLight={isLight}
          cardSurface={cardSurface}
        />
      </section>
    </div>
  );
}
