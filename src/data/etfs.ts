import type { ETFInstrument, HistoricalPricePoint } from '../types';

interface PriceMilestone {
  monthIndex: number; // 0 = 2021-11-01, 24 = 2023-11-01 (3Y ago), 60 = 2026-11-01 (current)
  price: number;
}

/**
 * Generates a realistic 61-point monthly price series from 2021-11-01 to 2026-11-01.
 * Interpolates smoothly between real-world market milestones (including the 2022 bear market,
 * 2023-2024 recovery, and 2025-2026 trajectory) while adding deterministic monthly variance
 * proportional to the ETF's annualized volatility. Anchor milestones are preserved exactly.
 */
function generateMonthlyHistory5Y(
  milestones: PriceMilestone[],
  monthlyNoiseAmplitude: number,
  seed: number
): HistoricalPricePoint[] {
  const sorted = [...milestones].sort((a, b) => a.monthIndex - b.monthIndex);
  const anchorSet = new Set(sorted.map((m) => m.monthIndex));
  const points: HistoricalPricePoint[] = [];

  const startYear = 2021;
  const startMonth = 11; // November (1-indexed)

  for (let i = 0; i <= 60; i++) {
    const totalMonths = startMonth - 1 + i;
    const year = startYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const timestamp = Date.UTC(year, month - 1, 1);

    // Find bracketing milestones
    let prev = sorted[0];
    let next = sorted[sorted.length - 1];
    for (let m = 0; m < sorted.length - 1; m++) {
      if (i >= sorted[m].monthIndex && i <= sorted[m + 1].monthIndex) {
        prev = sorted[m];
        next = sorted[m + 1];
        break;
      }
    }

    const span = Math.max(1, next.monthIndex - prev.monthIndex);
    const progress = (i - prev.monthIndex) / span;
    const basePrice = prev.price + (next.price - prev.price) * progress;

    // Deterministic monthly ripple that fades to 0 at anchor points
    let close = basePrice;
    if (!anchorSet.has(i) && monthlyNoiseAmplitude > 0) {
      const ripple =
        Math.sin(i * 1.47 + seed) * 0.6 +
        Math.cos(i * 2.31 + seed * 1.7) * 0.4;
      const envelope = Math.sin(progress * Math.PI); // 0 at anchors, 1 in middle
      close = basePrice * (1 + ripple * monthlyNoiseAmplitude * envelope);
    }

    points.push({
      date: dateStr,
      timestamp,
      close: Math.round(close * 100) / 100,
    });
  }

  return points;
}

export const CURATED_ETFS: ETFInstrument[] = [
  {
    id: 'vwce',
    ticker: 'VWCE.DE',
    altTickers: ['VWCE.AS', 'VWCE.MI', 'VWRP.L'],
    isin: 'IE00BK5BQT80',
    wkn: 'A2PKXG',
    justEtfSlug: 'vanguard-ftse-all-world-ucits-etf-usd-accumulating',
    name: 'Vanguard FTSE All-World UCITS ETF (USD) Accumulating',
    shortName: 'Vanguard FTSE All-World (Acc)',
    provider: 'Vanguard',
    indexTracked: 'FTSE All-World Index (Large & Mid Cap, Developed + Emerging Markets)',
    assetClass: 'Global Equities',
    distributionPolicy: 'Acc',
    pairedEtfId: 'vgwl',
    ter: 0.22,
    trackingDifference: -0.02,
    dividendYieldEst: 1.85,
    replication: 'Physical (Optimized Sampling)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 31.4,
    holdingsCount: 3650,
    volatilityAnnualPct: 14.2,
    riskRatingPriips: 4,
    whyCarefulChoice:
      'One-ticket global diversification across ~3,650 companies in ~50 developed and emerging countries. Eliminates single-country and stock-picking risk while automatically reinvesting dividends internally.',
    taxEfficiencyNotes:
      'Irish UCITS domicile (15% US dividend withholding treaty vs 30%). Accumulating policy avoids annual dividend tax drag in deferral jurisdictions (PT, ES, IT, BE, PL, RO, CZ) and maximizes long-term compounding.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 99.0 },   // 2021-11
        { monthIndex: 2, price: 102.4 },  // 2022-01 peak
        { monthIndex: 7, price: 90.2 },   // 2022-06 dip
        { monthIndex: 11, price: 88.6 },  // 2022-10 bear trough
        { monthIndex: 18, price: 97.8 },  // 2023-05
        { monthIndex: 24, price: 104.0 }, // 2023-11 (3Y ago)
        { monthIndex: 30, price: 116.5 }, // 2024-05
        { monthIndex: 36, price: 126.2 }, // 2024-11
        { monthIndex: 42, price: 124.8 }, // 2025-05 spring pullback
        { monthIndex: 48, price: 131.6 }, // 2025-11
        { monthIndex: 60, price: 138.4 }, // 2026-11 current
      ],
      0.024,
      1.1
    ),
  },
  {
    id: 'vgwl',
    ticker: 'VGWL.DE',
    altTickers: ['VWRL.AS', 'VWRL.L', 'VWLD.MI'],
    isin: 'IE00B3RBWM25',
    wkn: 'A1JX52',
    justEtfSlug: 'vanguard-ftse-all-world-ucits-etf-usd-distributing',
    name: 'Vanguard FTSE All-World UCITS ETF (USD) Distributing',
    shortName: 'Vanguard FTSE All-World (Dist)',
    provider: 'Vanguard',
    indexTracked: 'FTSE All-World Index (Large & Mid Cap, Developed + Emerging Markets)',
    assetClass: 'Global Equities',
    distributionPolicy: 'Dist',
    pairedEtfId: 'vwce',
    ter: 0.22,
    trackingDifference: -0.02,
    dividendYieldEst: 1.85,
    replication: 'Physical (Optimized Sampling)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 18.2,
    holdingsCount: 3650,
    volatilityAnnualPct: 14.2,
    riskRatingPriips: 4,
    whyCarefulChoice:
      'Identical underlying portfolio to VWCE (~3,650 global equities), paying out quarterly cash dividends directly to your brokerage cash account.',
    taxEfficiencyNotes:
      'Useful in Germany up to the €1,000 Sparerpauschbetrag tax-free allowance (or €2,000 joint). Less tax-efficient in Portugal, Spain, Italy, Belgium, or Poland where every quarterly dividend triggers immediate income tax without deferral.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 101.2 },  // 2021-11
        { monthIndex: 2, price: 104.1 },  // 2022-01
        { monthIndex: 7, price: 90.8 },   // 2022-06
        { monthIndex: 11, price: 88.4 },  // 2022-10
        { monthIndex: 18, price: 96.6 },  // 2023-05
        { monthIndex: 24, price: 101.8 }, // 2023-11 (3Y ago) - price ex-dividends
        { monthIndex: 30, price: 112.9 }, // 2024-05
        { monthIndex: 36, price: 121.0 }, // 2024-11
        { monthIndex: 42, price: 118.4 }, // 2025-05
        { monthIndex: 48, price: 123.7 }, // 2025-11
        { monthIndex: 60, price: 128.4 }, // 2026-11 current (price-only excluding paid ~1.85%/yr dividends)
      ],
      0.024,
      1.15
    ),
  },
  {
    id: 'iwda',
    ticker: 'EUNL.DE',
    altTickers: ['IWDA.AS', 'SWDA.L', 'SWDA.MI'],
    isin: 'IE00B4L5Y983',
    wkn: 'A0RPWH',
    justEtfSlug: 'ishares-core-msci-world-ucits-etf-usd-acc',
    name: 'iShares Core MSCI World UCITS ETF USD (Acc)',
    shortName: 'iShares Core MSCI World (Acc)',
    provider: 'iShares (BlackRock)',
    indexTracked: 'MSCI World Index (23 Developed Markets, Large & Mid Cap)',
    assetClass: 'Developed World Equities',
    distributionPolicy: 'Acc',
    pairedEtfId: 'iqqw',
    ter: 0.20,
    trackingDifference: -0.06,
    dividendYieldEst: 1.65,
    replication: 'Physical (Optimized Sampling)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 82.6,
    holdingsCount: 1410,
    volatilityAnnualPct: 14.5,
    riskRatingPriips: 4,
    whyCarefulChoice:
      'Europe’s largest and most liquid equity UCITS ETF. Covers ~1,410 leading companies across 23 developed nations with negative tracking difference (-0.06%), meaning securities lending offsets fees.',
    taxEfficiencyNotes:
      'Irish domicile + Accumulating policy maximizes tax deferral in Europe. Can be paired 88/12 with IS3N.DE (MSCI EM IMI) to replicate a full global portfolio at slightly lower blended TER than VWCE.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 73.0 },   // 2021-11
        { monthIndex: 2, price: 75.8 },   // 2022-01
        { monthIndex: 7, price: 66.5 },   // 2022-06
        { monthIndex: 11, price: 65.4 },  // 2022-10
        { monthIndex: 18, price: 72.9 },  // 2023-05
        { monthIndex: 24, price: 78.0 },  // 2023-11 (3Y ago)
        { monthIndex: 30, price: 88.2 },  // 2024-05
        { monthIndex: 36, price: 96.4 },  // 2024-11
        { monthIndex: 42, price: 95.3 },  // 2025-05
        { monthIndex: 48, price: 102.1 }, // 2025-11
        { monthIndex: 60, price: 108.6 }, // 2026-11 current
      ],
      0.025,
      2.3
    ),
  },
  {
    id: 'iqqw',
    ticker: 'IQQW.DE',
    altTickers: ['IDWR.AS', 'IWRD.L'],
    isin: 'IE00B0M62Q58',
    wkn: 'A0HGV0',
    justEtfSlug: 'ishares-msci-world-ucits-etf-dist',
    name: 'iShares MSCI World UCITS ETF (Dist)',
    shortName: 'iShares MSCI World (Dist)',
    provider: 'iShares (BlackRock)',
    indexTracked: 'MSCI World Index (23 Developed Markets, Large & Mid Cap)',
    assetClass: 'Developed World Equities',
    distributionPolicy: 'Dist',
    pairedEtfId: 'iwda',
    ter: 0.50,
    trackingDifference: 0.35,
    dividendYieldEst: 1.65,
    replication: 'Physical (Optimized Sampling)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 6.8,
    holdingsCount: 1410,
    volatilityAnnualPct: 14.5,
    riskRatingPriips: 4,
    whyCarefulChoice:
      'Legacy distributing twin of EUNL/IWDA. Note the higher 0.50% TER compared to 0.20% on IWDA—an important cost lesson for careful investors comparing Acc vs Dist share classes.',
    taxEfficiencyNotes:
      'Higher 0.50% TER plus quarterly taxable dividend payouts create a noticeable long-term drag outside tax-free wrappers. Only consider Dist if you specifically need cash payouts or German Sparerpauschbetrag harvesting (and compare lower-fee Dist alternatives like VGWL).',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 54.0 },   // 2021-11
        { monthIndex: 2, price: 55.9 },   // 2022-01
        { monthIndex: 7, price: 48.6 },   // 2022-06
        { monthIndex: 11, price: 47.4 },  // 2022-10
        { monthIndex: 18, price: 52.1 },  // 2023-05
        { monthIndex: 24, price: 55.2 },  // 2023-11 (3Y ago)
        { monthIndex: 30, price: 61.8 },  // 2024-05
        { monthIndex: 36, price: 66.8 },  // 2024-11
        { monthIndex: 42, price: 65.4 },  // 2025-05
        { monthIndex: 48, price: 69.3 },  // 2025-11
        { monthIndex: 60, price: 72.8 },  // 2026-11 current
      ],
      0.025,
      2.35
    ),
  },
  {
    id: 'sxr8',
    ticker: 'SXR8.DE',
    altTickers: ['CSPX.AS', 'CSPX.L', 'CSSPX.MI'],
    isin: 'IE00B5BMR087',
    wkn: 'A0YEDG',
    justEtfSlug: 'ishares-core-sp-500-ucits-etf-acc',
    name: 'iShares Core S&P 500 UCITS ETF USD (Acc)',
    shortName: 'iShares Core S&P 500 (Acc)',
    provider: 'iShares (BlackRock)',
    indexTracked: 'S&P 500 Index (500 Largest US Public Companies)',
    assetClass: 'US Equities',
    distributionPolicy: 'Acc',
    pairedEtfId: 'vusa',
    ter: 0.07,
    trackingDifference: -0.22,
    dividendYieldEst: 1.35,
    replication: 'Physical (Full)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 96.5,
    holdingsCount: 503,
    volatilityAnnualPct: 16.4,
    riskRatingPriips: 5,
    whyCarefulChoice:
      'Ultra-low 0.07% TER and negative tracking difference (-0.22%) because Irish UCITS funds pay only 15% US dividend withholding tax instead of the 30% assumed by the Net Total Return index.',
    taxEfficiencyNotes:
      'Single-country US concentration carries USD FX exposure and US tech mega-cap concentration risk; pair with non-US equities or use VWCE/IWDA if seeking geographic balance. Accumulating structure defers all dividend taxation.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 410.0 },  // 2021-11
        { monthIndex: 2, price: 426.0 },  // 2022-01
        { monthIndex: 7, price: 374.0 },  // 2022-06
        { monthIndex: 11, price: 368.0 }, // 2022-10
        { monthIndex: 18, price: 405.0 }, // 2023-05
        { monthIndex: 24, price: 435.0 }, // 2023-11 (3Y ago)
        { monthIndex: 30, price: 504.0 }, // 2024-05
        { monthIndex: 36, price: 561.0 }, // 2024-11
        { monthIndex: 42, price: 552.0 }, // 2025-05
        { monthIndex: 48, price: 594.0 }, // 2025-11
        { monthIndex: 60, price: 632.5 }, // 2026-11 current
      ],
      0.028,
      3.7
    ),
  },
  {
    id: 'vusa',
    ticker: 'VUSA.DE',
    altTickers: ['VUSA.AS', 'VUSA.L', 'VUSA.MI'],
    isin: 'IE00B3XXRP09',
    wkn: 'A1JX53',
    justEtfSlug: 'vanguard-sp-500-ucits-etf-usd-distributing',
    name: 'Vanguard S&P 500 UCITS ETF (USD) Distributing',
    shortName: 'Vanguard S&P 500 (Dist)',
    provider: 'Vanguard',
    indexTracked: 'S&P 500 Index (500 Largest US Public Companies)',
    assetClass: 'US Equities',
    distributionPolicy: 'Dist',
    pairedEtfId: 'sxr8',
    ter: 0.07,
    trackingDifference: -0.20,
    dividendYieldEst: 1.35,
    replication: 'Physical (Full)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 41.2,
    holdingsCount: 503,
    volatilityAnnualPct: 16.4,
    riskRatingPriips: 5,
    whyCarefulChoice:
      'Lower share price (~€108 vs ~€632 for SXR8) makes whole-share purchasing accessible even at brokers without fractional shares, at the same institutional 0.07% TER.',
    taxEfficiencyNotes:
      'Pays quarterly cash dividends subject to local dividend taxation in the year received. For pure long-term compounding in Portugal, Spain, Italy, or Belgium, accumulating VUAA.DE / SXR8.DE avoids annual tax drag.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 74.5 },   // 2021-11
        { monthIndex: 2, price: 77.1 },   // 2022-01
        { monthIndex: 7, price: 67.1 },   // 2022-06
        { monthIndex: 11, price: 65.6 },  // 2022-10
        { monthIndex: 18, price: 71.6 },  // 2023-05
        { monthIndex: 24, price: 76.2 },  // 2023-11 (3Y ago)
        { monthIndex: 30, price: 87.6 },  // 2024-05
        { monthIndex: 36, price: 96.8 },  // 2024-11
        { monthIndex: 42, price: 94.5 },  // 2025-05
        { monthIndex: 48, price: 101.2 }, // 2025-11
        { monthIndex: 60, price: 106.8 }, // 2026-11 current
      ],
      0.028,
      3.75
    ),
  },
  {
    id: 'eqqb',
    ticker: 'EQQB.DE',
    altTickers: ['EQAC.AS', 'EQAC.SW'],
    isin: 'IE00BFZXGZ54',
    wkn: 'A2N6RV',
    justEtfSlug: 'invesco-eqqq-nasdaq-100-ucits-etf-acc',
    name: 'Invesco EQQQ Nasdaq-100 UCITS ETF Acc',
    shortName: 'Invesco Nasdaq-100 (Acc)',
    provider: 'Invesco',
    indexTracked: 'NASDAQ-100 Index (100 Largest Non-Financial Nasdaq Companies)',
    assetClass: 'Tech / Nasdaq Equities',
    distributionPolicy: 'Acc',
    pairedEtfId: 'eqqq',
    ter: 0.30,
    trackingDifference: 0.14,
    dividendYieldEst: 0.75,
    replication: 'Physical (Full)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 4.9,
    holdingsCount: 101,
    volatilityAnnualPct: 22.8,
    riskRatingPriips: 6,
    whyCarefulChoice:
      'Higher-risk satellite allocation only—experienced a >30% drawdown in 2022. Careful investors cap sector/tech tilts (e.g. 10–15% max) alongside a broad core like VWCE or IWDA.',
    taxEfficiencyNotes:
      'Low dividend yield (~0.75%) combined with Accumulating policy keeps annual tax drag minimal even in imputed-tax jurisdictions, though high volatility makes holding discipline critical.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 245.0 },  // 2021-11
        { monthIndex: 2, price: 251.0 },  // 2022-01
        { monthIndex: 7, price: 189.0 },  // 2022-06 sharp tech selloff
        { monthIndex: 11, price: 176.5 }, // 2022-10 bear trough (~-30% from peak)
        { monthIndex: 18, price: 218.0 }, // 2023-05 AI rebound
        { monthIndex: 24, price: 248.0 }, // 2023-11 (3Y ago)
        { monthIndex: 30, price: 294.0 }, // 2024-05
        { monthIndex: 36, price: 334.0 }, // 2024-11
        { monthIndex: 42, price: 318.0 }, // 2025-05
        { monthIndex: 48, price: 362.0 }, // 2025-11
        { monthIndex: 60, price: 396.0 }, // 2026-11 current
      ],
      0.038,
      4.9
    ),
  },
  {
    id: 'eqqq',
    ticker: 'EQQQ.DE',
    altTickers: ['EQQQ.MI', 'EQQQ.L', 'EQQQ.AS'],
    isin: 'IE0032077012',
    wkn: '801498',
    justEtfSlug: 'invesco-eqqq-nasdaq-100-ucits-etf-dist',
    name: 'Invesco EQQQ Nasdaq-100 UCITS ETF Dist',
    shortName: 'Invesco Nasdaq-100 (Dist)',
    provider: 'Invesco',
    indexTracked: 'NASDAQ-100 Index (100 Largest Non-Financial Nasdaq Companies)',
    assetClass: 'Tech / Nasdaq Equities',
    distributionPolicy: 'Dist',
    pairedEtfId: 'eqqb',
    ter: 0.30,
    trackingDifference: 0.14,
    dividendYieldEst: 0.75,
    replication: 'Physical (Full)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 8.7,
    holdingsCount: 101,
    volatilityAnnualPct: 22.8,
    riskRatingPriips: 6,
    whyCarefulChoice:
      'Flagship European Nasdaq-100 ETF with deep exchange liquidity across Xetra, Euronext, and Borsa Italiana. Same high-volatility tech concentration warning applies.',
    taxEfficiencyNotes:
      'Distributes small quarterly dividends (~0.75%/yr). Because tech companies pay modest dividends, the Acc vs Dist tax gap is narrower than for All-World ETFs, though Acc (EQQB) still wins on convenience and deferral.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 344.0 },  // 2021-11
        { monthIndex: 2, price: 352.0 },  // 2022-01
        { monthIndex: 7, price: 263.5 },  // 2022-06
        { monthIndex: 11, price: 245.0 }, // 2022-10
        { monthIndex: 18, price: 301.0 }, // 2023-05
        { monthIndex: 24, price: 341.0 }, // 2023-11 (3Y ago)
        { monthIndex: 30, price: 402.0 }, // 2024-05
        { monthIndex: 36, price: 454.5 }, // 2024-11
        { monthIndex: 42, price: 431.0 }, // 2025-05
        { monthIndex: 48, price: 488.0 }, // 2025-11
        { monthIndex: 60, price: 530.5 }, // 2026-11 current
      ],
      0.038,
      4.95
    ),
  },
  {
    id: 'is3n',
    ticker: 'IS3N.DE',
    altTickers: ['EMIM.AS', 'EMIM.L', 'EIMI.L'],
    isin: 'IE00BKM4GZ66',
    wkn: 'A111X9',
    justEtfSlug: 'ishares-core-msci-em-imi-ucits-etf-usd-acc',
    name: 'iShares Core MSCI EM IMI UCITS ETF (Acc)',
    shortName: 'iShares MSCI EM IMI (Acc)',
    provider: 'iShares (BlackRock)',
    indexTracked: 'MSCI Emerging Markets Investable Market Index (Large, Mid & Small Cap)',
    assetClass: 'Emerging Markets',
    distributionPolicy: 'Acc',
    ter: 0.18,
    trackingDifference: 0.12,
    dividendYieldEst: 2.65,
    replication: 'Physical (Optimized Sampling)',
    domicile: 'Ireland (IE)',
    currency: 'EUR',
    fundSizeBillionsEur: 22.8,
    holdingsCount: 3180,
    volatilityAnnualPct: 16.8,
    riskRatingPriips: 4,
    whyCarefulChoice:
      'Low-cost building block (0.18% TER, >3,100 holdings across China, India, Taiwan, South Korea, Brazil) often combined with EUNL/IWDA at a ~10-15% weight to match global market capitalization.',
    taxEfficiencyNotes:
      'Emerging markets pay higher average dividends (~2.65%), making the Accumulating structure especially valuable in tax-deferral countries (PT, ES, IT, BE, FR) where avoiding annual dividend taxation saves substantial compounding.',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 31.2 },   // 2021-11
        { monthIndex: 2, price: 31.6 },   // 2022-01
        { monthIndex: 7, price: 28.4 },   // 2022-06
        { monthIndex: 11, price: 26.2 },  // 2022-10
        { monthIndex: 18, price: 27.6 },  // 2023-05
        { monthIndex: 24, price: 28.1 },  // 2023-11 (3Y ago)
        { monthIndex: 30, price: 31.0 },  // 2024-05
        { monthIndex: 36, price: 33.4 },  // 2024-11
        { monthIndex: 42, price: 32.8 },  // 2025-05
        { monthIndex: 48, price: 35.1 },  // 2025-11
        { monthIndex: 60, price: 37.2 },  // 2026-11 current
      ],
      0.03,
      6.2
    ),
  },
  {
    id: 'xeon',
    ticker: 'XEON.DE',
    altTickers: ['XEON.MI', 'XEON.AS'],
    isin: 'LU0290358497',
    wkn: 'DBX0AN',
    justEtfSlug: 'xtrackers-ii-eur-overnight-rate-swap-ucits-etf-1c',
    name: 'Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C (Acc)',
    shortName: 'Xtrackers EUR €STR Money Market (Acc)',
    provider: 'Xtrackers (DWS)',
    indexTracked: 'Solactive €STR +8.5 bps Overnight Rate Index (ECB Cash Rate)',
    assetClass: 'EUR Money Market / Bonds',
    distributionPolicy: 'Acc',
    ter: 0.10,
    trackingDifference: 0.08,
    dividendYieldEst: 0.0,
    replication: 'Synthetic (Unfunded Swap)',
    domicile: 'Luxembourg (LU)',
    currency: 'EUR',
    fundSizeBillionsEur: 14.5,
    holdingsCount: 45,
    volatilityAnnualPct: 0.4,
    riskRatingPriips: 1,
    whyCarefulChoice:
      'PRIIPs Risk Level 1 cash-parking instrument tracking the ECB Euro Short-Term Rate (€STR). Ideal for emergency reserves, short-term goals (<3 years), or stabilizing equity portfolio drawdowns.',
    taxEfficiencyNotes:
      'Accumulates daily overnight interest into NAV rather than paying taxable monthly/annual coupons. Note for Belgium: as a bond/money-market fund, capital gains are subject to the 30% Reynders Tax. In Germany, 0% Teilfreistellung applies (full 26.375% tax above Sparerpauschbetrag).',
    baselineHistory5Y: generateMonthlyHistory5Y(
      [
        { monthIndex: 0, price: 134.8 },  // 2021-11 (negative ECB rate era)
        { monthIndex: 7, price: 134.3 },  // 2022-06 (last negative rate month)
        { monthIndex: 11, price: 134.5 }, // 2022-10 (ECB hikes start)
        { monthIndex: 18, price: 136.8 }, // 2023-05
        { monthIndex: 24, price: 139.4 }, // 2023-11 (3Y ago, ~3.9% €STR)
        { monthIndex: 36, price: 144.6 }, // 2024-11
        { monthIndex: 48, price: 148.7 }, // 2025-11 (rate normalization)
        { monthIndex: 60, price: 152.1 }, // 2026-11 current
      ],
      0.0005, // Near-zero volatility smooth curve
      7.1
    ),
  },
];

export const ETF_BY_ID: Record<string, ETFInstrument> = Object.fromEntries(
  CURATED_ETFS.map((etf) => [etf.id, etf])
);
