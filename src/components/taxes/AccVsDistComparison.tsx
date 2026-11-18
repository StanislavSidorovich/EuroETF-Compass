import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Coins,
  PiggyBank,
  Scale,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import type { CountryTaxRule } from '../../types';
import { getApplicableExitTaxRatePct } from '../../utils/investmentMath';

interface AccVsDistComparisonProps {
  country: CountryTaxRule;
}

const HOLDING_OPTIONS = [3, 5, 8, 10, 15] as const;
type HoldingYearsOption = (typeof HOLDING_OPTIONS)[number];

interface SimOutcome {
  grossFinalEur: number;
  netAccEur: number;
  netDistEur: number;
  taxPaidAccEur: number;
  taxPaidDistEur: number;
  accAdvantageEur: number;
  appliedExitRatePct: number;
  countrySpecificMechanism: string;
}

function formatEur(val: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Educational annual-step simulator illustrating how Acc vs Dist tax timing affects compounding
 * under the selected country's statutory rules (7.5% total return = 5.65% price + 1.85% dividend).
 */
function simulateCountryAccVsDist(
  country: CountryTaxRule,
  portfolioEur: number,
  years: number
): SimOutcome {
  const priceReturn = 0.0565;
  const divYield = 0.0185;
  const totalReturn = (1 + priceReturn) * (1 + divYield) - 1;
  const appliedExitRatePct = getApplicableExitTaxRatePct(country, years, true);
  const exitRate = appliedExitRatePct / 100;
  const divTaxRate = Math.max(0, country.dividendTaxRatePct) / 100;
  const allowance = Math.max(0, country.annualTaxFreeAllowanceEur);
  const statutoryRate = Math.max(0, country.capitalGainsTaxRatePct) / 100;

  let grossVal = portfolioEur;
  let accVal = portfolioEur;
  let accBasis = portfolioEur;
  let accAnnualTaxPaid = 0;

  let distVal = portfolioEur;
  let distBasis = portfolioEur;
  let distAnnualTaxPaid = 0;

  // Box 3 effective wealth tax rate (~2.16% above €57k) or Sweden ISK (~1.0% above €13k)
  const nlOrSeAnnualRate =
    country.code === 'NL' || country.code === 'SE'
      ? (country.effectiveEquityEtfTaxRatePct > 0
          ? country.effectiveEquityEtfTaxRatePct
          : 1.5) / 100
      : 0;

  for (let y = 1; y <= years; y += 1) {
    const accStart = accVal;
    grossVal = grossVal * (1 + totalReturn);
    accVal = accVal * (1 + totalReturn);

    // Distributing: price grows, dividend paid out and taxed annually
    const distBeforeDiv = distVal * (1 + priceReturn);
    const grossDiv = distBeforeDiv * divYield;
    let distTaxThisYear = 0;

    if (country.code === 'NL' || country.code === 'SE') {
      const taxableWealthAcc = Math.max(0, accVal - allowance);
      const taxableWealthDist = Math.max(0, distBeforeDiv + grossDiv - allowance);
      const taxAcc = taxableWealthAcc * nlOrSeAnnualRate;
      const taxDist = taxableWealthDist * nlOrSeAnnualRate;
      accVal = Math.max(0, accVal - taxAcc);
      accAnnualTaxPaid += taxAcc;
      distTaxThisYear = taxDist;
    } else if (country.code === 'DE') {
      const afterTeilfreistellung = grossDiv * 0.7;
      const taxableDiv = Math.max(0, afterTeilfreistellung - allowance);
      distTaxThisYear = taxableDiv * statutoryRate;
    } else if (country.code === 'IE') {
      distTaxThisYear = grossDiv * 0.41;
    } else {
      const taxableDiv = Math.max(0, grossDiv - allowance);
      distTaxThisYear = taxableDiv * divTaxRate;
    }

    distAnnualTaxPaid += distTaxThisYear;
    const netReinvestedDiv = Math.max(0, grossDiv - distTaxThisYear);
    distVal = distBeforeDiv + netReinvestedDiv;
    distBasis += netReinvestedDiv;

    // Annual imputed tax on Acc where applicable
    if (country.archetype === 'IMPUTED_ANNUAL_TAX_HYBRID') {
      if (country.code === 'DE') {
        const gainThisYear = Math.max(0, accVal - accStart);
        const vorabBase = Math.min(gainThisYear, accStart * 0.0229 * 0.7);
        const taxableVorab = Math.max(0, vorabBase * 0.7 - allowance);
        const vorabTax = taxableVorab * statutoryRate;
        accVal = Math.max(0, accVal - vorabTax);
        accAnnualTaxPaid += vorabTax;
        accBasis += vorabBase;
      } else if (country.code === 'AT') {
        const deemedIncome = accStart * divYield * 0.6;
        const kest = deemedIncome * exitRate;
        accVal = Math.max(0, accVal - kest);
        accAnnualTaxPaid += kest;
        accBasis += deemedIncome;
      } else if (country.code === 'CH') {
        const virtualDiv = accStart * divYield;
        const chTax = Math.max(0, virtualDiv - allowance) * divTaxRate;
        accVal = Math.max(0, accVal - chTax);
        accAnnualTaxPaid += chTax;
      } else {
        const eriDiv = accStart * divYield;
        const eriTax = Math.max(0, eriDiv - allowance) * divTaxRate;
        accVal = Math.max(0, accVal - eriTax);
        accAnnualTaxPaid += eriTax;
        accBasis += eriDiv;
      }
    } else if (country.code === 'IE' && y % 8 === 0 && y < years) {
      // 8-year Deemed Disposal on Acc & Dist
      const accDeemed = Math.max(0, accVal - accBasis) * 0.41;
      accVal = Math.max(0, accVal - accDeemed);
      accAnnualTaxPaid += accDeemed;
      accBasis = accVal;

      const distDeemed = Math.max(0, distVal - distBasis) * 0.41;
      distVal = Math.max(0, distVal - distDeemed);
      distAnnualTaxPaid += distDeemed;
      distBasis = distVal;
    }
  }

  // Final exit tax upon liquidation at year `years`
  let accExitTax = 0;
  let distExitTax = 0;

  if (country.code !== 'NL' && country.code !== 'SE' && country.code !== 'CH') {
    const accGain = Math.max(0, accVal - accBasis);
    const distGain = Math.max(0, distVal - distBasis);
    if (country.code === 'DE') {
      accExitTax = Math.max(0, accGain * 0.7 - allowance) * statutoryRate;
      distExitTax = Math.max(0, distGain * 0.7 - allowance) * statutoryRate;
    } else if (country.code === 'BE' || country.code === 'GB') {
      accExitTax = Math.max(0, accGain - allowance) * exitRate;
      distExitTax = Math.max(0, distGain - allowance) * exitRate;
    } else {
      accExitTax = accGain * exitRate;
      distExitTax = distGain * exitRate;
    }
  }

  const netAccEur = accVal - accExitTax;
  const netDistEur = distVal - distExitTax;
  const taxPaidAccEur = accAnnualTaxPaid + accExitTax;
  const taxPaidDistEur = distAnnualTaxPaid + distExitTax;

  let countrySpecificMechanism = `Acc compounds gross dividends tax-deferred until final sale at ${appliedExitRatePct.toFixed(1)}% effective tax.`;
  if (country.code === 'PT') {
    countrySpecificMechanism =
      years > 8
        ? 'Lei n.º 31/2024 (>8Y): Acc converts all reinvested dividends into long-term gains taxed at 19.6% (30% exclusion), whereas Dist pays 28% IRS annually on every dividend!'
        : `Lei n.º 31/2024 (${years}Y): Acc defers annual 28% dividend tax and unlocks the ${appliedExitRatePct.toFixed(1)}% holding-period capital gains rate (19.6% once held >8 years).`;
  } else if (country.code === 'DE') {
    countrySpecificMechanism =
      'Germany: €1,000 Sparerpauschbetrag + 30% Teilfreistellung (18.46% effective rate). Dist uses your annual €1,000 allowance automatically; Acc is subject to Vorabpauschale.';
  } else if (country.code === 'NL') {
    countrySpecificMechanism =
      'Netherlands Box 3: Annual wealth tax (~2.16% above €57,000 exemption) taxes Acc and Dist identically on Jan 1 value. Acc wins on effortless zero-fee reinvestment.';
  } else if (country.code === 'IE') {
    countrySpecificMechanism =
      'Ireland: 41% Exit Tax + 8-Year Deemed Disposal. Acc defers dividend tax during Years 1–7, whereas Dist suffers 41% tax on dividends every single year.';
  } else if (country.code === 'CZ') {
    countrySpecificMechanism =
      years >= 3
        ? 'Czechia 3-Year Time Test (Časový test): Acc gains become 100% TAX-FREE (0%) after 3 years, while Dist dividends are still taxed at 15% annually!'
        : 'Hold ≥ 3 years in Czechia to unlock 0% capital gains tax on Acc ETFs.';
  }

  return {
    grossFinalEur: Math.round(grossVal),
    netAccEur: Math.round(netAccEur),
    netDistEur: Math.round(netDistEur),
    taxPaidAccEur: Math.round(taxPaidAccEur),
    taxPaidDistEur: Math.round(taxPaidDistEur),
    accAdvantageEur: Math.round(netAccEur - netDistEur),
    appliedExitRatePct,
    countrySpecificMechanism,
  };
}

export const AccVsDistComparison: React.FC<AccVsDistComparisonProps> = ({ country }) => {
  const [portfolioSize, setPortfolioSize] = useState<number>(25000);
  const [holdingYears, setHoldingYears] = useState<HoldingYearsOption>(10);

  const sim = useMemo(
    () => simulateCountryAccVsDist(country, portfolioSize, holdingYears),
    [country, portfolioSize, holdingYears]
  );

  const maxBar = Math.max(sim.grossFinalEur, sim.netAccEur, sim.netDistEur, 1);
  const accLeads = sim.accAdvantageEur >= 0;

  return (
    <div className="fintech-card rounded-2xl p-5">
      <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 ui-text-sage" />
            <h3 className="text-base font-bold ui-text-primary sm:text-lg">
              {country.flag} Accumulating (Acc) vs. Distributing (Dist) Tax Simulator —{' '}
              {country.name}
            </h3>
          </div>
          <p className="mt-1 text-xs ui-text-muted">
            Interactive compounding &amp; tax-drag illustration (assumes 7.5%/yr gross return: 5.65%
            price growth + 1.85% dividend yield).
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold ui-text-sage">
          <Award className="h-3.5 w-3.5" />
          {country.verdict === 'DIST_UP_TO_ALLOWANCE_THEN_ACC'
            ? 'Hybrid: Dist up to €1k, then Acc'
            : accLeads
              ? `Acc Wins by +${formatEur(sim.accAdvantageEur)}`
              : 'Allowance / Parity Regime'}
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="mt-4 grid gap-4 rounded-xl border ui-border-subtle ui-surface-deep p-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold ui-text-body">
              <SlidersHorizontal className="h-3.5 w-3.5 ui-text-cool" />
              Simulated Portfolio Size
            </span>
            <span className="font-mono text-sm font-bold tabular-nums ui-text-primary">
              {formatEur(portfolioSize)}
            </span>
          </div>
          <input
            type="range"
            aria-label="Simulated portfolio size in euros"
            min={10000}
            max={100000}
            step={5000}
            value={portfolioSize}
            onChange={(e) => setPortfolioSize(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg ui-surface-elevated accent-emerald-400"
          />
          <div className="mt-1.5 flex justify-between font-mono text-[10px] ui-text-subtle">
            <span>€10,000</span>
            <span>€25,000</span>
            <span>€50,000</span>
            <span>€100,000</span>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold ui-text-body">
            Holding Horizon (Tests Holding-Period Discounts &amp; Compounding)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {HOLDING_OPTIONS.map((yr) => {
              const active = holdingYears === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setHoldingYears(yr)}
                  className={`rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition ${
                    active
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'border ui-border-default ui-surface-card ui-text-body ui-hover-elevated hover:text-[var(--ui-text-primary)]'
                  }`}
                >
                  {yr}Y
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] ui-text-cool">{sim.countrySpecificMechanism}</p>
        </div>
      </div>

      {/* Visual Bar Comparison */}
      <div className="mt-4 space-y-3 rounded-xl border ui-border-subtle ui-surface-card p-4">
        {[
          {
            label: 'Gross Portfolio (0% Tax Theoretical Benchmark)',
            value: sim.grossFinalEur,
            taxText: '€0 tax',
            barClass: 'bg-slate-500',
            textClass: 'ui-text-body',
          },
          {
            label: `Accumulating (Acc) — Net After ${country.name} Tax`,
            value: sim.netAccEur,
            taxText: `Est. tax: ${formatEur(sim.taxPaidAccEur)}`,
            barClass: 'bg-gradient-to-r from-emerald-500 to-teal-400',
            textClass: 'ui-text-sage',
          },
          {
            label: `Distributing (Dist) — Net After ${country.name} Tax (Reinvested)`,
            value: sim.netDistEur,
            taxText: `Est. tax: ${formatEur(sim.taxPaidDistEur)}`,
            barClass: 'bg-gradient-to-r from-amber-500 to-amber-400',
            textClass: 'ui-text-sand',
          },
        ].map((row) => {
          const widthPct = Math.max(8, Math.round((row.value / maxBar) * 100));
          return (
            <div key={row.label} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium ui-text-secondary">{row.label}</span>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-[11px] ui-text-muted">{row.taxText}</span>
                  <span className={`font-bold ${row.textClass}`}>{formatEur(row.value)}</span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full ui-surface-elevated">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${row.barClass}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t ui-border-subtle pt-3 text-xs">
          <div className="flex items-center gap-1.5 ui-text-body">
            <TrendingUp className="h-4 w-4 ui-text-sage" />
            <span>
              Applied Exit Tax Rate at <strong className="ui-text-primary">{holdingYears}Y</strong>:{' '}
              <strong className="font-mono ui-text-sage">
                {sim.appliedExitRatePct.toFixed(2)}%
              </strong>
            </span>
          </div>
          <div className="font-mono text-xs font-bold tabular-nums">
            {sim.accAdvantageEur > 0 ? (
              <span className="ui-text-sage">
                Acc Extra Net Wealth Kept: +{formatEur(sim.accAdvantageEur)}
              </span>
            ) : sim.accAdvantageEur < 0 ? (
              <span className="ui-text-sand">
                Dist Allowance Edge: +{formatEur(Math.abs(sim.accAdvantageEur))}
              </span>
            ) : (
              <span className="ui-text-cool">
                Tax Parity (Acc preferred for €0 fee auto-reinvestment)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Statutory Rules */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 ui-tint-sage p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold ui-text-sage">
              <PiggyBank className="h-4 w-4" />
              Accumulating (Acc) Rule in {country.name}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase ui-text-sage">
              Auto-Reinvested
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed ui-text-secondary">
            {country.accumulatingTaxRule}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium ui-text-sage">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Zero broker commission or bid-ask spread on dividend reinvestment</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 ui-tint-sand p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold ui-text-sand">
              <Coins className="h-4 w-4" />
              Distributing (Dist) Rule in {country.name}
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase ui-text-sand">
              Cash Payouts
            </span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed ui-text-secondary">
            {country.distributingTaxRule}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium ui-text-sand">
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span>
              Dividends paid as cash; manual reinvestment required outside automated DRIP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
