import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { CURATED_ETFS } from './data/etfs';
import { EUROPEAN_COUNTRY_TAXES } from './data/countryTaxes';
import {
  buildBaselineQuote,
  fetchAllLiveEtfQuotes,
  fetchCustomYahooEtf,
} from './services/marketService';
import type {
  ETFInstrument,
  FontSizeOption,
  LanguageMode,
  LiveQuoteData,
  ThemeMode,
} from './types';
import { AppPreferencesContext, tr } from './utils/i18n';
import { Header, type AppTab } from './components/layout/Header';
import { LiveTickerBar } from './components/layout/LiveTickerBar';
import { InvestorWisdomBanner } from './components/layout/InvestorWisdomBanner';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { InvestmentCalculator } from './components/calculator/InvestmentCalculator';

const CountryTaxExplorer = lazy(() =>
  import('./components/taxes/CountryTaxExplorer').then((m) => ({ default: m.CountryTaxExplorer }))
);
const EcosystemTab = lazy(() =>
  import('./components/ecosystem/EcosystemTab').then((m) => ({ default: m.EcosystemTab }))
);
const CarefulInvestingAcademy = lazy(() =>
  import('./components/academy/CarefulInvestingAcademy').then((m) => ({
    default: m.CarefulInvestingAcademy,
  }))
);

function buildInitialQuotes(etfs: ETFInstrument[]): Record<string, LiveQuoteData> {
  const initial: Record<string, LiveQuoteData> = {};
  for (const etf of etfs) {
    initial[etf.id] = buildBaselineQuote(etf);
  }
  return initial;
}

const THEME_STORAGE_KEY = 'euroetf_theme_v1';
const FONT_SIZE_STORAGE_KEY = 'euroetf_fontsize_v1';
const LANG_STORAGE_KEY = 'euroetf_lang_v1';

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

  const [lang, setLang] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'ru') return saved;
    } catch {
      // ignore storage errors
    }
    return 'ru';
  });

  const [fontSize, setFontSize] = useState<FontSizeOption>(() => {
    try {
      const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (saved === 'normal' || saved === 'large' || saved === 'xl') return saved;
    } catch {
      // ignore storage errors
    }
    return 'normal';
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
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    } catch {
      // ignore storage errors
    }
    const root = document.documentElement;
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xl');
    root.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang;
  }, [lang]);

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
    <AppPreferencesContext.Provider
      value={{ lang, setLang, fontSize, setFontSize, theme, setTheme }}
    >
      <div
        data-theme={theme}
        className="min-h-screen fintech-grid-bg ui-text-primary flex flex-col font-theme-inter"
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
        />

      <LiveTickerBar
        etfs={etfs}
        quotesByEtfId={quotesByEtfId}
        onAddCustomTicker={handleAddCustomTicker}
        isFetchingCustomTicker={isFetchingCustomTicker}
        customTickerError={customTickerError}
      />

      <InvestorWisdomBanner theme={theme} onNavigateTab={setActiveTab} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6">
        <DisclaimerBanner />

        <Suspense
          fallback={
            <div className="fintech-card rounded-2xl p-8 text-center text-sm ui-text-muted">
              {tr(lang, 'Loading section...', 'Загрузка раздела...')}
            </div>
          }
        >
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
            <EcosystemTab
              etfs={etfs}
              countries={EUROPEAN_COUNTRY_TAXES}
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={setSelectedCountryCode}
            />
          )}

          {activeTab === 'academy' && <CarefulInvestingAcademy />}
        </Suspense>
      </main>

      <footer className="border-t ui-border-subtle ui-surface-deep py-6 text-xs ui-text-muted">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold ui-text-secondary">
              {tr(
                lang,
                'EuroETF Compass — Careful UCITS ETF Investing & European Tax Intelligence',
                'EuroETF Compass — Разумные инвестиции в UCITS ETF и Налоговый гид по Европе'
              )}
            </p>
            <p className="mt-0.5 text-[11px] ui-text-subtle">
              {tr(
                lang,
                'Educational platform only. Historical performance and backtests do not guarantee future returns. Verify ISIN KIDs and national tax filings with licensed advisors.',
                'Только для образовательных целей. Прошлая доходность и бэктесты не гарантируют будущих результатов. Проверяйте KID по ISIN и налоговые декларации со специалистами.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="hover:text-emerald-300"
            >
              {tr(lang, '3Y/5Y Backtest', 'Бэктест 3Y/5Y')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('taxes')}
              className="hover:text-emerald-300"
            >
              {tr(lang, 'EU Tax Matrix', 'Налоги ЕС')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ecosystem')}
              className="hover:text-emerald-300"
            >
              {tr(lang, 'Brokers & Portals', 'Брокеры и Порталы')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academy')}
              className="hover:text-emerald-300"
            >
              {tr(lang, 'ETF Academy', 'Академия ETF')}
            </button>
          </div>
        </div>
      </footer>
      </div>
    </AppPreferencesContext.Provider>
  );
}

export default App;
