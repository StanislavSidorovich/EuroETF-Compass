// src/data/europeanPortals.ts
import type { EuropeanBroker, EuropeanPortalResource } from '../types';

export interface EtfExternalPortalLinks {
  justEtf: string;
  extraEtf: string;
  finanzfluss: string;
  curvo: string;
  oekb: string;
  yahooFinance: string;
}

export function getEtfExternalLinks(isin: string, ticker: string): EtfExternalPortalLinks {
  const cleanIsin = encodeURIComponent(isin.trim());
  const cleanTicker = encodeURIComponent(ticker.trim());
  return {
    justEtf:
      isin && isin !== 'Custom Lookup'
        ? `https://www.justetf.com/en/etf-profile.html?isin=${cleanIsin}`
        : `https://www.justetf.com/en/search.html?search=ETFS&query=${cleanTicker}`,
    extraEtf:
      isin && isin !== 'Custom Lookup'
        ? `https://extraetf.com/de/etf-profile/${cleanIsin}`
        : `https://extraetf.com/de/etf-search?query=${cleanTicker}`,
    finanzfluss:
      isin && isin !== 'Custom Lookup'
        ? `https://www.finanzfluss.de/informer/etf/suche/?q=${cleanIsin}`
        : `https://www.finanzfluss.de/informer/etf/suche/?q=${cleanTicker}`,
    curvo: `https://curvo.eu/backtest/en`,
    oekb:
      isin && isin !== 'Custom Lookup'
        ? `https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=${cleanIsin}`
        : `https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f`,
    yahooFinance: `https://finance.yahoo.com/quote/${cleanTicker}`,
  };
}

export const EUROPEAN_PORTALS: EuropeanPortalResource[] = [
  {
    id: 'justetf',
    name: 'justETF.com',
    domain: 'justetf.com',
    category: 'ETF Screener & Analytics',
    supportedCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'RO', 'CZ', 'SE'],
    description:
      'Europe’s #1 UCITS ETF screener, side-by-side comparison engine, savings plan finder, and country-specific ETF guides.',
    whyUseIt:
      'Verify UCITS compliance, exact ISIN/WKN, fund domicile (Ireland vs Luxembourg), replication method, and whether an ETF is Accumulating or Distributing.',
    baseUrl: 'https://www.justetf.com/en/find-etf.html',
    buildIsinDeepLink: (isin: string) => `https://www.justetf.com/en/etf-profile.html?isin=${encodeURIComponent(isin)}`,
  },
  {
    id: 'extraetf',
    name: 'extraETF.com',
    domain: 'extraetf.com',
    category: 'ETF Screener & Analytics',
    supportedCountries: ['DE', 'AT', 'CH', 'NL', 'PT', 'FR', 'ES', 'IT'],
    description:
      'Deep analytics for European ETFs, German/Austrian Vorabpauschale & KESt tax calculators, portfolio trackers, and Sparplan broker ratings.',
    whyUseIt:
      'Compare broker savings plan fees (Sparpläne), simulate German Vorabpauschale tax, and inspect detailed sector/country breakdowns.',
    baseUrl: 'https://extraetf.com/de/',
    buildIsinDeepLink: (isin: string) => `https://extraetf.com/de/etf-profile/${encodeURIComponent(isin)}`,
  },
  {
    id: 'curvo',
    name: 'Curvo.eu',
    domain: 'curvo.eu',
    category: 'Tax & Legal Calculator',
    supportedCountries: ['PT', 'NL', 'BE', 'DE', 'FR', 'ES', 'IT', 'IE', 'AT'],
    description:
      'Pan-European ETF backtesting engine and in-depth country tax guides for Portugal, Netherlands, Belgium, France, Germany, Spain, and Italy.',
    whyUseIt:
      'Best plain-English breakdowns of why Accumulating ETFs beat Distributing ETFs in Portugal, Belgium (TOB & Reynders tax), Netherlands (Box 3), and across the EU.',
    baseUrl: 'https://curvo.eu/backtest/en',
  },
  {
    id: 'bankeronwheels',
    name: 'Banker on Wheels',
    domain: 'bankeronwheels.com',
    category: 'Tax & Legal Calculator',
    supportedCountries: ['PT', 'NL', 'DE', 'FR', 'BE', 'CH', 'GB', 'IE', 'ES', 'IT'],
    description:
      'Institutional-grade European research on UCITS ETF structures, Irish 15% US withholding tax advantages, synthetic vs physical replication, and broker safety.',
    whyUseIt:
      'Understand hidden withholding tax drag (Level 1 & Level 2 taxes), counterparty risk, and which European brokers offer strongest asset segregation.',
    baseUrl: 'https://www.bankeronwheels.com/',
  },
  {
    id: 'finanzfluss',
    name: 'Finanzfluss.de & Finanztip.de',
    domain: 'finanzfluss.de',
    category: 'Broker Comparison',
    supportedCountries: ['DE', 'AT', 'CH', 'NL', 'PT'],
    description:
      'Independent broker comparisons (Depotvergleich), ETF Informer, Vorabpauschale calculators, and fee analyzers.',
    whyUseIt:
      'Quickly compare execution fees, FX spreads, and which exchanges (Xetra, Tradegate, Gettex, Euronext) each European broker routes to.',
    baseUrl: 'https://www.finanzfluss.de/vergleich/depot/',
    buildIsinDeepLink: (isin: string) => `https://www.finanzfluss.de/informer/etf/suche/?q=${encodeURIComponent(isin)}`,
  },
  {
    id: 'trackingdifferences',
    name: 'TrackingDifferences.com',
    domain: 'trackingdifferences.com',
    category: 'ETF Screener & Analytics',
    supportedCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'RO', 'CZ', 'SE'],
    description:
      'Dedicated European database comparing an ETF’s headline TER (Total Expense Ratio) against its real-world historical Tracking Difference (TD).',
    whyUseIt:
      'Discover which UCITS ETFs actually outperform or closely match their index after securities lending and withholding tax treaties.',
    baseUrl: 'https://www.trackingdifferences.com/',
    buildIsinDeepLink: (isin: string) => `https://www.trackingdifferences.com/ETF/ISIN/${encodeURIComponent(isin)}`,
  },
  {
    id: 'portugal-at-cmvm',
    name: 'Portal das Finanças (AT) & CMVM Portugal',
    domain: 'portaldasfinancas.gov.pt',
    category: 'Country Official Registry',
    supportedCountries: ['PT'],
    description:
      'Official Portuguese Tax Authority (Autoridade Tributária - IRS Anexo J / Anexo G) and CMVM Investor Portal (Todos Contam).',
    whyUseIt:
      'Official guidance for declaring foreign ETF sales on IRS Anexo J (Quadro 9.2A), FIFO rules, and Lei n.º 31/2024 holding-period exclusions (10% / 20% / 30% discount after 2, 5, and 8 years).',
    baseUrl: 'https://www.portaldasfinancas.gov.pt/',
  },
  {
    id: 'belastingdienst-nl',
    name: 'Belastingdienst — Netherlands Box 3',
    domain: 'belastingdienst.nl',
    category: 'Country Official Registry',
    supportedCountries: ['NL'],
    description:
      'Official Dutch Tax Administration portal for Box 3 wealth taxation (Sparen en Beleggen), annual Jan 1 valuation rules, and actual return rebuttal (Tegenbewijsregeling).',
    whyUseIt:
      'Check the current Box 3 tax-free allowance (Heffingsvrij vermogen), deemed return percentages for investments, and how to submit actual return calculations.',
    baseUrl: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/box-3',
  },
  {
    id: 'oekb-ictax',
    name: 'OeKB Profitweb (AT) & ICTax (CH)',
    domain: 'my.oekb.at',
    category: 'Country Official Registry',
    supportedCountries: ['AT', 'CH'],
    description:
      'Official Austrian Meldefonds tax registry (OeKB) and Swiss Federal Tax Administration (ESTV ICTax) fund income lookup.',
    whyUseIt:
      'Mandatory check for Austrian investors to verify an ETF is a registered Meldefonds, and for Swiss investors to check taxable virtual dividend income.',
    baseUrl: 'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f',
    buildIsinDeepLink: (isin: string) =>
      `https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=${encodeURIComponent(isin)}`,
  },
];

export const EUROPEAN_BROKERS: EuropeanBroker[] = [
  {
    id: 'xtb',
    name: 'XTB',
    logoText: 'XTB',
    headquarters: 'Warsaw, Poland (Branches in PT, DE, ES, FR, RO, CZ)',
    regulation: 'KNF, CMVM (Registered in Portugal), BaFin (DE), FCA (UK)',
    availableInCountries: ['PT', 'NL', 'DE', 'FR', 'ES', 'IT', 'BE', 'PL', 'RO', 'CZ', 'GB'],
    autoTaxCountries: ['PL', 'RO', 'PT'],
    portugalTaxHelperNote:
      'Standout choice in Portugal: XTB provides a pre-filled annual IRS Tax Report mapping directly to Anexo J (Quadro 9.2A & 8A) with FIFO calculations done for you.',
    germanyTaxNote:
      'Provides an annual German tax report, though investors must copy figures into Anlage KAP (not automatic Steuereinfach withholding like local German banks).',
    netherlandsTaxNote:
      'Provides official annual January 1st portfolio valuation statements required for Dutch Box 3 wealth tax filing.',
    etfCommission: '0% commission on real UCITS ETFs up to €100,000 monthly volume (0.20%, min €10 above €100k)',
    savingsPlanFee: '0% Automated Investment Plans (from €15)',
    fxFee: '0.50% on currency conversion (0% if buying EUR-traded ETFs on Xetra/Euronext)',
    minMonthlySparplanEur: 15,
    fractionalEtfs: true,
    ucitsEtfCount: 1350,
    interestOnCashNote: 'Pays competitive variable interest on uninvested EUR cash.',
    pros: [
      '0% commission up to €100k/mo on EUR UCITS ETFs',
      'Delivers ready-to-use IRS Anexo J tax report for Portugal residents',
      'Local Portuguese customer support & CMVM branch registration',
      'Automated ETF Investment Plans with fractional rights',
    ],
    cons: [
      '0.50% FX fee when buying USD/GBP-denominated listings (avoid by buying EUR tickers like VWCE.DE or EUNL.DE)',
      'Inactivity fee of €10/mo only if no trade in 365 days AND no deposit in 90 days',
    ],
    websiteUrl: 'https://www.xtb.com/pt',
    comparisonReviewLinks: [
      { portalName: 'Curvo Broker Review', url: 'https://curvo.eu/article/xtb-review' },
      { portalName: 'justETF Broker Comparison', url: 'https://www.justetf.com/en/online-broker-comparison/' },
    ],
  },
  {
    id: 'degiro',
    name: 'DEGIRO (flatexDEGIRO Bank)',
    logoText: 'DG',
    headquarters: 'Amsterdam, Netherlands & Frankfurt, Germany',
    regulation: 'DNB & AFM (Netherlands), BaFin (Germany), CMVM notified',
    availableInCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'CZ', 'SE'],
    autoTaxCountries: ['NL'],
    portugalTaxHelperNote:
      'Very popular in Portugal (degiro.pt). Provides an annual tax report summarizing realizations; pair with Accumulating ETFs so you have zero annual dividend declarations until you sell.',
    germanyTaxNote:
      'Operates via flatexDEGIRO; standard DEGIRO accounts require manual Anlage KAP entry using their annual tax report (flatex.de is fully Steuereinfach).',
    netherlandsTaxNote:
      'Native Dutch broker: automatically reports annual January 1st Box 3 balances directly to the Dutch Belastingdienst.',
    etfCommission: '€1.00 handling fee on Core Selection ETFs (€3.00 on standard ETFs)',
    savingsPlanFee: '€1.00 per trade (manual monthly execution; no fractional shares)',
    fxFee: '0.25% AutoFX (0% when trading in EUR on Euronext Amsterdam or Xetra)',
    minMonthlySparplanEur: 50,
    fractionalEtfs: false,
    ucitsEtfCount: 2000,
    interestOnCashNote: 'Uninvested cash held in German flatexDEGIRO Bank account (protected up to €100,000).',
    pros: [
      'Direct access to Euronext Amsterdam (.AS) and Xetra (.DE) with deep liquidity',
      'Automatic Box 3 pre-fill for Netherlands residents',
      'Full European banking license backing via flatexDEGIRO Bank AG',
      'Whole-share ownership with clean custody rules',
    ],
    cons: [
      'No automated monthly direct-debit Sparplan or fractional shares',
      '€2.50 annual connectivity fee per foreign stock exchange outside home market',
    ],
    websiteUrl: 'https://www.degiro.pt/',
    comparisonReviewLinks: [
      { portalName: 'Curvo DEGIRO Guide', url: 'https://curvo.eu/article/degiro-review' },
      { portalName: 'Banker on Wheels Review', url: 'https://www.bankeronwheels.com/degiro-review/' },
    ],
  },
  {
    id: 'trade-republic',
    name: 'Trade Republic Bank',
    logoText: 'TR',
    headquarters: 'Berlin, Germany',
    regulation: 'BaFin & Deutsche Bundesbank (Full ECB Banking License)',
    availableInCountries: ['PT', 'NL', 'DE', 'AT', 'FR', 'ES', 'IT', 'BE', 'IE'],
    autoTaxCountries: ['DE', 'AT'],
    portugalTaxHelperNote:
      'Available across Portugal with €0 ETF savings plans and full ECB deposit rate on cash. Provides an annual country tax summary for IRS Anexo J.',
    germanyTaxNote:
      '100% Steuereinfach in Germany & Austria: automatically handles Abgeltungsteuer, Vorabpauschale, 30% Teilfreistellung, and €1,000 Sparerpauschbetrag (Freistellungsauftrag).',
    netherlandsTaxNote:
      'Provides an annual Dutch tax overview with Jan 1st balances and ECB interest earned for Box 3 declaration.',
    etfCommission: '€1.00 flat settlement fee per single order',
    savingsPlanFee: '€0.00 (Free on 2,500+ UCITS ETF Savings Plans / Sparpläne)',
    fxFee: '0% (All instruments trade directly in EUR via LS Exchange)',
    minMonthlySparplanEur: 1,
    fractionalEtfs: true,
    ucitsEtfCount: 2500,
    interestOnCashNote: 'Passes through the full ECB deposit facility rate on uninvested EUR cash.',
    pros: [
      '2,500+ completely free (€0) automated UCITS ETF savings plans from €1',
      '100% Steuereinfach (automatic tax handling) in Germany and Austria',
      'Full ECB interest rate paid monthly on uninvested cash',
      'Simple mobile & web interface ideal for passive long-term ETF investors',
    ],
    cons: [
      'Routes exclusively through single market maker (LS Exchange / Lang & Schwarz)',
      'Customer support is primarily automated / in-app chat',
    ],
    websiteUrl: 'https://traderepublic.com/',
    comparisonReviewLinks: [
      { portalName: 'Finanzfluss Review', url: 'https://www.finanzfluss.de/anbieter/trade-republic/' },
      { portalName: 'extraETF Sparplan Test', url: 'https://extraetf.com/de/etf-broker/trade-republic-etf-depot' },
    ],
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers (IBKR Ireland)',
    logoText: 'IBKR',
    headquarters: 'Dublin, Ireland (European Hub)',
    regulation: 'Central Bank of Ireland (CBI), SEC, FCA',
    availableInCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'RO', 'CZ', 'SE'],
    autoTaxCountries: ['IE'],
    portugalTaxHelperNote:
      'Top choice for larger Portuguese portfolios (>€25k). Generates comprehensive FIFO realized gain/loss reports in EUR for IRS Anexo J.',
    germanyTaxNote:
      'Foreign broker (Auslandsbroker): does not deduct Vorabpauschale automatically; investors file manually via Anlage KAP & KAP-INV (gives cash-flow deferral until tax return).',
    netherlandsTaxNote:
      'Provides customizable Activity Statements showing exact Jan 1st net asset value for Dutch Box 3.',
    etfCommission: '0.05% of trade value (min €1.25 on Tiered pricing for European ETFs)',
    savingsPlanFee: '€1.25 per recurring investment execution',
    fxFee: '0.002% (min $2) institutional spot FX rate — lowest in the industry',
    minMonthlySparplanEur: 10,
    fractionalEtfs: true,
    ucitsEtfCount: 3500,
    interestOnCashNote: 'Pays tiered market interest rates on cash balances above €10,000.',
    pros: [
      'Gold-standard institutional reputation, 45+ years track record, NASDAQ-listed ($IBKR)',
      'SmartRouting across Xetra, Euronext Amsterdam, Gettex, LSE, and SIX',
      'Near-zero FX conversion costs (0.002%) and access to every UCITS ETF in Europe',
      'Supports automated recurring ETF investments and fractional European ETFs',
    ],
    cons: [
      'Steeper learning curve than neobrokers (use IBKR GlobalTrader app for a simpler UI)',
      'Requires manual tax declaration in Germany, Austria, and Portugal (using IBKR tax reports)',
    ],
    websiteUrl: 'https://www.interactivebrokers.ie/',
    comparisonReviewLinks: [
      { portalName: 'Banker on Wheels IBKR Guide', url: 'https://www.bankeronwheels.com/interactive-brokers-review/' },
      { portalName: 'Curvo IBKR Review', url: 'https://curvo.eu/article/interactive-brokers-review' },
    ],
  },
  {
    id: 'scalable-capital',
    name: 'Scalable Capital',
    logoText: 'SC',
    headquarters: 'Munich, Germany',
    regulation: 'BaFin & Deutsche Bundesbank',
    availableInCountries: ['DE', 'AT', 'NL', 'FR', 'ES', 'IT'],
    autoTaxCountries: ['DE'],
    portugalTaxHelperNote:
      'Primarily focused on DACH, NL, FR, ES, and IT markets; Portuguese residents typically prefer XTB, Trade Republic, DEGIRO, or IBKR.',
    germanyTaxNote:
      '100% Steuereinfach in Germany: automatic calculation of Abgeltungsteuer, Vorabpauschale, Teilfreistellung, and Freistellungsauftrag.',
    netherlandsTaxNote:
      'Available in the Netherlands with annual tax reports ready for Box 3 wealth tax declaration.',
    etfCommission: '€0.99 per trade in FREE Broker (or €0 in PRIME+ flatrate)',
    savingsPlanFee: '€0.00 on all 2,600+ UCITS ETF Savings Plans',
    fxFee: '0% (All ETFs traded in EUR on gettex or Xetra)',
    minMonthlySparplanEur: 1,
    fractionalEtfs: true,
    ucitsEtfCount: 2600,
    interestOnCashNote: 'Competitive interest on uninvested EUR cash.',
    pros: [
      'All 2,600+ UCITS ETFs available with €0 savings plan fees from €1/month',
      'Automatic inflation-adjustment option for monthly ETF savings plans',
      'Choice between gettex (Munich) and Xetra (Frankfurt) execution',
      'Full German Steuereinfach automation',
    ],
    cons: [
      'Not directly onboarding new accounts in all smaller EU countries',
      'Xetra orders carry higher fees than gettex execution',
    ],
    websiteUrl: 'https://scalable.capital/',
    comparisonReviewLinks: [
      { portalName: 'justETF Scalable Review', url: 'https://www.justetf.com/en/online-broker-comparison/' },
      { portalName: 'Finanzfluss Review', url: 'https://www.finanzfluss.de/anbieter/scalable-capital-broker/' },
    ],
  },
  {
    id: 'lightyear',
    name: 'Lightyear Europe',
    logoText: 'LY',
    headquarters: 'Tallinn, Estonia & London, UK',
    regulation: 'EFSA (Estonia / EU MiFID II) & FCA (UK)',
    availableInCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'GB'],
    autoTaxCountries: ['GB'],
    portugalTaxHelperNote:
      'Very popular in Portugal: €0 fee on all UCITS ETFs, Portuguese interface support, and downloadable annual tax statements for IRS Anexo J.',
    germanyTaxNote:
      'Provides downloadable annual activity & gain statements for manual Anlage KAP filing.',
    netherlandsTaxNote:
      'Provides clean annual balance statements for Dutch Box 3 reporting.',
    etfCommission: '€0.00 (Zero execution fee on all UCITS ETFs; fund TER still applies)',
    savingsPlanFee: '€0.00 on recurring auto-invest plans',
    fxFee: '0.35% on currency conversion (0% when depositing and buying EUR ETFs)',
    minMonthlySparplanEur: 1,
    fractionalEtfs: true,
    ucitsEtfCount: 400,
    interestOnCashNote: 'Offers BlackRock Money Market Vaults and uninvested cash interest.',
    pros: [
      '€0 commission on every UCITS ETF with no monthly volume cap',
      'Built-in ISIN and KIID document links for every European ETF',
      'Supports multi-currency sub-accounts (EUR, USD, GBP)',
    ],
    cons: [
      'Curated selection (~400 core UCITS ETFs rather than 2,500+)',
      'Younger platform than IBKR or DEGIRO',
    ],
    websiteUrl: 'https://lightyear.com/eu',
    comparisonReviewLinks: [
      { portalName: 'Curvo Lightyear Review', url: 'https://curvo.eu/article/lightyear-review' },
      { portalName: 'Banker on Wheels Brokers', url: 'https://www.bankeronwheels.com/best-international-brokers/' },
    ],
  },
  {
    id: 'trading212',
    name: 'Trading 212',
    logoText: 'T212',
    headquarters: 'London, UK / Limassol, Cyprus / Frankfurt, Germany',
    regulation: 'FCA (UK), CySEC (EU), BaFin (FXFlat Bank subsidiary)',
    availableInCountries: ['PT', 'NL', 'DE', 'AT', 'IE', 'FR', 'ES', 'IT', 'BE', 'CH', 'GB', 'PL', 'RO', 'CZ', 'SE'],
    autoTaxCountries: ['GB'],
    portugalTaxHelperNote:
      'Widely used in Portugal for custom multi-ETF "Pies" with 1-click rebalancing and an annual realized profit/loss tax statement for Anexo J.',
    germanyTaxNote:
      'Provides annual tax statements; manual entry in German tax return unless migrated to local German bank entity.',
    netherlandsTaxNote:
      'Provides annual Jan 1st portfolio valuation PDF for Belastingdienst Box 3.',
    etfCommission: '€0.00 commission on all ETF trades',
    savingsPlanFee: '€0.00 via custom AutoInvest Pies',
    fxFee: '0.15% FX fee (0% if account and ETF are both in EUR)',
    minMonthlySparplanEur: 1,
    fractionalEtfs: true,
    ucitsEtfCount: 1800,
    interestOnCashNote: 'High daily-paid interest on uninvested EUR, GBP, and USD via QMMFs & banks.',
    pros: [
      'Best-in-class "Pie" builder: combine e.g. 85% VWCE + 15% XEON and auto-invest monthly with 1 click',
      '€0 ETF commissions and very low 0.15% FX fee',
      'Tax-free Stocks & Shares ISA available for UK residents',
    ],
    cons: [
      'Note on Pie rebalancing: selling slices to rebalance triggers a taxable capital gain event in Portugal/EU—prefer "rebalance by new deposits only"',
      'Share lending program enabled if opted in (verify tax implications in your country)',
    ],
    websiteUrl: 'https://www.trading212.com/',
    comparisonReviewLinks: [
      { portalName: 'Curvo Trading 212 Review', url: 'https://curvo.eu/article/trading-212-review' },
      { portalName: 'justETF Comparison', url: 'https://www.justetf.com/en/online-broker-comparison/' },
    ],
  },
];
