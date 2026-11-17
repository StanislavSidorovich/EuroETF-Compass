import type { CountryTaxRule } from '../types';

export const EUROPEAN_COUNTRY_TAXES: CountryTaxRule[] = [
  // =========================================================================
  // FEATURED CORE COUNTRIES (PT, NL, DE)
  // =========================================================================
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    regionGroup: 'Featured Core',
    featuredPriority: true,
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT',
    verdictTitle: 'Accumulating (Acc) ETFs Have a Massive Double Advantage',
    verdictSummary:
      'In Portugal, Distributing ETF dividends are taxed at the full 28% IRS rate every year with zero holding discount. Accumulating ETFs avoid annual dividend tax completely and—under Lei n.º 31/2024—convert reinvested dividends into long-term capital gains eligible for up to 30% tax exclusion (19.6% effective rate after 8 years).',
    capitalGainsTaxRatePct: 28,
    dividendTaxRatePct: 28,
    effectiveEquityEtfTaxRatePct: 19.6, // Effective rate after >8 years holding (30% exclusion on 28%)
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No general annual tax-free allowance for capital gains or dividends (unless opting for progressive income aggregation / Englobamento when total taxable income is low).',
    accumulatingTaxRule:
      '0% tax while held. Reinvested dividends are never taxed annually. When shares are eventually sold (FIFO per broker/ISIN), capital gains are taxed at 28% minus the Lei n.º 31/2024 holding-period exemption (10% off at 2–5y, 20% off at 5–8y, 30% off at >8y).',
    distributingTaxRule:
      'Cash dividends paid out (Category E) are taxed at a flat 28% every year in the IRS declaration (even if you immediately reinvest them yourself), permanently losing compounding capital and receiving NO holding-period discount.',
    holdingPeriodDiscounts: [
      {
        yearsMin: 0,
        yearsMax: 2,
        exemptionPct: 0,
        effectiveTaxRatePct: 28.0,
        label: 'Short-term (< 2 years): 0% exemption → 28.0% IRS tax',
      },
      {
        yearsMin: 2,
        yearsMax: 5,
        exemptionPct: 10,
        effectiveTaxRatePct: 25.2,
        label: 'Medium-term (2–5 years): 10% exclusion → 25.2% effective IRS tax',
      },
      {
        yearsMin: 5,
        yearsMax: 8,
        exemptionPct: 20,
        effectiveTaxRatePct: 22.4,
        label: 'Long-term (5–8 years): 20% exclusion → 22.4% effective IRS tax',
      },
      {
        yearsMin: 8,
        yearsMax: null,
        exemptionPct: 30,
        effectiveTaxRatePct: 19.6,
        label: 'Ultra Long-term (> 8 years): 30% exclusion → 19.6% effective IRS tax',
      },
    ],
    specialWrapperName: 'Lei n.º 31/2024 Long-Term Holding Exclusion & PPR',
    specialWrapperDetails:
      'Securities/UCITS ETFs held for >8 years automatically qualify for a 30% capital gains exclusion (19.6% effective tax). Ensure your ETF is NOT domiciled in a Portuguese tax-haven blacklist jurisdiction (use standard IE or LU UCITS ETFs—never blacklisted jurisdictions, which trigger a punitive 35% rate).',
    taxDeclarationForm:
      'Modelo 3 IRS: Anexo J — Quadro 9.2A (Foreign Broker Capital Gains, FIFO) & Quadro 8A (Foreign Dividends); Anexo G for Portuguese domestic brokers.',
    localAuthorityName: 'Autoridade Tributária e Aduaneira (Portal das Finanças)',
    localAuthorityUrl: 'https://www.portaldasfinancas.gov.pt',
    recommendedPortals: [
      {
        name: 'Portal das Finanças (AT)',
        url: 'https://www.portaldasfinancas.gov.pt',
        description: 'Official Portuguese IRS Modelo 3 filing portal (Anexo J & Anexo G).',
      },
      {
        name: 'Curvo — Investing in Portugal Guide',
        url: 'https://curvo.eu/article/investing-in-etfs-portugal',
        description: 'Detailed guide on Portuguese ETF taxation, FIFO, and Anexo J.',
      },
      {
        name: 'justETF Portugal Guide',
        url: 'https://www.justetf.com/en/',
        description: 'Verify Irish (IE) or Luxembourg (LU) UCITS domicile to avoid 35% blacklist rate.',
      },
    ],
    keyLegalWarnings: [
      'FIFO (First-In, First-Out) applies strictly per ISIN when calculating holding duration for Lei n.º 31/2024 discounts.',
      'Holdings must be in non-blacklisted jurisdictions: standard Irish (IE) and Luxembourg (LU) UCITS ETFs are fully compliant and safe.',
      'Foreign broker IBANs/accounts must also be declared in Anexo J Quadro 11.',
      '365-day rule (Englobamento obrigatório): Mandatory aggregation into progressive IRS brackets (up to 48%+) ONLY applies if assets are held <365 days AND total taxable income exceeds the top IRS bracket (~€80,000+); buy-and-hold ETF investors (>1 year) are completely unaffected.',
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    regionGroup: 'Featured Core',
    featuredPriority: true,
    archetype: 'WEALTH_OR_DEEMED_DISPOSAL',
    verdict: 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT',
    verdictTitle: 'Box 3 Wealth Tax: Acc & Dist Taxed Equally on Portfolio Value (Acc Wins on Convenience)',
    verdictSummary:
      'The Netherlands taxes net wealth annually in Box 3 rather than realized capital gains or dividends. Whether you hold Acc or Dist UCITS ETFs, the Belastingdienst calculates a deemed return above your ~€57,000 tax-free threshold. Accumulating ETFs remain preferred for effortless fee-free compounding (watch Dutch dividend withholding leakage on FBI funds vs Irish UCITS).',
    capitalGainsTaxRatePct: 0,
    dividendTaxRatePct: 0,
    effectiveEquityEtfTaxRatePct: 2.16, // ~36% tax on ~6.0% deemed investment return in Box 3 (~2.16% of assets above exemption)
    annualTaxFreeAllowanceEur: 57000,
    allowanceDescription:
      'Heffingsvrij vermogen (tax-free net wealth allowance): ~€57,000 per individual (€114,000 for fiscal partners) in Box 3. Portfolios below this threshold pay €0 Box 3 tax.',
    accumulatingTaxRule:
      '0% capital gains tax upon sale. Portfolio value on January 1st (Peildatum) is counted toward Box 3 net wealth and taxed via the deemed return formula (~6% deemed return × 36% Box 3 tax rate ≈ ~2.16%/yr on assets above the allowance, or actual return if lower under the Counter-evidence rule / Tegenbewijsregeling).',
    distributingTaxRule:
      'Same Box 3 Peildatum wealth tax applies. Cash dividends paid out are NOT separately taxed in Box 3 (unless reinvested into cash/assets held on Jan 1), though Dutch dividend tax (15% on NL-domiciled funds) is reclaimed via Box 3/income tax; Irish (IE) UCITS ETFs have 0% Irish withholding tax.',
    specialWrapperName: 'Box 3 Heffingsvrij Vermogen & Pensioenbeleggen (Box 1)',
    specialWrapperDetails:
      'Long-term retirement investing inside a blocked Dutch Pensioenrekening (Box 1, e.g., Brand New Day, Meesman, DEGIRO Pensioen) is exempt from Box 3 wealth tax and offers upfront income tax deduction up to your Jaarruimte.',
    taxDeclarationForm:
      'Belastingdienst Aangifte Inkomstenbelasting — Box 3 (Sparen en Beleggen, Jan 1 Peildatum snapshot).',
    localAuthorityName: 'Belastingdienst',
    localAuthorityUrl: 'https://www.belastingdienst.nl',
    recommendedPortals: [
      {
        name: 'Belastingdienst Box 3 Portal',
        url: 'https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/box-3',
        description: 'Official Dutch Box 3 rates, Heffingsvrij vermogen thresholds, and Tegenbewijs rules.',
      },
      {
        name: 'Indexfondsenvergelijken.nl',
        url: 'https://www.indexfondsenvergelijken.nl',
        description: 'Compare dividend leakage (dividendlek) across VWCE, IWDA, and Dutch FBI index funds.',
      },
      {
        name: 'Curvo Netherlands ETF Guide',
        url: 'https://curvo.eu/article/investing-in-etfs-netherlands',
        description: 'Walkthrough on Box 3, Irish UCITS vs Dutch FBI funds, and broker reporting.',
      },
    ],
    keyLegalWarnings: [
      'Transition alert: The Dutch government is preparing a new Box 3 system based on actual returns (Werkelijk Rendement) targeted around 2028—stay updated via Belastingdienst.',
      'Under the Tegenbewijsregeling (counter-evidence rule), if your actual return in a given year was lower than the deemed ~6% rate, you can submit actual portfolio statements to reduce Box 3 tax.',
      'Dividend leakage (dividendlek): Irish UCITS ETFs (like VWCE/IWDA) lose 15% US dividend withholding internally (~0.25-0.30%/yr), whereas Dutch FBI funds (e.g. Northern Trust via major NL banks) can reclaim it.',
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    regionGroup: 'Featured Core',
    featuredPriority: true,
    archetype: 'IMPUTED_ANNUAL_TAX_HYBRID',
    verdict: 'DIST_UP_TO_ALLOWANCE_THEN_ACC',
    verdictTitle: 'Hybrid Strategy: Dist Up to €1,000 Sparerpauschbetrag, Then Acc',
    verdictSummary:
      'Germany levies 26.375% Abgeltungsteuer (incl. Soli), reduced by a 30% Teilfreistellung on equity ETFs (>50% stocks) for an effective 18.4625% tax rate. Accumulating ETFs face an annual advance tax (Vorabpauschale), so both Acc and Dist are closely balanced. Use Dist (or targeted sales) to exhaust your €1,000 Sparerpauschbetrag (€2,000 joint), then switch to Acc for effortless compounding.',
    capitalGainsTaxRatePct: 26.375,
    dividendTaxRatePct: 26.375,
    effectiveEquityEtfTaxRatePct: 18.4625, // 26.375% * (1 - 0.30 Teilfreistellung)
    annualTaxFreeAllowanceEur: 1000,
    allowanceDescription:
      '€1,000 Sparerpauschbetrag per person (€2,000 for married couples filing jointly) via a Freistellungsauftrag at your Steuereinfach German broker.',
    accumulatingTaxRule:
      'Subject to the annual Vorabpauschale (advance lump-sum tax calculated in January using the Bundesbank Basiszins, capped at actual annual fund gain, with 30% Teilfreistellung applied). Any Vorabpauschale paid is credited against final capital gains tax when you eventually sell.',
    distributingTaxRule:
      'Cash dividends are taxed immediately at 18.4625% effective rate (after 30% Teilfreistellung on equity ETFs), consuming your €1,000 Sparerpauschbetrag first. If cash dividends exceed the Vorabpauschale, no extra Vorabpauschale is charged.',
    specialWrapperName: '30% Teilfreistellung (Equity ETFs) + €1,000 Sparerpauschbetrag',
    specialWrapperDetails:
      'Equity ETFs holding >50% stocks legally enjoy a 30% partial tax exemption (Teilfreistellung) on all dividends, Vorabpauschale, and capital gains. Money market / bond ETFs (like XEON) receive 0% Teilfreistellung (taxed at full 26.375%).',
    taxDeclarationForm:
      'Automatic withholding by German Steuereinfach brokers (Freistellungsauftrag); foreign brokers require Einkommensteuererklärung Anlage KAP & Anlage KAP-INV.',
    localAuthorityName: 'Bundeszentralamt für Steuern (BZSt)',
    localAuthorityUrl: 'https://www.bzst.de',
    recommendedPortals: [
      {
        name: 'Finanzfluss Vorabpauschale & ETF Rechner',
        url: 'https://www.finanzfluss.de/rechner/vorabpauschale-berechnen/',
        description: 'Calculate exact annual Vorabpauschale and Sparerpauschbetrag usage.',
      },
      {
        name: 'extraETF Sparplan & Steuer-Guide',
        url: 'https://extraetf.com/de/etf-sparplan',
        description: 'Compare free German ETF Sparpläne and Steuereinfach brokers.',
      },
      {
        name: 'Finanztip ETF-Steuern Guide',
        url: 'https://www.finanztip.de/indexfonds-etf/etf-steuern/',
        description: 'Consumer-advocate guide to Teilfreistellung and Abgeltungsteuer.',
      },
    ],
    keyLegalWarnings: [
      'Always submit a Freistellungsauftrag to your German broker before year-end to claim the €1,000 (€2,000 joint) exemption automatically.',
      'Ensure you have enough cash in your broker clearing account (Verrechnungskonto) in early January to cover the Vorabpauschale debit.',
      'Using a non-German broker (e.g. IBKR, DEGIRO) removes automatic tax withholding and forces complex manual Anlage KAP-INV calculations for Vorabpauschale.',
    ],
  },

  // =========================================================================
  // 12 ADDITIONAL MAJOR EUROPEAN COUNTRIES
  // =========================================================================
  {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    regionGroup: 'DACH',
    archetype: 'IMPUTED_ANNUAL_TAX_HYBRID',
    verdict: 'ACC_PREFERRED_WITH_REPORTING_CHECK',
    verdictTitle: 'Verify OeKB Meldefonds Status! Acc Still Retains ~40% Deferral',
    verdictSummary:
      'Austria applies a 27.5% KESt flat tax on all ETF gains and dividends. Accumulating ETFs must be registered as "Meldefonds" with OeKB: 60% of undistributed deemed income (AgE) is taxed annually while ~40% of capital gains remain deferred—making Meldefonds Acc slightly superior to Dist.',
    capitalGainsTaxRatePct: 27.5,
    dividendTaxRatePct: 27.5,
    effectiveEquityEtfTaxRatePct: 27.5,
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No general annual capital gains allowance (outside €22/yr trivial dividend rules; loss offsetting works automatically within a Steuereinfach Austrian broker).',
    accumulatingTaxRule:
      'For OeKB-registered Meldefonds, Ausschüttungsgleiche Erträge (AgE) are calculated once per fund fiscal year and taxed at 27.5% KESt (raising your tax cost basis so you are not double-taxed on sale). Non-Meldefonds ("Schwarze Fonds") suffer punitive flat-rate annual taxation!',
    distributingTaxRule:
      'Cash distributions are taxed at 27.5% KESt immediately upon payout. Note: Distributing ETFs can still have minor AgE reports via OeKB.',
    specialWrapperName: 'OeKB Meldefonds Registry + Austrian Steuereinfach Broker',
    specialWrapperDetails:
      'Austrian residents should prioritize Steuereinfach brokers (e.g., Flatex.at, DADAT, Easybank) AND verify every ETF ISIN on my.oekb.at before buying.',
    taxDeclarationForm:
      'Automatic 27.5% KESt with Austrian Steuereinfach brokers; otherwise manual Einkommensteuererklärung E1 + E1kv.',
    localAuthorityName: 'Bundesministerium für Finanzen (BMF) & OeKB',
    localAuthorityUrl: 'https://my.oekb.at',
    recommendedPortals: [
      {
        name: 'OeKB Profitweb (Meldefonds Check)',
        url: 'https://my.oekb.at',
        description: 'Official Austrian registry to verify Meldefonds status and AgE reports by ISIN.',
      },
      {
        name: 'Broker-Test.at (Steuereinfach)',
        url: 'https://www.broker-test.at',
        description: 'Austrian broker comparison for Steuereinfach ETF investing.',
      },
    ],
    keyLegalWarnings: [
      'CRITICAL: Never buy a Non-Meldefonds ETF in Austria—it is taxed punitively on 90% of annual price gains or at least 10% of year-end NAV.',
      'Using foreign non-Steuereinfach brokers (like Trade Republic DE/foreign or IBKR) requires complex manual E1kv tax reporting of every OeKB AgE event.',
    ],
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    regionGroup: 'Western Europe',
    archetype: 'WEALTH_OR_DEEMED_DISPOSAL',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: '41% Exit Tax & 8-Year Deemed Disposal (Acc Defers Years 1–7)',
    verdictSummary:
      'Ireland imposes one of Europe’s harshest ETF tax regimes: 41% Exit Tax on UCITS ETFs plus a mandatory 8-Year Deemed Disposal rule taxing unrealized gains every 8 years. Accumulating ETFs are still preferred over Distributing ETFs because they avoid paying 41% tax on dividends during years 1–7.',
    capitalGainsTaxRatePct: 41,
    dividendTaxRatePct: 41,
    effectiveEquityEtfTaxRatePct: 41,
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'The standard €1,270 annual CGT exemption does NOT apply to UCITS ETFs under Irish Exit Tax (Gross Roll-Up) rules.',
    accumulatingTaxRule:
      'No tax on reinvested dividends during years 1–7. On the 8th anniversary of purchase (Deemed Disposal), 41% Exit Tax is due on the unrealized gain, resetting the 8-year clock.',
    distributingTaxRule:
      'Every cash dividend received is immediately subject to 41% Exit Tax (self-assessed via Form 11 / Revenue myAccount), reducing compounding every year.',
    specialWrapperName: 'Employer Pension / PRSA (Tax-Exempt Growth)',
    specialWrapperDetails:
      'Maximize Irish Pension / PRSA contributions before taxable ETFs—pension funds grow free of the 41% Exit Tax and 8-year Deemed Disposal.',
    taxDeclarationForm:
      'Revenue Form 11 (self-assessed) or Revenue myAccount (Form 12) under Offshore Funds / Domestic Exit Tax.',
    localAuthorityName: 'Revenue Commissioners (Ireland)',
    localAuthorityUrl: 'https://www.revenue.ie',
    recommendedPortals: [
      {
        name: 'Revenue.ie — Exchange Traded Funds',
        url: 'https://www.revenue.ie',
        description: 'Official guidance on Irish ETF Exit Tax and 8-year Deemed Disposal.',
      },
      {
        name: 'r/irishpersonalfinance Wiki',
        url: 'https://www.justetf.com/en/',
        description: 'Check UCITS domicile (IE/EU) to confirm 41% Exit Tax vs 33% CGT rules.',
      },
    ],
    keyLegalWarnings: [
      'Losses on one UCITS ETF generally CANNOT be offset against gains on another ETF or standard shares under the 41% Exit Tax regime.',
      'Track every purchase lot separately—each monthly DCA buy triggers its own 8-year Deemed Disposal clock.',
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    regionGroup: 'Western Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: 'Use PEA (17.2% After 5 Years) + Accumulating ETFs',
    verdictSummary:
      'In a standard CTO (Compte-Titres Ordinaire), France applies the 30% Flat Tax (PFU), making Accumulating ETFs clearly superior by deferring dividend tax. Better yet, inside a PEA (Plan d’Épargne en Actions) held for 5+ years, gains and dividends are exempt from income tax—paying only 17.2% social charges (prélèvements sociaux) upon withdrawal!',
    capitalGainsTaxRatePct: 30,
    dividendTaxRatePct: 30,
    effectiveEquityEtfTaxRatePct: 17.2, // Inside PEA after 5 years (or 30% PFU in CTO)
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No general euro capital gains allowance in CTO, but PEA has a €150,000 contribution ceiling (unlimited growth) with 0% income tax after 5 years.',
    accumulatingTaxRule:
      '0% tax while held in CTO (until sold) and 0% tax while held or traded inside a PEA (tax occurs only upon cash withdrawal from the PEA wrapper).',
    distributingTaxRule:
      'In a standard CTO, dividends are immediately taxed at 30% PFU (12.8% income tax + 17.2% social charges). Inside a PEA, dividends stay inside the wrapper tax-free until withdrawn, though Acc still avoids manual reinvestment fees.',
    specialWrapperName: 'PEA (Plan d’Épargne en Actions) — Synthetic World ETFs',
    specialWrapperDetails:
      'To hold MSCI World or S&P 500 inside a PEA (which legally requires ≥75% EU equities), French investors use UCITS synthetic swap ETFs like Amundi MSCI World (EWLD/CW8) or iShares MSCI World Swap PEA (WPEA).',
    taxDeclarationForm:
      'Déclaration de revenus 2042 + Formulaire 2074 (CTO gains) + 3916 (foreign broker accounts like DEGIRO/IBKR/Trade Republic).',
    localAuthorityName: 'Direction Générale des Finances Publiques (impots.gouv.fr)',
    localAuthorityUrl: 'https://www.impots.gouv.fr',
    recommendedPortals: [
      {
        name: 'impots.gouv.fr',
        url: 'https://www.impots.gouv.fr',
        description: 'Official French tax portal for 2042, 2074, and 3916 foreign account filings.',
      },
      {
        name: 'justETF France PEA Screener',
        url: 'https://www.justetf.com/fr/',
        description: 'Filter ETFs explicitly eligible for the French PEA tax wrapper.',
      },
    ],
    keyLegalWarnings: [
      'Foreign broker accounts (IBKR, DEGIRO, Trade Republic without FR IBAN) MUST be declared annually on Form 3916 or face €1,500+ fines per undeclared account.',
      'Withdrawing from a PEA before the 5-year mark triggers full 30% PFU taxation and usually closes the PEA.',
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    regionGroup: 'Southern Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: 'Accumulating ETFs Defer Progressive 19%–28% Savings Tax',
    verdictSummary:
      'Spain taxes savings income (Base del Ahorro) progressively from 19% up to 28% (30% above €300k). Accumulating ETFs let you compound 100% of gross dividends without triggering annual IRPF withholding. Note: unlike mutual funds (Fondos de Inversión), ETFs do NOT enjoy tax-free switching (Traspaso) in Spain.',
    capitalGainsTaxRatePct: 23, // Representative mid-bracket (19%–28%)
    dividendTaxRatePct: 23,
    effectiveEquityEtfTaxRatePct: 21, // Typical blended 19% first €6k + 21% next €44k
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No capital gains allowance, though progressive Base del Ahorro starts at 19% (up to €6,000), 21% (€6k–€50k), 23% (€50k–€200k), 27% (€200k–€300k), and 28%/30% above.',
    accumulatingTaxRule:
      '0% annual tax while held. Reinvested dividends compound tax-deferred until sale, when FIFO capital gains enter the Base del Ahorro (19%–28%).',
    distributingTaxRule:
      'Dividends are taxed immediately in the year received at 19%–28% (with 19% withholding if held at a Spanish broker), creating continuous compounding drag.',
    specialWrapperName: 'Index Mutual Funds (Fondos Indexados) vs. UCITS ETFs',
    specialWrapperDetails:
      'In Spain, regulated mutual index funds (like MyInvestor Vanguard/Fidelity funds) allow tax-free transfers (Traspasos) between funds, whereas UCITS ETFs trigger capital gains when sold to rebalance.',
    taxDeclarationForm:
      'IRPF Renta (Casillas de Ganancias y Pérdidas Patrimoniales, FIFO) + Modelo 720 if foreign assets > €50,000.',
    localAuthorityName: 'Agencia Tributaria (AEAT)',
    localAuthorityUrl: 'https://sede.agenciatributaria.gob.es',
    recommendedPortals: [
      {
        name: 'Agencia Tributaria (AEAT)',
        url: 'https://sede.agenciatributaria.gob.es',
        description: 'Official Spanish Renta IRPF and Modelo 720 filing portal.',
      },
      {
        name: 'justETF Spain',
        url: 'https://www.justetf.com/es/',
        description: 'Compare UCITS Acc ETFs available in Spain.',
      },
    ],
    keyLegalWarnings: [
      'Modelo 720: Mandatory informative declaration if foreign-held securities/cash exceed €50,000 as of Dec 31 (e.g., IBKR, DEGIRO, Trading 212).',
      'Anti-wash-sale rule (2-month rule): Losses sold cannot be offset if you buy back the same ISIN within 2 months before or after.',
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    regionGroup: 'Southern Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: 'Accumulating ETFs Defer 26% Tax & Avoid Italy’s Redditi di Capitale Trap',
    verdictSummary:
      'Italy taxes UCITS ETF dividends and gains at 26% Imposta Sostitutiva (plus 0.20% annual IVAFE / Imposta di Bollo wealth stamp duty). Accumulating ETFs defer the 26% dividend tax completely. Crucial Italian quirk: ETF capital gains count as "Redditi di Capitale", which CANNOT be offset against prior ETF capital losses ("Minusvalenze")!',
    capitalGainsTaxRatePct: 26,
    dividendTaxRatePct: 26,
    effectiveEquityEtfTaxRatePct: 26,
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No general annual tax-free allowance. Government bonds (white-listed sovereigns) enjoy a reduced 12.5% rate instead of 26%.',
    accumulatingTaxRule:
      '0% income tax while held (only 0.20% annual Imposta di Bollo / IVAFE stamp duty applies regardless of Acc/Dist). Full 26% applies on realized gains at sale.',
    distributingTaxRule:
      'Every cash dividend is taxed at 26% immediately on payout, losing a quarter of every dividend before you can reinvest it.',
    specialWrapperName: 'Regime Amministrato vs. Regime Dichiarativo',
    specialWrapperDetails:
      'Italian domestic brokers (Directa, Fineco) offer Regime Amministrato (automatic 26% + Bollo withholding), whereas foreign brokers (IBKR, DEGIRO, Scalable) require Regime Dichiarativo (Modello Redditi RW/RT/RM).',
    taxDeclarationForm:
      'Automatic in Regime Amministrato; otherwise Modello Redditi PF (Quadri RW, RT, RM) for Regime Dichiarativo.',
    localAuthorityName: 'Agenzia delle Entrate',
    localAuthorityUrl: 'https://www.agenziaentrate.gov.it',
    recommendedPortals: [
      {
        name: 'Agenzia delle Entrate',
        url: 'https://www.agenziaentrate.gov.it',
        description: 'Official Italian tax portal for Modello Redditi PF and IVAFE.',
      },
      {
        name: 'justETF Italia',
        url: 'https://www.justetf.com/it/',
        description: 'Screen Borsa Italiana (MIL) UCITS ETFs.',
      },
    ],
    keyLegalWarnings: [
      'Italian ETF loss trap: Positive gains on UCITS ETFs are "Redditi di Capitale" and CANNOT offset "Minusvalenze" (capital losses) from selling ETFs at a loss! (Only ETCs/single stocks/certificates generate "Redditi Diversi" that offset Minusvalenze).',
      '0.20% annual Imposta di Bollo / IVAFE applies to total portfolio value.',
    ],
  },
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    regionGroup: 'Western Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: 'Acc Equity ETFs Avoid 30% Dividend Tax (Watch 0.12% vs 1.32% TOB!)',
    verdictSummary:
      'Belgium taxes cash dividends at 30% (Roerende Voorheffing), whereas private long-term equity capital gains enjoy a €10,000 annual exemption (and traditionally 0% for "normal management", with 10% CGT above €10k exemption introduced in recent Belgian tax reform). Accumulating equity ETFs completely avoid the 30% annual dividend tax! Crucially, choose ETFs NOT registered in Belgium to pay 0.12% TOB instead of 1.32%.',
    capitalGainsTaxRatePct: 10, // Recent Belgian reform: 10% above €10,000 annual exemption (0% within exemption; bond ETFs face 30% Reynders Tax)
    dividendTaxRatePct: 30,
    effectiveEquityEtfTaxRatePct: 0, // 0% up to €10,000 annual capital gain exemption for private investors
    annualTaxFreeAllowanceEur: 10000,
    allowanceDescription:
      'Under Belgium’s capital gains framework, €10,000/yr of realized gains is exempt (plus €833 dividend exemption reclaimed in tax return, which does NOT apply to ETF dividends—only individual stocks!).',
    accumulatingTaxRule:
      '0% annual dividend tax on Accumulating equity ETFs! Note two critical Belgian rules: (1) TOB transaction tax on buy/sell is 0.12% if the Acc ETF is NOT registered in Belgium (e.g. IWDA/SXR8), vs 1.32% if registered in Belgium (e.g. VWCE!). (2) Bond/Money Market ETFs (>10% bonds, e.g. XEON) trigger the 30% Reynders Tax on bond capital gains.',
    distributingTaxRule:
      '30% Roerende Voorheffing withholding tax on every single dividend paid out (the €833 Belgian dividend tax exemption applies ONLY to individual stocks, NOT ETFs). TOB is 0.12% for Dist ETFs.',
    specialWrapperName: '0.12% TOB Optimization (Non-BE Registered Acc ETFs)',
    specialWrapperDetails:
      'Belgian investors often combine IWDA (88%) + EMIM (12%) or SPYI/IMIE instead of VWCE because Vanguard registered VWCE in Belgium (triggering 1.32% TOB per trade), whereas IWDA/EMIM/SPYI pay only 0.12% TOB!',
    taxDeclarationForm:
      'Monthly/Bi-monthly TOB Form (if using foreign broker like IBKR/Trading 212) + Annual NBB Central Point of Contact (CAP) + Personenaangifte.',
    localAuthorityName: 'FPS Finance Belgium (Financien.belgium.be)',
    localAuthorityUrl: 'https://finance.belgium.be',
    recommendedPortals: [
      {
        name: 'Curvo Belgium ETF Tax & TOB Guide',
        url: 'https://curvo.eu/article/tob',
        description: 'Definitive Belgian TOB (0.12% vs 1.32%) and Reynders Tax lookup guide.',
      },
      {
        name: 'FPS Finance Belgium',
        url: 'https://finance.belgium.be',
        description: 'Official Belgian tax portal and NBB foreign account registry.',
      },
    ],
    keyLegalWarnings: [
      'Check TOB registration status before buying: VWCE triggers 1.32% TOB (capped at €4,000) in Belgium, while IWDA, EMIM, and SXR8 trigger only 0.12% TOB (capped at €1,300)!',
      'Reynders Tax: Any ETF with >10% bonds/cash (including money market ETF XEON) faces 30% tax on realized gains.',
      'Foreign brokers (IBKR, Trading 212) do NOT withhold TOB—you must file and pay TOB yourself within 2 months unless using a Belgian/TOB-handling broker (Bolero, Saxo, DEGIRO, Keytrade).',
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    regionGroup: 'DACH',
    archetype: 'IMPUTED_ANNUAL_TAX_HYBRID',
    verdict: 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT',
    verdictTitle: '0% Capital Gains Tax! Dividends Taxed Annually (Acc & Dist Alike via ICTax)',
    verdictSummary:
      'Switzerland is famous for 0% Capital Gains Tax for private investors. However, the Swiss tax office (ESTV ICTax) taxes the underlying dividend income of BOTH Distributing and Accumulating ETFs every year at your marginal income tax rate, plus minor cantonal wealth tax. Acc wins slightly on automatic zero-fee reinvestment.',
    capitalGainsTaxRatePct: 0,
    dividendTaxRatePct: 22, // Varies by Canton (~15%–35% marginal income tax)
    effectiveEquityEtfTaxRatePct: 0, // 0% on price appreciation / capital gains
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      '0% Capital Gains Tax for private individuals (regardless of amount). Cantonal wealth tax exemptions vary by canton.',
    accumulatingTaxRule:
      '0% capital gains tax on price growth! However, internal dividends reinvested inside Acc ETFs are published in the ESTV ICTax database and taxed annually as regular income.',
    distributingTaxRule:
      '0% capital gains tax on price growth; cash dividends are taxed annually at your marginal income tax rate.',
    specialWrapperName: 'Säule 3a (Pillar 3a) & US-Domiciled ETFs (VT / VTI)',
    specialWrapperDetails:
      'Unlike EU residents blocked by PRIIPs, Swiss residents CAN legally buy US-domiciled ETFs (like VT or VOO) via IBKR/Swissquote and reclaim the 15% US dividend withholding tax via DA-1 form!',
    taxDeclarationForm:
      'Cantonal Tax Return Wertschriftenverzeichnis (matching ESTV ICTax values) + Form DA-1 for US withholding credit.',
    localAuthorityName: 'Swiss Federal Tax Administration (ESTV / ICTax)',
    localAuthorityUrl: 'https://www.ictax.admin.ch',
    recommendedPortals: [
      {
        name: 'ESTV ICTax Kurslisten',
        url: 'https://www.ictax.admin.ch',
        description: 'Official Swiss federal database showing taxable income per ETF share for Acc & Dist.',
      },
      {
        name: 'The Poor Swiss — ETF Guide',
        url: 'https://thepoorswiss.com',
        description: 'Comprehensive Swiss ETF, DA-1, and broker tax optimization guide.',
      },
    ],
    keyLegalWarnings: [
      'To maintain 0% Capital Gains Tax status, follow the 5 ESTV criteria (hold >6 months, no frequent leveraged trading, etc.) so you are not classified as a professional trader.',
      'Swiss Stamp Duty (Stempelsteuer) applies on Swiss brokers (0.075%–0.15%)—foreign brokers like IBKR avoid Swiss stamp duty.',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    regionGroup: 'Nordics & UK',
    archetype: 'IMPUTED_ANNUAL_TAX_HYBRID',
    verdict: 'ACC_PREFERRED_WITH_REPORTING_CHECK',
    verdictTitle: '0% Tax Inside £20k ISA! Outside ISA, ERI Taxes Acc Dividends Annually',
    verdictSummary:
      'Inside a UK Stocks & Shares ISA (£20,000/yr allowance) or SIPP, all capital gains and dividends are 100% tax-free—Accumulating ETFs win on convenience. Outside an ISA (General Investment Account), Accumulating ETFs still trigger dividend tax via Excess Reportable Income (ERI), requiring careful cost-basis tracking.',
    capitalGainsTaxRatePct: 24, // Higher rate UK CGT (18% basic / 24% higher)
    dividendTaxRatePct: 33.75, // Higher rate UK dividend tax (8.75% basic / 33.75% higher)
    effectiveEquityEtfTaxRatePct: 0, // 0% inside £20,000/yr Stocks & Shares ISA
    annualTaxFreeAllowanceEur: 23500, // ~£20,000 ISA annual allowance (~€23,500) + £3,000 CGT / £500 dividend allowance in GIA
    allowanceDescription:
      '£20,000/year Stocks & Shares ISA tax-free shelter (all gains & dividends 0%). Outside ISA (GIA): £3,000 annual CGT allowance and £500 annual dividend allowance.',
    accumulatingTaxRule:
      'Inside ISA/SIPP: 0% tax. In a GIA: you must hold funds with "UK Reporting Fund Status" (all major iShares/Vanguard UCITS ETFs have it). Annual Excess Reportable Income (ERI) is taxed as dividend income—remember to add taxed ERI to your CGT cost basis to prevent double taxation on sale!',
    distributingTaxRule:
      'Inside ISA/SIPP: 0% tax. In a GIA: cash dividends above the £500 dividend allowance are taxed at 8.75% / 33.75% / 39.35%, making record-keeping simpler than ERI on Acc ETFs.',
    specialWrapperName: 'Stocks & Shares ISA (£20,000/yr) & SIPP',
    specialWrapperDetails:
      'Always fill your £20,000 annual ISA allowance first—zero UK tax declaration required, zero CGT, and zero dividend tax forever.',
    taxDeclarationForm:
      'None inside ISA; Self Assessment SA100 / SA106 (Foreign Income) / SA108 (Capital Gains) for GIA.',
    localAuthorityName: 'HM Revenue & Customs (HMRC)',
    localAuthorityUrl: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
    recommendedPortals: [
      {
        name: 'GOV.UK — Stocks & Shares ISA & CGT',
        url: 'https://www.gov.uk/individual-savings-accounts',
        description: 'Official HMRC ISA allowance, dividend tax, and CGT guidance.',
      },
      {
        name: 'justETF UK',
        url: 'https://www.justetf.com/uk/',
        description: 'Check GBP/LSE tickers (VWRP, VWRL, SWDA, CSPX) and UK Reporting Fund status.',
      },
    ],
    keyLegalWarnings: [
      'In a taxable GIA, many UK investors actually prefer Distributing ETFs because tracking ERI (Excess Reportable Income) on Accumulating ETFs for Section 104 CGT cost-basis adjustments is notoriously tedious.',
      'Only buy offshore UCITS ETFs with HMRC "Reporting Fund Status"—non-reporting funds are taxed at full income tax rates (up to 45%) on capital gains!',
    ],
  },
  {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    regionGroup: 'Central & Eastern Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: 'Accumulating ETFs Defer 19% Belka Tax (Use IKE / IKZE First)',
    verdictSummary:
      'Poland levies a flat 19% capital gains and dividend tax ("Podatek Belki"). Accumulating UCITS ETFs strongly outperform Distributing ETFs by deferring the 19% tax on dividends until final sale. Using Polish IKE or IKZE retirement accounts eliminates the 19% Belka tax entirely.',
    capitalGainsTaxRatePct: 19,
    dividendTaxRatePct: 19,
    effectiveEquityEtfTaxRatePct: 19,
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No general annual tax-free allowance on taxable brokerage accounts, but IKE & IKZE retirement wrappers shelter substantial annual contributions from 19% Belka tax.',
    accumulatingTaxRule:
      '0% tax while held. Dividends compound internally without triggering annual PIT-38 tax. At sale, 19% Belka tax applies on realized profit (converted to PLN using NBP T-1 exchange rates).',
    distributingTaxRule:
      'Cash dividends trigger 19% PIT-38 tax every single year (with complex manual foreign withholding tax credit calculations for Irish/US dividends).',
    specialWrapperName: 'IKE (0% CGT at age 60) & IKZE (Tax-Deductible)',
    specialWrapperDetails:
      'Polish brokers like XTB, DM BOŚ, and mBank offer IKE/IKZE accounts supporting UCITS ETFs with zero 19% Belka tax if held to retirement.',
    taxDeclarationForm:
      'Annual PIT-38 tax return (based on PIT-8C from Polish brokers like XTB, or manual PLN conversion for foreign brokers).',
    localAuthorityName: 'Krajowa Administracja Skarbowa (Podatki.gov.pl)',
    localAuthorityUrl: 'https://www.podatki.gov.pl',
    recommendedPortals: [
      {
        name: 'Podatki.gov.pl (PIT-38)',
        url: 'https://www.podatki.gov.pl',
        description: 'Official Polish Ministry of Finance portal for PIT-38 online filing.',
      },
      {
        name: 'AtlasETF.pl',
        url: 'https://atlasetf.pl',
        description: 'Leading Polish UCITS ETF screener, IKE/IKZE guide, and tax comparisons.',
      },
    ],
    keyLegalWarnings: [
      'Every transaction on a EUR/USD ETF at a foreign broker must be converted to PLN using the official NBP average exchange rate from the last business day preceding the trade/dividend (D-1).',
      'Polish domestic brokers (e.g. XTB, BOŚ) automatically issue PIT-8C for realized sales, saving substantial accounting effort.',
    ],
  },
  {
    code: 'RO',
    name: 'Romania',
    flag: '🇷🇴',
    regionGroup: 'Central & Eastern Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: '1%/3% Tax via Romanian-Domiciled Brokers + Acc Avoids 8%–10% Dividend Tax',
    verdictSummary:
      'Romania offers one of Europe’s lowest capital gains tax rates when investing through a Romanian-registered broker (such as XTB Romania or TradeVille): just 1% on gains held >365 days (3% if <365 days), withheld at source! Accumulating ETFs avoid annual 8%–10% dividend tax and CASS health-contribution thresholds.',
    capitalGainsTaxRatePct: 1, // 1% for >365 days via RO-registered broker (10% via foreign broker)
    dividendTaxRatePct: 10, // 8%–10% dividend tax + potential CASS health contribution
    effectiveEquityEtfTaxRatePct: 1,
    annualTaxFreeAllowanceEur: 0,
    allowanceDescription:
      'No capital gains exemption, but gains/dividends only trigger the 10% CASS health contribution if total non-salary investment income crosses 6/12/24 minimum gross salaries.',
    accumulatingTaxRule:
      '0% annual dividend tax and zero CASS triggers while holding! When sold via an RO-regulated broker (like XTB RO or TradeVille), tax is withheld automatically at 1% (>1 year hold) or 3% (<1 year hold). Foreign brokers (IBKR/T212) remain taxed at 10% via Declarația Unică.',
    distributingTaxRule:
      'Dividends are taxed annually (8%–10% via Declarația Unică for foreign UCITS ETFs) and count toward CASS health-insurance thresholds.',
    specialWrapperName: 'Romanian-Registered Broker 1% Long-Term Withholding',
    specialWrapperDetails:
      'Holding UCITS Acc ETFs through a broker with an ASF-registered Romanian entity reduces capital gains tax from 10% to 1% (>365 days) with automatic withholding (losses cannot be carried forward under the 1%/3% regime).',
    taxDeclarationForm:
      'Declarația Unică (Formular 212) for foreign brokers, foreign dividends, or when crossing CASS thresholds.',
    localAuthorityName: 'ANAF (Agenția Națională de Administrare Fiscală)',
    localAuthorityUrl: 'https://www.anaf.ro',
    recommendedPortals: [
      {
        name: 'ANAF — Declarația Unică',
        url: 'https://www.anaf.ro',
        description: 'Official Romanian tax authority for Formular 212 and SPV.',
      },
      {
        name: 'justETF Europe',
        url: 'https://www.justetf.com/en/',
        description: 'Compare accumulating UCITS ETFs (VWCE, EUNL, SXR8).',
      },
    ],
    keyLegalWarnings: [
      'Always double-check whether your broker has a local Romanian branch/entity (1%/3% source-withheld) vs cross-border EU entity (10% Declarația Unică).',
      'Watch the 6 / 12 / 24 minimum-wage CASS health tax brackets when realizing large gains or receiving dividends in a single calendar year.',
    ],
  },
  {
    code: 'CZ',
    name: 'Czechia',
    flag: '🇨🇿',
    regionGroup: 'Central & Eastern Europe',
    archetype: 'PURE_DEFERRAL_ACC_WINS',
    verdict: 'ACC_STRONGLY_PREFERRED',
    verdictTitle: '0% Capital Gains Tax After 3-Year Time Test — Acc Wins Completely!',
    verdictSummary:
      'Czechia offers a golden tax rule for long-term investors: the 3-Year Time Test (Časový test). Any UCITS ETF held for at least 3 years is 100% exempt from capital gains tax (0% tax, subject to a 40M CZK/yr aggregate cap)! Meanwhile, cash dividends are taxed at 15%, making Accumulating ETFs overwhelmingly superior.',
    capitalGainsTaxRatePct: 15, // 0% after 3 years!
    dividendTaxRatePct: 15,
    effectiveEquityEtfTaxRatePct: 0, // 0% after 3-year time test
    annualTaxFreeAllowanceEur: 4000, // 100,000 CZK gross sales proceeds exemption + 40M CZK post-3Y cap
    allowanceDescription:
      '0% Capital Gains Tax if held >3 years (Časový test, up to 40M CZK/yr proceeds) OR if gross annual securities sales are under 100,000 CZK (~€4,000).',
    accumulatingTaxRule:
      '0% tax while held AND 0% capital gains tax upon sale once shares are held >3 years (FIFO). Reinvested dividends convert into tax-free capital gains!',
    distributingTaxRule:
      'Foreign UCITS dividends must be declared in your Czech tax return (§ 8) and taxed at 15% every year—even after 3 years.',
    holdingPeriodDiscounts: [
      {
        yearsMin: 0,
        yearsMax: 3,
        exemptionPct: 0,
        effectiveTaxRatePct: 15,
        label: 'Held < 3 years (if gross sales > 100k CZK): 15% tax (23% for very high income)',
      },
      {
        yearsMin: 3,
        yearsMax: null,
        exemptionPct: 100,
        effectiveTaxRatePct: 0,
        label: 'Held ≥ 3 years (Časový test): 100% exempt → 0.0% tax!',
      },
    ],
    specialWrapperName: '3-Year Time Test (Časový test) & DIP (Long-Term Investment Product)',
    specialWrapperDetails:
      'Hold Acc UCITS ETFs for >3 years for 0% tax, or contribute to a DIP (Dlouhodobý investiční produkt) for up to 48,000 CZK/yr income tax deduction.',
    taxDeclarationForm:
      'Daňové přiznání k dani z příjmů fyzických osob (§ 8 dividends, § 10 capital gains under 3Y).',
    localAuthorityName: 'Finanční správa České republiky',
    localAuthorityUrl: 'https://www.financnisprava.cz',
    recommendedPortals: [
      {
        name: 'Finanční správa ČR',
        url: 'https://www.financnisprava.cz',
        description: 'Official Czech tax authority portal and Moje Daně filing.',
      },
      {
        name: 'justETF',
        url: 'https://www.justetf.com/en/',
        description: 'Screen accumulating UCITS ETFs eligible for the 3-year time test.',
      },
    ],
    keyLegalWarnings: [
      'FIFO applies strictly per ISIN—keep clear records of each monthly DCA lot purchase date so you only sell lots older than 36 months.',
      'A 40 million CZK (~€1.6M) annual limit applies to the 3-year CGT exemption.',
    ],
  },
  {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    regionGroup: 'Nordics & UK',
    archetype: 'WEALTH_OR_DEEMED_DISPOSAL',
    verdict: 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT',
    verdictTitle: 'ISK Account: ~1% Flat Annual Tax & 0% Capital Gains (Acc Wins on Convenience)',
    verdictSummary:
      'Most Swedish retail investors hold ETFs inside an ISK (Investeringssparkonto) or Kapitalförsäkring (KF). Instead of 30% tax on realized gains and dividends, ISK charges a small annual flat tax (Schablonskatt, ~0.9%–1.1% of account value, with the first 150,000–300,000 SEK exempt from 2025/2026!). Acc ETFs avoid FX conversion fees on payouts.',
    capitalGainsTaxRatePct: 30, // Standard Depå; 0% inside ISK/KF
    dividendTaxRatePct: 30,
    effectiveEquityEtfTaxRatePct: 1.0, // ~0.9%–1.1% annual Schablonskatt inside ISK (0% on first 150k/300k SEK)
    annualTaxFreeAllowanceEur: 13000, // 150,000 SEK (rising to 300,000 SEK) tax-free ISK floor
    allowanceDescription:
      'Inside ISK: Tax-free base up to 150,000 SEK (~€13,000 in 2025, rising to 300,000 SEK in 2026); flat annual Schablonskatt above that, 0% tax on realized sales or dividends.',
    accumulatingTaxRule:
      'Inside ISK/KF: 0% tax on dividends or sales; only the annual Schablonskatt applies. Acc ETFs save Swedish investors from paying 0.25%–0.50% FX spread twice when EUR dividends convert to SEK and back.',
    distributingTaxRule:
      'Inside ISK: 0% Swedish dividend tax, though EUR payouts incur SEK FX conversion fees at brokers like Avanza/Nordnet unless held in a EUR account.',
    specialWrapperName: 'ISK (Investeringssparkonto) & Kapitalförsäkring (KF)',
    specialWrapperDetails:
      'ISK is pre-filled automatically on your Skatteverket tax return. Available via Swedish brokers (Nordnet, Avanza, Montrose) and Lightyear/others supporting ISK.',
    taxDeclarationForm:
      'Pre-filled automatically by Swedish ISK brokers on Inkomstdeklaration 1 (Skatteverket); K4 required only for standard Depå accounts.',
    localAuthorityName: 'Skatteverket',
    localAuthorityUrl: 'https://www.skatteverket.se',
    recommendedPortals: [
      {
        name: 'Skatteverket — ISK Rules',
        url: 'https://www.skatteverket.se',
        description: 'Official Swedish ISK Schablonskatt rates and tax-free SEK thresholds.',
      },
      {
        name: 'RikaTillsammans',
        url: 'https://rikatillsammans.se',
        description: 'Popular Swedish evidence-based index fund & ETF community.',
      },
    ],
    keyLegalWarnings: [
      'Avoid holding low-yield cash/money market ETFs (like XEON) inside an ISK if the expected yield is close to or below the Schablonskatt rate.',
      'ISK is only valid at brokers offering official Swedish ISK reporting to Skatteverket (international brokers like IBKR are treated as standard Depå at 30% CGT/dividend tax).',
    ],
  },
];

export const COUNTRY_TAX_BY_CODE: Record<string, CountryTaxRule> = Object.fromEntries(
  EUROPEAN_COUNTRY_TAXES.map((country) => [country.code, country])
);
