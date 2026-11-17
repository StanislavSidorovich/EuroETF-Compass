# ROADMAP.md — EuroETF Compass Product & Engineering Roadmap

> **Project:** EuroETF Compass — Careful ETF Investing, European Tax Legal Guide, Broker Connections & Live 3Y/5Y Backtest + Forecast App  
> **Companion Files:** [`GEMINI.md`](./GEMINI.md) | [`MEMORY.md`](./MEMORY.md)

---

## Phase 0: Architecture, Memory & Orchestration Blueprint (Completed)
- [x] Initialize local Git repository (`git init`) for seamless GitHub connection.
- [x] Create persistent decision & memory files (`GEMINI.md` and `MEMORY.md`) so the user and future agents can review and append decisions.
- [x] Define complete system architecture, module boundaries, data schemas, and multi-agent orchestration plan (Models & Effort levels).
- [x] Present architectural blueprint & roadmap artifact to the user for review before writing application code.

---

## Phase 1: Project Foundation, Live Market Proxy & Financial Math Engine (Completed)
**Assigned Agent:** `Agent 1 — Core Engine & Live Market Architect` (`Model: "pro"` / **Argon**, Effort: **High**)
- [x] Create `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts` (configured with `/api/yahoo` proxy for live European ETF quotes), and `index.html`.
- [x] Define strict TypeScript interfaces in `src/types/index.ts`.
- [x] Implement `src/services/marketService.ts` (3-tier live quote & 5Y history fetcher: Vite Yahoo Finance v8 proxy $\rightarrow$ CORS fallback $\rightarrow$ verified 5Y baseline + custom ticker search).
- [x] Implement `src/utils/investmentMath.ts` (3Y & 5Y historical lump-sum & monthly DCA backtest, country-specific `Acc` vs `Dist` tax-drag simulator, and 3Y–20Y statistical forecast engine).

---

## Phase 2: European Domain Data — ETFs, Country Tax Laws, Brokers & Academy (Completed)
**Assigned Agents:**
- `Agent 2A — European Tax & ETF Dataset Specialist` (`Model: "flash"` / **Hydrogen**, Effort: **Medium-High**)
- `Agent 2B — Broker Matrix, Portals & Academy Specialist` (`Model: "flash"` / **Hydrogen**, Effort: **Medium**)
- [x] Populate `src/data/etfs.ts` with 10 flagship European UCITS ETFs pairing `Acc` and `Dist` twins (`VWCE.DE` ↔ `VGWL.DE`, `EUNL.DE`/`IWDA.AS` ↔ `IQQW.DE`, `SXR8.DE` ↔ `VUSA.DE`, `EQQB.DE` ↔ `EQQQ.DE`, `IS3N.DE`, `XEON.DE`) with 61-point 5Y monthly trajectories.
- [x] Populate `src/data/countryTaxes.ts` with legal & tax frameworks for **15 European Countries** led by **🇵🇹 Portugal** (28% IRS & Lei n.º 31/2024 holding-period discounts: 25.2% at 2–5y, 22.4% at 5–8y, 19.6% at >8y), **🇳🇱 Netherlands** (Box 3 wealth tax), and **🇩🇪 Germany** (30% *Teilfreistellung*, €1,000 *Sparerpauschbetrag*, *Vorabpauschale*), plus `AT`, `IE`, `FR`, `ES`, `IT`, `BE`, `CH`, `GB`, `PL`, `RO`, `CZ`, `SE`.
- [x] Populate `src/data/europeanPortals.ts` with dynamic ISIN deep-linkers (`justETF`, `extraETF`, `Finanzfluss`, `Curvo.eu`, `OeKB`, `Portal das Finanças`, `Belastingdienst`, `Yahoo Finance`) and 7 European brokers (`XTB`, `DEGIRO`, `Trade Republic`, `Interactive Brokers`, `Scalable Capital`, `Lightyear`, `Trading 212`).
- [x] Populate `src/data/academyContent.ts` with 5 structured careful-investing lessons and an 8-point interactive checklist.

---

## Phase 3: Interactive Application UI & Visualizations (Completed)
**Assigned Agents:**
- `Agent 3A — Calculator & Interactive Chart Engineer` (`Model: "pro"` / **Argon**, Effort: **High**)
- `Agent 3B — Tax Explorer, Broker Hub & Academy UI Developer` (`Model: "flash"` / **Hydrogen**, Effort: **Medium**)
- [x] **Live Ticker Header & Navigation (`src/components/layout/`):** `Header.tsx`, `LiveTickerBar.tsx`, and `DisclaimerBanner.tsx`.
- [x] **Budget, 3Y/5Y Historical Backtest & Forecast Calculator (`src/components/calculator/`):** `InvestmentCalculator.tsx`, `EtfSelector.tsx`, and custom SVG `PerformanceChart.tsx` showing `-5Y`/`-3Y` historical reality transitioning into `+3Y` to `+20Y` forecast cones with mandatory regulatory notices.
- [x] **European Country Tax & Legal Matrix (`src/components/taxes/`):** `CountryTaxExplorer.tsx` and interactive `AccVsDistComparison.tsx`.
- [x] **European Portals & Broker Comparison Hub (`src/components/ecosystem/`):** `EuropeanPortalsHub.tsx` and `BrokerComparison.tsx`.
- [x] **Careful Investing Academy (`src/components/academy/`):** `CarefulInvestingAcademy.tsx`.

---

## Phase 4: Integration, Build Verification & GitHub Readiness (Completed)
- [x] Install dependencies (`npm install`) and verify zero TypeScript or Vite production build errors (`npm run build` $\rightarrow$ `tsc --noEmit && vite build`).
- [x] Verify clean `.gitignore` and documentation (`README.md`, `GEMINI.md`, `MEMORY.md`, `ROADMAP.md`) ready for GitHub push.

---

## Phase 5 (V2 Upgrade): Theme, Portfolio-First UX, 20 Stocks, Europe Map, News & PT Anexo J Toolkit (Completed)
**Assigned Multi-Agent Wave:**
- **Agent V2-A (`Model: "flash"` / Hydrogen — Catalog, Stocks & Multi-Gateway Market Engine):**
  - [x] Expand `src/data/etfs.ts` to ~35 instruments: 15 categorized UCITS ETFs (Global, US, Europe, Cash/Bonds) + **20 Popular Individual Stocks** (`NVDA`, `AAPL`, `MSFT`, `GOOGL`, `META`, `AMZN`, `TSLA`, `AVGO`, `BRK-B`, `LLY`, `JPM`, `COST`, `ASML.AS`, `NVO`, `SAP.DE`, `MC.PA`, `SIE.DE`, `SHEL.AS`, `NESN.SW`, `EDP.LS`).
  - [x] Upgrade `src/services/marketService.ts` so searching `NVDA` or any ticker/company name works 100% reliably on static GitHub Pages via local catalog lookup + multi-CORS proxies (`corsproxy.io`, `codetabs`, `allorigins`) + smart fallback profile generator.
- **Agent V2-B (`Model: "pro"` / Argon — Portfolio-First Calculator, Categorized Asset Picker & Soft-Green Chart):**
  - [x] Reorder `InvestmentCalculator.tsx` so **Step 1 (Budget & Sparplan)** is immediately followed by **Step 2 ("На чём зарабатываем: выбор ETF и акций в портфель")** *before* the 3Y/5Y revenue cards and forecast chart, with clear portfolio composition badges on every revenue card.
  - [x] Upgrade `EtfSelector.tsx` into a full **Categorized Asset & Portfolio Builder** with category tabs (`🌍 Мировые ETF`, `🇺🇸 ETF США`, `🇪🇺 ETF Европы`, `💻 Топ-12 Акций США (NVDA, AAPL, META...)`, `🏰 Топ-8 Акций Европы (ASML, SAP, EDP.LS...)`), instant search by ticker or company name, and custom portfolio weight sliders.
  - [x] Update `PerformanceChart.tsx` to support Light & Dark themes and softer sage-green colors.
- **Agent V2-C (`Model: "flash"` / Hydrogen — Europe SVG Map, PT Anexo J Template + Reminders, News Hub & Theme/Font Shell):**
  - [x] Add **Light / Dark Mode toggle**, **3 Font Switcher (`Inter`, `Plus Jakarta Sans`, `Merriweather`)**, and toned-down sage-green palette in `index.html`, `src/index.css`, `Header.tsx`, and `App.tsx`.
  - [x] Build `src/components/taxes/TaxFilingToolkit.tsx`: Interactive **Portuguese `IRS Modelo 3 — Anexo J` Filled Sample Template** (Quadro 9.2A & Quadro 8A with fictitious investor *João Silva* + downloadable/printable guide), filing deadlines (`1 April – 30 June`), and **`.ics` Calendar & In-App Tax Reminder Generator**.
  - [x] Build `src/components/taxes/EuropeTaxMap.tsx`: Interactive **SVG Map of Europe** showing all 15 countries color-coded by ETF tax favorability, integrated into the Taxes & Map view.
  - [x] Build `src/components/ecosystem/MarketNewsFeed.tsx`: Live Financial News & Market Insights (RSS-to-JSON live feed + curated European ETF, ECB, and Tech stock news channels).
