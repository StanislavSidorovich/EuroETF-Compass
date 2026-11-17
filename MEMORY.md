# MEMORY.md — Project Decisions, Domain Knowledge & User-Editable Log

> **Sync Notice:** This file works alongside [`GEMINI.md`](./GEMINI.md) and [`ROADMAP.md`](./ROADMAP.md).  
> You can add new architectural decisions, preferred ETFs, specific country tax nuances, or broker preferences directly to this file at any time. All agents in the orchestration pipeline will read this file before writing or modifying code.

---

## 1. Key Decisions Made So Far

### 1.1 Application Architecture & Stack
- **Framework:** React 18 + TypeScript + Vite + Tailwind CSS.
- **Why:** Fast compilation, strong type safety for financial/tax calculations, native Vite dev server proxy (`/api/yahoo`) to fetch live European ETF quotes without browser CORS issues, and seamless static export for GitHub Pages / Vercel / Netlify.
- **GitHub Integration:** Local Git repository initialized (`git init`). Structured with clean modular boundaries so commits can be pushed directly to a remote GitHub repository.

### 1.2 Live Market Connection Strategy
- **Primary Live Source:** Yahoo Finance v8 Chart API (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=5y&interval=1wk` and intraday/daily quotes) routed via Vite proxy in development and public CORS-friendly endpoints when hosted statically.
- **Custom Symbol Support:** Users can pick from our curated list of top European UCITS ETFs **or** type any valid Yahoo Finance European ETF ticker (e.g. `VWCE.DE`, `IWDA.AS`, `SXR8.DE`, `VUAA.DE`, `CSPX.L`, `XDWD.DE`, `VGWL.DE`) to pull live prices and 3Y/5Y history on the fly.
- **Resilient Offline / Rate-Limit Fallback:** Bundled verified 5-year historical price curves for core UCITS ETFs ensure the 3Y/5Y calculator and forecast charts work instantaneously even if the user is offline or rate-limited, displaying a clear `LIVE FEED` vs. `CACHED SNAPSHOT` indicator in the header.

### 1.3 Careful Investing & ETF Selection Decisions
- **Focus on UCITS ETFs:** All default ETFs are EU-regulated **UCITS** funds (Irish `IE...` or Luxembourg `LU...` domicile), as required for European retail investors.
- **Accumulating (`Acc`) vs. Distributing (`Dist`) Pairing:** Every core index in our catalog includes both its **Accumulating** version (dividends automatically reinvested inside the fund without triggering broker commissions) and its **Distributing** version (dividends paid out in cash), allowing side-by-side comparison of tax drag and compounding over 3Y, 5Y, and 10Y+ horizons.

### 1.4 European Country Tax & Legal Matrix Decisions
We model 12+ European jurisdictions across three distinct tax archetypes so users immediately see whether **Accumulating** or **Distributing** ETFs are more tax-beneficial:
1. **Archetype A — Pure Tax Deferral on Accumulating ETFs (`Acc` Strongly Preferred):**
   - **Portugal (Featured Tier-1):** 28% flat IRS tax (*Taxa Autónoma*) on dividends (Category E) and capital gains (Category G, FIFO method, declared on *Anexo J, Quadro 9.2A* for foreign brokers or *Anexo G* for PT brokers). Under **Lei n.º 31/2024**, capital gains on securities/ETFs held long-term receive progressive exemptions: **2–5 years = 10% exemption (25.2% effective tax)**; **5–8 years = 20% exemption (22.4% effective tax)**; **>8 years = 30% exemption (19.6% effective tax)**. Because `Dist` ETF dividends are taxed at the full 28% every year with zero holding discount, whereas `Acc` ETFs reinvest dividends tax-free and convert them into discounted long-term capital gains upon sale, **`Acc` ETFs have a massive double tax advantage in Portugal**.
   - **Other Archetype A Countries:** France (*PEA* & *CTO*), Spain, Italy, Belgium (for 100% equity ETFs; note 1.32% vs 0.12% *TOB* and 30% *Reynders tax* on bond portion), Poland (*Belka* 19%), Romania (1%/3% local broker with holding period vs 10% dividends), Czechia & Slovakia (3-year / 1-year holding period exemption for 0% capital gains tax!).
   - **Why `Acc` wins:** Dividends paid out by `Dist` ETFs are taxed immediately every year, whereas `Acc` ETFs reinvest dividends internally without triggering a taxable event until shares are sold.
2. **Archetype B — Annual Deemed / Imputed Tax on Accumulating ETFs (`Acc` & `Dist` Neutral or Hybrid Strategy):**
   - **Germany:** 26.375% *Abgeltungsteuer* (incl. Soli) with **30% *Teilfreistellung*** (partial exemption for equity ETFs >50% stocks -> effective ~18.46% tax). Uses the **Vorabpauschale** (advance lump-sum tax based on Bundesbank base rate) on Accumulating ETFs. **Verdict:** Use `Dist` (or partial capital gains sale) up to the **€1,000 *Sparerpauschbetrag*** (€2,000 for couples) tax-free allowance, then `Acc` for hands-off compounding.
   - **Austria:** 27.5% *KESt*. Accumulating ETFs must be registered as **Meldefonds** with **OeKB** (`my.oekb.at`), where **60% of distributed-equivalent income (*Ausschüttungsgleiche Erträge* - AgE)** is taxed annually and 40% is deferred.
   - **United Kingdom:** Inside an **ISA** (£20,000/yr allowance), **100% tax-free** for both `Acc` and `Dist` (`Acc` preferred for zero reinvestment spread). In a General Investment Account (GIA), **Excess Reportable Income (ERI)** on `Acc` ETFs is still taxed as dividend income; requires ETFs with **UK Reporting Fund Status**.
   - **Switzerland:** **0% Capital Gains Tax** for private investors! However, both `Dist` payouts and `Acc` internal dividend income are subject to Swiss income tax (as parsed in the *ICTax* federal tax database).
3. **Archetype C — Wealth Tax or Periodic Deemed Disposal:**
   - **Ireland:** **41% Exit Tax** on UCITS ETFs with **8-Year Deemed Disposal** (taxed on unrealized gains every 8 years whether sold or not; losses cannot be offset across all funds). `Acc` still avoids annual 41% dividend tax during the 8-year window.
   - **Netherlands:** **Box 3 Wealth Tax** (annual tax based on deemed return on net assets above the tax-free threshold ~€57,000 per person; transitioning toward actual return system).

### 1.5 Connected European Portals & Broker Comparison
- **Connected Portals:** `justETF.com`, `extraETF.com`, `Finanzfluss.de`, `Finanztip.de`, `Curvo.eu`, `Bankeronwheels.com`, `my.oekb.at` (OeKB), `ICTax.admin.ch` (Swiss Federal Tax DB), `TrackingDifferences.com`.
- **Compared Brokers:** Trade Republic, Scalable Capital, Interactive Brokers (IBKR), DEGIRO, Lightyear, Trading 212, XTB, Finanzen.net zero — classified by **Automatic Local Tax Reporting (*Steuereinfach*)** vs. Manual Tax Return.

---

## 2. Agent & Model Assignments

| Agent ID / Role | Model | Effort Level | Scope |
| :--- | :--- | :--- | :--- |
| **Coordinator Hub** | **Gemini 4 Argon (`pro`)** | **High** | Architecture, user alignment, subagent orchestration & cleanup, final verification. |
| **Agent 1: Core Engine & Live Market Architect** | **Gemini 4 Argon (`pro`)** | **High** | Project setup, Vite proxy, TypeScript schemas, live Yahoo Finance ETF client, 3Y/5Y historical backtest & statistical forecast math. |
| **Agent 2: European Tax & ETF Dataset Specialist** | **Gemini 4 Hydrogen (`flash`)** | **Medium-High** | Rich data sets for UCITS ETFs (`Acc` & `Dist`) and 12+ European country legal/tax rules. |
| **Agent 3: Broker Matrix, Portals & Academy Specialist** | **Gemini 4 Hydrogen (`flash`)** | **Medium** | European website deep-links, broker comparison matrix, and careful investing educational lessons. |
| **Agent 4: Calculator & Interactive Chart Engineer** | **Gemini 4 Argon (`pro`)** | **High** | Complex SVG/Canvas interactive 3Y/5Y historical revenue + future forecast cone chart & budget calculator UI. |
| **Agent 5: Tax, Broker & Academy UI Builder** | **Gemini 4 Hydrogen (`flash`)** | **Medium** | UI components for Country Tax Matrix, Acc vs Dist analyzer, European Portals Hub, Academy, and App shell. |
| **Agent 6: QA & Browser Verifier** | **Gemini 4 Hydrogen (`flash`)** | **Low-Medium** | Production build verification (`npm run build`) and live browser testing. |

---

## 3. User Additions & Future Decisions (Editable Section)

> **Add your own rules, notes, or changes below:**

- `[x]` **V2 Upgrade — Light/Dark Theme, Soft Green Palette & 3 Fonts:** Added Light/Dark toggle (`light` / `dark`), softened the green accent from bright neon emerald to calm forest/sage green (`#2d8a61`), and added 3 selectable fonts (`Inter`, `Plus Jakarta Sans`, `Merriweather`).
- `[x]` **V2 Upgrade — Portfolio Builder First + 20 Popular Individual Stocks & Categorized ETFs:** Moved the interactive portfolio builder directly underneath the Budget inputs (before the 3Y/5Y revenue cards) so it is always explicit *which* ETFs and stocks generate the return. Added category browser (`Global ETFs`, `US ETFs`, `European & Bond ETFs`, `US Individual Stocks`, `European Individual Stocks`) with 20 famous stocks (`NVDA`, `AAPL`, `MSFT`, `GOOGL`, `META`, `AMZN`, `TSLA`, `AVGO`, `BRK-B`, `LLY`, `JPM`, `COST`, `ASML.AS`, `NVO`, `SAP.DE`, `MC.PA`, `SIE.DE`, `SHEL.AS`, `NESN.SW`, `EDP.LS`).
- `[x]` **V2 Upgrade — Bulletproof Ticker Search (`NVDA`, Company Names, Any Symbol):** Upgraded `marketService.ts` so searching by ticker (`NVDA`) or company name (`NVIDIA`, `Apple`, `Facebook`) matches the built-in 35+ catalog immediately and falls back through multi-CORS gateways (`corsproxy.io`, `codetabs`, `allorigins`) plus a smart deterministic symbol builder so GitHub Pages never blocks adding a ticker.
- `[x]` **V2 Upgrade — Interactive Map of Europe & Live Financial News Hub:** Added an SVG Map of Europe colored by ETF tax regime and a Live Financial News & Market Insights section (RSS-to-JSON live feeds + curated European financial news sources).
- `[x]` **V2 Upgrade — Portugal `IRS Modelo 3 Anexo J` Sample Filled Form, Deadlines & `.ics` Reminders:** Added a visual filled template of Portugal's `Anexo J` (*Quadro 9.2A* for ETF/Stock sales via FIFO & *Quadro 8A* for dividends) with realistic fictitious data, downloadable cheat-sheet, filing calendar (`1 April – 30 June` in Portugal), and `.ics` calendar reminder generator.
- `[x]` **V3 Upgrade (`v3.0.0`) — Light Header, `EN/RU` Switcher, 3 Font Sizes (`A/A+/A++`), Compact Portfolio Dropdown & 4 Feature-Card Tabs:**
  - Replaced dark `#090d16` header & ticker strip with a soft, bright alabaster/sage header (`#f7faf8`) in Light Mode and a softer slate (`#162231`) in Dark Mode.
  - Added global **`🌐 EN | RU` language switcher** (`src/utils/i18n.ts`) and **3 Font Size Zoom levels (`A` 16px, `A+` 18px, `A++` 20px)**.
  - Redesigned `EtfSelector.tsx` to be compact (~220px) by default with 1-click presets, active holding chips, a grouped `<select>` dropdown by category, and a collapsible category drawer (closed by default) so beginners immediately see their 3Y/5Y revenue cards.
  - Added **Windows Non-Hanging Build Rule (`ADR-013`)**: invoke `$null | node ./node_modules/typescript/bin/tsc --noEmit` and `$null | node ./node_modules/vite/bin/vite.js build` instead of `npm run` / `npx` wrappers to prevent child descriptor hangs on Windows.
