# EuroETF Compass — Careful UCITS ETF Investing, EU Country Taxes & Live 3Y/5Y Backtest + Forecast App

EuroETF Compass is an interactive European investment education, tax-optimization, and historical backtest + forecast web application built with **React 18, TypeScript, Vite, and Tailwind CSS**.

## Core Features

1. **Careful Stock & ETF Investing Academy (`Acc` vs `Dist`):**
   - Explains why broad, diversified **UCITS ETFs** outperform speculative stock picking.
   - Deep-dives into **Accumulating (`Acc`) vs. Distributing (`Dist`) ETFs**, dividend reinvestment compounding, Irish (`IE`) 15% US dividend tax treaty advantage vs. Luxembourg (`LU`), and TER vs. Tracking Difference (TD).
   - Interactive **8-Point Careful Investor Pre-Flight Checklist**.

2. **European Country Legal & Tax Matrix (15 Jurisdictions):**
   - Featured support for **🇵🇹 Portugal**, **🇳🇱 Netherlands**, and **🇩🇪 Germany**, plus Austria, Ireland, France, Spain, Italy, Belgium, UK, Switzerland, Poland, Romania, Czechia, and Sweden.
   - Evaluates whether **Accumulating** or **Distributing** ETFs are more tax-beneficial in each country:
     - **Portugal (`PT`):** Models the 28% IRS tax, FIFO rule, *Anexo J (Quadro 9.2A)* declaration, and **Lei n.º 31/2024 progressive holding-period capital gains exclusions** (`2–5 yrs = 25.2%`, `5–8 yrs = 22.4%`, `>8 yrs = 19.6%` effective tax), showing why Accumulating ETFs provide a powerful double tax advantage in Portugal.
     - **Netherlands (`NL`):** Models **Box 3** wealth taxation above the tax-free allowance (*Heffingsvrij vermogen*) and actual return rebuttal rules (*Tegenbewijsregeling*).
     - **Germany (`DE`):** Models the 26.375% *Abgeltungsteuer*, **30% *Teilfreistellung*** (18.46% effective rate on equity ETFs), **€1,000 *Sparerpauschbetrag***, and *Vorabpauschale*.

3. **Connected European Websites & Broker Comparison Hub:**
   - One-click dynamic **ISIN & Ticker Deep-Linker** to **justETF.com**, **extraETF.com**, **Finanzfluss.de**, **Curvo.eu**, **OeKB Profitweb (`my.oekb.at`)**, **TrackingDifferences.com**, and **Yahoo Finance**.
   - Filterable **European Broker Comparison Matrix** (**XTB**, **DEGIRO**, **Trade Republic**, **Interactive Brokers**, **Scalable Capital**, **Lightyear**, **Trading 212**) highlighting local tax support (e.g., XTB Portugal's pre-filled *IRS Anexo J* report and German *Steuereinfach* brokers).

4. **Market Data + 3Y/5Y Historical Revenue Backtest & Future Forecast Calculator:**
   - **Daily Snapshot Quotes (`public/data/quotes.json`):** A scheduled GitHub Action ([`.github/workflows/quotes.yml`](./.github/workflows/quotes.yml)) runs [`scripts/fetch-quotes.mjs`](./scripts/fetch-quotes.mjs) once daily (Node 20, zero API keys) against the Yahoo Finance v8 Chart API (`range=5y&interval=1mo`) and commits `public/data/quotes.json`. The app reads `./data/quotes.json` first and falls back to its built-in 5-year baseline cache if unavailable. In local Vite dev mode, `/api/yahoo` is also available.
   - **3-Year & 5-Year Historical Backtest:** Shows exact revenue (`€` profit), final portfolio value, CAGR, max drawdown, and net after-tax `Acc` vs `Dist` wealth if you had invested **3 years ago** or **5 years ago**.
   - **Future Forecast Cone (`3Y`, `5Y`, `10Y`, `15Y`, `20Y`):** Projects Conservative (`-1σ`), Base Historical CAGR, Optimistic (`+1σ`), and Post-Tax Net curves with a prominent regulatory notice that *historical investment ratings and past returns are not promised for the future*.

### Optional: Connecting a Cloudflare Worker Proxy for Arbitrary Tickers
Because public browser CORS gateways are unreliable on static GitHub Pages, arbitrary tickers outside the 35-asset `quotes.json` snapshot (and the built-in dictionary) cannot be queried directly from the browser. If you want on-demand lookup for any arbitrary Yahoo symbol on GitHub Pages later:
1. Deploy a minimal Cloudflare Worker (free tier) that proxies `GET /?symbol=<TICKER>` to `https://query1.finance.yahoo.com/v8/finance/chart/<TICKER>?range=5y&interval=1mo&includeAdjustedClose=true` with `Access-Control-Allow-Origin: https://<your-username>.github.io` and a `User-Agent` header.
2. Expose its URL via `VITE_YAHOO_WORKER_URL` (or add it inside `fetchYahooChartViaDevProxy` / a `fetchYahooChartFromWorker` branch in `src/services/marketService.ts`) for `fetchCustomYahooEtf`.

## Project Memory & Roadmap Files

- [`GEMINI.md`](./GEMINI.md) — Central AI & Developer Memory, System Architecture, and Decision Log (`ADR-001` to `ADR-006`).
- [`MEMORY.md`](./MEMORY.md) — Extended Domain Decisions & User-Editable Notes Log.
- [`ROADMAP.md`](./ROADMAP.md) — Phased Engineering & Product Roadmap.

## Getting Started Locally

```bash
npm install
npm run dev
```

## Production Build & GitHub Connection

```bash
npm run build
git add .
git commit -m "Initial commit: EuroETF Compass"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
