import { useCallback, useEffect, useState } from 'react';
import { CURATED_ETFS } from './data/etfs';
import { EUROPEAN_COUNTRY_TAXES } from './data/countryTaxes';
import { EUROPEAN_BROKERS } from './data/europeanPortals';
import {
  buildBaselineQuote,
  fetchAllLiveEtfQuotes,
  fetchCustomYahooEtf,
} from './services/marketService';
import type {
  ETFInstrument,
  FontFamilyOption,
  LiveQuoteData,
  ThemeMode,
} from './types';
import { Header, type AppTab } from './components/layout/Header';
import { LiveTickerBar } from './components/layout/LiveTickerBar';
import { InvestorWisdomBanner } from './components/layout/InvestorWisdomBanner';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { InvestmentCalculator } from './components/calculator/InvestmentCalculator';
import { CountryTaxExplorer } from './components/taxes/CountryTaxExplorer';
import { EuropeanPortalsHub } from './components/ecosystem/EuropeanPortalsHub';
import { BrokerComparison } from './components/ecosystem/BrokerComparison';
import { CarefulInvestingAcademy } from './components/academy/CarefulInvestingAcademy';

function buildInitialQuotes(etfs: ETFInstrument[]): Record<string, LiveQuoteData> {
  const initial: Record<string, LiveQuoteData> = {};
  for (const etf of etfs) {
    initial[etf.id] = buildBaselineQuote(etf);
  }
  return initial;
}

const THEME_STORAGE_KEY = 'euroetf_theme_v1';
const FONT_STORAGE_KEY = 'euroetf_font_v1';

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  const [fontFamily, setFontFamily] = useState<FontFamilyOption>(() => {
    try {
      const saved = localStorage.getItem(FONT_STORAGE_KEY);
      if (saved === 'inter' || saved === 'jakarta' || saved === 'serif') return saved;
    } catch {
      // ignore storage errors
    }
    return 'inter';
  });

  const [etfs, setEtfs] = useState<ETFInstrument[]>(CURATED_ETFS);
  const [quotesByEtfId, setQuotesByEtfId] = useState<Record<string, LiveQuoteData>>(() =>
    buildInitialQuotes(CURATED_ETFS)
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('PT');
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingCustomTicker, setIsFetchingCustomTicker] = useState(false);
  const [customTickerError, setCustomTickerError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, fontFamily);
    } catch {
      // ignore storage errors
    }
  }, [fontFamily]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const refreshAllQuotes = useCallback(
    async (targetEtfs: ETFInstrument[], forceRefresh = false) => {
      setIsRefreshing(true);
      try {
        const liveQuotes = await fetchAllLiveEtfQuotes(targetEtfs, { forceRefresh });
        setQuotesByEtfId((prev) => ({ ...prev, ...liveQuotes }));
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  // Automatically upgrade baseline quotes to live Yahoo Finance feeds on initial mount
  useEffect(() => {
    void refreshAllQuotes(CURATED_ETFS, false);
  }, [refreshAllQuotes]);

  const handleRefreshPrices = useCallback(() => {
    void refreshAllQuotes(etfs, true);
  }, [etfs, refreshAllQuotes]);

  const handleAddCustomTicker = useCallback(
    async (ticker: string) => {
      const normalized = ticker.trim().toUpperCase();
      if (!normalized) return;

      setCustomTickerError(null);
      setIsFetchingCustomTicker(true);
      try {
        const { etf: fetchedEtf, quote } = await fetchCustomYahooEtf(normalized);
        setEtfs((prev) => {
          const exists = prev.some(
            (item) =>
              item.id === fetchedEtf.id ||
              item.ticker.toUpperCase() === fetchedEtf.ticker.toUpperCase()
          );
          if (exists) {
            return prev;
          }
          return [...prev, fetchedEtf];
        });

        setQuotesByEtfId((prev) => {
          const existingMatch = etfs.find(
            (item) => item.ticker.toUpperCase() === fetchedEtf.ticker.toUpperCase()
          );
          const targetId = existingMatch ? existingMatch.id : fetchedEtf.id;
          return { ...prev, [targetId]: quote };
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : `Unable to fetch live ticker "${normalized}".`;
        setCustomTickerError(msg);
      } finally {
        setIsFetchingCustomTicker(false);
      }
    },
    [etfs]
  );

  return (
    <div
      data-theme={theme}
      className={`min-h-screen bg-[#090d16] fintech-grid-bg text-slate-100 flex flex-col font-theme-${fontFamily}`}
    >
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        countries={EUROPEAN_COUNTRY_TAXES}
        selectedCountryCode={selectedCountryCode}
        onSelectCountry={setSelectedCountryCode}
        quotesByEtfId={quotesByEtfId}
        totalEtfCount={etfs.length}
        onRefreshPrices={handleRefreshPrices}
        isRefreshing={isRefreshing}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        fontFamily={fontFamily}
        onChangeFont={setFontFamily}
      />

      <LiveTickerBar
        etfs={etfs}
        quotesByEtfId={quotesByEtfId}
        onAddCustomTicker={handleAddCustomTicker}
        isFetchingCustomTicker={isFetchingCustomTicker}
        customTickerError={customTickerError}
      />

      <InvestorWisdomBanner theme={theme} onNavigateTab={setActiveTab} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <DisclaimerBanner />

        {activeTab === 'calculator' && (
          <InvestmentCalculator
            etfs={etfs}
            quotesByEtfId={quotesByEtfId}
            countries={EUROPEAN_COUNTRY_TAXES}
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={setSelectedCountryCode}
            onAddCustomTicker={handleAddCustomTicker}
            isFetchingCustomTicker={isFetchingCustomTicker}
            customTickerError={customTickerError}
            theme={theme}
          />
        )}

        {activeTab === 'taxes' && (
          <CountryTaxExplorer
            countries={EUROPEAN_COUNTRY_TAXES}
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={setSelectedCountryCode}
          />
        )}

        {activeTab === 'ecosystem' && (
          <div className="space-y-6">
            <EuropeanPortalsHub etfs={etfs} selectedCountryCode={selectedCountryCode} />
            <BrokerComparison
              brokers={EUROPEAN_BROKERS}
              countries={EUROPEAN_COUNTRY_TAXES}
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={setSelectedCountryCode}
            />
          </div>
        )}

        {activeTab === 'academy' && <CarefulInvestingAcademy />}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-slate-200">
              EuroETF Compass — Careful UCITS ETF Investing &amp; European Tax Intelligence
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Educational platform only. Historical performance and backtests do not guarantee
              future returns. Verify ISIN KIDs and national tax filings with licensed advisors.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="hover:text-emerald-300"
            >
              3Y/5Y Backtest
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('taxes')}
              className="hover:text-emerald-300"
            >
              EU Tax Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ecosystem')}
              className="hover:text-emerald-300"
            >
              Brokers &amp; Portals
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academy')}
              className="hover:text-emerald-300"
            >
              ETF Academy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
