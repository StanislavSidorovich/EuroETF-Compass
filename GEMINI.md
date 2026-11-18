# GEMINI.md — Project Memory, Architectural Decisions & Agent Orchestration Rules

> **Project Name:** EuroETF Compass (Careful ETF & Tax-Smart Investing App for Europe)  
> **Repository Root:** `d:\docs\2. study\Claude\00. Gemini\Japp`  
> **GitHub Repository:** `https://github.com/StanislavSidorovich/EuroETF-Compass`  
> **Live GitHub Pages:** `https://stanislavsidorovich.github.io/EuroETF-Compass/`  
> **Current Release Tag:** `v3.0.0`  
> **Last Updated:** 2026-11-18  
> **Purpose:** This file serves as the persistent project memory (`GEMINI.md` / `MEMORY.md`) for both human developers and AI agents. Always read this file before making architectural changes, and **append new decisions** to the Decision Log below.

---

## 1. Core Vision & Product Requirements

1. **Careful Investing Academy (ETF-First Philosophy):**
   - Teach beginners and intermediate investors how to invest carefully using broad, diversified **UCITS ETFs** rather than speculative stock picking.
   - Deeply explain **Accumulating (`Acc`) vs. Distributing (`Dist`) ETFs**: automatic dividend reinvestment (DRIP without broker fees), compounding math, tax drag, TER (Total Expense Ratio) vs. Tracking Difference (TD), and physical vs. synthetic replication.
2. **European Country Legal & Tax Matrix:**
   - Provide an interactive country-by-country legal & tax breakdown for European investors (Germany, Austria, Ireland, United Kingdom, France, Netherlands, Switzerland, Belgium, Spain, Italy, Poland, Romania, Czechia, Sweden/Denmark).
   - Explicitly evaluate **whether Accumulating or Distributing ETFs are more tax-beneficial** in each jurisdiction (e.g., Germany's *Vorabpauschale* & €1,000 *Sparerpauschbetrag* + 30% *Teilfreistellung*; Austria's *Meldefonds* via OeKB; Ireland's 41% Exit Tax & 8-year *Deemed Disposal*; Belgium's *TOB* & *Reynders Tax*; pure tax-deferral advantage of Accumulating ETFs in France, Spain, Italy, Poland, Romania, Belgium equity ETFs).
3. **Live Connections to European ETF & Broker Portals:**
   - Dynamic deep-links (by ISIN/Ticker) and curated directory connecting users to:
     - **justETF.com** (ETF screener, ISIN profiles, European tax guides)
     - **extraETF.com** (DACH tax calculators, Sparplan comparisons, tracking tools)
     - **Finanzfluss.de** & **Finanztip.de** (Broker comparison / *Depotvergleich*, *Sparplanrechner*)
     - **Curvo.eu** & **Bankeronwheels.com** (Pan-European accumulating ETF analysis & country tax guides)
     - **OeKB Profitweb (`my.oekb.at`)** (Austrian *Meldefonds* tax status lookup)
     - **TrackingDifferences.com** & **Morningstar Europe**
   - Interactive **European Broker Comparison Matrix** (Interactive Brokers, Scalable Capital, Trade Republic, DEGIRO, Lightyear, Trading 212, XTB) highlighting **Steuereinfach (Auto-Tax Reporting)** vs. Self-Declaration per country.
4. **Budget, 3Y/5Y Historical Revenue Backtest & Future Forecast Calculator:**
   - **Inputs:** Initial Lump-Sum Budget (`€`), optional Monthly Savings Plan (`€/mo`), ETF selection (single ETF or weighted multi-ETF portfolio), and Tax Residence Country.
   - **Historical Backtest (3 Years & 5 Years Ago):** Compute exact historical return, total revenue (`€` profit), annualized CAGR, max drawdown, and Acc vs. Dist net performance over the actual past 3-year and 5-year windows.
   - **Future Forecast Engine:** Project 3Y, 5Y, 10Y, and 20Y future portfolio values based on historical CAGR and volatility bands (Conservative `-1σ`, Base Historical CAGR, Optimistic `+1σ`), with an optional post-tax estimator.
   - **Mandatory Legal Disclaimer:** Every historical and forecast view must prominently display the regulatory warning: *"Historical investment ratings and past performance are not a promise or reliable indicator of future results. Projections are mathematical models for educational purposes only and do not constitute financial, legal, or tax advice."*
5. **Live Online ETF Price Feed & GitHub Readiness:**
   - Fetch real-time/delayed prices and 5-year historical price series for major European UCITS ETFs (`VWCE.DE`, `IWDA.AS` / `EUNL.DE`, `VUAA.DE`, `SXR8.DE`, `VGWL.DE`, `EQQQ.DE`, `EMIM.AS`, `XEON.DE`) via Yahoo Finance v8 Chart API (through Vite server proxy in dev + CORS-safe fallback endpoints + offline verified market cache so the app never breaks).
   - Maintain a clean, modular Git repository ready to push to GitHub and deploy to Vercel / GitHub Pages / Netlify.

---

## 2. Proposed Directory & File Structure

```text
Japp/
├── GEMINI.md                     # Persistent AI & Developer Memory / Decision Log
├── MEMORY.md                     # Mirror / Extended Decision & Context Log for user additions
├── ROADMAP.md                    # Phased Product & Engineering Roadmap
├── .gitignore                    # Node, Vite, build, and env exclusions
├── package.json                  # Dependencies & scripts (dev, build, preview, lint)
├── tsconfig.json                 # Strict TypeScript configuration
├── vite.config.ts                # Vite config + /api/yahoo proxy for live CORS-free ETF feeds
├── index.html                    # App entry HTML with typography & meta tags
└── src/
    ├── main.tsx                  # React DOM root
    ├── App.tsx                   # Main shell, navigation tabs, live ticker header, global state
    ├── index.css                 # Tailwind CSS + custom European fintech dark/light design tokens
    ├── types/
    │   └── index.ts              # Shared TypeScript interfaces (ETF, TaxCountry, Broker, BacktestResult, ForecastPoint)
    ├── services/
    │   └── marketService.ts      # Live ETF price & 5Y history fetcher (Proxy -> Public CORS -> Verified Snapshot Fallback)
    ├── utils/
    │   └── investmentMath.ts     # 3Y/5Y historical backtest engine, Acc vs Dist tax drag simulator, CAGR & forecast curves
    ├── data/
    │   ├── etfs.ts               # Curated UCITS ETFs (Acc & Dist pairs) with ISIN, WKN, Ticker, TER, TD, baseline 5Y series
    │   ├── countryTaxes.ts       # 12+ European countries: legal rules, tax rates, exemptions, Acc vs Dist tax benefit analysis
    │   ├── europeanPortals.ts    # Deep-link generators (justETF, extraETF, Finanzfluss, Curvo, OeKB) & Broker comparison data
    │   └── academyContent.ts     # Structured educational modules on careful ETF investing, Acc vs Dist, UCITS, risk control
    └── components/
        ├── layout/
        │   ├── Header.tsx        # Top nav, live connection status badge, GitHub repo status, currency/country quick-selector
        │   ├── LiveTickerBar.tsx # Scrolling/grid live price bar for tracked UCITS ETFs
        │   └── DisclaimerBanner.tsx # Persistent legal & historical performance notice
        ├── calculator/
        │   ├── InvestmentCalculator.tsx # Main interactive Budget + 3Y/5Y Backtest + Future Forecast view
        │   ├── EtfSelector.tsx          # Multi-ETF / Single-ETF picker with Acc vs Dist badges & live price
        │   └── PerformanceChart.tsx     # Interactive SVG/Canvas chart showing 5Y/3Y history -> Future Forecast cone
        ├── taxes/
        │   ├── CountryTaxExplorer.tsx   # Country selector, legal requirements, Acc vs Dist verdict & tax calculator
        │   └── AccVsDistComparison.tsx  # Side-by-side compounding & tax-drag visualizer per country
        ├── ecosystem/
        │   ├── BrokerComparison.tsx     # European broker matrix (fees, Sparplan, Steuereinfach filter)
        │   └── EuropeanPortalsHub.tsx   # Direct ISIN deep-linker to justETF, extraETF, Finanzfluss, Curvo, OeKB
        └── academy/
            └── CarefulInvestingAcademy.tsx # Interactive lessons, quizzes/checklists for careful ETF selection
```

---

## 3. Multi-Agent, Model & Effort Orchestration Plan

Following the Global Hub & Subagent Rules (`Argon` vs `Hydrogen`):
- **Main Chat (`Coordinator Hub`)** runs on **Gemini 4 Argon (`pro`, High Effort)** to maintain architectural coherence, review outputs, verify builds, and keep the main context window clean.
- Every non-browser subagent is immediately terminated via `manage_subagents(Action: "kill")` upon completion to prevent hanging background descriptors on Windows.

| Phase | Agent Role (`Role`) | Subagent Type | Model Assignment | Effort Level | Responsibilities & Deliverables |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | **Chief Architect & Orchestrator** | Main Hub (Coordinator) | **Gemini 4 Argon (`pro`)** | **High** | Define project structure, author `GEMINI.md`, `MEMORY.md`, `ROADMAP.md`, align with user on decisions before coding, and orchestrate subagents. |
| **Phase 1** | **Project Scaffold & Live Market Engine Architect** | `self` | **Gemini 4 Argon (`pro`)** | **High** | Scaffold `package.json`, `vite.config.ts` (with live Yahoo Finance v8 proxy), TypeScript types (`src/types/index.ts`), `src/services/marketService.ts` (live fetch + caching + fallback), and `src/utils/investmentMath.ts` (exact 3Y/5Y historical backtest, Acc vs Dist tax-drag math, and multi-scenario future forecast engine). |
| **Phase 2A** | **European Tax & ETF Domain Data Specialist** | `self` | **Gemini 4 Hydrogen (`flash`)** | **Medium-High** | Build comprehensive, accurate data modules: `src/data/etfs.ts` (major Acc & Dist UCITS ETFs with real ISINs, tickers, TERs, and baseline 5Y monthly/weekly price points), `src/data/countryTaxes.ts` (12+ European countries with legal requirements, tax rates, allowances, and Acc vs Dist tax-benefit verdicts). |
| **Phase 2B** | **European Broker, Portal Links & Academy Author** | `self` | **Gemini 4 Hydrogen (`flash`)** | **Medium** | Build `src/data/europeanPortals.ts` (dynamic ISIN deep-linkers to justETF, extraETF, Finanzfluss, Curvo, OeKB + European broker comparison matrix) and `src/data/academyContent.ts` (careful ETF investing curriculum, Acc vs Dist mechanics, UCITS rules, risk checklist). |
| **Phase 3A** | **Calculator & Interactive Chart Engineer** | `self` | **Gemini 4 Argon (`pro`)** | **High** | Implement `src/components/calculator/` (`InvestmentCalculator.tsx`, `EtfSelector.tsx`, `PerformanceChart.tsx`) — handling complex SVG/Canvas geometry for the combined 3Y/5Y Historical Backtest + Future Forecast cone, interactive tooltips, Acc vs Dist toggle, and prominent legal disclaimer. |
| **Phase 3B** | **Tax Explorer, Broker Hub & Academy UI Developer** | `self` | **Gemini 4 Hydrogen (`flash`)** | **Medium** | Implement `src/components/taxes/`, `src/components/ecosystem/`, `src/components/academy/`, `src/components/layout/`, and assemble `src/App.tsx` + `src/index.css`. |
| **Phase 4** | **Build, Live Feed & UI Verification Agent** | `self` + `browser` | **Gemini 4 Hydrogen (`flash`)** | **Low-Medium** | Run `npm run build` / TypeScript verification, start dev server, and verify live ETF price fetching, 3Y/5Y calculator accuracy, country tax switching, and external European links in the browser. |

---

## 4. Architectural Decision Log (Append-Only / User-Editable)

> **Instructions for Users & Agents:** Add new architectural, tax-rule, ETF-selection, or UI decisions to the table below (or under section 5 "User Custom Notes & Additions") so all future turns respect them.

| ID | Date | Status | Decision Area | Decision Summary | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | 2026-11-17 | Accepted | **Tech Stack** | **React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons** | Fast local dev server, built-in dev proxy (`vite.config.ts`) for live Yahoo Finance ETF API calls without CORS errors, zero heavy backend required, trivial deployment to GitHub Pages / Vercel. |
| **ADR-002** | 2026-11-17 | Accepted | **Live ETF Price Architecture** | **3-Tier Hybrid Market Data Pipeline**: (1) Live Yahoo Finance v8 Chart API via Vite proxy `/api/yahoo` (Xetra `.DE`, Euronext `.AS`, LSE `.L`); (2) Direct CORS proxy fallback (`allorigins` / `query1.finance.yahoo.com`) for static GitHub Pages hosting; (3) Curated 5-year historical dataset bundled locally so the app never fails offline and shows real 3Y/5Y historical numbers immediately. | Public financial APIs frequently block browser CORS or rate-limit unauthenticated users. A hybrid pipeline guarantees live prices when online while ensuring 100% uptime and instant 3Y/5Y backtest calculation. |
| **ADR-003** | 2026-11-17 | Accepted | **ETF Universe Selection** | **UCITS-Compliant European ETFs Only** (pairing Accumulating and Distributing equivalents where possible, e.g., `VWCE.DE` Acc vs `VGWL.DE` Dist; `EUNL.DE`/`IWDA.AS` Acc vs `IQQW.DE` Dist; `VUAA.DE`/`SXR8.DE` Acc vs `IUSA.DE` Dist; `EQQQ.DE`; `EMIM.AS`; `XEON.DE`). | US-domiciled ETFs (like SPY, VOO, QQQ) are generally unavailable to retail EU investors due to PRIIPs KID regulations and carry US estate tax / withholding disadvantages. |
| **ADR-004** | 2026-11-17 | Accepted | **3Y/5Y Backtest & Forecast Methodology** | **Dual-Mode Calculation**: Support both **Lump Sum** and **Monthly DCA (*Sparplan*)** backtests over exact 3-year and 5-year lookback windows. Forecast uses the ETF's historical annualized CAGR as the Base curve, plus Conservative (`CAGR - 0.5 * Volatility`) and Optimistic (`CAGR + 0.5 * Volatility`) bands, with a mandatory legal disclaimer that historical ratings/returns are not promised for the future. | Gives users realistic expectations (showing historical drawdowns as well as gains) and strictly complies with financial education transparency standards. |
| **ADR-005** | 2026-11-17 | Accepted | **European Tax Modeling** | **Jurisdiction-Specific Acc vs. Dist Logic**: Categorize countries into (A) *Strict Deferral Advantage for Acc* (Portugal, Belgium equity, Spain, Italy, France CTO/PEA, Poland, Romania, Czechia), (B) *Deemed Annual / Vorabpauschale Tax on Acc* (Germany, Austria, UK outside ISA, Switzerland), and (C) *Special Regime* (Ireland 8-year Deemed Disposal, Netherlands Box 3 wealth tax). | Answering "which ETFs are more tax-beneficial or less" accurately requires separating countries that tax unrealized/accumulated income from those that only tax realized capital gains or cash dividends. |
| **ADR-006** | 2026-11-17 | Accepted | **Portugal & Core EU Focus** | **Featured Tier-1 Support for Portugal (`PT`), Netherlands (`NL`), Germany (`DE`), plus 12 major European countries**: Model Portugal's 28% IRS tax, FIFO rule, *Anexo J* reporting, and the progressive **holding-period capital gains exclusion** (10% off at 2–5 yrs = 25.2%, 20% off at 5–8 yrs = 22.4%, 30% off at >8 yrs = **19.6% effective tax**), which makes Accumulating (`Acc`) ETFs dramatically superior to Distributing (`Dist`) ETFs in Portugal. | User highlighted Portugal alongside Netherlands, Germany, and major European hubs. |
| **ADR-007** | 2026-11-17 | Accepted | **UI Theme, Palette & Typography** | **Light/Dark Mode Switcher + Soft Sage-Green Palette + 3 Font Choices**: Add a header toggle for Light Mode and Dark Mode, replace glaring neon emerald (`#10b981`) with a calmer, eye-friendly sage/forest green (`#2d8a61` / `#1f7a53`), and provide 3 selectable typography themes (`Inter` Modern Sans, `Plus Jakarta Sans` Geometric, `Merriweather` Editorial Serif). | User feedback: needed explicit Light Mode option, softer green color, and 3 font options. |
| **ADR-008** | 2026-11-17 | Accepted | **Portfolio Builder First + 20 Popular Stocks & Categorized ETFs** | **Move Asset/Portfolio Builder directly below Budget Inputs (before 3Y/5Y revenue results)** and expand catalog to include categorized ETFs (Global, US, Europe, Cash/Bonds) **plus 20 popular individual companies** (12 US: `NVDA`, `AAPL`, `MSFT`, `GOOGL`, `META`, `AMZN`, `TSLA`, `AVGO`, `BRK-B`, `LLY`, `JPM`, `COST`; 8 European: `ASML.AS`, `NVO`, `SAP.DE`, `MC.PA`, `SIE.DE`, `SHEL.AS`, `NESN.SW`, `EDP.LS`). | User feedback: "On what am I earning?" must be visible and customizable immediately before showing revenue numbers, with popular stocks like NVIDIA/Apple/Google/Meta selectable alongside ETFs. |
| **ADR-009** | 2026-11-17 | Accepted | **Bulletproof Any-Ticker Lookup (`NVDA`, etc.)** | **Multi-Gateway CORS + Local Dictionary + Smart Fallback**: Support ticker & company-name search (`NVDA`, `NVIDIA`, `AAPL`, `Apple`, etc.) across 4 tiers: (1) Built-in 35+ ETF & Stock catalog, (2) Vite `/api/yahoo` proxy, (3) Multi-CORS fallbacks (`corsproxy.io`, `codetabs`, `allorigins`), (4) Deterministic instant ticker profile generator so adding a ticker on static GitHub Pages never fails. | User tested `NVDA` on GitHub Pages where `allorigins` was blocked by Yahoo rate-limiting. |
| **ADR-010** | 2026-11-17 | Accepted | **Interactive Europe Tax Map & Live Financial News** | Add an **Interactive SVG Map of Europe** color-coded by ETF tax regime/rates, plus a **Live Market News & European Insights Feed** (live RSS-to-JSON feeds + curated financial news channels). | User requested a visual map tab/view and live accessible market news links/feeds. |
| **ADR-011** | 2026-11-17 | Accepted | **Portugal IRS Anexo J Sample Form, Filing Calendar & `.ics` Reminders** | Add a realistic **Filled Sample Template of Portugal's `IRS Modelo 3 — Anexo J` (Quadro 9.2A & 8A)** with fictitious example data + interactive calculator mapping user's own numbers into Anexo J rows, downloadable cheat-sheet, official deadlines, and an **`.ics` Calendar Reminder Generator** (+ local reminders). | User requested concrete guidance on *what* to fill out, *when* to file, a sample filled Portuguese tax form with fictitious data, and reminders so investors never miss deadlines or holding-period milestones. |
| **ADR-012** | 2026-11-17 | Accepted | **V3 Readability, Compact Portfolio UX, `EN/RU` & 3 Text Sizes (`A / A+ / A++`)** | Add a global **`🌐 EN | RU` language switcher**, a **3-level Font Size Zoom control (`A 100% | A+ 112% | A++ 125%`)**, distinct **4-Card Main Navigation Tabs**, a custom SVG **Favicon + Mariner's Compass Crest Logo**, an **Investor Wisdom & Habit Banner** (collapsible), and redesign `EtfSelector` to be **compact (~220px) by default** using a grouped `<select>` dropdown + active chips + a collapsible category drawer so beginners immediately see their 3Y/5Y revenue cards without scrolling through 35 cards. | User feedback: needed English/Russian toggle, larger font size presets, clearer clickable tabs, and elimination of the tall catalog wall on the home screen. |
| **ADR-013** | 2026-11-17 | Accepted | **Windows Non-Hanging Build & Typecheck Rule** | **Always invoke `node` directly with closed `stdin` (`$null | node ...`) instead of `npm run` / `npx` wrappers on Windows:** Use `$null | node ./node_modules/typescript/bin/tsc --noEmit` and `$null | node ./node_modules/vite/bin/vite.js build` for builds/checks, and always run `npm install` or `git push` with `BypassSandbox: true`. | On Windows PowerShell inside the sandbox, `npm.ps1` / `npx.ps1` wrappers keep child `stdin`/`stdout` pipe handles open after completion, causing tasks to stay in `RUNNING` state indefinitely. Piping `$null | node ...` closes `stdin` (`EOF`) and exits cleanly. |
| **ADR-014** | 2026-11-18 | Accepted | **Calm Palette, Static Header, No Fabricated Prices** | (1) Remap cyan/sky/blue/violet/purple/indigo to one muted steel-blue ramp and amber to sand in `@theme` (`index.css`); chart hexes aligned. (2) Header is `relative`, not `sticky`; tab titles shortened. (3) `synthesizePlausibleInstrument` throws for tickers outside `POPULAR_FALLBACK_DICTIONARY` instead of generating a hash-based price curve; dictionary entries are labelled approximate. See `REVIEW-v3.1.md`. | User feedback: colors too bright, orientation hard. Review found all CORS gateways dead on GitHub Pages and fake data entering backtests. |
| **ADR-015** | 2026-11-18 | Accepted | **Phase 8 Closure: Daily Quotes Snapshot, Shorter First Screen, CSS Variables Theme, Code Splitting & `TAX-VERIFY.md`** | (1) Server-side `scripts/fetch-quotes.mjs` + daily GitHub Action (`.github/workflows/quotes.yml`) write `public/data/quotes.json`; `marketService.ts` reads `./data/quotes.json` first, removes dead CORS gateways (`corsproxy.io`, `codetabs`, `allorigins`), and `Header` displays `Data as of <date>` / `Данные на <дата>` instead of fake `Live`. (2) `InvestorWisdomBanner` quotes and "Power of Time" cards default to collapsed and persist in `localStorage`, keeping Step 1 visible at `1366x768`. (3) Replaced all `!important` light-mode CSS overrides in `src/index.css` with `--ui-*` CSS custom properties and `.ui-*` utilities, verified by before/after screenshots across all 4 tabs and both themes. (4) Split `EtfSelector`, `InvestmentCalculator`, and `TaxFilingToolkit` into modular sub-components and lazy-loaded non-default tabs via `React.lazy` (main bundle `453.42 kB` < `500 kB`). (5) Created `TAX-VERIFY.md` auditing all 15 jurisdictions in `src/data/countryTaxes.ts` against official tax authorities without inventing or modifying unverified tax numbers. | Resolves all Phase 8 items from `REVIEW-v3.1.md` and `ROADMAP.md` while maintaining strict price and tax-data honesty. |

---

## 5. User Custom Notes & Additions

<!-- USER: Add any custom requirements, extra countries, specific brokers, favorite ETFs (by ISIN/Ticker), or UI preferences below! -->
- **2026-11-17:** Prioritize **Portugal (`PT`)**, **Netherlands (`NL`)**, **Germany (`DE`)**, and all major European countries (Austria, Ireland, UK, France, Spain, Italy, Belgium, Switzerland, Poland, Romania, Czechia, Sweden). Default country selector features Portugal, Germany, and Netherlands at the top for fast switching.
- **2026-11-17 (V2 Feedback — Completed):**
  1. Light / Dark theme toggle + toned-down sage-green palette + 3 font options.
  2. Portfolio & Asset Selector placed *before* the "How much you could earn" cards; 35+ catalog with categorized ETFs (World, US, Europe) + 20 top individual stocks (`NVDA`, `AAPL`, `MSFT`, `GOOGL`, `META`, `AMZN`, `ASML.AS`, `EDP.LS`, etc.) and 100% reliable ticker search (`NVDA`, etc.) on GitHub Pages.
  3. Interactive SVG Map of Europe (`EuropeTaxMap.tsx`) + Live Market News & Insights (`MarketNewsFeed.tsx`).
  4. In Taxes (`TaxFilingToolkit.tsx`): shows *what* form to file and *when*, provides a sample filled Portuguese `IRS Anexo J` form with fictitious data (downloadable/printable), and lets users download `.ics` calendar reminders.
- **2026-11-17 (V3 Feedback — Completed & Tagged `v3.0.0`):**
  1. Full **`🌐 EN | RU` language switcher** in Header (`src/utils/i18n.ts`).
  2. **3 Font Size Zoom levels (`A` 16px, `A+` 18px, `A++` 20px)** scaling all `rem` typography across the app.
  3. **Compact Beginner Portfolio UX**: Replaced the tall 35-card wall with 1-click strategy presets, active holding chips, a grouped `<select>` dropdown by category, and a collapsible category drawer (closed by default).
  4. **4 Distinct Numbered Feature-Card Navigation Tabs**, custom SVG Favicon + Header Crest Logo, and collapsible Investor Wisdom & Habit Banner.
