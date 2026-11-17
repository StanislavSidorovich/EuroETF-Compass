import type {
  AssetClass,
  DistributionPolicy,
  ETFInstrument,
  HistoricalPricePoint,
  LiveQuoteData,
} from '../types';

const YAHOO_PROXY_PREFIX = '/api/yahoo/v8/finance/chart/';
const YAHOO_DIRECT_PREFIX = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const ALLORIGINS_RAW_PREFIX = 'https://api.allorigins.win/raw?url=';

const REQUEST_TIMEOUT_MS = 6500;
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

async function fetchYahooChartWithFallback(ticker: string): Promise<{
  result: YahooChartResult;
  source: 'live-yahoo-proxy' | 'live-cors-fallback';
}> {
  const encodedTicker = encodeURIComponent(ticker);
  const queryParams = 'range=5y&interval=1mo&includeAdjustedClose=true';
  const proxyUrl = `${YAHOO_PROXY_PREFIX}${encodedTicker}?${queryParams}`;
  const directUrl = `${YAHOO_DIRECT_PREFIX}${encodedTicker}?${queryParams}`;
  const corsFallbackUrl = `${ALLORIGINS_RAW_PREFIX}${encodeURIComponent(directUrl)}`;

  try {
    const proxyRes = await fetchWithTimeout(proxyUrl);
    const result = await parseYahooChartJson(proxyRes);
    return { result, source: 'live-yahoo-proxy' };
  } catch (proxyErr) {
    // If Yahoo explicitly rejected the symbol via the working proxy, skip duplicate CORS retry.
    if (proxyErr instanceof YahooSymbolError) {
      throw proxyErr;
    }
  }

  const corsRes = await fetchWithTimeout(corsFallbackUrl);
  const result = await parseYahooChartJson(corsRes);
  return { result, source: 'live-cors-fallback' };
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

/**
 * Synchronously builds a baseline LiveQuoteData from an ETF's bundled 5-year history
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
    exchangeName: etf.ticker.endsWith('.AS')
      ? 'Euronext Amsterdam'
      : etf.ticker.endsWith('.L')
        ? 'London Stock Exchange'
        : 'Xetra Frankfurt',
    lastUpdated: latestPoint?.date ? `${latestPoint.date}T16:30:00.000Z` : new Date().toISOString(),
    source: 'verified-baseline',
    history5Y: history,
  };
}

/**
 * Fetches live price and 5-year monthly history for a known ETFInstrument:
 * 1) Vite dev proxy `/api/yahoo`
 * 2) Public CORS fallback (`api.allorigins.win`) for static hosting
 * 3) Bundled verified baseline fallback if offline or rate-limited
 */
export async function fetchLiveEtfQuote(
  etf: ETFInstrument,
  options?: { forceRefresh?: boolean }
): Promise<LiveQuoteData> {
  const cacheKey = etf.ticker.toUpperCase();
  const cached = quoteCache.get(cacheKey);
  if (!options?.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  const candidateTickers = [etf.ticker, ...(etf.altTickers ?? []).slice(0, 1)];

  for (let i = 0; i < candidateTickers.length; i += 1) {
    const candidate = candidateTickers[i];
    try {
      const { result, source } = await fetchYahooChartWithFallback(candidate);
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
 * Fetches live quotes for a catalog of ETFs in controlled batches, keyed by `etf.id`.
 */
export async function fetchAllLiveEtfQuotes(
  etfs: ETFInstrument[],
  options?: { forceRefresh?: boolean }
): Promise<Record<string, LiveQuoteData>> {
  const quotesById: Record<string, LiveQuoteData> = {};
  const batchSize = 4;

  for (let i = 0; i < etfs.length; i += batchSize) {
    const batch = etfs.slice(i, i + batchSize);
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

function inferProvider(name: string): ETFInstrument['provider'] {
  if (/vanguard/i.test(name)) return 'Vanguard';
  if (/ishares|blackrock/i.test(name)) return 'iShares (BlackRock)';
  if (/xtrackers|dws/i.test(name)) return 'Xtrackers (DWS)';
  if (/invesco/i.test(name)) return 'Invesco';
  if (/amundi|lyxor/i.test(name)) return 'Amundi';
  if (/spdr|state street/i.test(name)) return 'SPDR';
  return 'Custom';
}

function inferAssetClass(name: string): AssetClass {
  if (/nasdaq|tech|qqq|information technology/i.test(name)) return 'Tech / Nasdaq Equities';
  if (/emerging|em imi|\bem\b/i.test(name)) return 'Emerging Markets';
  if (/s&p 500|sp500|\busa\b|\bmsci usa\b/i.test(name)) return 'US Equities';
  if (/stoxx|europe|emu|dax|cac/i.test(name)) return 'European Equities';
  if (/overnight|bond|treasury|aggregate|cash|money market|xeon/i.test(name)) {
    return 'EUR Money Market / Bonds';
  }
  if (/msci world|developed/i.test(name)) return 'Developed World Equities';
  return 'Global Equities';
}

function inferDomicile(ticker: string, name: string): ETFInstrument['domicile'] {
  if (/luxembourg|\(lu\)|\blux\b|amundi|xtrackers/i.test(name)) return 'Luxembourg (LU)';
  if (/germany|\(de\)/i.test(name) && !ticker.endsWith('.L')) return 'Germany (DE)';
  return 'Ireland (IE)';
}

function computeMonthlyVolatilityPct(history: HistoricalPricePoint[]): number {
  if (history.length < 6) return 15.0;
  const returns: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1].close;
    const curr = history[i].close;
    if (prev > 0 && curr > 0) {
      returns.push(curr / prev - 1);
    }
  }
  if (returns.length < 3) return 15.0;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  return Number((Math.sqrt(variance) * Math.sqrt(12) * 100).toFixed(2));
}

/**
 * Looks up any custom European ETF ticker (e.g., `CSPX.L`, `XDWD.DE`, `EMIM.AS`, `MEUD.PA`)
 * via Yahoo Finance v8 Chart API and constructs both an `ETFInstrument` and `LiveQuoteData`.
 */
export async function fetchCustomYahooEtf(
  ticker: string
): Promise<{ etf: ETFInstrument; quote: LiveQuoteData }> {
  const cleanTicker = ticker.trim().toUpperCase();
  if (!cleanTicker || !/^[A-Z0-9^.\-=]{1,20}$/.test(cleanTicker)) {
    throw new Error('Please enter a valid ticker symbol (e.g. VWCE.DE, CSPX.L, EMIM.AS).');
  }

  let fetchResult: {
    result: YahooChartResult;
    source: 'live-yahoo-proxy' | 'live-cors-fallback';
  };

  try {
    fetchResult = await fetchYahooChartWithFallback(cleanTicker);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network error';
    throw new Error(
      `Unable to load live chart for "${cleanTicker}" (${detail}). Verify the European exchange suffix (e.g. .DE, .AS, .L, .PA).`
    );
  }

  const quote = parseResultToLiveQuote(cleanTicker, fetchResult.result, fetchResult.source, []);
  const meta = fetchResult.result.meta ?? {};
  const fullName = meta.longName ?? meta.shortName ?? `${cleanTicker} UCITS ETF`;
  const shortName = meta.shortName ?? cleanTicker;
  const policy = inferDistributionPolicy(fullName);
  const assetClass = inferAssetClass(fullName);
  const volPct = computeMonthlyVolatilityPct(quote.history5Y);
  const isBondOrCash = assetClass === 'EUR Money Market / Bonds';

  const etf: ETFInstrument = {
    id: `custom-${cleanTicker.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ticker: quote.ticker,
    altTickers: [],
    isin: 'Custom Lookup',
    wkn: 'Custom',
    name: fullName,
    shortName,
    provider: inferProvider(fullName),
    indexTracked: fullName,
    assetClass,
    distributionPolicy: policy,
    ter: isBondOrCash ? 0.1 : 0.2,
    trackingDifference: 0.0,
    dividendYieldEst: isBondOrCash ? 3.2 : 1.75,
    replication: 'Physical (Optimized Sampling)',
    domicile: inferDomicile(cleanTicker, fullName),
    currency: quote.currency === 'USD' ? 'USD' : 'EUR',
    fundSizeBillionsEur: 1.0,
    holdingsCount: isBondOrCash ? 100 : 1200,
    volatilityAnnualPct: volPct,
    riskRatingPriips: isBondOrCash ? 1 : 4,
    whyCarefulChoice:
      'Custom live symbol fetched directly from Yahoo Finance. Check UCITS compliance, domicile (IE/LU), and fund size on justETF before investing.',
    taxEfficiencyNotes:
      policy === 'Acc'
        ? 'Detected as Accumulating from fund title — verify exact distribution policy and national tax status (e.g. OeKB Meldefonds or UK Reporting status).'
        : 'Detected as Distributing from fund title — cash payouts may incur annual dividend tax drag depending on your tax residence.',
    baselineHistory5Y: quote.history5Y,
  };

  quoteCache.set(cleanTicker, { expiresAt: Date.now() + CACHE_TTL_MS, quote });

  return { etf, quote };
}

export function clearMarketCache(): void {
  quoteCache.clear();
}
