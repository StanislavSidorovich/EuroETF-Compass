import { Info, ShieldAlert } from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import type {
  CountryTaxRule,
  ETFInstrument,
  FullCalculationOutput,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';
import { formatEur } from './calculatorHelpers';
import { type ForecastHorizonOption, PerformanceChart } from './PerformanceChart';

export interface ForecastSectionProps {
  calculation: FullCalculationOutput;
  selectedCountry: CountryTaxRule;
  etfs: ETFInstrument[];
  allocations: PortfolioAllocationItem[];
  onChangeAllocations: (next: PortfolioAllocationItem[]) => void;
  selectedHorizonYears: ForecastHorizonOption;
  onSelectHorizonYears: (years: ForecastHorizonOption) => void;
  theme?: ThemeMode;
  isLight: boolean;
  cardSurface: string;
}

export function ForecastSection({
  calculation,
  selectedCountry,
  etfs,
  allocations,
  onChangeAllocations,
  selectedHorizonYears,
  onSelectHorizonYears,
  theme,
  isLight,
  cardSurface,
}: ForecastSectionProps) {
  const { lang } = useAppPreferences();

  return (
    <>
      {/* Interactive Historical -> Future Forecast Chart */}
      <PerformanceChart
        timelineSeries={calculation.timelineSeries}
        country={selectedCountry}
        etfs={etfs}
        allocations={allocations}
        onChangeAllocations={onChangeAllocations}
        historicalCagr5YPct={calculation.blendedHistoricalCagr5YPct}
        historicalCagr3YPct={calculation.blendedHistoricalCagr3YPct}
        volatilityPct={calculation.blendedVolatilityPct}
        selectedHorizonYears={selectedHorizonYears}
        onSelectHorizonYears={onSelectHorizonYears}
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
                onClick={() => onSelectHorizonYears(f.horizonYears)}
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
                            : 'bg-sky-500 text-white'
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
                    <span className="block font-mono text-[11px] tabular-nums ui-text-sage">
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
                    onClick={() => onSelectHorizonYears(f.horizonYears)}
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
                      <span className="ml-1.5 text-[10px] font-medium ui-text-sage">
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
    </>
  );
}
