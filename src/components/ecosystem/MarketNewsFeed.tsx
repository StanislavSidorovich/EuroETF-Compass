import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Newspaper,
  Radio,
  RefreshCw,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';

type NewsTagId = 'all' | 'ucits' | 'tech' | 'ecb' | 'tax';

interface NewsItem {
  id: string;
  titleEn: string;
  titleRu: string;
  summaryEn: string;
  summaryRu: string;
  source: string;
  publishedAtEn: string;
  publishedAtRu: string;
  tagId: Exclude<NewsTagId, 'all'>;
  url: string;
  isLive?: boolean;
}

const NEWS_TAGS: Array<{ id: NewsTagId; labelEn: string; labelRu: string }> = [
  { id: 'all', labelEn: 'All News', labelRu: 'Все новости' },
  { id: 'ucits', labelEn: 'UCITS ETF', labelRu: 'UCITS ETF' },
  { id: 'tech', labelEn: 'Stocks & AI (NVDA/Tech)', labelRu: 'Акции и ИИ (NVDA/Tech)' },
  { id: 'ecb', labelEn: 'ECB & Rates', labelRu: 'ЕЦБ и Ставки' },
  { id: 'tax', labelEn: 'European Taxes', labelRu: 'Налоги в Европе' },
];

const RSS_FEEDS: Array<{
  url: string;
  source: string;
  defaultTag: Exclude<NewsTagId, 'all'>;
}> = [
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=VWCE.DE,NVDA,ASML.AS,AAPL&region=US&lang=en-US',
    source: 'Yahoo Finance Live',
    defaultTag: 'tech',
  },
  {
    url: 'https://www.cnbc.com/id/19794221/device/rss/rss.html',
    source: 'CNBC Europe Markets',
    defaultTag: 'ecb',
  },
];

const CURATED_EUROPEAN_NEWS: NewsItem[] = [
  {
    id: 'curated-ucits-1',
    titleEn: 'Record inflows into European UCITS ETFs (VWCE, IWDA, VUAA) driven by monthly Sparplans',
    titleRu: 'Приток капитала в европейские UCITS ETF (VWCE, IWDA, VUAA) бьёт рекорды благодаря Sparplan',
    summaryEn:
      'European retail investors increasingly choose broad Accumulating (Acc) UCITS index ETFs over high-fee active funds.',
    summaryRu:
      'Розничные инвесторы в Европе всё чаще выбирают широкие индексные UCITS ETF с автоматической реинвестицией (Acc) вместо активных фондов с высокими комиссиями.',
    source: 'justETF Market Insights',
    publishedAtEn: 'Market Brief • UCITS',
    publishedAtRu: 'Обзор рынка • UCITS',
    tagId: 'ucits',
    url: 'https://www.justetf.com/en/news/',
  },
  {
    id: 'curated-tech-1',
    titleEn: 'NVIDIA (NVDA), ASML & Broadcom remain core drivers of Global and S&P 500 ETFs',
    titleRu: 'NVIDIA (NVDA), ASML и Broadcom остаются ключевым драйвером мировых и S&P 500 ETF',
    summaryEn:
      'Semiconductors and AI represent a major weight in MSCI World and S&P 500. Careful investors pair a core ETF (80–90%) with targeted single stocks (10–20%).',
    summaryRu:
      'Полупроводниковый и ИИ-сектор формирует значительную долю капитализации S&P 500 и MSCI World. Для снижения риска одной акции осторожные инвесторы комбинируют базовый ETF (80–90%) с точечными позициями (10–20%).',
    source: 'Reuters Markets',
    publishedAtEn: 'Analysis • Tech & AI',
    publishedAtRu: 'Аналитика • Tech & AI',
    tagId: 'tech',
    url: 'https://www.reuters.com/markets/',
  },
  {
    id: 'curated-ecb-1',
    titleEn: 'ECB policy rates and Euro Money Market ETFs (XEON.DE): what EUR investors should watch',
    titleRu: 'Ставки ЕЦБ и доходность денежных ETF (XEON.DE): что учитывать инвесторам в евро',
    summaryEn:
      'ECB rate adjustments as Eurozone inflation moderates directly shape €STR overnight money market ETF yields and bank savings accounts.',
    summaryRu:
      'Европейский центральный банк корректирует ключевую ставку на фоне замедления инфляции в еврозоне, что напрямую влияет на доходность фондов денежного рынка EUR (€STR) и банковских депозитов.',
    source: 'Handelsblatt / ECB Watch',
    publishedAtEn: 'Macro • ECB',
    publishedAtRu: 'Макроэкономика • ЕЦБ',
    tagId: 'ecb',
    url: 'https://www.ecb.europa.eu/press/html/index.en.html',
  },
  {
    id: 'curated-tax-pt',
    titleEn: 'Portugal: Lei n.º 31/2024 cuts IRS capital gains tax down to 19.6% for long-term ETF holders (>8 yrs)',
    titleRu: 'Португалия: Lei n.º 31/2024 снижает налог IRS до 19.6% для долгосрочных держателей ETF (>8 лет)',
    summaryEn:
      'Holding assets >2, >5, and >8 years reduces the taxable gain by 10%, 20%, and 30%. Track FIFO lots by ISIN and file sales in Anexo J (Quadro 9.2A).',
    summaryRu:
      'При владении бумагами более 2, 5 и 8 лет налоговая база уменьшается на 10%, 20% и 30%. Важно соблюдать FIFO по ISIN и подавать продажи в Anexo J (Quadro 9.2A).',
    source: 'Jornal de Negócios / ECO',
    publishedAtEn: 'Tax Law • PT',
    publishedAtRu: 'Налоговое право • PT',
    tagId: 'tax',
    url: 'https://eco.sapo.pt/financas-pessoais/',
  },
  {
    id: 'curated-tax-nl-de',
    titleEn: 'Netherlands (Box 3 Tegenbewijs) & Germany (Vorabpauschale): key ETF rules',
    titleRu: 'Нидерланды (Box 3 Tegenbewijs) и Германия (Vorabpauschale): актуальные правила для ETF',
    summaryEn:
      'Dutch residents can invoke actual return rebuttal (Tegenbewijsregeling) in Box 3, while Germany applies Basiszins-based Vorabpauschale on Acc ETFs.',
    summaryRu:
      'В Нидерландах инвесторы могут оспаривать расчётную доходность Box 3 по реальному результату, а в Германии ставка Basiszins определяет ежегодный авансовый налог с Acc ETF.',
    source: 'FD.nl / Finanzfluss',
    publishedAtEn: 'Tax Law • NL & DE',
    publishedAtRu: 'Налоговое право • NL & DE',
    tagId: 'tax',
    url: 'https://fd.nl/',
  },
  {
    id: 'curated-ucits-2',
    titleEn: 'Irish domicile (IE) preserves US dividend withholding advantage (15% vs 30%)',
    titleRu: 'Ирландский домициль (IE) сохраняет преимущество по налогу на дивиденды США (15% вместо 30%)',
    summaryEn:
      'Under the US–Ireland tax treaty, Irish-domiciled UCITS ETFs (IE00...) save ~0.20–0.25% annually on US equity dividends compared to non-treaty funds.',
    summaryRu:
      'Благодаря налоговому соглашению США–Ирландия ирландские UCITS ETF (IE00...) экономят ~0.20–0.25% в год на американских акциях по сравнению с фондами без льготного договора.',
    source: 'BankerOnWheels / Curvo',
    publishedAtEn: 'ETF Structure • IE vs LU',
    publishedAtRu: 'Структура ETF • IE vs LU',
    tagId: 'ucits',
    url: 'https://curvo.eu/article/',
  },
];

const TRUSTED_PORTALS = [
  { name: 'justETF News', url: 'https://www.justetf.com/en/news/', region: 'EU ETFs' },
  { name: 'Jornal de Negócios PT', url: 'https://www.jornaldenegocios.pt/', region: 'Portugal' },
  { name: 'ECO Sapo PT', url: 'https://eco.sapo.pt/', region: 'Portugal' },
  { name: 'FD.nl', url: 'https://fd.nl/', region: 'Netherlands' },
  { name: 'Handelsblatt', url: 'https://www.handelsblatt.com/finanzen/', region: 'Germany' },
  { name: 'Reuters Markets', url: 'https://www.reuters.com/markets/', region: 'Global' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/', region: 'Live Quotes' },
];

interface Rss2JsonResponse {
  status?: string;
  items?: Array<{
    title?: string;
    description?: string;
    link?: string;
    pubDate?: string;
  }>;
}

function classifyTag(
  title: string,
  fallbackTag: Exclude<NewsTagId, 'all'>
): Exclude<NewsTagId, 'all'> {
  const lower = title.toLowerCase();
  if (lower.includes('tax') || lower.includes('irs') || lower.includes('box 3') || lower.includes('fiscal')) {
    return 'tax';
  }
  if (lower.includes('ecb') || lower.includes('rate') || lower.includes('inflation') || lower.includes('central bank') || lower.includes('fed')) {
    return 'ecb';
  }
  if (lower.includes('etf') || lower.includes('ucits') || lower.includes('vanguard') || lower.includes('ishares') || lower.includes('index')) {
    return 'ucits';
  }
  if (lower.includes('nvidia') || lower.includes('nvda') || lower.includes('apple') || lower.includes('ai ') || lower.includes('asml') || lower.includes('tech')) {
    return 'tech';
  }
  return fallbackTag;
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const MarketNewsFeed: React.FC = () => {
  const { lang } = useAppPreferences();
  const [selectedTagId, setSelectedTagId] = useState<NewsTagId>('all');
  const [liveItems, setLiveItems] = useState<NewsItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchLiveNews = useCallback(async () => {
    setIsLoadingLive(true);
    const collected: NewsItem[] = [];

    await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => controller.abort(), 3500);
        try {
          const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
          const res = await fetch(endpoint, { signal: controller.signal });
          if (!res.ok) return;
          const data = (await res.json()) as Rss2JsonResponse;
          if (data.status !== 'ok' || !Array.isArray(data.items)) return;

          for (const entry of data.items.slice(0, 4)) {
            if (!entry.title || !entry.link) continue;
            const cleanTitle = stripHtmlTags(entry.title);
            const cleanDesc = stripHtmlTags(entry.description ?? '').slice(0, 180);
            const dateLabel = entry.pubDate ? entry.pubDate.slice(0, 16) : 'Live RSS';
            collected.push({
              id: `live-${feed.source}-${entry.link}`,
              titleEn: cleanTitle,
              titleRu: cleanTitle,
              summaryEn:
                cleanDesc.length > 15
                  ? `${cleanDesc}${cleanDesc.length >= 180 ? '...' : ''}`
                  : 'Open full article on the financial publisher website.',
              summaryRu:
                cleanDesc.length > 15
                  ? `${cleanDesc}${cleanDesc.length >= 180 ? '...' : ''}`
                  : 'Открыть полную новость на сайте финансового издания.',
              source: feed.source,
              publishedAtEn: dateLabel,
              publishedAtRu: dateLabel,
              tagId: classifyTag(cleanTitle, feed.defaultTag),
              url: entry.link,
              isLive: true,
            });
          }
        } catch {
          // Graceful fallback to curated news on timeout/CORS/rate-limit
        } finally {
          globalThis.clearTimeout(timeoutId);
        }
      })
    );

    if (collected.length > 0) {
      setLiveItems(collected);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    setIsLoadingLive(false);
  }, []);

  useEffect(() => {
    void fetchLiveNews();
  }, [fetchLiveNews]);

  const combinedNews = useMemo(() => {
    const merged = [...liveItems, ...CURATED_EUROPEAN_NEWS];
    if (selectedTagId === 'all') return merged;
    return merged.filter((item) => item.tagId === selectedTagId);
  }, [liveItems, selectedTagId]);

  const getTagLabel = (tagId: Exclude<NewsTagId, 'all'>): string => {
    const found = NEWS_TAGS.find((t) => t.id === tagId);
    return found ? tr(lang, found.labelEn, found.labelRu) : tagId;
  };

  return (
    <section
      aria-label={tr(
        lang,
        'Live Financial News and European Market Insights',
        'Финансовые новости и обзоры рынков Европы'
      )}
      className="fintech-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Newspaper className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {tr(
                lang,
                'Financial News, Market Insights & European Tax Updates',
                'Финансовые новости, обзоры рынков и налоги Европы'
              )}
            </h2>
            {liveItems.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <Radio className="h-3 w-3" />
                Live RSS ({liveItems.length}){lastUpdated ? ` • ${lastUpdated}` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                <TrendingUp className="h-3 w-3 text-cyan-400" />
                {tr(lang, 'Verified EU Briefs + Portals', 'Проверенная сводка ЕС + Порталы')}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {tr(
              lang,
              'Live headlines from Yahoo Finance / CNBC Europe (when online) combined with key briefs on UCITS ETFs, ECB rates, tech stocks, and European tax law.',
              'Живые заголовки Yahoo Finance / CNBC Europe (при доступности сети) вместе с ключевыми обзорами по UCITS ETF, ставкам ЕЦБ, тех-акциям и налоговым изменениям в Европе.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchLiveNews()}
          disabled={isLoadingLive}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
          <span>
            {isLoadingLive
              ? tr(lang, 'Loading...', 'Загрузка...')
              : tr(lang, 'Refresh Feed', 'Обновить ленту')}
          </span>
        </button>
      </div>

      {/* Tag Filter Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Tag className="mr-1 h-3.5 w-3.5 text-slate-400" />
        {NEWS_TAGS.map((tag) => {
          const active = selectedTagId === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTagId(tag.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              {tr(lang, tag.labelEn, tag.labelRu)}
            </button>
          );
        })}
      </div>

      {/* News Grid */}
      <div className="mt-4 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {combinedNews.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-300">
                  {getTagLabel(item.tagId)}
                </span>
                <span className="font-mono text-slate-400">
                  {item.isLive ? 'LIVE • ' : ''}
                  {tr(lang, item.publishedAtEn, item.publishedAtRu)}
                </span>
              </div>

              <h3 className="mt-2 text-xs leading-snug font-bold text-white group-hover:text-emerald-300 sm:text-sm">
                {tr(lang, item.titleEn, item.titleRu)}
              </h3>

              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {tr(lang, item.summaryEn, item.summaryRu)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px]">
              <span className="font-semibold text-slate-300">{item.source}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                {tr(lang, 'Read', 'Читать')} <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Trusted European Financial News Portals */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
        <p className="mb-2 text-xs font-bold text-slate-200">
          {tr(
            lang,
            'Direct links to trusted European financial & ETF news portals:',
            'Прямые ссылки на проверенные деловые и ETF-порталы Европы:'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {TRUSTED_PORTALS.map((portal) => (
            <a
              key={portal.name}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-300"
            >
              <span>{portal.name}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                {portal.region}
              </span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
