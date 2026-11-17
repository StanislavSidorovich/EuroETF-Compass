import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeftRight,
  Calculator,
  Calendar,
  Coins,
  Globe2,
  Info,
  Percent,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import type {
  BacktestPeriodMetrics,
  CountryTaxRule,
  ETFInstrument,
  LiveQuoteData,
  PortfolioAllocationItem,
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
}

const BUDGET_PRESETS_EUR = [1000, 5000, 10000, 25000, 50000];
const MONTHLY_PRESETS_EUR = [0, 100, 250, 500, 1000];
const FEATURED_COUNTRY_CODES = ['PT', 'NL', 'DE'];

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

function getVerdictBadgeClasses(verdict: CountryTaxRule['verdict']): string {
  switch (verdict) {
    case 'ACC_STRONGLY_PREFERRED':
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-200';
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return 'border-sky-500/40 bg-sky-500/15 text-sky-200';
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
}: InvestmentCalculatorProps) {
  const [initialBudgetEur, setInitialBudgetEur] = useState<number>(10000);
  const [monthlyContributionEur, setMonthlyContributionEur] = useState<number>(250);
  const [allocations, setAllocations] = useState<PortfolioAllocationItem[]>([
    { etfId: 'vwce', weightPct: 100 },
  ]);
  const [selectedHorizonYears, setSelectedHorizonYears] = useState<ForecastHorizonOption>(10);

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

  if (!selectedCountry || !calculation) {
    return null;
  }

  const normalizedTotalWeight =
    allocations.reduce((sum, item) => sum + Math.max(0, item.weightPct), 0) || 1;

  // Quick Acc <-> Dist twin toggle if single paired ETF is selected
  const singleActiveEtf =
    allocations.length === 1 ? etfById.get(allocations[0].etfId) : undefined;
  const singlePairedEtf =
    singleActiveEtf?.pairedEtfId ? etfById.get(singleActiveEtf.pairedEtfId) : undefined;

  const backtestCards: Array<{
    key: '3Y' | '5Y';
    title: string;
    subtitle: string;
    accentBorder: string;
    metrics: BacktestPeriodMetrics;
  }> = [
    {
      key: '3Y',
      title: 'If You Invested 3 Years Ago (3Y Backtest)',
      subtitle: 'Recent 36-month market cycle & tax drag simulation',
      accentBorder: 'border-sky-500/35',
      metrics: calculation.backtest3Y,
    },
    {
      key: '5Y',
      title: 'If You Invested 5 Years Ago (5Y Backtest)',
      subtitle: 'Full 60-month cycle (2022 bear market + 2023–2026 recovery)',
      accentBorder: 'border-emerald-500/35',
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

  return (
    <div className="space-y-8">
      {/* ===================================================================
          1. TOP CONTROL BAR: BUDGET + SPARPLAN + TAX RESIDENCE COUNTRY
      =================================================================== */}
      <section className="fintech-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-800/90 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-100 sm:text-xl">
                Budget, 3Y/5Y Backtest &amp; European Tax Forecast Calculator
              </h2>
              <p className="text-xs text-slate-400">
                Simulate real historical UCITS ETF returns, Acc vs. Dist tax drag, and long-term
                after-tax compounding.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Initial Lump-Sum Budget */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4 lg:col-span-4">
            <label
              htmlFor="initial-budget-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <Coins className="h-3.5 w-3.5 text-emerald-400" />
              Initial Lump-Sum Budget (€)
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-emerald-400">
              <span className="mr-2 font-mono text-base font-bold text-slate-400">€</span>
              <input
                id="initial-budget-input"
                type="number"
                min={0}
                max={10000000}
                step={500}
                value={initialBudgetEur}
                onChange={(e) => handleNumericBudgetChange(e.target.value, setInitialBudgetEur)}
                className="w-full bg-transparent font-mono text-lg font-bold text-slate-100 tabular-nums focus:outline-none"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {BUDGET_PRESETS_EUR.map((amt) => {
                const active = initialBudgetEur === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialBudgetEur(amt)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700/80 bg-slate-900 text-slate-300 hover:border-emerald-500/50'
                    }`}
                  >
                    {formatEur(amt)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Savings Plan (Sparplan) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4 lg:col-span-4">
            <label
              htmlFor="monthly-sparplan-input"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              Monthly Savings Plan / Sparplan (€/mo)
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-sky-400">
              <span className="mr-2 font-mono text-base font-bold text-slate-400">€</span>
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
                className="w-full bg-transparent font-mono text-lg font-bold text-slate-100 tabular-nums focus:outline-none"
              />
              <span className="ml-1.5 shrink-0 font-mono text-xs text-slate-400">/ mo</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {MONTHLY_PRESETS_EUR.map((amt) => {
                const active = monthlyContributionEur === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyContributionEur(amt)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                      active
                        ? 'bg-sky-500 text-slate-950'
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4 lg:col-span-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="country-tax-select"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                <Globe2 className="h-3.5 w-3.5 text-violet-400" />
                Tax Residence Country
              </label>
              <div className="flex items-center gap-1">
                {featuredCountries.map((fc) => {
                  const active = fc.code === selectedCountry.code;
                  return (
                    <button
                      key={fc.code}
                      type="button"
                      onClick={() => onSelectCountry(fc.code)}
                      title={`Select ${fc.name}`}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-violet-500 text-slate-950'
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
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-slate-100 focus:border-violet-400 focus:outline-none"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code}) — {c.regionGroup}
                </option>
              ))}
            </select>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold leading-tight ${getVerdictBadgeClasses(
                  selectedCountry.verdict
                )}`}
              >
                {selectedCountry.flag} {selectedCountry.verdictTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Active Portfolio Summary Strip */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-slate-950/65 p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active ETF Mix:
            </span>
            {allocations.map((item) => {
              const etf = etfById.get(item.etfId);
              if (!etf) return null;
              const pct = ((Math.max(0, item.weightPct) / normalizedTotalWeight) * 100).toFixed(0);
              return (
                <span
                  key={item.etfId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-100"
                >
                  <span className="font-mono">{etf.ticker}</span>
                  <span className="text-slate-400">{pct}%</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      etf.distributionPolicy === 'Acc'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {etf.distributionPolicy}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
              <Percent className="h-3.5 w-3.5 text-sky-400" />
              Blended TER:{' '}
              <strong className="font-mono text-sky-300">
                {calculation.blendedTerPct.toFixed(2)}%
              </strong>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              5Y CAGR:{' '}
              <strong className="font-mono text-emerald-300">
                {calculation.blendedHistoricalCagr5YPct >= 0 ? '+' : ''}
                {calculation.blendedHistoricalCagr5YPct.toFixed(2)}%
              </strong>
            </span>
            {singlePairedEtf && singleActiveEtf && (
              <button
                type="button"
                onClick={() =>
                  setAllocations([{ etfId: singlePairedEtf.id, weightPct: 100 }])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Switch to {singlePairedEtf.ticker} ({singlePairedEtf.distributionPolicy})
              </button>
            )}
            <a
              href="#etf-portfolio-selector"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-200"
            >
              Change ETFs / Presets
              <ArrowDown className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. HISTORICAL REVENUE BACKTEST SECTION (3Y & 5Y SIDE BY SIDE)
      =================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              Historical Performance Lookback
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-100">
              What Could You Have Earned Historically?
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Comparing {formatEur(initialBudgetEur)} lump-sum + {formatEur(monthlyContributionEur)}
            /mo DCA under <strong className="text-slate-200">{selectedCountry.flag} {selectedCountry.name}</strong> tax laws
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {backtestCards.map((card) => {
            const bt = card.metrics;
            const profitPositive = bt.grossProfitEur >= 0;
            const accWins = bt.accTaxAdvantageEur > 0.5;
            const distWins = bt.accTaxAdvantageEur < -0.5;
            const monthsCount = bt.years * 12;

            return (
              <div
                key={card.key}
                className={`fintech-card rounded-2xl border ${card.accentBorder} p-5`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/90 pb-3.5">
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{card.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-400">{card.subtitle}</p>
                  </div>
                  <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-300">
                    {bt.startDate} → {bt.endDate}
                  </span>
                </div>

                {/* Primary KPI Grid */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="block text-[11px] text-slate-400">Total Budget Invested</span>
                    <span className="mt-1 block font-mono text-base font-bold text-slate-100 tabular-nums">
                      {formatEurDetailed(bt.totalInvestedEur)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {formatEur(bt.initialBudgetEur)} + {monthsCount}×
                      {formatEur(bt.monthlyContributionEur)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="block text-[11px] text-slate-400">
                      Final Gross Value
                    </span>
                    <span className="mt-1 block font-mono text-base font-bold text-sky-300 tabular-nums">
                      {formatEurDetailed(bt.grossFinalValueEur)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      Before national exit taxes
                    </span>
                  </div>

                  <div className="col-span-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 sm:col-span-1">
                    <span className="block text-[11px] text-emerald-200/80">
                      Total Historical Revenue
                    </span>
                    <span
                      className={`mt-1 block font-mono text-base font-bold tabular-nums ${
                        profitPositive ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {profitPositive ? '+' : ''}
                      {formatEurDetailed(bt.grossProfitEur)}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-[11px] font-semibold tabular-nums ${
                        profitPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {profitPositive ? '+' : ''}
                      {bt.grossTotalReturnPct.toFixed(2)}% total return
                    </span>
                  </div>
                </div>

                {/* CAGR & Drawdown Row */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs">
                    <span className="text-slate-400">Annualized Return (CAGR)</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        bt.annualizedCagrPct >= 0 ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {bt.annualizedCagrPct >= 0 ? '+' : ''}
                      {bt.annualizedCagrPct.toFixed(2)}% / yr
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs">
                    <span className="text-slate-400">Max Historical Drawdown</span>
                    <span className="font-mono font-bold text-rose-300 tabular-nums">
                      -{bt.maxDrawdownPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Country Tax & Acc vs Dist Net Breakdown */}
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>
                      {selectedCountry.flag} {selectedCountry.name} After-Tax Comparison (Acc vs.
                      Dist)
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Liquidation at {bt.years}Y
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-300">Accumulating (Acc) Net</span>
                        <span className="font-mono text-rose-300/90">
                          -{formatEurDetailed(bt.estimatedTaxDragAccEur)} tax
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
                        {formatEurDetailed(bt.estimatedNetFinalAccEur)}
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-300">Distributing (Dist) Net</span>
                        <span className="font-mono text-rose-300/90">
                          -{formatEurDetailed(bt.estimatedTaxDragDistEur)} tax
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
                        {formatEurDetailed(bt.estimatedNetFinalDistEur)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-2.5 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold ${
                      accWins
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                        : distWins
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <span>
                      {accWins
                        ? `Acc Advantage in ${selectedCountry.name}:`
                        : distWins
                          ? `Dist Allowance Edge in ${selectedCountry.name}:`
                          : `Tax Neutrality in ${selectedCountry.name}:`}
                    </span>
                    <span className="font-mono font-bold tabular-nums">
                      {accWins
                        ? `+${formatEurDetailed(bt.accTaxAdvantageEur)} extra kept`
                        : distWins
                          ? `+${formatEurDetailed(Math.abs(bt.accTaxAdvantageEur))} via allowance`
                          : '€0.00 tax gap (Acc saves friction)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================================
          3. INTERACTIVE TIMELINE CHART + FUTURE FORECAST HORIZONS
      =================================================================== */}
      <section className="space-y-5">
        <PerformanceChart
          timelineSeries={calculation.timelineSeries}
          country={selectedCountry}
          historicalCagr5YPct={calculation.blendedHistoricalCagr5YPct}
          historicalCagr3YPct={calculation.blendedHistoricalCagr3YPct}
          volatilityPct={calculation.blendedVolatilityPct}
          selectedHorizonYears={selectedHorizonYears}
          onSelectHorizonYears={setSelectedHorizonYears}
        />

        {/* Future Forecast Horizon Cards */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-slate-100">
              Future Compounding Forecast ({selectedCountry.flag} {selectedCountry.name} After-Tax
              Horizons)
            </h3>
            <span className="text-xs text-slate-400">
              Click any horizon card below to zoom the forecast chart above
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
                  className={`fintech-card flex flex-col justify-between rounded-2xl p-4 text-left transition-all ${
                    isActive
                      ? 'border-sky-400/80 ring-1 ring-sky-400/40'
                      : 'hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                          isActive
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        +{f.horizonYears} Years
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Eff. Tax: {f.effectiveTaxRateAppliedPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="block text-[11px] text-slate-400">
                        Base Gross (Hist. CAGR)
                      </span>
                      <span className="font-mono text-lg font-bold text-sky-300 tabular-nums">
                        {formatEur(f.baseGrossEur)}
                      </span>
                      <span className="block font-mono text-[11px] text-emerald-400 tabular-nums">
                        +{formatEur(f.baseGrossProfitEur)} gain
                      </span>
                    </div>

                    <div className="mt-2.5 border-t border-slate-800 pt-2">
                      <span className="block text-[11px] text-violet-300">
                        Est. Net After Tax ({selectedCountry.code})
                      </span>
                      <span className="font-mono text-base font-bold text-white tabular-nums">
                        {formatEur(f.estimatedNetPostTaxBaseEur)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[10px] text-slate-400 tabular-nums">
                    <span>Low: {formatEur(f.conservativeGrossEur)}</span>
                    <span>High: {formatEur(f.optimisticGrossEur)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Forecast Horizon & Tax Breakdown Table */}
        <div className="fintech-card overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Info className="h-4 w-4 text-sky-400" />
              Complete 3Y–20Y Mathematical Projection &amp; {selectedCountry.name} Tax Schedule
            </div>
            <span className="text-xs text-slate-400">
              Based on {calculation.blendedHistoricalCagr5YPct.toFixed(2)}% 5Y CAGR &amp; ±
              {calculation.blendedVolatilityPct.toFixed(1)}% volatility
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Horizon</th>
                  <th className="px-4 py-3 font-semibold">Total Invested</th>
                  <th className="px-4 py-3 font-semibold">Conservative (-Band)</th>
                  <th className="px-4 py-3 font-semibold text-sky-300">Base (Hist. CAGR)</th>
                  <th className="px-4 py-3 font-semibold">Optimistic (+Band)</th>
                  <th className="px-4 py-3 font-semibold text-rose-300">Est. Tax</th>
                  <th className="px-4 py-3 font-semibold text-violet-300">
                    Net After Tax ({selectedCountry.code})
                  </th>
                  <th className="px-4 py-3 font-semibold">Jurisdiction Tax Rule Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/75 tabular-nums">
                {calculation.forecasts.map((f) => {
                  const selected = selectedHorizonYears === f.horizonYears;
                  return (
                    <tr
                      key={f.horizonYears}
                      onClick={() => setSelectedHorizonYears(f.horizonYears)}
                      className={`cursor-pointer transition ${
                        selected ? 'bg-sky-500/10' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-100">
                        +{f.horizonYears}Y
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {formatEur(f.totalInvestedEur)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {formatEur(f.conservativeGrossEur)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-300">
                        {formatEur(f.baseGrossEur)}
                        <span className="ml-1.5 text-[10px] font-medium text-emerald-400">
                          (+{formatEur(f.baseGrossProfitEur)})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sky-200">
                        {formatEur(f.optimisticGrossEur)}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-300">
                        -{formatEur(f.estimatedExitTaxEur)}
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({f.effectiveTaxRateAppliedPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-violet-300">
                        {formatEur(f.estimatedNetPostTaxBaseEur)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-[11px] leading-relaxed text-slate-300">
                        {f.taxNote}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 border-t border-slate-800 bg-slate-950/75 px-4 py-2.5 text-[11px] text-slate-400 sm:px-5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>
              Past performance and historical ETF ratings are not a promise or guarantee of future
              returns. Tax rules (e.g., Portugal Lei n.º 31/2024 holding discounts, Netherlands Box
              3, Germany Vorabpauschale, Ireland 8-Year Deemed Disposal) are simplified educational
              simulations—consult a licensed tax advisor before filing.
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. ETF PORTFOLIO SELECTOR
      =================================================================== */}
      <section id="etf-portfolio-selector" className="scroll-mt-6">
        <EtfSelector
          etfs={etfs}
          quotesByEtfId={quotesByEtfId}
          allocations={allocations}
          onChangeAllocations={setAllocations}
          onAddCustomTicker={onAddCustomTicker}
          isFetchingCustomTicker={isFetchingCustomTicker}
          customTickerError={customTickerError}
        />
      </section>
    </div>
  );
}
