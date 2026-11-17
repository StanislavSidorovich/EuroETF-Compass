// src/types/index.ts
// Shared TypeScript contracts for EuroETF Compass

export type DistributionPolicy = 'Acc' | 'Dist';

export type ReplicationMethod =
  | 'Physical (Full)'
  | 'Physical (Optimized Sampling)'
  | 'Synthetic (Unfunded Swap)'
  | 'Direct Equity (Single Stock)';

export type AssetClass =
  | 'Global Equities'
  | 'Developed World Equities'
  | 'US Equities'
  | 'Tech / Nasdaq Equities'
  | 'Emerging Markets'
  | 'European Equities'
  | 'EUR Money Market / Bonds'
  | 'Individual Stock (US)'
  | 'Individual Stock (Europe)';

export type InstrumentType = 'ETF' | 'Stock';

export type CatalogCategory =
  | 'Global ETFs'
  | 'US ETFs'
  | 'Europe & Bond ETFs'
  | 'US Stocks'
  | 'Europe Stocks';

export type ThemeMode = 'dark' | 'light';

export type FontFamilyOption = 'inter' | 'jakarta' | 'serif';

export type FontSizeOption = 'normal' | 'large' | 'xl';

export type LanguageMode = 'en' | 'ru';

export interface HistoricalPricePoint {
  date: string;       // YYYY-MM-DD
  timestamp: number;  // Unix ms
  close: number;      // Price in EUR
}

export interface ETFInstrument {
  id: string;
  ticker: string;           // Primary Yahoo Finance ticker, e.g. 'VWCE.DE' or 'NVDA'
  altTickers: string[];     // e.g. ['VWCE.AS', 'VWCE.MI']
  isin: string;             // e.g. 'IE00BK5BQT80' or 'US67066G1040'
  wkn: string;              // e.g. 'A2PKXG'
  justEtfSlug?: string;
  name: string;
  shortName: string;
  instrumentType?: InstrumentType; // 'ETF' (default) | 'Stock'
  catalogCategory?: CatalogCategory; // Category tab for easy browsing
  provider:
    | 'Vanguard'
    | 'iShares (BlackRock)'
    | 'Xtrackers (DWS)'
    | 'Invesco'
    | 'Amundi'
    | 'SPDR'
    | 'US Corporation (NASDAQ/NYSE)'
    | 'European Corporation'
    | 'Custom';
  indexTracked: string;
  assetClass: AssetClass;
  distributionPolicy: DistributionPolicy;
  pairedEtfId?: string;     // Links Acc <-> Dist twin (e.g., 'vwce' <-> 'vgwl')
  ter: number;              // Total Expense Ratio in % (0.00 for individual stocks)
  trackingDifference: number; // Typical annual TD in %
  dividendYieldEst: number; // Estimated annual gross dividend yield %
  replication: ReplicationMethod;
  domicile: 'Ireland (IE)' | 'Luxembourg (LU)' | 'Germany (DE)' | 'France (FR)' | 'United States (US)' | 'Europe (Direct)';
  currency: 'EUR' | 'USD';
  fundSizeBillionsEur: number;
  holdingsCount: number;
  volatilityAnnualPct: number; // Historical annualized volatility (standard deviation %)
  riskRatingPriips: 1 | 2 | 3 | 4 | 5 | 6 | 7; // EU PRIIPs SRI 1-7 scale
  whyCarefulChoice: string;
  taxEfficiencyNotes: string;
  // Baseline verified 5-year monthly price series (61 points from 5Y ago to present)
  baselineHistory5Y: HistoricalPricePoint[];
}

export interface LiveQuoteData {
  ticker: string;
  currentPrice: number;
  previousClose: number;
  dayChangeEur: number;
  dayChangePct: number;
  currency: string;
  exchangeName: string;
  lastUpdated: string;
  source: 'live-yahoo-proxy' | 'live-cors-fallback' | 'verified-baseline';
  history5Y: HistoricalPricePoint[];
}

export type TaxArchetype =
  | 'PURE_DEFERRAL_ACC_WINS'         // Portugal, Spain, Italy, France, Belgium (Equity), Poland, Romania, Czechia
  | 'IMPUTED_ANNUAL_TAX_HYBRID'      // Germany (Vorabpauschale), Austria (AgE Meldefonds), UK (GIA ERI), Switzerland (ICTax)
  | 'WEALTH_OR_DEEMED_DISPOSAL';     // Netherlands (Box 3), Ireland (8-Yr Deemed Disposal)

export type AccVsDistVerdict =
  | 'ACC_STRONGLY_PREFERRED'
  | 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT'
  | 'DIST_UP_TO_ALLOWANCE_THEN_ACC'
  | 'ACC_PREFERRED_WITH_REPORTING_CHECK'
  | 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT';

export interface HoldingPeriodDiscountTier {
  yearsMin: number;
  yearsMax: number | null;
  exemptionPct: number;       // e.g. 30% exempt in Portugal after 8 years
  effectiveTaxRatePct: number; // e.g. 19.6% in Portugal after 8 years
  label: string;
}

export interface CountryTaxRule {
  code: string;               // 'PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'RO', 'CZ', 'SE'
  name: string;
  flag: string;
  regionGroup: 'Featured Core' | 'Western Europe' | 'DACH' | 'Southern Europe' | 'Central & Eastern Europe' | 'Nordics & UK';
  featuredPriority?: boolean; // True for PT, NL, DE
  archetype: TaxArchetype;
  verdict: AccVsDistVerdict;
  verdictTitle: string;
  verdictSummary: string;
  capitalGainsTaxRatePct: number;   // Headline rate %
  dividendTaxRatePct: number;       // Headline dividend rate %
  effectiveEquityEtfTaxRatePct: number; // After partial exemptions (e.g., DE 18.46% after 30% Teilfreistellung, PT 19.6% >8y)
  annualTaxFreeAllowanceEur: number; // e.g. €1,000 in DE, €0 in PT
  allowanceDescription: string;
  accumulatingTaxRule: string;      // How Acc ETFs are taxed while held
  distributingTaxRule: string;      // How Dist ETFs are taxed while held
  holdingPeriodDiscounts?: HoldingPeriodDiscountTier[]; // e.g. Portugal Lei n.º 31/2024, Czechia 3Y test, Romania 1Y local broker
  specialWrapperName?: string;      // e.g. 'PEA (France)', 'ISA (UK)', 'PPR / Long-Term >8Y (Portugal)'
  specialWrapperDetails?: string;
  taxDeclarationForm: string;       // e.g. 'IRS Anexo J (Quadro 9.2A / 8A) - FIFO method' for Portugal
  localAuthorityName: string;
  localAuthorityUrl: string;
  recommendedPortals: {
    name: string;
    url: string;
    description: string;
  }[];
  keyLegalWarnings: string[];
}

export interface PortfolioAllocationItem {
  etfId: string;
  weightPct: number; // 0 to 100, sum = 100
}

export interface BacktestPeriodMetrics {
  years: 3 | 5;
  startDate: string;
  endDate: string;
  initialBudgetEur: number;
  monthlyContributionEur: number;
  totalInvestedEur: number;
  grossFinalValueEur: number;
  grossProfitEur: number;
  grossTotalReturnPct: number;
  annualizedCagrPct: number;
  maxDrawdownPct: number;
  // Country Tax & Acc vs Dist comparison for this lookback
  estimatedTaxDragAccEur: number;
  estimatedNetFinalAccEur: number;
  estimatedTaxDragDistEur: number;
  estimatedNetFinalDistEur: number;
  accTaxAdvantageEur: number; // Extra net wealth kept by choosing Acc over Dist in the selected country
}

export interface ChartTimelinePoint {
  date: string;
  yearOffset: number;          // e.g. -5, -3, 0 (Today), +3, +5, +10
  phase: 'historical' | 'forecast';
  totalInvestedEur: number;
  historicalValueEur?: number;
  historicalDistNetEur?: number;
  forecastBaseEur?: number;
  forecastOptimisticEur?: number;
  forecastConservativeEur?: number;
  forecastPostTaxBaseEur?: number;
}

export interface ForecastHorizonSummary {
  horizonYears: 3 | 5 | 10 | 15 | 20;
  totalInvestedEur: number;
  conservativeGrossEur: number;
  baseGrossEur: number;
  optimisticGrossEur: number;
  baseGrossProfitEur: number;
  estimatedExitTaxEur: number;
  estimatedNetPostTaxBaseEur: number;
  effectiveTaxRateAppliedPct: number;
  taxNote: string;
}

export interface FullCalculationOutput {
  countryCode: string;
  backtest3Y: BacktestPeriodMetrics;
  backtest5Y: BacktestPeriodMetrics;
  forecasts: ForecastHorizonSummary[];
  timelineSeries: ChartTimelinePoint[];
  blendedTerPct: number;
  blendedDividendYieldPct: number;
  blendedHistoricalCagr5YPct: number;
  blendedHistoricalCagr3YPct: number;
  blendedVolatilityPct: number;
}

export interface EuropeanBroker {
  id: string;
  name: string;
  logoText: string;
  headquarters: string;
  regulation: string;
  availableInCountries: string[]; // Country codes e.g. ['PT', 'NL', 'DE', 'AT', 'FR', 'ES', 'IT', 'BE', 'IE', 'PL', 'RO', 'CZ']
  autoTaxCountries: string[];     // Countries where broker is "Steuereinfach" / auto-withholds or provides direct official tax form
  portugalTaxHelperNote: string;  // Specific note for PT investors (e.g. XTB provides ready-to-copy IRS Anexo J report)
  germanyTaxNote: string;         // Steuereinfach status in DE/AT
  netherlandsTaxNote: string;     // Annual Box 3 statement support
  etfCommission: string;
  savingsPlanFee: string;         // Sparplan fee
  fxFee: string;
  minMonthlySparplanEur: number;
  fractionalEtfs: boolean;
  ucitsEtfCount: number;
  interestOnCashNote: string;
  pros: string[];
  cons: string[];
  websiteUrl: string;
  comparisonReviewLinks: {
    portalName: string;
    url: string;
  }[];
}

export interface EuropeanPortalResource {
  id: string;
  name: string;
  domain: string;
  category: 'ETF Screener & Analytics' | 'Broker Comparison' | 'Tax & Legal Calculator' | 'Country Official Registry';
  supportedCountries: string[];
  description: string;
  whyUseIt: string;
  baseUrl: string;
  buildIsinDeepLink?: (isin: string, ticker?: string) => string;
}

export interface AcademyLesson {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  readTimeMinutes: number;
  category: 'Core ETF Mechanics' | 'Accumulating vs Distributing' | 'European UCITS & Tax Law' | 'Risk & Portfolio Strategy';
  keyTakeaways: string[];
  sections: {
    heading: string;
    body: string;
    highlightBox?: {
      type: 'tip' | 'warning' | 'math' | 'legal';
      title: string;
      content: string;
    };
  }[];
  interactiveComparison?: {
    leftTitle: string;
    leftPoints: string[];
    rightTitle: string;
    rightPoints: string[];
  };
}

export interface CarefulInvestorChecklistItem {
  id: string;
  category: 'Legal & UCITS' | 'Cost & Tracking' | 'Tax Efficiency (Acc vs Dist)' | 'Diversification & Risk';
  question: string;
  whyItMatters: string;
  recommendedTarget: string;
}
