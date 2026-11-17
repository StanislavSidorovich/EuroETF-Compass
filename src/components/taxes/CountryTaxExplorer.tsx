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
import type { AccVsDistVerdict, CountryTaxRule } from '../../types';
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

const REGION_FILTERS: Array<{ id: RegionFilter; label: string }> = [
  { id: 'All', label: 'All 15 Countries' },
  { id: 'Featured Core', label: 'Featured Core' },
  { id: 'Western Europe', label: 'Western Europe' },
  { id: 'DACH', label: 'DACH' },
  { id: 'Southern Europe', label: 'Southern Europe' },
  { id: 'Central & Eastern Europe', label: 'Central & Eastern Europe' },
  { id: 'Nordics & UK', label: 'Nordics & UK' },
];

function getVerdictBadgeStyle(verdict: AccVsDistVerdict): {
  label: string;
  className: string;
} {
  switch (verdict) {
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return {
        label: 'Acc Wins + Holding Discount',
        className: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
      };
    case 'ACC_STRONGLY_PREFERRED':
      return {
        label: 'Acc Strongly Preferred',
        className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
      };
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
      return {
        label: 'Dist Up to Allowance, Then Acc',
        className: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
      };
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return {
        label: 'Acc Preferred (Check Registry)',
        className: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300',
      };
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return {
        label: 'Tax Parity (Acc Convenience)',
        className: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300',
      };
  }
}

export const CountryTaxExplorer: React.FC<CountryTaxExplorerProps> = ({
  countries,
  selectedCountryCode,
  onSelectCountry,
}) => {
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

  const verdictBadge = getVerdictBadgeStyle(selectedCountry.verdict);

  return (
    <div className="space-y-6">
      {/* Interactive SVG Map of Europe */}
      <EuropeTaxMap
        countries={countries}
        selectedCountryCode={selectedCountry.code}
        onSelectCountry={onSelectCountry}
      />

      {/* Top Featured Priority Cards (PT, NL, DE) */}
      <section aria-label="Featured priority European countries">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Featured Priority Jurisdictions (Portugal, Netherlands &amp; Germany)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click any card to inspect legal filings &amp; Acc vs Dist tax math
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {featuredCountries.map((country) => {
            const isSelected = country.code === selectedCountry.code;
            const badge = getVerdictBadgeStyle(country.verdict);
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => onSelectCountry(country.code)}
                className={`fintech-card flex flex-col justify-between rounded-2xl p-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-400/70 ring-2 ring-emerald-500/35'
                    : 'hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <h3 className="text-base font-bold text-white">{country.name}</h3>
                        <span className="font-mono text-[11px] text-slate-400">
                          {country.code} • {country.regionGroup}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs font-semibold text-slate-100">
                    {country.verdictTitle}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-[11px]">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-cyan-300">
                    Eff. {country.effectiveEquityEtfTaxRatePct}%
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
                      ? 'bg-emerald-500 text-slate-950'
                      : 'border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {region.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country, Box 3, Anexo J, PEA..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pr-3 pl-8 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filteredCountries.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">
              No European jurisdictions match &ldquo;{searchQuery}&rdquo;.
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
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40'
                      : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">
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
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-3xl">{selectedCountry.flag}</span>
                <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                  {selectedCountry.name} ({selectedCountry.code})
                </h2>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  {selectedCountry.regionGroup}
                </span>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-bold ${verdictBadge.className}`}
                >
                  {verdictBadge.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-300">
                {selectedCountry.verdictTitle}
              </p>
              <p className="max-w-4xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                {selectedCountry.verdictSummary}
              </p>
            </div>

            <a
              href={selectedCountry.localAuthorityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <Landmark className="h-4 w-4" />
              <span>{selectedCountry.localAuthorityName}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* 4 Headline Metric Tiles */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <span className="text-[11px] font-medium text-slate-400">
                Headline Capital Gains Tax
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-white">
                {selectedCountry.capitalGainsTaxRatePct}%
              </p>
              <span className="text-[11px] text-slate-400">Statutory rate on realized gains</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <span className="text-[11px] font-medium text-slate-400">
                Headline Dividend Tax
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-amber-300">
                {selectedCountry.dividendTaxRatePct}%
              </p>
              <span className="text-[11px] text-slate-400">Applies to Distributing cash payouts</span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
              <span className="text-[11px] font-medium text-emerald-300">
                Effective Equity ETF Rate
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-emerald-300">
                {selectedCountry.effectiveEquityEtfTaxRatePct}%
              </p>
              <span className="text-[11px] text-emerald-200/75">
                After local exemptions / holding tiers
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
              <span className="text-[11px] font-medium text-slate-400">
                Annual Tax-Free Allowance
              </span>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-cyan-300">
                {selectedCountry.annualTaxFreeAllowanceEur > 0
                  ? `€${selectedCountry.annualTaxFreeAllowanceEur.toLocaleString('en-IE')}`
                  : '€0'}
              </p>
              <span className="text-[11px] text-slate-400">
                {selectedCountry.annualTaxFreeAllowanceEur > 0
                  ? 'Annual tax-exempt base / wrapper'
                  : 'See special wrappers or holding tiers'}
              </span>
            </div>
          </div>

          {/* Holding Period Discount Step Timeline (Portugal Lei n.º 31/2024, Czechia 3Y Test) */}
          {selectedCountry.holdingPeriodDiscounts &&
            selectedCountry.holdingPeriodDiscounts.length > 0 && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-slate-950/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Holding-Period Tax Reduction Timeline ({selectedCountry.name})
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
                            : 'border-slate-800 bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {tier.yearsMax === null
                              ? `≥ ${tier.yearsMin} Years`
                              : `${tier.yearsMin}–${tier.yearsMax} Years`}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            <BadgePercent className="h-3 w-3" />
                            {tier.exemptionPct}% off
                          </span>
                        </div>
                        <p
                          className={`mt-1.5 font-mono text-xl font-extrabold tabular-nums ${
                            isBest ? 'text-emerald-300' : 'text-white'
                          }`}
                        >
                          {tier.effectiveTaxRatePct.toFixed(1)}%
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-slate-300">
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
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Tax Filing &amp; Allowance Rules</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-semibold text-slate-400">Official Tax Declaration:</span>
                  <p className="mt-0.5 font-medium text-slate-100">
                    {selectedCountry.taxDeclarationForm}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-400">Tax-Free Allowance Details:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-300">
                    {selectedCountry.allowanceDescription}
                  </p>
                </div>

                {selectedCountry.specialWrapperName && (
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/20 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{selectedCountry.specialWrapperName}</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-slate-200">
                      {selectedCountry.specialWrapperDetails}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-amber-500/25 bg-amber-950/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <AlertOctagon className="h-4 w-4" />
                <span>Key Legal &amp; Compliance Warnings</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {selectedCountry.keyLegalWarnings.map((warn) => (
                  <li
                    key={warn}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-slate-950/60 p-2.5 leading-relaxed"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>

              {/* Recommended Local Portals */}
              <div className="pt-1">
                <p className="mb-2 text-xs font-semibold text-slate-300">
                  Recommended {selectedCountry.name} Authorities &amp; Guides
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.recommendedPortals.map((portal) => (
                    <a
                      key={portal.name}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={portal.description}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-300"
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
