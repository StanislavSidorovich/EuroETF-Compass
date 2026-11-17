// src/data/academyContent.ts
// Careful ETF Investing Academy: 5 core lessons + 8-point pre-purchase checklist

import type { AcademyLesson, CarefulInvestorChecklistItem } from '../types';

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'lesson-1-why-ucits-etfs',
    stepNumber: 1,
    title: 'Why Careful Investors Choose Broad UCITS ETFs Over Single Stocks',
    subtitle: 'Eliminate company-specific blowup risk and capture global economic growth at ultra-low cost.',
    readTimeMinutes: 5,
    category: 'Core ETF Mechanics',
    keyTakeaways: [
      'Over 10–15 years, roughly 85%–90% of active stock-picking funds underperform their benchmark index after fees (S&P SPIVA Europe Scorecard).',
      'Equity returns are heavily skewed: Henrik Bessembinder’s research showed that a tiny ~4% of stocks generate virtually all net wealth above Treasury bills—picking single stocks risks missing the winners.',
      'One global UCITS ETF (such as FTSE All-World or MSCI World) gives you instant ownership in 1,400 to 3,600+ companies across 23–47 countries in a single trade.',
      'Self-cleansing mechanism: failing companies naturally shrink out of the index while tomorrow’s market leaders automatically grow in weight.',
    ],
    sections: [
      {
        heading: 'The Mathematics of Humility: Why Stock Picking Usually Loses',
        body: 'Even full-time institutional fund managers with Bloomberg terminals and analyst teams struggle to beat broad market indices over multi-year horizons. According to the S&P Indices Versus Active (SPIVA) Europe reports, between 85% and 92% of active European and global equity funds lag their benchmark over 10- to 15-year periods once management fees and trading turnover costs are subtracted. For retail investors, chasing hot individual stocks concentrates uncompensated idiosyncratic risk—if one company suffers an accounting scandal or technological disruption, your savings suffer permanently.',
        highlightBox: {
          type: 'tip',
          title: 'Careful Investor Principle',
          content:
            'Instead of searching for the needle in the haystack, buy the entire haystack via a globally diversified UCITS ETF. You guarantee yourself the market’s average return—which historically beats ~90% of active players.',
        },
      },
      {
        heading: 'Skewness of Returns & Automatic Index Rebalancing',
        body: 'Stock market wealth creation is extraordinarily concentrated. A small minority of breakout compounders drive the vast majority of long-term gains, while the median individual stock often underperforms cash over its lifetime. Broad market-cap weighted indices (like FTSE All-World or MSCI ACWI) automatically hold the winners as they rise and reduce exposure to declining companies without you ever placing a sell order or triggering a taxable capital gain.',
      },
    ],
    interactiveComparison: {
      leftTitle: 'Broad Global UCITS ETF (e.g., VWCE / IWDA)',
      leftPoints: [
        '1,400 to 3,600+ companies across 23–47 countries',
        '0.12%–0.22% annual TER (no active manager fee drag)',
        'Automatic self-cleansing as winners replace laggards',
        'Zero company-bankruptcy wipeout risk',
      ],
      rightTitle: 'Concentrated Single-Stock Picking',
      rightPoints: [
        'High exposure to single-company earnings/fraud shocks',
        'Missing the top ~4% of market winners destroys long-term returns',
        'Frequent trading triggers broker spreads & early capital gains tax',
        'Requires constant financial statement monitoring',
      ],
    },
  },
  {
    id: 'lesson-2-acc-vs-dist',
    stepNumber: 2,
    title: 'Accumulating (Acc) vs. Distributing (Dist) ETFs — The Compounding Engine',
    subtitle: 'How automatic internal dividend reinvestment eliminates broker fees and compounds wealth tax-free in most EU countries.',
    readTimeMinutes: 6,
    category: 'Accumulating vs Distributing',
    keyTakeaways: [
      'Accumulating (Acc) ETFs automatically reinvest all company dividends inside the fund at Net Asset Value (NAV) with €0 broker commission and 0% bid-ask spread.',
      'Distributing (Dist) ETFs pay dividends out as cash to your brokerage account quarterly or semi-annually, creating reinvestment friction and immediate taxable events.',
      'In tax-deferral countries (Portugal, Spain, France CTO, Belgium equity, Italy, Poland, Romania, Czechia), avoiding annual dividend tax on Dist payouts leaves significantly more capital compounding over 5–20 years.',
      'Even in zero-tax or wealth-tax regimes (Netherlands Box 3, UK ISA), Acc ETFs save effort and avoid idle cash drag.',
    ],
    sections: [
      {
        heading: 'What Happens Inside an Accumulating ETF?',
        body: 'Both an Accumulating ETF (like VWCE) and its Distributing twin (like VGWL) hold the exact same underlying stocks and receive the exact same dividends from Apple, Microsoft, Nestlé, or ASML. The difference lies strictly in what the fund manager does with that cash. A Distributing fund accumulates cash over the quarter and wires it to your broker, dropping the ETF share price by the dividend amount on the ex-dividend date. An Accumulating fund immediately uses those dividends inside the fund structure to buy more underlying shares at institutional execution costs—causing the ETF’s share price (NAV) to grow faster over time.',
        highlightBox: {
          type: 'math',
          title: 'The Compounding & Tax-Drag Math (10–20 Years)',
          content:
            'Assume €20,000 invested with a 7% total return (5% price growth + 2% dividend yield) in Portugal (28% dividend tax). On a Dist ETF, 28% of the 2% dividend (0.56%/yr) is lost to IRS every single year before it can compound. On an Acc ETF, 100% of that dividend stays invested compounding for 10+ years, and upon sale after >8 years in Portugal, only 19.6% effective tax applies to the gain!',
        },
      },
      {
        heading: 'When Does a Distributing (Dist) ETF Ever Make Sense?',
        body: 'Distributing ETFs remain useful in three specific scenarios: (1) Retirees who want predictable quarterly cashflow without selling shares; (2) German tax residents using Dist dividends to harvest their annual €1,000 tax-free Sparerpauschbetrag (€2,000 for married couples) before switching future savings to Acc; and (3) Investors in jurisdictions with identical tax treatment on Acc and Dist (such as Switzerland’s ICTax) who prefer visible cash income.',
      },
    ],
    interactiveComparison: {
      leftTitle: 'Accumulating (Acc) Share Class',
      leftPoints: [
        'Dividends reinvested internally at NAV (€0 broker fee, 0% spread)',
        'Zero idle cash sitting uninvested in your brokerage account',
        'Defers personal income/dividend tax in PT, ES, FR, BE, IT, PL, RO, CZ',
        'Simpler tax paperwork in most deferral jurisdictions (no quarterly dividend tracking)',
      ],
      rightTitle: 'Distributing (Dist) Share Class',
      rightPoints: [
        'Pays cash dividends 2x–4x per year directly to your broker cash balance',
        'Triggers immediate annual dividend tax (e.g., 28% in PT, 30% in BE/FR) even if reinvested',
        'Manual reinvestment may incur broker commissions & FX fees',
        'Useful in Germany up to €1,000/yr Sparerpauschbetrag or for retirement income',
      ],
    },
  },
  {
    id: 'lesson-3-ucits-irish-domicile',
    stepNumber: 3,
    title: 'European Legal Rules — UCITS Safety, PRIIPs & Why Irish (IE) Domicile Matters',
    subtitle: 'Understand investor protection under EU UCITS law and the hidden 15% vs. 30% US withholding tax treaty advantage.',
    readTimeMinutes: 5,
    category: 'European UCITS & Tax Law',
    keyTakeaways: [
      'UCITS (Undertakings for Collective Investment in Transferable Securities) mandates strict asset segregation: your ETF assets belong to the fund trust, NOT the ETF provider or broker.',
      'Under EU PRIIPs regulations, European retail brokers cannot generally sell US-domiciled ETFs (like VOO, SPY, QQQ) because they lack a localized Key Information Document (KID).',
      'Irish-domiciled UCITS ETFs (ISIN starting with IE00...) benefit from the Ireland–US Double Taxation Treaty, cutting US dividend withholding tax from 30% down to 15%.',
      'By contrast, physical Luxembourg-domiciled ETFs (LU...) pay 30% withholding tax on US dividends—costing ~0.20% to 0.30% in silent extra drag every year on Global or S&P 500 funds.',
    ],
    sections: [
      {
        heading: 'Ring-Fenced Custody: What If Vanguard, BlackRock, or Your Broker Fails?',
        body: 'Under the European UCITS directive, an ETF’s underlying shares are legally segregated at an independent custodian bank (such as State Street, Brown Brothers Harriman, or BNP Paribas) separate from the asset manager’s corporate balance sheet and separate from your retail broker. Even if your broker goes bankrupt, your ETF units remain your legal property and are transferred to another custodian—backed further by EU Investor Compensation Schemes (typically €20,000 minimum coverage for missing assets/cash anomalies, plus €100,000 bank deposit guarantee on cash).',
        highlightBox: {
          type: 'legal',
          title: 'PRIIPs KID Rule & US Estate Tax Protection',
          content:
            'Buying UCITS ETFs (ISIN IE... or LU...) not only complies with EU PRIIPs KID laws, it also protects non-US residents from the harsh 40% US Federal Estate Tax trap that applies above $60,000 on US-domiciled shares (VOO/SPY).',
        },
      },
      {
        heading: 'Why ISIN Prefix "IE00..." Beats "LU0..." for US & Global Stocks',
        body: 'Because US equities make up ~62%–70% of MSCI World / FTSE All-World indices and 100% of S&P 500 funds, US dividend withholding tax (Level 1 tax inside the fund) matters enormously. Ireland’s tax treaty with the United States lowers withholding on US dividends paid into the ETF from 30% to 15%. On a 1.5%–2.0% US dividend yield, saving 15% of that dividend equals roughly 0.20%–0.28% extra annual return—often larger than the entire TER of the ETF!',
      },
    ],
  },
  {
    id: 'lesson-4-ter-vs-td-replication',
    stepNumber: 4,
    title: 'True Cost of an ETF — TER vs. Tracking Difference (TD) & Replication',
    subtitle: 'Look past headline TER fees to measure how closely an ETF actually tracks its benchmark after internal costs and revenues.',
    readTimeMinutes: 5,
    category: 'Core ETF Mechanics',
    keyTakeaways: [
      'TER (Total Expense Ratio) is only the advertised annual management fee—it excludes securities lending income, withholding tax efficiency, and internal rebalancing costs.',
      'Tracking Difference (TD) = ETF Return minus Benchmark Index Return. A negative TD (e.g., -0.05%) or 0.00% TD means the ETF actually beat or matched its net index even after its TER!',
      'Physical Full Replication buys every stock in the index; Optimized Sampling holds a representative basket of liquid stocks; Synthetic (Unfunded Swap) uses collateralized swap contracts.',
      'Synthetic S&P 500 UCITS ETFs (like Invesco SPXS) can legally achieve 0% US dividend withholding tax under US IRC Section 871(m) rules, often outperforming physical S&P 500 ETFs.',
    ],
    sections: [
      {
        heading: 'Why a 0.20% TER ETF Can Beat a 0.12% TER ETF',
        body: 'Beginners often sort ETFs strictly by the lowest TER on justETF. While low TER is vital, Tracking Difference (TD) is the true scorecard of real-world investor cost. Two Irish ETFs tracking MSCI World might charge 0.20% and 0.12% TER, yet the 0.20% fund might offset part of its fee through tightly controlled securities lending (collateralized at >102%–105%) and lower index-rebalancing transaction drag. Always verify multi-year TD on TrackingDifferences.com.',
        highlightBox: {
          type: 'tip',
          title: 'Liquidity & Bid-Ask Spread Check',
          content:
            'Prefer funds with Assets Under Management (AUM) above €500M (ideally €1B+) and trade during European market overlap (09:30–17:00 CET on Xetra or Euronext Amsterdam) using Limit orders—never market orders outside exchange hours.',
        },
      },
      {
        heading: 'Physical vs. Synthetic Replication Explained Safely',
        body: 'Physical (Full or Optimized Sampling) ETFs directly hold the stocks in the index and are the gold standard for clarity. Synthetic (Unfunded Swap) UCITS ETFs hold a diversified substitute basket of liquid securities pledged at a custodian and enter a swap agreement with an investment bank counterparty to deliver the exact index return. Under UCITS law, swap counterparty exposure is strictly capped at 10% of NAV (and typically reset daily near 0%–2%), making synthetic S&P 500 ETFs a uniquely tax-efficient option for European investors.',
      },
    ],
  },
  {
    id: 'lesson-5-european-tax-traps',
    stepNumber: 5,
    title: 'Country Tax Traps & Golden Rules (Portugal, Netherlands, Germany & EU)',
    subtitle: 'Navigate local reporting laws, holding-period discounts, and hidden wealth or deemed disposal taxes before you invest.',
    readTimeMinutes: 7,
    category: 'European UCITS & Tax Law',
    keyTakeaways: [
      'Portugal (Lei n.º 31/2024): Standard IRS rate is 28%, but holding ETFs >8 years unlocks a 30% capital gains exemption (19.6% effective tax!). Acc ETFs avoid annual 28% dividend tax and qualify for this long-term discount.',
      'Germany: Equity ETFs (>50% stocks) get a 30% Teilfreistellung (18.46% effective tax). Watch the annual Vorabpauschale advance tax and use your €1,000 Sparerpauschbetrag wisely.',
      'Netherlands: No capital gains or dividend tax differential on ETFs; Box 3 taxes total net wealth above ~€57,000/person on January 1 using a deemed return rate (with actual-return rebuttal option).',
      'Watch Special EU Traps: Ireland’s 41% Exit Tax with 8-year Deemed Disposal, Austria’s punitive Nicht-Meldefonds penalty if an ETF isn’t registered on OeKB, and Belgium’s 1.32% TOB on registered Acc funds vs. 0.12%.',
    ],
    sections: [
      {
        heading: 'Portugal & Deferral Jurisdictions: Patience Literally Cuts Your Tax Rate',
        body: 'In Portugal, foreign-broker ETF sales must be declared on IRS Modelo 3, Anexo J (Quadro 9.2A) using strict FIFO (First-In, First-Out) lot matching—meaning your oldest purchased shares are always considered sold first. Thanks to Lei n.º 31/2024, capital gains on ETFs held 2–5 years get 10% excluded (25.2% effective tax), 5–8 years get 20% excluded (22.4%), and >8 years get 30% excluded (19.6%). Choosing Distributing ETFs forces you to pay 28% every year on cash dividends with zero holding discount, whereas Accumulating ETFs convert dividends into discounted long-term capital gains.',
        highlightBox: {
          type: 'warning',
          title: 'Three Big European ETF Tax Traps to Avoid',
          content:
            '1) Austria: Never buy an ETF not registered as a Meldefonds on my.oekb.at (risk of punitive flat taxation). 2) Belgium: Check whether an Accumulating ETF is registered in Belgium before buying—non-Belgian-registered EEA Acc funds often incur 0.12% TOB instead of 1.32%. 3) Ireland: Remember the 8-year Deemed Disposal rule requires tracking 8th anniversaries of every buy lot!',
        },
      },
      {
        heading: 'Germany, Netherlands & Record-Keeping Best Practices',
        body: 'In Germany, using a Steuereinfach broker (Trade Republic, Scalable Capital, ING, DKB) automates your 30% Teilfreistellung, €1,000 Freistellungsauftrag, and annual Vorabpauschale. In the Netherlands, focus on minimizing TER and dividend leakage (using Irish UCITS ETFs or Dutch FBI funds like Northern Trust / VanEck) and record your portfolio market value every January 1 for Box 3. Across all countries where you use an international broker (IBKR, DEGIRO, XTB, Lightyear), archive every buy/sell trade confirmation PDF—you will need exact purchase dates and EUR costs under FIFO rules years from now.',
      },
    ],
  },
];

export const CAREFUL_INVESTOR_CHECKLIST: CarefulInvestorChecklistItem[] = [
  {
    id: 'chk-1-ucits',
    category: 'Legal & UCITS',
    question: 'Is the fund UCITS-compliant with a PRIIPs Key Information Document (KID)?',
    whyItMatters:
      'UCITS guarantees ring-fenced legal asset segregation at an independent custodian and shields EU residents from US estate tax exposure.',
    recommendedTarget: 'Confirm "UCITS" in the fund name and verify ISIN starts with IE00... or LU0... on justETF.',
  },
  {
    id: 'chk-2-domicile',
    category: 'Tax Efficiency (Acc vs Dist)',
    question: 'For Global or US equity exposure, is the ETF domiciled in Ireland (IE)?',
    whyItMatters:
      'Ireland’s tax treaty with the US cuts US dividend withholding tax inside the fund from 30% to 15%, saving ~0.20%–0.30% annually vs. Luxembourg physical funds.',
    recommendedTarget: 'ISIN starting with IE00... (or synthetic S&P 500 swap UCITS ETF).',
  },
  {
    id: 'chk-3-acc-dist',
    category: 'Tax Efficiency (Acc vs Dist)',
    question: 'Does the distribution policy (Acc vs. Dist) match your country’s tax rules?',
    whyItMatters:
      'In Portugal, Spain, France (CTO), Belgium (equity), Italy, Poland, Romania, and Czechia, Accumulating ETFs defer dividend tax and preserve compounding—and in Portugal unlock the 19.6% >8-year rate.',
    recommendedTarget: 'Acc for compounding in deferral/wealth-tax countries; Dist in Germany only up to €1,000/yr allowance.',
  },
  {
    id: 'chk-4-ter-td',
    category: 'Cost & Tracking',
    question: 'Are both the Total Expense Ratio (TER) and 3-year Tracking Difference (TD) low?',
    whyItMatters:
      'High annual fees compound against you every year. Tracking Difference reveals true net performance after internal securities lending and tax drag.',
    recommendedTarget: 'TER ≤ 0.22% for broad global/developed equity (≤ 0.10% for S&P 500); TD ≤ 0.25%.',
  },
  {
    id: 'chk-5-aum-liquidity',
    category: 'Cost & Tracking',
    question: 'Is Fund Size (AUM) large enough to prevent closure risk and wide spreads?',
    whyItMatters:
      'Tiny ETFs (<€50M) risk liquidation (forcing an unwanted taxable event) and suffer wider bid-ask spreads when buying or selling.',
    recommendedTarget: 'AUM ≥ €500M (ideally €1B+ for core long-term holdings) traded in EUR on Xetra or Euronext.',
  },
  {
    id: 'chk-6-diversification',
    category: 'Diversification & Risk',
    question: 'Are you diversified across hundreds/thousands of companies and geographies?',
    whyItMatters:
      'Relying on a single country, narrow sector theme, or handful of stocks increases permanent drawdown risk.',
    recommendedTarget: 'Core allocation (70%–100%) in Global (FTSE All-World / MSCI ACWI) or Developed World (MSCI World) index.',
  },
  {
    id: 'chk-7-country-trap',
    category: 'Legal & UCITS',
    question: 'Have you checked your country’s specific fund registry or local tax trap?',
    whyItMatters:
      'Austria requires OeKB Meldefonds status; UK non-ISA requires UK Reporting Fund Status; Belgium applies 30% Reynders tax if >10% bonds; Germany checks >50% equity ratio for 30% Teilfreistellung.',
    recommendedTarget: 'Verify ISIN on OeKB (AT), extraETF (DE), or UK Reporting list (GB) before first purchase.',
  },
  {
    id: 'chk-8-horizon-emergency',
    category: 'Diversification & Risk',
    question: 'Is your emergency fund separate and your investment horizon at least 5–10+ years?',
    whyItMatters:
      'Equity ETFs routinely experience 20%–40% temporary drawdowns. Never invest rent or near-term cash that might force you to sell at a market bottom.',
    recommendedTarget: 'Hold 3–6 months of living expenses in cash/EUR money market (e.g. XEON or high-yield bank) before investing in equities.',
  },
];
