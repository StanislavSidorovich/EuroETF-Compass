import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  Landmark,
  Percent,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { CountryTaxRule, EuropeanBroker } from '../../types';

interface BrokerComparisonProps {
  brokers: EuropeanBroker[];
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
}

export const BrokerComparison: React.FC<BrokerComparisonProps> = ({
  brokers,
  countries,
  selectedCountryCode,
  onSelectCountry,
}) => {
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [onlyAutoTax, setOnlyAutoTax] = useState(false);
  const [onlyFreeSparplan, setOnlyFreeSparplan] = useState(false);
  const [onlyFractional, setOnlyFractional] = useState(false);

  const activeCountry = useMemo(
    () => countries.find((c) => c.code === selectedCountryCode) ?? countries[0],
    [countries, selectedCountryCode]
  );

  const filteredBrokers = useMemo(() => {
    return brokers.filter((broker) => {
      if (!showAllCountries && !broker.availableInCountries.includes(selectedCountryCode)) {
        return false;
      }
      if (onlyAutoTax && !broker.autoTaxCountries.includes(selectedCountryCode)) {
        return false;
      }
      if (
        onlyFreeSparplan &&
        !/^(€0|0%)/.test(broker.savingsPlanFee.trim())
      ) {
        return false;
      }
      if (onlyFractional && !broker.fractionalEtfs) {
        return false;
      }
      return true;
    });
  }, [brokers, showAllCountries, selectedCountryCode, onlyAutoTax, onlyFreeSparplan, onlyFractional]);

  const getCountryTaxNote = (broker: EuropeanBroker): { label: string; note: string } => {
    if (selectedCountryCode === 'PT') {
      return {
        label: '🇵🇹 Portugal IRS / Anexo J Note',
        note: broker.portugalTaxHelperNote,
      };
    }
    if (selectedCountryCode === 'DE' || selectedCountryCode === 'AT') {
      return {
        label: `${activeCountry.flag} ${activeCountry.name} Steuereinfach Note`,
        note: broker.germanyTaxNote,
      };
    }
    if (selectedCountryCode === 'NL') {
      return {
        label: '🇳🇱 Netherlands Box 3 Note',
        note: broker.netherlandsTaxNote,
      };
    }
    const hasAuto = broker.autoTaxCountries.includes(selectedCountryCode);
    return {
      label: `${activeCountry.flag} ${activeCountry.name} Tax Reporting`,
      note: hasAuto
        ? `${broker.name} offers direct local tax reporting or automatic withholding in ${activeCountry.name}.`
        : `${broker.name} provides downloadable annual activity/gain statements for manual filing on ${activeCountry.taxDeclarationForm}.`,
    };
  };

  return (
    <section className="fintech-card rounded-2xl p-5 sm:p-6">
      {/* Header & Country Filter */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              European UCITS ETF Broker Comparison Matrix
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Compare fees, €0 ETF Savings Plans (Sparpläne), fractional shares, and{' '}
            <span className="text-emerald-300 font-medium">
              Steuereinfach / local tax reporting
            </span>{' '}
            for your country.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="broker-country-select"
            className="text-xs font-semibold text-slate-300"
          >
            Investor Residence:
          </label>
          <select
            id="broker-country-select"
            value={selectedCountryCode}
            onChange={(e) => {
              onSelectCountry(e.target.value);
              setShowAllCountries(false);
            }}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </span>

        <button
          type="button"
          onClick={() => setShowAllCountries((prev) => !prev)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            !showAllCountries
              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          {showAllCountries
            ? 'Showing All EU Brokers'
            : `Available in ${activeCountry.flag} ${activeCountry.code}`}
        </button>

        <button
          type="button"
          onClick={() => setOnlyAutoTax((prev) => !prev)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            onlyAutoTax
              ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          Auto-Tax / Ready Report ({activeCountry.code})
        </button>

        <button
          type="button"
          onClick={() => setOnlyFreeSparplan((prev) => !prev)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            onlyFreeSparplan
              ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          €0 ETF Savings Plan (Sparplan)
        </button>

        <button
          type="button"
          onClick={() => setOnlyFractional((prev) => !prev)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            onlyFractional
              ? 'border-purple-400 bg-purple-500/15 text-purple-200'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
          }`}
        >
          Fractional ETFs Supported
        </button>
      </div>

      {/* Broker Cards */}
      {filteredBrokers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-center text-xs text-slate-400">
          No brokers match all active filters for {activeCountry.name}. Try disabling &ldquo;Auto-Tax
          Only&rdquo; or switching to &ldquo;All EU Brokers&rdquo;.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredBrokers.map((broker) => {
            const isAutoTaxInCountry = broker.autoTaxCountries.includes(selectedCountryCode);
            const isAvailableInCountry = broker.availableInCountries.includes(selectedCountryCode);
            const taxNote = getCountryTaxNote(broker);
            const isFreePlan = /^(€0|0%)/.test(broker.savingsPlanFee.trim());

            return (
              <article
                key={broker.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5 transition hover:border-slate-600"
              >
                <div className="space-y-3.5">
                  {/* Broker Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 font-mono text-sm font-extrabold text-emerald-300">
                        {broker.logoText}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{broker.name}</h3>
                        <p className="text-[11px] text-slate-400">{broker.headquarters}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {isAutoTaxInCountry && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <Sparkles className="h-3 w-3" />
                          {selectedCountryCode === 'DE' || selectedCountryCode === 'AT'
                            ? 'Steuereinfach'
                            : `Tax-Ready (${selectedCountryCode})`}
                        </span>
                      )}
                      {isFreePlan && (
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          €0 Sparplan
                        </span>
                      )}
                      {!isAvailableInCountry && (
                        <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                          Not in {selectedCountryCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Country-Specific Tax Helper Callout */}
                  <div
                    className={`rounded-xl border p-3 text-xs ${
                      isAutoTaxInCountry
                        ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-100'
                        : 'border-slate-800 bg-slate-900/75 text-slate-200'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-300">
                      <Landmark className="h-3.5 w-3.5" />
                      <span>{taxNote.label}</span>
                    </div>
                    <p className="leading-relaxed">{taxNote.note}</p>
                  </div>

                  {/* Fee & Feature Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        ETF Commission
                      </span>
                      <p className="mt-0.5 font-medium text-slate-100">{broker.etfCommission}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        Savings Plan (Min €{broker.minMonthlySparplanEur})
                      </span>
                      <p className="mt-0.5 font-medium text-cyan-300">{broker.savingsPlanFee}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                        <Percent className="h-3 w-3" /> FX Conversion Fee
                      </span>
                      <p className="mt-0.5 font-medium text-slate-100">{broker.fxFee}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        UCITS ETFs &amp; Fractional
                      </span>
                      <p className="mt-0.5 font-mono font-medium text-slate-100">
                        ~{broker.ucitsEtfCount.toLocaleString()} ETFs •{' '}
                        {broker.fractionalEtfs ? 'Fractional Yes' : 'Whole Shares'}
                      </p>
                    </div>
                  </div>

                  {/* Regulation & Cash Interest */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span>
                      <strong className="text-slate-200">Regulated:</strong> {broker.regulation}
                    </span>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Pros
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {broker.pros.map((pro) => (
                          <li key={pro} className="flex items-start gap-1.5">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-400">
                        Watch-outs
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {broker.cons.map((con) => (
                          <li key={con} className="flex items-start gap-1.5">
                            <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {broker.comparisonReviewLinks.map((rev) => (
                      <a
                        key={rev.portalName}
                        href={rev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                      >
                        <span>{rev.portalName}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>

                  <a
                    href={broker.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    <span>Visit {broker.logoText}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
