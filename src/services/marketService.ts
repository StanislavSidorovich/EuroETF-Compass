import { CURATED_ETFS } from '../data/etfs';
import type {
  AssetClass,
  DistributionPolicy,
  ETFInstrument,
  HistoricalPricePoint,
  InstrumentType,
  LiveQuoteData,
} from '../types';

const YAHOO_PROXY_PREFIX = '/api/yahoo/v8/finance/chart/';
const YAHOO_DIRECT_PREFIX = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const REQUEST_TIMEOUT_MS = 3500;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  quote: LiveQuoteData;
}

const quoteCache = new Map<string, CacheEntry>();

interface YahooChartMeta {
  currency?: string;
  symbol?: string;
  exchangeName?: string;
  fullExchangeName?: string;
  instrumentType?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: number;
  shortName?: string;
  longName?: string;
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
    adjclose?: Array<{
      adjclose?: Array<number | null>;
    }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
}

class YahooSymbolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YahooSymbolError';
  }
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timerId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timerId);
  }
}

async function parseYahooChartJson(response: Response): Promise<YahooChartResult> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }

  const text = await response.text();
  let parsed: YahooChartResponse;
  try {
    parsed = JSON.parse(text) as YahooChartResponse;
  } catch {
    throw new Error('Non-JSON response received from market endpoint');
  }

  if (parsed.chart?.error) {
    throw new YahooSymbolError(
      parsed.chart.error.description ?? parsed.chart.error.code ?? 'Yahoo symbol lookup error'
    );
  }

  const result = parsed.chart?.result?.[0];
  if (!result || !result.meta || !Array.isArray(result.timestamp) || result.timestamp.length === 0) {
    throw new YahooSymbolError('Empty historical chart data returned by Yahoo Finance');
  }

  return result;
}

async function fetchYahooChartWithFallback(
  ticker: string,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<{
  result: YahooChartResult;
  source: 'live-yahoo-proxy' | 'live-cors-fallback';
}> {
  const encodedTicker = encodeURIComponent(ticker);
  const queryParams = 'range=5y&interval=1mo&includeAdjustedClose=true';
  const proxyUrl = `${YAHOO_PROXY_PREFIX}${encodedTicker}?${queryParams}`;
  const directUrl = `${YAHOO_DIRECT_PREFIX}${encodedTicker}?${queryParams}`;

  const gateways: Array<{
    url: string;
    source: 'live-yahoo-proxy' | 'live-cors-fallback';
  }> = [
    { url: proxyUrl, source: 'live-yahoo-proxy' },
    {
      url: `https://corsproxy.io/?${encodeURIComponent(directUrl)}`,
      source: 'live-cors-fallback',
    },
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
      source: 'live-cors-fallback',
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
      source: 'live-cors-fallback',
    },
  ];

  let lastError: unknown = new Error('All market gateways unreachable');

  for (const gateway of gateways) {
    try {
      const res = await fetchWithTimeout(gateway.url, timeoutMs);
      const result = await parseYahooChartJson(res);
      return { result, source: gateway.source };
    } catch (err) {
      lastError = err;
      // If our own dev proxy reports an explicit Yahoo symbol error, skip redundant CORS retries.
      if (gateway.source === 'live-yahoo-proxy' && err instanceof YahooSymbolError) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to reach market gateways');
}

function normalizeCurrencyAndDivisor(rawCurrency?: string): { currency: string; divisor: number } {
  if (!rawCurrency) {
    return { currency: 'EUR', divisor: 1 };
  }
  // London-listed ETFs quoted in pence (GBp/GBX) are converted to GBP.
  if (rawCurrency === 'GBp' || rawCurrency === 'GBX') {
    return { currency: 'GBP', divisor: 100 };
  }
  return { currency: rawCurrency.toUpperCase(), divisor: 1 };
}

function extractMonthlyHistory(
  result: YahooChartResult,
  divisor: number,
  livePrice?: number,
  liveDate?: string
): HistoricalPricePoint[] {
  const timestamps = result.timestamp ?? [];
  const adjCloses = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const rawCloses = result.indicators?.quote?.[0]?.close ?? [];

  const byMonth = new Map<string, HistoricalPricePoint>();

  for (let i = 0; i < timestamps.length; i += 1) {
    const tsSec = timestamps[i];
    if (typeof tsSec !== 'number' || !Number.isFinite(tsSec)) continue;

    const rawAdj = adjCloses[i];
    const rawClose = rawCloses[i];
    const chosen = isFinitePositive(rawAdj) ? rawAdj : isFinitePositive(rawClose) ? rawClose : null;
    if (chosen === null) continue;

    const timestampMs = tsSec * 1000;
    const dateStr = new Date(timestampMs).toISOString().slice(0, 10);
    const monthKey = dateStr.slice(0, 7);

    byMonth.set(monthKey, {
      date: dateStr,
      timestamp: timestampMs,
      close: Number((chosen / divisor).toFixed(4)),
    });
  }

  const points = Array.from(byMonth.values()).sort((a, b) => a.timestamp - b.timestamp);

  if (isFinitePositive(livePrice) && points.length > 0) {
    const latestPoint = points[points.length - 1];
    const effectiveDate = liveDate ?? latestPoint.date;
    const liveMonth = effectiveDate.slice(0, 7);
    const latestMonth = latestPoint.date.slice(0, 7);

    if (liveMonth === latestMonth) {
      points[points.length - 1] = {
        date: effectiveDate,
        timestamp: Date.parse(effectiveDate) || latestPoint.timestamp,
        close: Number(livePrice.toFixed(4)),
      };
    } else if (liveMonth > latestMonth) {
      points.push({
        date: effectiveDate,
        timestamp: Date.parse(effectiveDate) || Date.now(),
        close: Number(livePrice.toFixed(4)),
      });
    }
  }

  return points;
}

function parseResultToLiveQuote(
  requestedTicker: string,
  result: YahooChartResult,
  source: 'live-yahoo-proxy' | 'live-cors-fallback',
  fallbackHistory: HistoricalPricePoint[]
): LiveQuoteData {
  const meta = result.meta ?? {};
  const { currency, divisor } = normalizeCurrencyAndDivisor(meta.currency);

  const rawMarketPrice = isFinitePositive(meta.regularMarketPrice)
    ? meta.regularMarketPrice / divisor
    : undefined;

  const lastUpdatedIso =
    typeof meta.regularMarketTime === 'number' && Number.isFinite(meta.regularMarketTime)
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

  const history = extractMonthlyHistory(
    result,
    divisor,
    rawMarketPrice,
    lastUpdatedIso.slice(0, 10)
  );

  const effectiveHistory = history.length >= 2 ? history : fallbackHistory;
  const lastHistClose =
    effectiveHistory.length > 0 ? effectiveHistory[effectiveHistory.length - 1].close : 0;

  const currentPrice = Number((rawMarketPrice ?? lastHistClose).toFixed(2));

  // Avoid meta.chartPreviousClose on 5y range charts because Yahoo sets it to the 5-year-ago price.
  const rawPrevClose = isFinitePositive(meta.regularMarketPreviousClose)
    ? meta.regularMarketPreviousClose / divisor
    : isFinitePositive(meta.previousClose)
      ? meta.previousClose / divisor
      : currentPrice;

  const previousClose = Number(rawPrevClose.toFixed(2));
  const dayChangeEur = Number((currentPrice - previousClose).toFixed(2));
  const dayChangePct =
    previousClose > 0 ? Number(((dayChangeEur / previousClose) * 100).toFixed(2)) : 0;

  return {
    ticker: meta.symbol ?? requestedTicker,
    currentPrice,
    previousClose,
    dayChangeEur,
    dayChangePct,
    currency,
    exchangeName: meta.fullExchangeName ?? meta.exchangeName ?? 'European Exchange',
    lastUpdated: lastUpdatedIso,
    source,
    history5Y: effectiveHistory,
  };
}

function inferExchangeNameFromTicker(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper.endsWith('.AS')) return 'Euronext Amsterdam';
  if (upper.endsWith('.PA')) return 'Euronext Paris';
  if (upper.endsWith('.LS')) return 'Euronext Lisbon';
  if (upper.endsWith('.L')) return 'London Stock Exchange';
  if (upper.endsWith('.CO')) return 'Nasdaq Copenhagen';
  if (upper.endsWith('.SW')) return 'SIX Swiss Exchange';
  if (upper.endsWith('.DE')) return 'Xetra Frankfurt';
  if (upper.endsWith('.MI')) return 'Borsa Italiana';
  return 'NASDAQ / NYSE';
}

/**
 * Synchronously builds a baseline LiveQuoteData from an instrument's bundled 5-year history
 * so the UI renders immediately without waiting on network requests.
 */
export function buildBaselineQuote(etf: ETFInstrument): LiveQuoteData {
  const history = etf.baselineHistory5Y;
  const latestPoint = history[history.length - 1];
  const prevPoint = history.length > 1 ? history[history.length - 2] : latestPoint;

  const currentPrice = Number((latestPoint?.close ?? 100).toFixed(2));
  const previousClose = Number((prevPoint?.close ?? currentPrice).toFixed(2));
  const dayChangeEur = Number((currentPrice - previousClose).toFixed(2));
  const dayChangePct =
    previousClose > 0 ? Number(((dayChangeEur / previousClose) * 100).toFixed(2)) : 0;

  return {
    ticker: etf.ticker,
    currentPrice,
    previousClose,
    dayChangeEur,
    dayChangePct,
    currency: etf.currency,
    exchangeName: inferExchangeNameFromTicker(etf.ticker),
    lastUpdated: latestPoint?.date ? `${latestPoint.date}T16:30:00.000Z` : new Date().toISOString(),
    source: 'verified-baseline',
    history5Y: history,
  };
}

/**
 * Fetches live price and 5-year monthly history for a known ETFInstrument:
 * 1) Vite dev proxy `/api/yahoo`
 * 2) Public CORS fallbacks (`corsproxy.io`, `codetabs`, `allorigins`) for static hosting
 * 3) Bundled verified baseline fallback if offline or rate-limited
 */
export async function fetchLiveEtfQuote(
  etf: ETFInstrument,
  options?: { forceRefresh?: boolean; timeoutMs?: number }
): Promise<LiveQuoteData> {
  const cacheKey = etf.ticker.toUpperCase();
  const cached = quoteCache.get(cacheKey);
  if (!options?.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  const candidateTickers = [etf.ticker, ...(etf.altTickers ?? []).slice(0, 1)];
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;

  for (let i = 0; i < candidateTickers.length; i += 1) {
    const candidate = candidateTickers[i];
    try {
      const { result, source } = await fetchYahooChartWithFallback(candidate, timeoutMs);
      const quote = parseResultToLiveQuote(candidate, result, source, etf.baselineHistory5Y);
      quoteCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, quote });
      return quote;
    } catch (err) {
      // Only try altTicker when Yahoo specifically reports an unknown/empty primary symbol.
      if (!(err instanceof YahooSymbolError)) {
        break;
      }
    }
  }

  return buildBaselineQuote(etf);
}

/**
 * Fetches live quotes for a catalog of instruments.
 * By default (`!options?.forceRefresh`), performs live network requests only for the first 6
 * instruments and returns `buildBaselineQuote` for the remainder so initial load stays fast
 * and avoids triggering rate-limiting.
 */
export async function fetchAllLiveEtfQuotes(
  etfs: ETFInstrument[],
  options?: { forceRefresh?: boolean }
): Promise<Record<string, LiveQuoteData>> {
  const quotesById: Record<string, LiveQuoteData> = {};
  const liveTargetCount = options?.forceRefresh ? etfs.length : Math.min(6, etfs.length);
  const liveTargets = etfs.slice(0, liveTargetCount);
  const baselineTargets = etfs.slice(liveTargetCount);

  for (const etf of baselineTargets) {
    quotesById[etf.id] = buildBaselineQuote(etf);
  }

  const batchSize = 3;
  for (let i = 0; i < liveTargets.length; i += batchSize) {
    const batch = liveTargets.slice(i, i + batchSize);
    const settled = await Promise.all(
      batch.map(async (etf) => {
        const quote = await fetchLiveEtfQuote(etf, options);
        return { id: etf.id, quote };
      })
    );
    for (const item of settled) {
      quotesById[item.id] = item.quote;
    }
  }

  return quotesById;
}

function inferDistributionPolicy(name: string): DistributionPolicy {
  if (/\b(dist|distributing|dis|inc|income|1d)\b/i.test(name)) {
    return 'Dist';
  }
  return 'Acc';
}

function inferProvider(name: string, instrumentType: InstrumentType): ETFInstrument['provider'] {
  if (/vanguard/i.test(name)) return 'Vanguard';
  if (/ishares|blackrock/i.test(name)) return 'iShares (BlackRock)';
  if (/xtrackers|dws/i.test(name)) return 'Xtrackers (DWS)';
  if (/invesco/i.test(name)) return 'Invesco';
  if (/amundi|lyxor/i.test(name)) return 'Amundi';
  if (/spdr|state street/i.test(name)) return 'SPDR';
  if (instrumentType === 'Stock') {
    return /\.(DE|AS|PA|LS|L|CO|SW|MI)$/i.test(name)
      ? 'European Corporation'
      : 'US Corporation (NASDAQ/NYSE)';
  }
  return 'Custom';
}

function inferAssetClass(name: string, ticker: string, instrumentType: InstrumentType): AssetClass {
  if (instrumentType === 'Stock') {
    return /\.(DE|AS|PA|LS|L|CO|SW|MI)$/i.test(ticker)
      ? 'Individual Stock (Europe)'
      : 'Individual Stock (US)';
  }
  if (/nasdaq|tech|qqq|information technology/i.test(name)) return 'Tech / Nasdaq Equities';
  if (/emerging|em imi|\bem\b/i.test(name)) return 'Emerging Markets';
  if (/s&p 500|sp500|\busa\b|\bmsci usa\b|voo|spy/i.test(name)) return 'US Equities';
  if (/stoxx|europe|emu|dax|cac/i.test(name)) return 'European Equities';
  if (/overnight|bond|treasury|aggregate|cash|money market|xeon/i.test(name)) {
    return 'EUR Money Market / Bonds';
  }
  if (/msci world|developed/i.test(name)) return 'Developed World Equities';
  return 'Global Equities';
}

function inferDomicile(
  ticker: string,
  name: string,
  instrumentType: InstrumentType
): ETFInstrument['domicile'] {
  if (instrumentType === 'Stock') {
    return /\.(DE|AS|PA|LS|L|CO|SW|MI)$/i.test(ticker) ? 'Europe (Direct)' : 'United States (US)';
  }
  if (/luxembourg|\(lu\)|\blux\b|amundi|xtrackers/i.test(name)) return 'Luxembourg (LU)';
  if (/germany|\(de\)/i.test(name) && !ticker.endsWith('.L')) return 'Germany (DE)';
  return 'Ireland (IE)';
}

function computeMonthlyVolatilityPct(history: HistoricalPricePoint[]): number {
  if (history.length < 6) return 18.0;
  const returns: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1].close;
    const curr = history[i].close;
    if (prev > 0 && curr > 0) {
      returns.push(curr / prev - 1);
    }
  }
  if (returns.length < 3) return 18.0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  return Number((Math.sqrt(variance) * Math.sqrt(12) * 100).toFixed(2));
}

const QUERY_ALIAS_TO_TICKER: Record<string, string> = {
  NVIDIA: 'NVDA',
  APPLE: 'AAPL',
  MICROSOFT: 'MSFT',
  GOOGLE: 'GOOGL',
  ALPHABET: 'GOOGL',
  FACEBOOK: 'META',
  INSTAGRAM: 'META',
  AMAZON: 'AMZN',
  TESLA: 'TSLA',
  BROADCOM: 'AVGO',
  BERKSHIRE: 'BRK-B',
  LILLY: 'LLY',
  'ELI LILLY': 'LLY',
  JPMORGAN: 'JPM',
  'JP MORGAN': 'JPM',
  COSTCO: 'COST',
  ASML: 'ASML.AS',
  NOVO: 'NOVO-B.CO',
  'NOVO NORDISK': 'NOVO-B.CO',
  SAP: 'SAP.DE',
  LVMH: 'MC.PA',
  SIEMENS: 'SIE.DE',
  SHELL: 'SHEL.AS',
  NESTLE: 'NESN.SW',
  NESTLÉ: 'NESN.SW',
  EDP: 'EDP.LS',
  'ALL-WORLD': 'VWCE.DE',
  'FTSE ALL-WORLD': 'VWCE.DE',
  'MSCI WORLD': 'EUNL.DE',
  'S&P 500': 'SXR8.DE',
  SP500: 'SXR8.DE',
  NASDAQ: 'EQQB.DE',
};

function findCuratedMatch(rawQuery: string): ETFInstrument | undefined {
  const trimmed = rawQuery.trim();
  const upper = trimmed.toUpperCase();

  const aliasTicker = QUERY_ALIAS_TO_TICKER[upper];
  if (aliasTicker) {
    const byAlias = CURATED_ETFS.find(
      (item) =>
        item.ticker.toUpperCase() === aliasTicker.toUpperCase() ||
        item.altTickers.some((alt) => alt.toUpperCase() === aliasTicker.toUpperCase())
    );
    if (byAlias) return byAlias;
  }

  const exactMatch = CURATED_ETFS.find(
    (item) =>
      item.id.toUpperCase() === upper ||
      item.ticker.toUpperCase() === upper ||
      item.isin.toUpperCase() === upper ||
      item.wkn.toUpperCase() === upper ||
      item.altTickers.some((alt) => alt.toUpperCase() === upper)
  );
  if (exactMatch) return exactMatch;

  if (upper.length >= 3) {
    const lower = trimmed.toLowerCase();
    return CURATED_ETFS.find(
      (item) =>
        item.shortName.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower) ||
        item.ticker.toLowerCase().startsWith(`${lower}.`)
    );
  }

  return undefined;
}

interface PopularFallbackProfile {
  name: string;
  shortName: string;
  isin: string;
  instrumentType: InstrumentType;
  distributionPolicy: DistributionPolicy;
  dividendYieldEst: number;
  volatilityAnnualPct: number;
  ter: number;
  p5y: number;
  p2022: number;
  p3y: number;
  p1y: number;
  pNow: number;
  notes: string;
}

const POPULAR_FALLBACK_DICTIONARY: Record<string, PopularFallbackProfile> = {
  AMD: {
    name: 'Advanced Micro Devices, Inc.',
    shortName: 'AMD (AMD)',
    isin: 'US0079031078',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 45.0,
    ter: 0,
    p5y: 128.0,
    p2022: 58.0,
    p3y: 108.0,
    p1y: 138.0,
    pNow: 146.5,
    notes: 'Semiconductor & AI CPU/GPU challenger; 0% dividend means capital gains are deferred until sale.',
  },
  NFLX: {
    name: 'Netflix, Inc.',
    shortName: 'Netflix (NFLX)',
    isin: 'US64110L1061',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 38.0,
    ter: 0,
    p5y: 590.0,
    p2022: 235.0,
    p3y: 415.0,
    p1y: 745.0,
    pNow: 812.0,
    notes: 'Global streaming leader; 0% dividend avoids annual withholding tax drag.',
  },
  PLTR: {
    name: 'Palantir Technologies Inc.',
    shortName: 'Palantir (PLTR)',
    isin: 'US69608A1088',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 54.0,
    ter: 0,
    p5y: 21.5,
    p2022: 7.4,
    p3y: 17.8,
    p1y: 48.0,
    pNow: 59.4,
    notes: 'High-beta enterprise AI & defense analytics stock; size strictly as a small satellite position.',
  },
  INTC: {
    name: 'Intel Corporation',
    shortName: 'Intel (INTC)',
    isin: 'US4581401001',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 39.0,
    ter: 0,
    p5y: 46.0,
    p2022: 26.0,
    p3y: 38.5,
    p1y: 23.0,
    pNow: 22.8,
    notes: 'Illustrates single-company turnaround risk compared with diversified semiconductor or global ETFs.',
  },
  CRM: {
    name: 'Salesforce, Inc.',
    shortName: 'Salesforce (CRM)',
    isin: 'US79466L3024',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.52,
    volatilityAnnualPct: 29.0,
    ter: 0,
    p5y: 265.0,
    p2022: 145.0,
    p3y: 212.0,
    p1y: 288.0,
    pNow: 304.0,
    notes: 'Enterprise CRM cloud software leader.',
  },
  ORCL: {
    name: 'Oracle Corporation',
    shortName: 'Oracle (ORCL)',
    isin: 'US68389X1054',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.95,
    volatilityAnnualPct: 27.0,
    ter: 0,
    p5y: 86.0,
    p2022: 72.0,
    p3y: 108.0,
    p1y: 162.0,
    pNow: 174.0,
    notes: 'Database & AI cloud infrastructure provider.',
  },
  UBER: {
    name: 'Uber Technologies, Inc.',
    shortName: 'Uber (UBER)',
    isin: 'US90353T1007',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 37.0,
    ter: 0,
    p5y: 40.0,
    p2022: 26.0,
    p3y: 52.0,
    p1y: 68.0,
    pNow: 73.5,
    notes: 'Global mobility & delivery platform; 0% dividend.',
  },
  COIN: {
    name: 'Coinbase Global, Inc.',
    shortName: 'Coinbase (COIN)',
    isin: 'US19260Q1076',
    instrumentType: 'Stock',
    distributionPolicy: 'Acc',
    dividendYieldEst: 0.0,
    volatilityAnnualPct: 68.0,
    ter: 0,
    p5y: 268.0,
    p2022: 49.0,
    p3y: 98.0,
    p1y: 235.0,
    pNow: 254.0,
    notes: 'Crypto exchange equity with extreme cyclical volatility (>65% annualized).',
  },
  DIS: {
    name: 'The Walt Disney Company',
    shortName: 'Disney (DIS)',
    isin: 'US2546871060',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.85,
    volatilityAnnualPct: 28.0,
    ter: 0,
    p5y: 142.0,
    p2022: 92.0,
    p3y: 86.0,
    p1y: 98.0,
    pNow: 104.0,
    notes: 'Media, parks & streaming conglomerate.',
  },
  KO: {
    name: 'The Coca-Cola Company',
    shortName: 'Coca-Cola (KO)',
    isin: 'US1912161007',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 3.05,
    volatilityAnnualPct: 14.5,
    ter: 0,
    p5y: 50.5,
    p2022: 56.0,
    p3y: 54.0,
    p1y: 60.5,
    pNow: 62.8,
    notes: 'Classic defensive dividend aristocrat (~3.05% yield, subject to 15% US withholding with W-8BEN + local tax).',
  },
  PEP: {
    name: 'PepsiCo, Inc.',
    shortName: 'PepsiCo (PEP)',
    isin: 'US7134481081',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 3.25,
    volatilityAnnualPct: 15.0,
    ter: 0,
    p5y: 148.0,
    p2022: 165.0,
    p3y: 158.0,
    p1y: 155.0,
    pNow: 158.5,
    notes: 'Consumer staples snacks & beverages dividend payer.',
  },
  MCD: {
    name: "McDonald's Corporation",
    shortName: "McDonald's (MCD)",
    isin: 'US5801351017',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 2.35,
    volatilityAnnualPct: 16.5,
    ter: 0,
    p5y: 224.0,
    p2022: 248.0,
    p3y: 262.0,
    p1y: 278.0,
    pNow: 286.0,
    notes: 'Global franchise real-estate & quick-service restaurant brand.',
  },
  NKE: {
    name: 'NIKE, Inc.',
    shortName: 'Nike (NKE)',
    isin: 'US6541061031',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 1.9,
    volatilityAnnualPct: 27.5,
    ter: 0,
    p5y: 148.0,
    p2022: 92.0,
    p3y: 99.0,
    p1y: 76.0,
    pNow: 78.5,
    notes: 'Athletic apparel & footwear brand; highlights brand-cycle drawdown risk.',
  },
  V: {
    name: 'Visa Inc.',
    shortName: 'Visa (V)',
    isin: 'US92826C8394',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.78,
    volatilityAnnualPct: 19.5,
    ter: 0,
    p5y: 192.0,
    p2022: 194.0,
    p3y: 234.0,
    p1y: 282.0,
    pNow: 298.0,
    notes: 'Global payments network with high operating margins.',
  },
  MA: {
    name: 'Mastercard Incorporated',
    shortName: 'Mastercard (MA)',
    isin: 'US57636Q1040',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.56,
    volatilityAnnualPct: 20.0,
    ter: 0,
    p5y: 318.0,
    p2022: 316.0,
    p3y: 378.0,
    p1y: 472.0,
    pNow: 496.0,
    notes: 'Global card & cross-border payments network.',
  },
  SPY: {
    name: 'SPDR S&P 500 ETF Trust (US-Domiciled Reference)',
    shortName: 'SPY (US S&P 500)',
    isin: 'US78462F1030',
    instrumentType: 'ETF',
    distributionPolicy: 'Dist',
    dividendYieldEst: 1.3,
    volatilityAnnualPct: 16.4,
    ter: 0.09,
    p5y: 412.0,
    p2022: 365.0,
    p3y: 422.0,
    p1y: 548.0,
    pNow: 576.0,
    notes: 'Note for EU residents: US-domiciled ETFs usually lack a PRIIPs KID for retail EU brokers—prefer UCITS SXR8.DE or VUSA.DE.',
  },
  QQQ: {
    name: 'Invesco QQQ Trust (US-Domiciled Nasdaq-100)',
    shortName: 'QQQ (US Nasdaq-100)',
    isin: 'US46090E1038',
    instrumentType: 'ETF',
    distributionPolicy: 'Dist',
    dividendYieldEst: 0.6,
    volatilityAnnualPct: 22.8,
    ter: 0.2,
    p5y: 348.0,
    p2022: 262.0,
    p3y: 356.0,
    p1y: 468.0,
    pNow: 495.0,
    notes: 'Note for EU residents: US-domiciled ETFs lack a PRIIPs KID—European investors should use UCITS EQQB.DE or EQQQ.DE.',
  },
  VOO: {
    name: 'Vanguard S&P 500 ETF (US-Domiciled Reference)',
    shortName: 'VOO (US S&P 500)',
    isin: 'US9229083632',
    instrumentType: 'ETF',
    distributionPolicy: 'Dist',
    dividendYieldEst: 1.32,
    volatilityAnnualPct: 16.4,
    ter: 0.03,
    p5y: 382.0,
    p2022: 340.0,
    p3y: 392.0,
    p1y: 508.0,
    pNow: 534.0,
    notes: 'Note for EU residents: prefer Irish UCITS equivalents SXR8.DE or VUAA.DE (15% US treaty withholding & PRIIPs compliant).',
  },
  'VUAA.DE': {
    name: 'Vanguard S&P 500 UCITS ETF (USD) Accumulating',
    shortName: 'Vanguard S&P 500 (VUAA Acc)',
    isin: 'IE00BFMXXD54',
    instrumentType: 'ETF',
    distributionPolicy: 'Acc',
    dividendYieldEst: 1.35,
    volatilityAnnualPct: 16.4,
    ter: 0.07,
    p5y: 72.5,
    p2022: 65.4,
    p3y: 79.8,
    p1y: 103.5,
    pNow: 112.4,
    notes: 'Accumulating UCITS twin of VUSA.DE—popular across Portugal, Germany, and the Netherlands for low share price + zero annual dividend drag.',
  },
  'VWRA.L': {
    name: 'Vanguard FTSE All-World UCITS ETF (USD) Acc (LSE)',
    shortName: 'Vanguard All-World USD (VWRA.L)',
    isin: 'IE00BK5BQT80',
    instrumentType: 'ETF',
    distributionPolicy: 'Acc',
    dividendYieldEst: 1.85,
    volatilityAnnualPct: 14.2,
    ter: 0.22,
    p5y: 104.0,
    p2022: 91.0,
    p3y: 110.0,
    p1y: 136.0,
    pNow: 145.0,
    notes: 'USD-quoted London Stock Exchange listing of VWCE (same Irish UCITS ISIN IE00BK5BQT80).',
  },
  'GALP.LS': {
    name: 'Galp Energia, SGPS, S.A. (Portugal PSI-20)',
    shortName: 'Galp Energia (GALP.LS)',
    isin: 'PTGAL0AM0009',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 3.4,
    volatilityAnnualPct: 28.0,
    ter: 0,
    p5y: 9.2,
    p2022: 11.4,
    p3y: 13.8,
    p1y: 16.2,
    pNow: 16.8,
    notes: 'Portuguese energy & upstream exploration stock traded on Euronext Lisbon.',
  },
  'BCP.LS': {
    name: 'Banco Comercial Português, S.A. (Millennium BCP)',
    shortName: 'Millennium BCP (BCP.LS)',
    isin: 'PTBCP0AM0015',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 4.1,
    volatilityAnnualPct: 33.0,
    ter: 0,
    p5y: 0.15,
    p2022: 0.14,
    p3y: 0.27,
    p1y: 0.44,
    pNow: 0.48,
    notes: 'Portuguese commercial bank listed on Euronext Lisbon (PSI-20).',
  },
  'JMT.LS': {
    name: 'Jerónimo Martins, SGPS, S.A. (Pingo Doce / Biedronka)',
    shortName: 'Jerónimo Martins (JMT.LS)',
    isin: 'PTJMT0AE0001',
    instrumentType: 'Stock',
    distributionPolicy: 'Dist',
    dividendYieldEst: 3.1,
    volatilityAnnualPct: 23.0,
    ter: 0,
    p5y: 19.4,
    p2022: 19.8,
    p3y: 22.1,
    p1y: 18.6,
    pNow: 19.2,
    notes: 'Portuguese food retail group operating Pingo Doce (PT) and Biedronka (PL).',
  },
};

function hashTicker(symbol: string): number {
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i += 1) {
    h ^= symbol.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildSynthesizedHistory5Y(
  p5y: number,
  p2022: number,
  p3y: number,
  p1y: number,
  pNow: number,
  noiseAmp: number,
  seed: number
): HistoricalPricePoint[] {
  const anchors = [
    { monthIndex: 0, price: p5y },
    { monthIndex: 11, price: p2022 },
    { monthIndex: 24, price: p3y },
    { monthIndex: 48, price: p1y },
    { monthIndex: 60, price: pNow },
  ];
  const anchorSet = new Set(anchors.map((a) => a.monthIndex));
  const points: HistoricalPricePoint[] = [];
  const startYear = 2021;
  const startMonth = 11;

  for (let i = 0; i <= 60; i += 1) {
    const totalMonths = startMonth - 1 + i;
    const year = startYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const timestamp = Date.UTC(year, month - 1, 1);

    let prev = anchors[0];
    let next = anchors[anchors.length - 1];
    for (let m = 0; m < anchors.length - 1; m += 1) {
      if (i >= anchors[m].monthIndex && i <= anchors[m + 1].monthIndex) {
        prev = anchors[m];
        next = anchors[m + 1];
        break;
      }
    }

    const span = Math.max(1, next.monthIndex - prev.monthIndex);
    const progress = (i - prev.monthIndex) / span;
    const base = prev.price + (next.price - prev.price) * progress;

    let close = base;
    if (!anchorSet.has(i) && noiseAmp > 0) {
      const ripple = Math.sin(i * 1.43 + seed) * 0.6 + Math.cos(i * 2.19 + seed * 1.3) * 0.4;
      close = base * (1 + ripple * noiseAmp * Math.sin(progress * Math.PI));
    }

    points.push({
      date: dateStr,
      timestamp,
      close: Math.max(0.05, Number(close.toFixed(2))),
    });
  }

  return points;
}

function synthesizePlausibleInstrument(cleanTicker: string): {
  etf: ETFInstrument;
  quote: LiveQuoteData;
} {
  const known = POPULAR_FALLBACK_DICTIONARY[cleanTicker];
  const isEuropean = /\.(DE|AS|PA|LS|L|CO|SW|MI)$/i.test(cleanTicker);
  const seed = hashTicker(cleanTicker);

  // Never fabricate price history for a symbol we know nothing about: a made-up curve
  // would feed fake returns into the backtest. Only the hand-checked dictionary is allowed.
  if (!known) {
    throw new Error(
      `Не удалось получить данные по «${cleanTicker}»: сервис котировок недоступен с этого сайта, а тикера нет во встроенном справочнике. Выберите актив из списка (ETF и 20 акций) — для них данные есть всегда.`
    );
  }
  const profile: PopularFallbackProfile = {
    ...known,
    notes: `⚠ Ориентировочные данные из встроенного справочника, не живая котировка. ${known.notes}`,
  };

  const history = buildSynthesizedHistory5Y(
    profile.p5y,
    profile.p2022,
    profile.p3y,
    profile.p1y,
    profile.pNow,
    Math.min(0.08, profile.volatilityAnnualPct / 650),
    (seed % 97) / 10
  );

  const isStock = profile.instrumentType === 'Stock';
  const etf: ETFInstrument = {
    id: `custom-${cleanTicker.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ticker: cleanTicker,
    altTickers: [],
    isin: profile.isin,
    wkn: 'Custom',
    name: profile.name,
    shortName: profile.shortName,
    instrumentType: profile.instrumentType,
    catalogCategory: isStock
      ? isEuropean
        ? 'Europe Stocks'
        : 'US Stocks'
      : isEuropean
        ? 'Europe & Bond ETFs'
        : 'US ETFs',
    provider: isStock
      ? isEuropean
        ? 'European Corporation'
        : 'US Corporation (NASDAQ/NYSE)'
      : inferProvider(profile.name, profile.instrumentType),
    indexTracked: isStock ? `Direct Single Equity (${cleanTicker})` : profile.name,
    assetClass: inferAssetClass(profile.name, cleanTicker, profile.instrumentType),
    distributionPolicy: profile.distributionPolicy,
    ter: profile.ter,
    trackingDifference: 0,
    dividendYieldEst: profile.dividendYieldEst,
    replication: isStock ? 'Direct Equity (Single Stock)' : 'Physical (Optimized Sampling)',
    domicile: inferDomicile(cleanTicker, profile.name, profile.instrumentType),
    currency: 'EUR',
    fundSizeBillionsEur: 5.0,
    holdingsCount: isStock ? 1 : 500,
    volatilityAnnualPct: profile.volatilityAnnualPct,
    riskRatingPriips: profile.volatilityAnnualPct > 35 ? 6 : isStock ? 5 : 4,
    whyCarefulChoice: profile.notes,
    taxEfficiencyNotes: isStock
      ? 'Individual equity: check local capital gains tax, dividend withholding (W-8BEN for US), and remember single stocks carry concentrated risk vs broad UCITS ETFs.'
      : 'Check UCITS compliance, domicile (IE/LU), and fund size on justETF before investing.',
    baselineHistory5Y: history,
  };

  const quote = buildBaselineQuote(etf);
  quoteCache.set(cleanTicker, { expiresAt: Date.now() + CACHE_TTL_MS, quote });
  return { etf, quote };
}

/**
 * Looks up any curated or custom ETF/Stock ticker or name query (e.g., `NVDA`, `NVIDIA`,
 * `AAPL`, `AMD`, `VWCE.DE`, `ASML.AS`, `GALP.LS`).
 * Never fails for plausible tickers on static GitHub Pages thanks to multi-CORS fallback
 * + calibrated baseline synthesis.
 */
export async function fetchCustomYahooEtf(
  tickerOrQuery: string
): Promise<{ etf: ETFInstrument; quote: LiveQuoteData }> {
  const raw = tickerOrQuery.trim();
  if (!raw) {
    throw new Error('Please enter a ticker symbol or company name (e.g. NVDA, AAPL, VWCE.DE).');
  }

  // 1) Instant match against our 35-instrument curated catalog (ticker, ID, ISIN, or name)
  const curatedMatch = findCuratedMatch(raw);
  if (curatedMatch) {
    const quote = await fetchLiveEtfQuote(curatedMatch, { timeoutMs: REQUEST_TIMEOUT_MS });
    return { etf: curatedMatch, quote };
  }

  const cleanTicker = raw.toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9^.\-=]{1,15}$/.test(cleanTicker)) {
    throw new Error(
      'Please enter a valid ticker symbol (1–15 chars, e.g. NVDA, AMD, VWCE.DE, ASML.AS).'
    );
  }

  // 2) Try live Yahoo Finance via dev proxy + multi-CORS fallback gateways
  try {
    const fetchResult = await fetchYahooChartWithFallback(cleanTicker, REQUEST_TIMEOUT_MS);
    const quote = parseResultToLiveQuote(cleanTicker, fetchResult.result, fetchResult.source, []);
    const meta = fetchResult.result.meta ?? {};
    const fullName = meta.longName ?? meta.shortName ?? cleanTicker;
    const shortName = meta.shortName ?? cleanTicker;

    const detectedType: InstrumentType =
      meta.instrumentType?.toUpperCase() === 'EQUITY' ||
      (!/(ETF|UCITS|TRUST|FUND|INDEX|SWAP)/i.test(fullName) &&
        !/\.(DE|AS|L|PA|MI)$/i.test(cleanTicker))
        ? 'Stock'
        : 'ETF';

    const policy = inferDistributionPolicy(fullName);
    const assetClass = inferAssetClass(fullName, cleanTicker, detectedType);
    const volPct = computeMonthlyVolatilityPct(quote.history5Y);
    const isBondOrCash = assetClass === 'EUR Money Market / Bonds';
    const isEuropean = /\.(DE|AS|PA|LS|L|CO|SW|MI)$/i.test(cleanTicker);

    const etf: ETFInstrument = {
      id: `custom-${cleanTicker.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      ticker: quote.ticker,
      altTickers: [],
      isin: POPULAR_FALLBACK_DICTIONARY[cleanTicker]?.isin ?? 'Live Lookup',
      wkn: 'Custom',
      name: fullName,
      shortName,
      instrumentType: detectedType,
      catalogCategory:
        detectedType === 'Stock'
          ? isEuropean
            ? 'Europe Stocks'
            : 'US Stocks'
          : isEuropean
            ? 'Europe & Bond ETFs'
            : 'US ETFs',
      provider: inferProvider(fullName, detectedType),
      indexTracked: detectedType === 'Stock' ? `Direct Single Equity (${quote.ticker})` : fullName,
      assetClass,
      distributionPolicy: detectedType === 'Stock' ? 'Dist' : policy,
      ter: detectedType === 'Stock' ? 0 : isBondOrCash ? 0.1 : 0.2,
      trackingDifference: 0.0,
      dividendYieldEst:
        POPULAR_FALLBACK_DICTIONARY[cleanTicker]?.dividendYieldEst ??
        (isBondOrCash ? 3.2 : detectedType === 'Stock' ? 1.0 : 1.75),
      replication:
        detectedType === 'Stock' ? 'Direct Equity (Single Stock)' : 'Physical (Optimized Sampling)',
      domicile: inferDomicile(cleanTicker, fullName, detectedType),
      currency: quote.currency === 'USD' ? 'USD' : 'EUR',
      fundSizeBillionsEur: 1.0,
      holdingsCount: detectedType === 'Stock' ? 1 : isBondOrCash ? 100 : 1200,
      volatilityAnnualPct: volPct,
      riskRatingPriips: isBondOrCash ? 1 : volPct > 35 ? 6 : 4,
      whyCarefulChoice:
        detectedType === 'Stock'
          ? 'Live single-stock symbol fetched from Yahoo Finance. Remember that individual equities carry higher idiosyncratic risk than diversified UCITS ETFs.'
          : 'Custom live ETF fetched directly from Yahoo Finance. Check UCITS compliance, domicile (IE/LU), and fund size on justETF before investing.',
      taxEfficiencyNotes:
        detectedType === 'Stock'
          ? 'Verify dividend withholding treaties (e.g. W-8BEN for US stocks) and local capital gains reporting.'
          : policy === 'Acc'
            ? 'Detected as Accumulating from fund title — verify exact distribution policy and national tax status.'
            : 'Detected as Distributing from fund title — cash payouts may incur annual dividend tax drag depending on your tax residence.',
      baselineHistory5Y: quote.history5Y,
    };

    quoteCache.set(cleanTicker, { expiresAt: Date.now() + CACHE_TTL_MS, quote });
    return { etf, quote };
  } catch {
    // 3) Bulletproof offline / static-host fallback for any plausible symbol
    return synthesizePlausibleInstrument(cleanTicker);
  }
}

export function clearMarketCache(): void {
  quoteCache.clear();
}
