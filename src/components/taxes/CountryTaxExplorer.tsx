import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  BadgePercent,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AccVsDistVerdict, CountryTaxRule, LanguageMode } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';
import { AccVsDistComparison } from './AccVsDistComparison';
import { EuropeTaxMap } from './EuropeTaxMap';
import { TaxFilingToolkit } from './TaxFilingToolkit';

interface CountryTaxExplorerProps {
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
}

type RegionFilter =
  | 'All'
  | 'Featured Core'
  | 'Western Europe'
  | 'DACH'
  | 'Southern Europe'
  | 'Central & Eastern Europe'
  | 'Nordics & UK';

const REGION_FILTERS: Array<{ id: RegionFilter; enLabel: string; ruLabel: string }> = [
  { id: 'All', enLabel: 'All 15 Countries', ruLabel: 'Все 15 стран' },
  { id: 'Featured Core', enLabel: 'Featured Core', ruLabel: 'Приоритетные (PT/NL/DE)' },
  { id: 'Western Europe', enLabel: 'Western Europe', ruLabel: 'Западная Европа' },
  { id: 'DACH', enLabel: 'DACH', ruLabel: 'DACH (DE/AT/CH)' },
  { id: 'Southern Europe', enLabel: 'Southern Europe', ruLabel: 'Южная Европа' },
  { id: 'Central & Eastern Europe', enLabel: 'Central & Eastern Europe', ruLabel: 'Центр. и Вост. Европа' },
  { id: 'Nordics & UK', enLabel: 'Nordics & UK', ruLabel: 'Север и UK' },
];

function getVerdictBadgeStyle(
  verdict: AccVsDistVerdict,
  lang: LanguageMode
): {
  label: string;
  className: string;
} {
  switch (verdict) {
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return {
        label: tr(lang, 'Acc Wins + Holding Discount', 'Acc выгоднее + льгота за срок'),
        className: 'border-emerald-400/40 bg-emerald-500/15 ui-text-sage',
      };
    case 'ACC_STRONGLY_PREFERRED':
      return {
        label: tr(lang, 'Acc Strongly Preferred', 'Acc однозначно выгоднее'),
        className: 'border-emerald-500/40 bg-emerald-500/15 ui-text-sage',
      };
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
      return {
        label: tr(lang, 'Dist Up to Allowance, Then Acc', 'Dist в рамках лимита, затем Acc'),
        className: 'border-amber-400/40 bg-amber-500/15 ui-text-sand',
      };
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return {
        label: tr(lang, 'Acc Preferred (Check Registry)', 'Acc выгоднее (проверить реестр)'),
        className: 'border-cyan-400/40 bg-cyan-500/15 ui-text-cool',
      };
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return {
        label: tr(lang, 'Tax Parity (Acc Convenience)', 'Налоговый паритет (Acc удобнее)'),
        className: 'border-indigo-400/40 bg-indigo-500/15 ui-text-cool',
      };
  }
}

export const CountryTaxExplorer: React.FC<CountryTaxExplorerProps> = ({
  countries,
  selectedCountryCode,
  onSelectCountry,
}) => {
  const { lang } = useAppPreferences();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredCountries = useMemo(
    () => countries.filter((c) => c.featuredPriority),
    [countries]
  );

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return countries.filter((c) => {
      const matchesRegion = regionFilter === 'All' || c.regionGroup === regionFilter;
      if (!matchesRegion) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.verdictTitle.toLowerCase().includes(q) ||
        c.taxDeclarationForm.toLowerCase().includes(q) ||
        (c.specialWrapperName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [countries, regionFilter, searchQuery]);

  const selectedCountry = useMemo(
    () =>
      countries.find((c) => c.code === selectedCountryCode) ?? countries[0],
    [countries, selectedCountryCode]
  );

  const verdictBadge = getVerdictBadgeStyle(selectedCountry.verdict, lang);

  return (
    <div className="space-y-6">
      {/* Interactive SVG Map of Europe */}
      <EuropeTaxMap
        countries={countries}
        selectedCountryCode={selectedCountry.code}
        onSelectCountry={onSelectCountry}
      />

      {/* Top Featured Priority Cards (PT, NL, DE) */}
      <section aria-label={tr(lang, 'Featured priority European countries', 'Приоритетные страны Европы')}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 ui-text-sage" />
            <h2 className="text-sm font-bold uppercase tracking-wider ui-text-secondary">
              {tr(
                lang,
                'Featured Priority Jurisdictions (Portugal, Netherlands & Germany)',
                'Приоритетные юрисдикции (Португалия, Нидерланды и Германия)'
              )}
            </h2>
          </div>
          <span className="text-xs ui-text-muted">
            {tr(
              lang,
              'Click any card to inspect legal filings & Acc vs Dist tax math',
              'Нажмите на карточку, чтобы увидеть декларации и сравнение Acc vs Dist'
            )}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {featuredCountries.map((country) => {
            const isSelected = country.code === selectedCountry.code;
            const badge = getVerdictBadgeStyle(country.verdict, lang);
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => onSelectCountry(country.code)}
                className={`fintech-card flex flex-col justify-between rounded-2xl p-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-400/70 ring-2 ring-emerald-500/35'
                    : 'hover:border-emerald-500/45'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <h3 className="text-base font-bold ui-text-primary">{country.name}</h3>
                        <span className="font-mono text-[11px] ui-text-muted">
                          {country.code} • {country.regionGroup}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold ui-text-sage">
                        <CheckCircle2 className="h-3 w-3" /> {tr(lang, 'Active', 'Активна')}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs font-semibold ui-text-primary">
                    {country.verdictTitle}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t ui-border-subtle pt-2.5 text-[11px]">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="font-mono font-bold tabular-nums ui-text-cool">
                    {tr(lang, 'Eff.', 'Эфф.')} {country.effectiveEquityEtfTaxRatePct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Region Filter + Search Bar + 15-Country Selector Grid */}
      <section className="fintech-card rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {REGION_FILTERS.map((region) => {
              const active = regionFilter === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setRegionFilter(region.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'border ui-border-subtle ui-surface-card ui-text-body ui-hover-elevated hover:text-[var(--ui-text-primary)]'
                  }`}
                >
                  {tr(lang, region.enLabel, region.ruLabel)}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 ui-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Search country, Box 3, Anexo J, PEA...',
                'Поиск страны, Box 3, Anexo J, PEA...'
              )}
              className="w-full rounded-xl border ui-input py-1.5 pr-3 pl-8 text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filteredCountries.length === 0 ? (
            <p className="py-2 text-xs ui-text-muted">
              {tr(
                lang,
                `No European jurisdictions match "${searchQuery}".`,
                `Юрисдикции по запросу «${searchQuery}» не найдены.`
              )}
            </p>
          ) : (
            filteredCountries.map((country) => {
              const active = country.code === selectedCountry.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => onSelectCountry(country.code)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-emerald-400 bg-emerald-500/15 ui-text-sage ring-1 ring-emerald-500/40'
                      : 'ui-border-subtle ui-surface-card ui-text-body ui-hover-elevated hover:text-[var(--ui-text-primary)]'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="font-mono text-[10px] ui-text-muted">
                    {country.effectiveEquityEtfTaxRatePct}%
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Detailed Country Inspection View */}
      <section className="space-y-5">
        <div className="fintech-card rounded-2xl p-5 sm:p-6">
          {/* Country Header & Verdict */}
          <div className="flex flex-col gap-4 border-b ui-border-subtle pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-3xl">{selectedCountry.flag}</span>
                <h2 className="text-xl font-extrabold ui-text-primary sm:text-2xl">
                  {selectedCountry.name} ({selectedCountry.code})
                </h2>
                <span className="rounded-full border ui-border-default ui-surface-elevated px-2.5 py-0.5 text-[11px] font-medium ui-text-body">
                  {selectedCountry.regionGroup}
                </span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold ${verdictBadge.className}`}
                >
                  {verdictBadge.label}
                </span>
              </div>
              <p className="text-sm font-semibold ui-text-sage">
                {selectedCountry.verdictTitle}
              </p>
              <p className="max-w-4xl text-xs leading-relaxed ui-text-body sm:text-sm">
                {selectedCountry.verdictSummary}
              </p>
            </div>

            <a
              href={selectedCountry.localAuthorityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold ui-text-cool transition hover:bg-cyan-500/20"
            >
              <Landmark className="h-4 w-4" />
              <span>{selectedCountry.localAuthorityName}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* 4 Headline Metric Tiles */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3.5">
              <span className="text-[11px] font-medium ui-text-muted">
                {tr(lang, 'Headline Capital Gains Tax', 'Базовый налог на прирост (CGT)')}
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums ui-text-primary">
                {selectedCountry.capitalGainsTaxRatePct}%
              </p>
              <span className="text-[11px] ui-text-muted">
                {tr(lang, 'Statutory rate on realized gains', 'Стандартная ставка при продаже')}
              </span>
            </div>

            <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3.5">
              <span className="text-[11px] font-medium ui-text-muted">
                {tr(lang, 'Headline Dividend Tax', 'Налог на дивиденды')}
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums ui-text-sand">
                {selectedCountry.dividendTaxRatePct}%
              </p>
              <span className="text-[11px] ui-text-muted">
                {tr(lang, 'Applies to Distributing cash payouts', 'Применяется к выплатам Dist ETF')}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 ui-tint-sage p-3.5">
              <span className="text-[11px] font-medium ui-text-sage">
                {tr(lang, 'Effective Equity ETF Rate', 'Эффективная ставка ETF')}
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums ui-text-sage">
                {selectedCountry.effectiveEquityEtfTaxRatePct}%
              </p>
              <span className="text-[11px] ui-text-sage opacity-80">
                {tr(lang, 'After local exemptions / holding tiers', 'После льгот и скидок за срок')}
              </span>
            </div>

            <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3.5">
              <span className="text-[11px] font-medium ui-text-muted">
                {tr(lang, 'Annual Tax-Free Allowance', 'Ежегодный необлагаемый лимит')}
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums ui-text-cool">
                {selectedCountry.annualTaxFreeAllowanceEur > 0
                  ? `€${selectedCountry.annualTaxFreeAllowanceEur.toLocaleString('en-IE')}`
                  : '€0'}
              </p>
              <span className="text-[11px] ui-text-muted">
                {selectedCountry.annualTaxFreeAllowanceEur > 0
                  ? tr(lang, 'Annual tax-exempt base / wrapper', 'Ежегодная льготная база')
                  : tr(lang, 'See special wrappers or holding tiers', 'См. спецсчета или льготы за срок')}
              </span>
            </div>
          </div>

          {/* Holding Period Discount Step Timeline (Portugal Lei n.º 31/2024, Czechia 3Y Test) */}
          {selectedCountry.holdingPeriodDiscounts &&
            selectedCountry.holdingPeriodDiscounts.length > 0 && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 ui-surface-deep p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 ui-text-sage" />
                  <h3 className="text-sm font-bold ui-text-primary">
                    {tr(
                      lang,
                      `Holding-Period Tax Reduction Timeline (${selectedCountry.name})`,
                      `Шкала снижения налога за срок владения (${selectedCountry.name})`
                    )}
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedCountry.holdingPeriodDiscounts.map((tier, idx) => {
                    const isBest =
                      idx === selectedCountry.holdingPeriodDiscounts!.length - 1;
                    return (
                      <div
                        key={tier.label}
                        className={`relative rounded-xl border p-3 ${
                          isBest
                            ? 'border-emerald-400/60 bg-emerald-500/10'
                            : 'ui-border-subtle ui-surface-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold ui-text-muted">
                            {tier.yearsMax === null
                              ? `≥ ${tier.yearsMin} ${tr(lang, 'Years', 'лет')}`
                              : `${tier.yearsMin}–${tier.yearsMax} ${tr(lang, 'Years', 'лет')}`}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full ui-surface-elevated px-2 py-0.5 text-[10px] font-bold ui-text-cool">
                            <BadgePercent className="h-3 w-3" />
                            {tier.exemptionPct}% {tr(lang, 'off', 'скидка')}
                          </span>
                        </div>
                        <p
                          className={`mt-1.5 font-mono text-xl font-extrabold tabular-nums ${
                            isBest ? 'ui-text-sage' : 'ui-text-primary'
                          }`}
                        >
                          {tier.effectiveTaxRatePct.toFixed(1)}%
                        </p>
                        <p className="mt-1 text-[11px] leading-snug ui-text-body">
                          {tier.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Filing Rules, Special Wrappers & Legal Warnings */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border ui-border-subtle ui-surface-deep p-4">
              <div className="flex items-center gap-2 text-sm font-bold ui-text-primary">
                <FileText className="h-4 w-4 ui-text-cool" />
                <span>{tr(lang, 'Tax Filing & Allowance Rules', 'Правила декларирования и льготы')}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-semibold ui-text-muted">
                    {tr(lang, 'Official Tax Declaration:', 'Официальная декларация:')}
                  </span>
                  <p className="mt-0.5 font-medium ui-text-primary">
                    {selectedCountry.taxDeclarationForm}
                  </p>
                </div>

                <div>
                  <span className="font-semibold ui-text-muted">
                    {tr(lang, 'Tax-Free Allowance Details:', 'Детали налоговых вычетов:')}
                  </span>
                  <p className="mt-0.5 leading-relaxed ui-text-body">
                    {selectedCountry.allowanceDescription}
                  </p>
                </div>

                {selectedCountry.specialWrapperName && (
                  <div className="rounded-lg border border-cyan-500/25 ui-tint-cool p-3">
                    <div className="flex items-center gap-1.5 font-semibold ui-text-cool">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{selectedCountry.specialWrapperName}</span>
                    </div>
                    <p className="mt-1 leading-relaxed ui-text-secondary">
                      {selectedCountry.specialWrapperDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-amber-500/25 ui-tint-sand p-4">
              <div className="flex items-center gap-2 text-sm font-bold ui-text-sand">
                <AlertOctagon className="h-4 w-4" />
                <span>
                  {tr(lang, 'Key Legal & Compliance Warnings', 'Важные юридические и налоговые нюансы')}
                </span>
              </div>
              <ul className="space-y-2 text-xs ui-text-secondary">
                {selectedCountry.keyLegalWarnings.map((warn) => (
                  <li
                    key={warn}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/20 ui-surface-deep p-2.5 leading-relaxed"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>

              {/* Recommended Local Portals */}
              <div className="pt-1">
                <p className="mb-2 text-xs font-semibold ui-text-body">
                  {tr(
                    lang,
                    `Recommended ${selectedCountry.name} Authorities & Guides`,
                    `Официальные порталы и гиды (${selectedCountry.name})`
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.recommendedPortals.map((portal) => (
                    <a
                      key={portal.name}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={portal.description}
                      className="inline-flex items-center gap-1.5 rounded-xl border ui-border-default ui-surface-card px-3 py-1.5 text-xs font-semibold ui-text-secondary transition ui-hover-elevated hover:border-emerald-500/50 hover:text-[var(--ui-accent-sage-text)]"
                    >
                      <span>{portal.name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Acc vs Dist Simulator */}
        <AccVsDistComparison country={selectedCountry} />

        {/* Tax Filing Toolkit: Deadlines, Portugal IRS Anexo J Sample & .ics Reminders */}
        <TaxFilingToolkit selectedCountry={selectedCountry} />
      </section>
    </div>
  );
};
