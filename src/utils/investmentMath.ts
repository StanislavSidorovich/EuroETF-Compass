import type {
  BacktestPeriodMetrics,
  ChartTimelinePoint,
  CountryTaxRule,
  ETFInstrument,
  ForecastHorizonSummary,
  FullCalculationOutput,
  HistoricalPricePoint,
  LiveQuoteData,
  PortfolioAllocationItem,
} from '../types';

export interface CalculationInput {
  allocations: PortfolioAllocationItem[];
  etfs: ETFInstrument[];
  quotesByEtfId?: Record<string, LiveQuoteData>;
  country: CountryTaxRule;
  initialBudgetEur: number;
  monthlyContributionEur: number;
}

interface NormalizedPortfolioItem {
  etf: ETFInstrument;
  weight: number; // Normalized 0..1 summing to 1
  history: HistoricalPricePoint[];
}

interface AlignedPortfolioSeries {
  dates: string[];
  unitCurve: number[]; // Normalized growth of 1.0 EUR over the aligned monthly timeline
}

interface TaxSimulationResult {
  grossFinalEur: number;
  netFinalAccEur: number;
  taxDragAccEur: number;
  netFinalDistEur: number;
  taxDragDistEur: number;
  effectiveExitRatePct: number;
  monthlyGrossCurve: number[];
  monthlyDistNetCurve: number[];
  monthlyInvestedCurve: number[];
}

function round2(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function normalizePortfolioItems(
  allocations: PortfolioAllocationItem[],
  etfs: ETFInstrument[],
  quotesByEtfId?: Record<string, LiveQuoteData>
): NormalizedPortfolioItem[] {
  const etfById = new Map(etfs.map((e) => [e.id, e]));
  const validEntries: Array<{ etf: ETFInstrument; rawWeight: number }> = [];

  for (const alloc of allocations) {
    const etf = etfById.get(alloc.etfId);
    if (etf && alloc.weightPct > 0) {
      validEntries.push({ etf, rawWeight: alloc.weightPct });
    }
  }

  if (validEntries.length === 0 && etfs.length > 0) {
    validEntries.push({ etf: etfs[0], rawWeight: 100 });
  }

  const totalRawWeight = validEntries.reduce((sum, item) => sum + item.rawWeight, 0) || 1;

  return validEntries.map((item) => {
    const liveHist = quotesByEtfId?.[item.etf.id]?.history5Y;
    const history =
      liveHist && liveHist.length >= 6 ? liveHist : item.etf.baselineHistory5Y;

    const sortedMonthly = deduplicateMonthlySeries(history);
    return {
      etf: item.etf,
      weight: item.rawWeight / totalRawWeight,
      history: sortedMonthly,
    };
  });
}

function deduplicateMonthlySeries(series: HistoricalPricePoint[]): HistoricalPricePoint[] {
  const byMonth = new Map<string, HistoricalPricePoint>();
  const sorted = [...series]
    .filter((p) => Number.isFinite(p.close) && p.close > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const point of sorted) {
    const monthKey = point.date.slice(0, 7);
    byMonth.set(monthKey, point);
  }

  return Array.from(byMonth.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Aligns monthly historical curves across weighted ETFs using calendar YYYY-MM overlap
 * when >= 24 common months exist, or trailing relative month index when mixing live & baseline snapshots.
 */
function alignPortfolioSeries(items: NormalizedPortfolioItem[]): AlignedPortfolioSeries {
  if (items.length === 0) {
    return { dates: ['2021-11-01', '2026-11-01'], unitCurve: [1, 1] };
  }

  if (items.length === 1) {
    const hist = items[0].history;
    if (hist.length < 2) {
      return { dates: ['2021-11-01', '2026-11-01'], unitCurve: [1, 1] };
    }
    const base = hist[0].close;
    return {
      dates: hist.map((p) => p.date),
      unitCurve: hist.map((p) => (base > 0 ? p.close / base : 1)),
    };
  }

  // Check overlapping calendar YYYY-MM keys across all active ETFs
  const monthMaps = items.map((item) => {
    const map = new Map<string, HistoricalPricePoint>();
    for (const pt of item.history) {
      map.set(pt.date.slice(0, 7), pt);
    }
    return map;
  });

  const firstMonths = Array.from(monthMaps[0].keys());
  const commonMonths = firstMonths
    .filter((m) => monthMaps.every((map) => map.has(m)))
    .sort();

  const useCalendarAlignment = commonMonths.length >= 24;
  const minLength = Math.min(...items.map((item) => item.history.length));

  const length = useCalendarAlignment ? commonMonths.length : minLength;
  if (length < 2) {
    return { dates: ['2021-11-01', '2026-11-01'], unitCurve: [1, 1] };
  }

  const dates: string[] = [];
  const unitCurve: number[] = [1];

  const getPoint = (itemIdx: number, stepIdx: number): HistoricalPricePoint => {
    if (useCalendarAlignment) {
      return monthMaps[itemIdx].get(commonMonths[stepIdx])!;
    }
    const hist = items[itemIdx].history;
    const offset = hist.length - length;
    return hist[offset + stepIdx];
  };

  dates.push(getPoint(0, 0).date);

  for (let t = 1; t < length; t += 1) {
    let blendedMonthlyReturn = 0;
    for (let k = 0; k < items.length; k += 1) {
      const prevPrice = getPoint(k, t - 1).close;
      const currPrice = getPoint(k, t).close;
      const r = prevPrice > 0 ? currPrice / prevPrice - 1 : 0;
      blendedMonthlyReturn += items[k].weight * r;
    }
    dates.push(getPoint(0, t).date);
    unitCurve.push(unitCurve[t - 1] * (1 + blendedMonthlyReturn));
  }

  return { dates, unitCurve };
}

function computeTimeWeightedCagrPct(unitCurve: number[], monthsWindow: number): number {
  if (unitCurve.length < 2) return 0;
  const startIdx = Math.max(0, unitCurve.length - 1 - monthsWindow);
  const intervals = unitCurve.length - 1 - startIdx;
  if (intervals <= 0) return 0;

  const startVal = unitCurve[startIdx];
  const endVal = unitCurve[unitCurve.length - 1];
  if (startVal <= 0 || endVal <= 0) return 0;

  const years = intervals / 12;
  return (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
}

function computeRealizedVolatilityPct(unitCurve: number[], fallbackPct: number): number {
  if (unitCurve.length < 13) return fallbackPct;
  const monthlyReturns: number[] = [];
  for (let i = 1; i < unitCurve.length; i += 1) {
    if (unitCurve[i - 1] > 0 && unitCurve[i] > 0) {
      monthlyReturns.push(unitCurve[i] / unitCurve[i - 1] - 1);
    }
  }
  if (monthlyReturns.length < 12) return fallbackPct;

  const mean = monthlyReturns.reduce((s, r) => s + r, 0) / monthlyReturns.length;
  const variance =
    monthlyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (monthlyReturns.length - 1);
  const annualized = Math.sqrt(variance) * Math.sqrt(12) * 100;
  return Math.max(0.4, annualized);
}

/**
 * Positive magnitude in % (e.g. 18.4 represents a -18.4% peak-to-trough decline).
 */
function computeMaxDrawdownPct(unitSubCurve: number[]): number {
  if (unitSubCurve.length < 2) return 0;
  let peak = unitSubCurve[0];
  let maxDd = 0;

  for (let i = 1; i < unitSubCurve.length; i += 1) {
    const val = unitSubCurve[i];
    if (val > peak) {
      peak = val;
    } else if (peak > 0) {
      const dd = ((peak - val) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }
  }

  return maxDd;
}

/**
 * Solves exact annualized Money-Weighted Return (IRR) via bisection for an initial lump sum at t=0
 * followed by `months` monthly contributions at t=1..months ending at `finalValue`.
 */
function computeMoneyWeightedCagrPct(
  initialOutflow: number,
  monthlyOutflow: number,
  months: number,
  finalValue: number
): number {
  if (months <= 0) return 0;
  const totalOutflow = initialOutflow + monthlyOutflow * months;
  if (totalOutflow <= 0) return 0;
  if (finalValue <= 0) return -100;

  if (monthlyOutflow === 0 && initialOutflow > 0) {
    const years = months / 12;
    return (Math.pow(finalValue / initialOutflow, 1 / years) - 1) * 100;
  }

  const futureValueAtRate = (rMonth: number): number => {
    const growthFactor = 1 + rMonth;
    let fv = initialOutflow * Math.pow(growthFactor, months);
    for (let t = 1; t <= months; t += 1) {
      fv += monthlyOutflow * Math.pow(growthFactor, months - t);
    }
    return fv;
  };

  let low = -0.25;
  let high = 0.25;
  for (let iter = 0; iter < 60; iter += 1) {
    const mid = (low + high) / 2;
    if (futureValueAtRate(mid) > finalValue) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const monthlyIrr = (low + high) / 2;
  return (Math.pow(1 + monthlyIrr, 12) - 1) * 100;
}

export function getApplicableExitTaxRatePct(
  country: CountryTaxRule,
  holdingYears: number,
  isEquityMajority: boolean
): number {
  if (country.holdingPeriodDiscounts && country.holdingPeriodDiscounts.length > 0) {
    const sortedTiers = [...country.holdingPeriodDiscounts].sort((a, b) => a.yearsMin - b.yearsMin);
    const matched = sortedTiers.find(
      (tier) =>
        holdingYears >= tier.yearsMin &&
        (tier.yearsMax === null || holdingYears < tier.yearsMax)
    );
    if (matched) {
      return matched.effectiveTaxRatePct;
    }
    // Holding period shorter than the first discount threshold pays standard statutory rate.
    return country.capitalGainsTaxRatePct;
  }

  return isEquityMajority ? country.effectiveEquityEtfTaxRatePct : country.capitalGainsTaxRatePct;
}

/**
 * Simulates month-by-month portfolio growth and country-specific Acc vs Dist tax drag
 * along an arbitrary unit total-return curve (historical or projected).
 */
function simulateStrategyTaxPath(params: {
  unitSubCurve: number[];
  initialBudgetEur: number;
  monthlyContributionEur: number;
  annualDividendYieldPct: number;
  country: CountryTaxRule;
  isEquityMajority: boolean;
  holdingYearsForExitRate: number;
}): TaxSimulationResult {
  const {
    unitSubCurve,
    initialBudgetEur,
    monthlyContributionEur,
    annualDividendYieldPct,
    country,
    isEquityMajority,
    holdingYearsForExitRate,
  } = params;

  const months = Math.max(1, unitSubCurve.length - 1);
  const monthlyDivRate = clampNonNegative(annualDividendYieldPct) / 100 / 12;
  const exitRate = getApplicableExitTaxRatePct(country, holdingYearsForExitRate, isEquityMajority) / 100;
  const divTaxRate = clampNonNegative(country.dividendTaxRatePct) / 100;
  const annualAllowance = clampNonNegative(country.annualTaxFreeAllowanceEur);

  // Determine effective annual equity tax rate for Germany's Teilfreistellung vs statutory rate
  const equityTaxMultiplier =
    country.code === 'DE' && isEquityMajority
      ? 0.7
      : country.capitalGainsTaxRatePct > 0
        ? (isEquityMajority ? country.effectiveEquityEtfTaxRatePct : country.capitalGainsTaxRatePct) /
          country.capitalGainsTaxRatePct
        : 1;
  const statutoryRate = clampNonNegative(country.capitalGainsTaxRatePct) / 100;

  // Netherlands Box 3 annual wealth tax rate on net wealth above exemption
  const rawNlRate = country.effectiveEquityEtfTaxRatePct || country.capitalGainsTaxRatePct;
  const nlAnnualWealthRate = rawNlRate <= 6 ? rawNlRate / 100 : (rawNlRate / 100) * 0.0604;

  let grossVal = initialBudgetEur;
  let totalInvested = initialBudgetEur;

  let accVal = initialBudgetEur;
  let accCostBasis = initialBudgetEur;
  let accYearStartVal = initialBudgetEur;
  let accYearContrib = 0;
  let accAnnualTaxableDiv = 0;
  let accFinalYearAllowanceUsed = 0;

  let distVal = initialBudgetEur;
  let distCostBasis = initialBudgetEur;
  let distYearDividends = 0;
  let distFinalYearAllowanceUsed = 0;

  const monthlyGrossCurve: number[] = [grossVal];
  const monthlyDistNetCurve: number[] = [distVal];
  const monthlyInvestedCurve: number[] = [totalInvested];

  for (let t = 1; t <= months; t += 1) {
    const prevUnit = unitSubCurve[t - 1] > 0 ? unitSubCurve[t - 1] : 1;
    const totalReturnMonth = unitSubCurve[t] / prevUnit - 1;
    const priceReturnMonth = (1 + totalReturnMonth) / (1 + monthlyDivRate) - 1;

    // 1. Gross Total-Return Baseline
    grossVal = grossVal * (1 + totalReturnMonth) + monthlyContributionEur;
    totalInvested += monthlyContributionEur;

    // 2. Accumulating Strategy Monthly Evolution
    accVal = accVal * (1 + totalReturnMonth) + monthlyContributionEur;
    accCostBasis += monthlyContributionEur;
    accYearContrib += monthlyContributionEur;
    accAnnualTaxableDiv += accVal * monthlyDivRate;

    // 3. Distributing Strategy Monthly Evolution (price appreciation + cash dividend payout)
    distVal = distVal * (1 + priceReturnMonth);
    const grossCashDividend = distVal * monthlyDivRate;
    distYearDividends += grossCashDividend;
    // Reinvest gross cash dividend immediately; annual tax settles at year-end below
    distVal += grossCashDividend + monthlyContributionEur;
    distCostBasis += grossCashDividend + monthlyContributionEur;

    const isYearEnd = t % 12 === 0 || t === months;
    const yearNumber = Math.ceil(t / 12);
    const isFullYearBoundary = t % 12 === 0;

    if (isYearEnd) {
      let yearAccAllowanceUsed = 0;
      let yearDistAllowanceUsed = 0;

      // --- Annual Distributing Dividend Tax Settlement ---
      if (country.archetype === 'WEALTH_OR_DEEMED_DISPOSAL' && country.code === 'NL') {
        // Netherlands Box 3 taxes net assets above threshold annually (same for Acc & Dist)
        const taxableWealthAcc = Math.max(0, accVal - annualAllowance);
        const taxableWealthDist = Math.max(0, distVal - annualAllowance);
        const yearScale = isFullYearBoundary ? 1 : (t % 12) / 12;
        accVal = Math.max(0, accVal - taxableWealthAcc * nlAnnualWealthRate * yearScale);
        distVal = Math.max(0, distVal - taxableWealthDist * nlAnnualWealthRate * yearScale);
      } else {
        // Standard annual dividend tax on Distributing payouts
        let distAnnualTax = 0;
        if (country.code === 'DE') {
          const taxableAfterTeilfreistellung = distYearDividends * equityTaxMultiplier;
          yearDistAllowanceUsed = Math.min(annualAllowance, taxableAfterTeilfreistellung);
          distAnnualTax = Math.max(0, taxableAfterTeilfreistellung - annualAllowance) * statutoryRate;
        } else if (country.code === 'IE') {
          distAnnualTax = distYearDividends * (exitRate || 0.41);
        } else {
          yearDistAllowanceUsed = Math.min(annualAllowance, distYearDividends);
          const taxableDiv = Math.max(0, distYearDividends - annualAllowance);
          distAnnualTax = taxableDiv * divTaxRate;
        }

        if (distAnnualTax > 0) {
          distVal = Math.max(0, distVal - distAnnualTax);
          distCostBasis = Math.max(0, distCostBasis - distAnnualTax);
        }
      }

      // --- Annual Accumulating Tax Settlement (for Imputed / Deemed regimes) ---
      if (country.archetype === 'IMPUTED_ANNUAL_TAX_HYBRID') {
        if (country.code === 'DE') {
          // Germany Vorabpauschale: Basisertrag (~2.29% Basiszins * 0.7 = 1.603%), capped at actual annual gain
          const actualAnnualGain = Math.max(0, accVal - accYearStartVal - accYearContrib);
          const basisErtrag = accYearStartVal * 0.0229 * 0.7;
          const vorabGross = Math.min(actualAnnualGain, basisErtrag);
          if (vorabGross > 0) {
            const taxableVorab = vorabGross * equityTaxMultiplier;
            yearAccAllowanceUsed = Math.min(annualAllowance, taxableVorab);
            const vorabTax = Math.max(0, taxableVorab - annualAllowance) * statutoryRate;
            accVal = Math.max(0, accVal - vorabTax);
            // Assessed Vorabpauschale steps up cost basis so exit gain isn't double-taxed
            accCostBasis += vorabGross;
          }
        } else if (country.code === 'AT') {
          // Austria Meldefonds: 60% of AgE (~dividend equivalent) taxed annually at 27.5% KESt
          const ageTaxable = accAnnualTaxableDiv * 0.6;
          const annualKest = ageTaxable * exitRate;
          accVal = Math.max(0, accVal - annualKest);
          accCostBasis += ageTaxable;
        } else if (country.code === 'CH') {
          // Switzerland ICTax: virtual Acc dividends taxed as income annually; 0% CGT on exit
          yearAccAllowanceUsed = Math.min(annualAllowance, accAnnualTaxableDiv);
          const chDivTax = Math.max(0, accAnnualTaxableDiv - annualAllowance) * divTaxRate;
          accVal = Math.max(0, accVal - chDivTax);
        } else {
          // UK GIA ERI or other imputed annual dividend regimes
          yearAccAllowanceUsed = Math.min(annualAllowance, accAnnualTaxableDiv);
          const imputedTax = Math.max(0, accAnnualTaxableDiv - annualAllowance) * divTaxRate;
          accVal = Math.max(0, accVal - imputedTax);
          accCostBasis += accAnnualTaxableDiv;
        }
      } else if (
        country.archetype === 'WEALTH_OR_DEEMED_DISPOSAL' &&
        country.code === 'IE' &&
        isFullYearBoundary &&
        yearNumber % 8 === 0 &&
        t < months
      ) {
        // Ireland 8-Year Deemed Disposal on unrealized gains every 8th anniversary
        const accGain8Y = Math.max(0, accVal - accCostBasis);
        const accDeemedTax = accGain8Y * exitRate;
        accVal = Math.max(0, accVal - accDeemedTax);
        accCostBasis = accVal;

        const distGain8Y = Math.max(0, distVal - distCostBasis);
        const distDeemedTax = distGain8Y * exitRate;
        distVal = Math.max(0, distVal - distDeemedTax);
        distCostBasis = distVal;
      }

      if (t === months) {
        accFinalYearAllowanceUsed = yearAccAllowanceUsed;
        distFinalYearAllowanceUsed = yearDistAllowanceUsed;
      }

      accYearStartVal = accVal;
      accYearContrib = 0;
      accAnnualTaxableDiv = 0;
      distYearDividends = 0;
    }

    monthlyGrossCurve.push(grossVal);
    monthlyDistNetCurve.push(distVal);
    monthlyInvestedCurve.push(totalInvested);
  }

  // Final Exit Settlement upon liquidation at end of horizon
  let exitTaxAcc = 0;
  let exitTaxDist = 0;

  if (country.archetype === 'WEALTH_OR_DEEMED_DISPOSAL' && country.code === 'NL') {
    // Netherlands Box 3 has 0% realized capital gains exit tax
    exitTaxAcc = 0;
    exitTaxDist = 0;
  } else if (country.code === 'DE') {
    const accGain = Math.max(0, accVal - accCostBasis);
    const distGain = Math.max(0, distVal - distCostBasis);
    const remainingAccAllowance = Math.max(0, annualAllowance - accFinalYearAllowanceUsed);
    const remainingDistAllowance = Math.max(0, annualAllowance - distFinalYearAllowanceUsed);
    exitTaxAcc = Math.max(0, accGain * equityTaxMultiplier - remainingAccAllowance) * statutoryRate;
    exitTaxDist =
      Math.max(0, distGain * equityTaxMultiplier - remainingDistAllowance) * statutoryRate;
  } else {
    const accGain = Math.max(0, accVal - accCostBasis);
    const distGain = Math.max(0, distVal - distCostBasis);
    const cgtAllowance =
      country.archetype === 'PURE_DEFERRAL_ACC_WINS' && country.annualTaxFreeAllowanceEur > 0
        ? country.annualTaxFreeAllowanceEur
        : 0;
    exitTaxAcc = Math.max(0, accGain - cgtAllowance) * exitRate;
    exitTaxDist = Math.max(0, distGain - cgtAllowance) * exitRate;
  }

  const netFinalAccEur = Math.max(0, accVal - exitTaxAcc);
  const netFinalDistEur = Math.max(0, distVal - exitTaxDist);

  return {
    grossFinalEur: grossVal,
    netFinalAccEur,
    taxDragAccEur: Math.max(0, grossVal - netFinalAccEur),
    netFinalDistEur,
    taxDragDistEur: Math.max(0, grossVal - netFinalDistEur),
    effectiveExitRatePct: exitRate * 100,
    monthlyGrossCurve,
    monthlyDistNetCurve,
    monthlyInvestedCurve,
  };
}

function buildBacktestMetrics(params: {
  years: 3 | 5;
  dates: string[];
  unitCurve: number[];
  initialBudgetEur: number;
  monthlyContributionEur: number;
  annualDividendYieldPct: number;
  country: CountryTaxRule;
  isEquityMajority: boolean;
}): { metrics: BacktestPeriodMetrics; sim: TaxSimulationResult; subDates: string[] } {
  const {
    years,
    dates,
    unitCurve,
    initialBudgetEur,
    monthlyContributionEur,
    annualDividendYieldPct,
    country,
    isEquityMajority,
  } = params;

  const targetMonths = years * 12;
  const startIdx = Math.max(0, unitCurve.length - 1 - targetMonths);
  const subUnit = unitCurve.slice(startIdx);
  const subDates = dates.slice(startIdx);
  const actualMonths = Math.max(1, subUnit.length - 1);

  const sim = simulateStrategyTaxPath({
    unitSubCurve: subUnit,
    initialBudgetEur,
    monthlyContributionEur,
    annualDividendYieldPct,
    country,
    isEquityMajority,
    holdingYearsForExitRate: years,
  });

  const totalInvestedEur = initialBudgetEur + monthlyContributionEur * actualMonths;
  const grossProfitEur = sim.grossFinalEur - totalInvestedEur;
  const grossTotalReturnPct =
    totalInvestedEur > 0 ? (grossProfitEur / totalInvestedEur) * 100 : 0;
  const annualizedCagrPct = computeMoneyWeightedCagrPct(
    initialBudgetEur,
    monthlyContributionEur,
    actualMonths,
    sim.grossFinalEur
  );
  const maxDrawdownPct = computeMaxDrawdownPct(subUnit);

  return {
    metrics: {
      years,
      startDate: subDates[0] ?? '2021-11-01',
      endDate: subDates[subDates.length - 1] ?? '2026-11-01',
      initialBudgetEur: round2(initialBudgetEur),
      monthlyContributionEur: round2(monthlyContributionEur),
      totalInvestedEur: round2(totalInvestedEur),
      grossFinalValueEur: round2(sim.grossFinalEur),
      grossProfitEur: round2(grossProfitEur),
      grossTotalReturnPct: round2(grossTotalReturnPct),
      annualizedCagrPct: round2(annualizedCagrPct),
      maxDrawdownPct: round2(maxDrawdownPct),
      estimatedTaxDragAccEur: round2(sim.taxDragAccEur),
      estimatedNetFinalAccEur: round2(sim.netFinalAccEur),
      estimatedTaxDragDistEur: round2(sim.taxDragDistEur),
      estimatedNetFinalDistEur: round2(sim.netFinalDistEur),
      accTaxAdvantageEur: round2(sim.netFinalAccEur - sim.netFinalDistEur),
    },
    sim,
    subDates,
  };
}

function buildConstantRateUnitCurve(annualRatePct: number, years: number): number[] {
  const totalMonths = years * 12;
  const annualDecimal = annualRatePct / 100;
  const monthlyRate = Math.pow(Math.max(0.05, 1 + annualDecimal), 1 / 12) - 1;
  const curve: number[] = [1];
  for (let m = 1; m <= totalMonths; m += 1) {
    curve.push(curve[m - 1] * (1 + monthlyRate));
  }
  return curve;
}

function projectForwardGross(
  startingValueEur: number,
  monthlyContributionEur: number,
  annualRatePct: number,
  years: number
): number {
  const totalMonths = years * 12;
  const monthlyRate = Math.pow(Math.max(0.05, 1 + annualRatePct / 100), 1 / 12) - 1;
  let val = startingValueEur;
  for (let m = 1; m <= totalMonths; m += 1) {
    val = val * (1 + monthlyRate) + monthlyContributionEur;
  }
  return val;
}

function buildForecastTaxNote(
  country: CountryTaxRule,
  horizonYears: 3 | 5 | 10 | 15 | 20,
  appliedRatePct: number,
  accShare: number
): string {
  if (country.code === 'PT') {
    const discountDesc =
      horizonYears >= 8
        ? 'max 30% holding exclusion (>8Y)'
        : horizonYears >= 5
          ? '20% holding exclusion (5–8Y)'
          : '10% holding exclusion (2–5Y)';
    return accShare >= 0.5
      ? `Portugal Lei n.º 31/2024: ${discountDesc} -> ${appliedRatePct.toFixed(1)}% effective IRS vs 28% on annual Dist dividends.`
      : `Distributing ETF pays 28% IRS annually on dividends without holding discount; Acc avoids annual drag.`;
  }
  if (country.code === 'DE') {
    return `Germany: 30% Teilfreistellung (18.46% effective) + €${country.annualTaxFreeAllowanceEur.toLocaleString()} Sparerpauschbetrag & Vorabpauschale.`;
  }
  if (country.code === 'AT') {
    return `Austria Meldefonds: 27.5% KESt with 60% annual AgE taxation and 40% deferred until exit.`;
  }
  if (country.code === 'IE') {
    const ddCount = Math.floor(horizonYears / 8);
    return ddCount > 0
      ? `Ireland: ${appliedRatePct.toFixed(0)}% Exit Tax with ${ddCount}× 8-Year Deemed Disposal event${ddCount > 1 ? 's' : ''} + final settlement.`
      : `Ireland: ${appliedRatePct.toFixed(0)}% Exit Tax applies at sale (8-Year Deemed Disposal triggers from Year 8).`;
  }
  if (country.code === 'NL') {
    return `Netherlands Box 3: Annual wealth tax modeled above €${country.annualTaxFreeAllowanceEur.toLocaleString()} threshold (0% exit CGT).`;
  }
  if (country.code === 'CH') {
    return `Switzerland: 0% private capital gains tax; ICTax annual dividend income tax applied to both Acc & Dist.`;
  }
  if (country.holdingPeriodDiscounts && country.holdingPeriodDiscounts.length > 0) {
    return `${country.name}: ${appliedRatePct.toFixed(1)}% effective tax rate after ${horizonYears}-year holding period rule.`;
  }
  return `${country.name}: ${appliedRatePct.toFixed(1)}% capital gains tax at exit${
    accShare >= 0.5 ? ' (Acc defers dividend taxes internally)' : ' + annual dividend tax drag'
  }.`;
}

function addYearsToIsoDate(isoDate: string, yearsToAdd: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const year = parts[0] + yearsToAdd;
    const month = String(parts[1]).padStart(2, '0');
    const day = String(parts[2]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsToAdd);
  return d.toISOString().slice(0, 10);
}

/**
 * Computes complete 3Y & 5Y historical backtests, country-aware Acc vs Dist net comparisons,
 * 3Y–20Y future forecasts, and a continuous -5Y to +20Y chart timeline.
 */
export function calculatePortfolioBacktestAndForecast(
  input: CalculationInput
): FullCalculationOutput {
  const initialBudgetEur = clampNonNegative(input.initialBudgetEur);
  const monthlyContributionEur = clampNonNegative(input.monthlyContributionEur);
  const activeItems = normalizePortfolioItems(
    input.allocations,
    input.etfs,
    input.quotesByEtfId
  );

  const blendedTerPct = activeItems.reduce((sum, item) => sum + item.weight * item.etf.ter, 0);
  const blendedDividendYieldPct = activeItems.reduce(
    (sum, item) => sum + item.weight * item.etf.dividendYieldEst,
    0
  );
  const fallbackVolPct = activeItems.reduce(
    (sum, item) => sum + item.weight * item.etf.volatilityAnnualPct,
    0
  );
  const accShare = activeItems.reduce(
    (sum, item) => sum + (item.etf.distributionPolicy === 'Acc' ? item.weight : 0),
    0
  );
  const equityWeight = activeItems.reduce(
    (sum, item) =>
      sum + (item.etf.assetClass !== 'EUR Money Market / Bonds' ? item.weight : 0),
    0
  );
  const isEquityMajority = equityWeight >= 0.5;

  const { dates, unitCurve } = alignPortfolioSeries(activeItems);
  const cagr5YPct = computeTimeWeightedCagrPct(unitCurve, 60);
  const cagr3YPct = computeTimeWeightedCagrPct(unitCurve, 36);
  const volatilityPct = computeRealizedVolatilityPct(unitCurve, fallbackVolPct);

  const bt3Y = buildBacktestMetrics({
    years: 3,
    dates,
    unitCurve,
    initialBudgetEur,
    monthlyContributionEur,
    annualDividendYieldPct: blendedDividendYieldPct,
    country: input.country,
    isEquityMajority,
  });

  const bt5Y = buildBacktestMetrics({
    years: 5,
    dates,
    unitCurve,
    initialBudgetEur,
    monthlyContributionEur,
    annualDividendYieldPct: blendedDividendYieldPct,
    country: input.country,
    isEquityMajority,
  });

  // Forecast CAGR rates: Base = 5Y CAGR, Optimistic = Base + 0.55σ, Conservative = max(1.5%, Base - 0.55σ)
  const baseCagrPct = Number.isFinite(cagr5YPct) ? cagr5YPct : 7.5;
  const optCagrPct = baseCagrPct + 0.55 * volatilityPct;
  const consCagrPct = Math.min(baseCagrPct, Math.max(1.5, baseCagrPct - 0.55 * volatilityPct));

  // Forward Horizon Summaries (starting Today from user's initialBudgetEur + monthlyContributionEur)
  const horizons: Array<3 | 5 | 10 | 15 | 20> = [3, 5, 10, 15, 20];
  const forecasts: ForecastHorizonSummary[] = horizons.map((horizonYears) => {
    const baseCurve = buildConstantRateUnitCurve(baseCagrPct, horizonYears);
    const optCurve = buildConstantRateUnitCurve(optCagrPct, horizonYears);
    const consCurve = buildConstantRateUnitCurve(consCagrPct, horizonYears);

    const baseSim = simulateStrategyTaxPath({
      unitSubCurve: baseCurve,
      initialBudgetEur,
      monthlyContributionEur,
      annualDividendYieldPct: blendedDividendYieldPct,
      country: input.country,
      isEquityMajority,
      holdingYearsForExitRate: horizonYears,
    });

    const optSim = simulateStrategyTaxPath({
      unitSubCurve: optCurve,
      initialBudgetEur,
      monthlyContributionEur,
      annualDividendYieldPct: blendedDividendYieldPct,
      country: input.country,
      isEquityMajority,
      holdingYearsForExitRate: horizonYears,
    });

    const consSim = simulateStrategyTaxPath({
      unitSubCurve: consCurve,
      initialBudgetEur,
      monthlyContributionEur,
      annualDividendYieldPct: blendedDividendYieldPct,
      country: input.country,
      isEquityMajority,
      holdingYearsForExitRate: horizonYears,
    });

    const totalInvestedEur = initialBudgetEur + monthlyContributionEur * horizonYears * 12;
    const baseGrossEur = baseSim.grossFinalEur;
    const baseGrossProfitEur = baseGrossEur - totalInvestedEur;

    const netPostTaxBlended =
      accShare * baseSim.netFinalAccEur + (1 - accShare) * baseSim.netFinalDistEur;
    const estimatedExitTaxEur = Math.max(0, baseGrossEur - netPostTaxBlended);
    const effectiveRate =
      baseGrossProfitEur > 0 ? (estimatedExitTaxEur / baseGrossProfitEur) * 100 : 0;

    return {
      horizonYears,
      totalInvestedEur: round2(totalInvestedEur),
      conservativeGrossEur: round2(consSim.grossFinalEur),
      baseGrossEur: round2(baseGrossEur),
      optimisticGrossEur: round2(optSim.grossFinalEur),
      baseGrossProfitEur: round2(baseGrossProfitEur),
      estimatedExitTaxEur: round2(estimatedExitTaxEur),
      estimatedNetPostTaxBaseEur: round2(netPostTaxBlended),
      effectiveTaxRateAppliedPct: round2(effectiveRate),
      taxNote: buildForecastTaxNote(
        input.country,
        horizonYears,
        baseSim.effectiveExitRatePct,
        accShare
      ),
    };
  });

  // Unified Timeline (-5Y -> Today -> +20Y), seamlessly transitioning at yearOffset = 0
  const timelineSeries: ChartTimelinePoint[] = [];
  const histLen = bt5Y.sim.monthlyGrossCurve.length;
  const histMonths = histLen - 1;

  for (let i = 0; i < histLen; i += 1) {
    const yearOffset = Number((-(histMonths - i) / 12).toFixed(2));
    const isTodayAnchor = i === histLen - 1;
    const grossToday = bt5Y.sim.monthlyGrossCurve[i];
    const netTodayBlended =
      accShare * bt5Y.metrics.estimatedNetFinalAccEur +
      (1 - accShare) * bt5Y.metrics.estimatedNetFinalDistEur;

    timelineSeries.push({
      date: bt5Y.subDates[i] ?? dates[dates.length - 1] ?? '2026-11-01',
      yearOffset,
      phase: 'historical',
      totalInvestedEur: round2(bt5Y.sim.monthlyInvestedCurve[i]),
      historicalValueEur: round2(grossToday),
      historicalDistNetEur: round2(bt5Y.sim.monthlyDistNetCurve[i]),
      ...(isTodayAnchor
        ? {
            forecastBaseEur: round2(grossToday),
            forecastOptimisticEur: round2(grossToday),
            forecastConservativeEur: round2(grossToday),
            forecastPostTaxBaseEur: round2(netTodayBlended),
          }
        : {}),
    });
  }

  const endDate = bt5Y.metrics.endDate;
  const startingForecastValue = bt5Y.metrics.grossFinalValueEur;
  const startingInvested = bt5Y.metrics.totalInvestedEur;
  const hist5YUnitSub = unitCurve.slice(Math.max(0, unitCurve.length - 1 - 60));
  const histEndUnit = hist5YUnitSub[hist5YUnitSub.length - 1] || 1;
  const histActualYears = Math.max(1, (hist5YUnitSub.length - 1) / 12);
  const full20BaseCurve = buildConstantRateUnitCurve(baseCagrPct, 20);

  for (let y = 1; y <= 20; y += 1) {
    // Concatenate the 5Y historical unit curve with y future years so tax basis,
    // holding-period discounts, and 8Y deemed disposal stay continuous across Today.
    const futureBaseScaled = full20BaseCurve
      .slice(1, y * 12 + 1)
      .map((factor) => factor * histEndUnit);
    const continuousBaseCurve = [...hist5YUnitSub, ...futureBaseScaled];

    const continuousBaseSim = simulateStrategyTaxPath({
      unitSubCurve: continuousBaseCurve,
      initialBudgetEur,
      monthlyContributionEur,
      annualDividendYieldPct: blendedDividendYieldPct,
      country: input.country,
      isEquityMajority,
      holdingYearsForExitRate: histActualYears + y,
    });

    const optGross = projectForwardGross(
      startingForecastValue,
      monthlyContributionEur,
      optCagrPct,
      y
    );
    const consGross = projectForwardGross(
      startingForecastValue,
      monthlyContributionEur,
      consCagrPct,
      y
    );

    const postTaxBlendedContinuation =
      accShare * continuousBaseSim.netFinalAccEur +
      (1 - accShare) * continuousBaseSim.netFinalDistEur;

    timelineSeries.push({
      date: addYearsToIsoDate(endDate, y),
      yearOffset: y,
      phase: 'forecast',
      totalInvestedEur: round2(startingInvested + y * 12 * monthlyContributionEur),
      forecastBaseEur: round2(continuousBaseSim.grossFinalEur),
      forecastOptimisticEur: round2(optGross),
      forecastConservativeEur: round2(consGross),
      forecastPostTaxBaseEur: round2(postTaxBlendedContinuation),
    });
  }

  return {
    countryCode: input.country.code,
    backtest3Y: bt3Y.metrics,
    backtest5Y: bt5Y.metrics,
    forecasts,
    timelineSeries,
    blendedTerPct: round2(blendedTerPct),
    blendedDividendYieldPct: round2(blendedDividendYieldPct),
    blendedHistoricalCagr5YPct: round2(cagr5YPct),
    blendedHistoricalCagr3YPct: round2(cagr3YPct),
    blendedVolatilityPct: round2(volatilityPct),
  };
}
