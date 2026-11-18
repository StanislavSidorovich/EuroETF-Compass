import {
  Activity,
  ArrowLeftRight,
  Briefcase,
  Percent,
  TrendingUp,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  BacktestPeriodMetrics,
  CountryTaxRule,
  ETFInstrument,
  FullCalculationOutput,
} from '../../types';
import {
  type CompositionPillItem,
  formatEur,
  formatEurDetailed,
} from './calculatorHelpers';

export interface BacktestResultsSectionProps {
  initialBudgetEur: number;
  monthlyContributionEur: number;
  selectedCountry: CountryTaxRule;
  calculation: FullCalculationOutput;
  activeCompositionPills: CompositionPillItem[];
  singleActiveEtf?: ETFInstrument;
  singlePairedEtf?: ETFInstrument;
  onSelectPairedEtf: (etfId: string) => void;
  isLight: boolean;
  cardSurface: string;
  subSurface: string;
}

export function BacktestResultsSection({
  initialBudgetEur,
  monthlyContributionEur,
  selectedCountry,
  calculation,
  activeCompositionPills,
  singleActiveEtf,
  singlePairedEtf,
  onSelectPairedEtf,
  isLight,
  cardSurface,
  subSurface,
}: BacktestResultsSectionProps) {
  const { lang } = useAppPreferences();

  const backtestCards: Array<{
    key: '3Y' | '5Y';
    title: string;
    subtitle: string;
    accentBorder: string;
    metrics: BacktestPeriodMetrics;
  }> = [
    {
      key: '3Y',
      title: tr(
        lang,
        'If You Invested 3 Years Ago (3Y Backtest)',
        'Если бы вы вложили 3 года назад (3Y Backtest)'
      ),
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
      title: tr(
        lang,
        'If You Invested 5 Years Ago (5Y Backtest)',
        'Если бы вы вложили 5 лет назад (5Y Backtest)'
      ),
      subtitle: tr(
        lang,
        'Full 60-month cycle (2022 dip + 2023–2026 recovery)',
        'Полный 60-месячный цикл (просадка 2022 + рост 2023–2026)'
      ),
      accentBorder: 'border-emerald-500/40',
      metrics: calculation.backtest5Y,
    },
  ];

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
        <Briefcase className="h-3 w-3 ui-text-sage" />
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
          <span className="font-mono font-bold ui-text-sage">
            {pill.pct}%
          </span>
          <span className="font-mono font-bold">{pill.ticker}</span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>({pill.label})</span>
        </span>
      ))}
    </div>
  );

  return (
    <>
      {/* Step 3 Header + Portfolio Summary Strip */}
      <div className={`${cardSurface} rounded-2xl p-4`}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-step-badge rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {tr(lang, 'Step 3', 'Шаг 3')}
            </span>
            <h3
              className={`inline-flex items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 ui-text-sage" />
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
              <Activity className="h-3.5 w-3.5 ui-text-sage" />
              5Y CAGR:{' '}
              <strong className="font-mono ui-text-sage">
                {calculation.blendedHistoricalCagr5YPct >= 0 ? '+' : ''}
                {calculation.blendedHistoricalCagr5YPct.toFixed(2)}%
              </strong>
            </span>
            {singlePairedEtf && singleActiveEtf && (
              <button
                type="button"
                onClick={() => onSelectPairedEtf(singlePairedEtf.id)}
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

                <div className="col-span-2 rounded-xl border border-emerald-500/35 ui-tint-sage p-2.5 sm:col-span-1">
                  <span className="block text-[11px] font-medium ui-text-sage">
                    {tr(lang, 'Historical Profit', 'Исторический доход')}
                  </span>
                  <span
                    className={`mt-0.5 block font-mono text-sm font-bold tabular-nums sm:text-base ${
                      profitPositive
                        ? 'ui-text-sage'
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
                        ? 'ui-text-sage'
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
                        ? 'ui-text-sage'
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
                  <div className="rounded-lg border border-emerald-500/35 ui-tint-sage p-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold ui-text-sage">
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
                      ? 'ui-soft-pill'
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
    </>
  );
}
