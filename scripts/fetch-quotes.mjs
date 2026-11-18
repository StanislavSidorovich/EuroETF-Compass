#!/usr/bin/env node
/**
 * Server-side Yahoo Finance v8 chart fetcher for EuroETF Compass.
 * Extracts all instruments from src/data/etfs.ts, fetches 5y monthly data
 * without API keys, and writes public/data/quotes.json.
 *
 * Rules:
 * - Node 20+ native fetch, zero external dependencies.
 * - If a ticker fails to fetch, keep its previous entry from public/data/quotes.json
 *   and never fabricate prices.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ETFS_TS_PATH = path.join(ROOT_DIR, 'src', 'data', 'etfs.ts');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'data', 'quotes.json');

const REQUEST_TIMEOUT_MS = 10000;
const REQUEST_DELAY_MS = 220;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isFinitePositive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Parses { id, ticker, altTickers } entries directly from src/data/etfs.ts
 * so Node 20 can run this script without a TypeScript compiler/loader.
 */
function parseEtfsFromSource(tsSource) {
  const instruments = [];
  const blockRegex =
    /id:\s*'([^']+)'[\s\S]*?ticker:\s*'([^']+)'[\s\S]*?altTickers:\s*\[([^\]]*)\]/g;

  let match;
  while ((match = blockRegex.exec(tsSource)) !== null) {
    const id = match[1].trim();
    const ticker = match[2].trim();
    const rawAlts = match[3];
    const altTickers = Array.from(rawAlts.matchAll(/'([^']+)'/g)).map((m) => m[1].trim());
    instruments.push({ id, ticker, altTickers });
  }

  return instruments;
}

function normalizeCurrencyAndDivisor(rawCurrency) {
  if (!rawCurrency) {
    return { currency: 'EUR', divisor: 1 };
  }
  if (rawCurrency === 'GBp' || rawCurrency === 'GBX') {
    return { currency: 'GBP', divisor: 100 };
  }
  return { currency: rawCurrency.toUpperCase(), divisor: 1 };
}

function extractMonthlyHistory(result, divisor, livePrice, liveDate) {
  const timestamps = result.timestamp ?? [];
  const adjCloses = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const rawCloses = result.indicators?.quote?.[0]?.close ?? [];

  const byMonth = new Map();

  for (let i = 0; i < timestamps.length; i += 1) {
    const tsSec = timestamps[i];
    if (typeof tsSec !== 'number' || !Number.isFinite(tsSec)) continue;

    const rawAdj = adjCloses[i];
    const rawClose = rawCloses[i];
    const chosen = isFinitePositive(rawAdj)
      ? rawAdj
      : isFinitePositive(rawClose)
        ? rawClose
        : null;
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

async function fetchYahooChart(symbol) {
  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
  const encoded = encodeURIComponent(symbol);
  const query = 'range=5y&interval=1mo&includeAdjustedClose=true';

  let lastError = null;

  for (const host of hosts) {
    const url = `${host}/v8/finance/chart/${encoded}?${query}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json,text/plain,*/*',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} for ${symbol} (${host})`);
        continue;
      }

      const payload = await response.json();
      if (payload?.chart?.error) {
        lastError = new Error(
          payload.chart.error.description ?? payload.chart.error.code ?? `Yahoo error for ${symbol}`
        );
        continue;
      }

      const result = payload?.chart?.result?.[0];
      if (!result || !result.meta || !Array.isArray(result.timestamp) || result.timestamp.length === 0) {
        lastError = new Error(`Empty chart data for ${symbol}`);
        continue;
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${symbol}`);
}

function buildSnapshotEntry(requestedTicker, result) {
  const meta = result.meta ?? {};
  const { currency, divisor } = normalizeCurrencyAndDivisor(meta.currency);

  const rawMarketPrice = isFinitePositive(meta.regularMarketPrice)
    ? meta.regularMarketPrice / divisor
    : undefined;

  const lastUpdatedIso =
    typeof meta.regularMarketTime === 'number' && Number.isFinite(meta.regularMarketTime)
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString();

  const history5Y = extractMonthlyHistory(
    result,
    divisor,
    rawMarketPrice,
    lastUpdatedIso.slice(0, 10)
  );

  if (history5Y.length < 2) {
    throw new Error(`Insufficient 5Y history points (${history5Y.length}) for ${requestedTicker}`);
  }

  const lastHistClose = history5Y[history5Y.length - 1].close;
  const currentPrice = Number((rawMarketPrice ?? lastHistClose).toFixed(2));

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
    history5Y,
  };
}

async function readExistingQuotesFile() {
  try {
    const raw = await readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.quotes && typeof parsed.quotes === 'object') {
      return parsed;
    }
  } catch {
    // Missing or unreadable file — start fresh.
  }
  return { updatedAt: null, updatedDate: null, quotes: {} };
}

async function main() {
  const tsSource = await readFile(ETFS_TS_PATH, 'utf8');
  const instruments = parseEtfsFromSource(tsSource);

  if (instruments.length === 0) {
    throw new Error(`No instruments parsed from ${ETFS_TS_PATH}`);
  }

  console.log(`Parsed ${instruments.length} instruments from src/data/etfs.ts`);

  const existing = await readExistingQuotesFile();
  const existingQuotes = existing.quotes ?? {};
  const nextQuotes = {};

  let fetchedCount = 0;
  let keptOldCount = 0;
  let missingCount = 0;

  for (const item of instruments) {
    const candidates = [item.ticker, ...item.altTickers.slice(0, 1)];
    let resolved = null;
    let lastErr = null;

    for (const symbol of candidates) {
      try {
        const result = await fetchYahooChart(symbol);
        resolved = buildSnapshotEntry(symbol, result);
        break;
      } catch (err) {
        lastErr = err;
      }
      await sleep(REQUEST_DELAY_MS);
    }

    if (resolved) {
      nextQuotes[item.id] = resolved;
      fetchedCount += 1;
      console.log(`  [OK] ${item.id} (${resolved.ticker}): ${resolved.currentPrice} ${resolved.currency} (${resolved.history5Y.length} pts)`);
    } else if (existingQuotes[item.id]) {
      nextQuotes[item.id] = existingQuotes[item.id];
      keptOldCount += 1;
      console.warn(
        `  [KEEP OLD] ${item.id} (${item.ticker}): ${lastErr?.message ?? 'fetch failed'}`
      );
    } else {
      missingCount += 1;
      console.warn(
        `  [OMIT] ${item.id} (${item.ticker}): ${lastErr?.message ?? 'fetch failed'} (no previous value)`
      );
    }

    await sleep(REQUEST_DELAY_MS);
  }

  const quotesChanged = JSON.stringify(nextQuotes) !== JSON.stringify(existingQuotes);
  const nowIso = new Date().toISOString();

  if (!quotesChanged && existing.updatedAt) {
    console.log('No quote values changed; keeping existing public/data/quotes.json untouched.');
    return;
  }

  const outputPayload = {
    updatedAt: fetchedCount > 0 ? nowIso : existing.updatedAt ?? null,
    updatedDate: fetchedCount > 0 ? nowIso.slice(0, 10) : existing.updatedDate ?? null,
    source: 'Yahoo Finance v8 Chart (range=5y, interval=1mo)',
    instrumentCount: Object.keys(nextQuotes).length,
    quotes: nextQuotes,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(outputPayload, null, 2)}\n`, 'utf8');

  console.log(
    `\nSummary: fetched=${fetchedCount}, keptOld=${keptOldCount}, omitted=${missingCount}, totalInFile=${Object.keys(nextQuotes).length}`
  );
  console.log(`Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error('Fatal error in fetch-quotes.mjs:', err);
  process.exitCode = 1;
});
