import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Newspaper,
  Radio,
  RefreshCw,
  Tag,
  TrendingUp,
} from 'lucide-react';

type NewsTag =
  | 'Все новости'
  | 'UCITS ETF'
  | 'Акции и ИИ (NVDA/Tech)'
  | 'ЕЦБ и Ставки'
  | 'Налоги в Европе';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  tag: Exclude<NewsTag, 'Все новости'>;
  url: string;
  isLive?: boolean;
}

const NEWS_TAGS: NewsTag[] = [
  'Все новости',
  'UCITS ETF',
  'Акции и ИИ (NVDA/Tech)',
  'ЕЦБ и Ставки',
  'Налоги в Европе',
];

const RSS_FEEDS: Array<{ url: string; source: string; defaultTag: Exclude<NewsTag, 'Все новости'> }> = [
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=VWCE.DE,NVDA,ASML.AS,AAPL&region=US&lang=en-US',
    source: 'Yahoo Finance Live',
    defaultTag: 'Акции и ИИ (NVDA/Tech)',
  },
  {
    url: 'https://www.cnbc.com/id/19794221/device/rss/rss.html',
    source: 'CNBC Europe Markets',
    defaultTag: 'ЕЦБ и Ставки',
  },
];

const CURATED_EUROPEAN_NEWS: NewsItem[] = [
  {
    id: 'curated-ucits-1',
    title: 'Приток капитала в европейские UCITS ETF (VWCE, IWDA, VUAA) бьёт рекорды благодаря Sparplan',
    summary:
      'Розничные инвесторы в Европе всё чаще выбирают широкие индексные UCITS ETF с автоматической реинвестицией (Acc) вместо активных фондов с высокими комиссиями.',
    source: 'justETF Market Insights',
    publishedAt: 'Обзор рынка • UCITS',
    tag: 'UCITS ETF',
    url: 'https://www.justetf.com/en/news/',
  },
  {
    id: 'curated-tech-1',
    title: 'NVIDIA (NVDA), ASML и Broadcom остаются ключевым драйвером мировых и S&P 500 ETF',
    summary:
      'Полупроводниковый и ИИ-сектор формирует значительную долю капитализации S&P 500 и MSCI World. Для снижения риска одной акции осторожные инвесторы комбинируют базовый ETF (80–90%) с точечными позициями (10–20%).',
    source: 'Reuters Markets',
    publishedAt: 'Аналитика • Tech & AI',
    tag: 'Акции и ИИ (NVDA/Tech)',
    url: 'https://www.reuters.com/markets/',
  },
  {
    id: 'curated-ecb-1',
    title: 'Ставки ЕЦБ и доходность денежных ETF (XEON.DE): что учитывать инвесторам в евро',
    summary:
      'Европейский центральный банк корректирует ключевую ставку на фоне замедления инфляции в еврозоне, что напрямую влияет на доходность фондов денежного рынка EUR (€STR) и банковских депозитов.',
    source: 'Handelsblatt / ECB Watch',
    publishedAt: 'Макроэкономика • ЕЦБ',
    tag: 'ЕЦБ и Ставки',
    url: 'https://www.ecb.europa.eu/press/html/index.en.html',
  },
  {
    id: 'curated-tax-pt',
    title: 'Португалия: Lei n.º 31/2024 снижает налог IRS до 19.6% для долгосрочных держателей ETF (>8 лет)',
    summary:
      'При владении бумагами более 2, 5 и 8 лет налоговая база уменьшается на 10%, 20% и 30%. Важно соблюдать FIFO по ISIN и подавать продажи в Anexo J (Quadro 9.2A).',
    source: 'Jornal de Negócios / ECO',
    publishedAt: 'Налоговое право • PT',
    tag: 'Налоги в Европе',
    url: 'https://eco.sapo.pt/financas-pessoais/',
  },
  {
    id: 'curated-tax-nl-de',
    title: 'Нидерланды (Box 3 Tegenbewijs) и Германия (Vorabpauschale): актуальные правила для ETF',
    summary:
      'В Нидерландах инвесторы могут оспаривать расчётную доходность Box 3 по реальному результату, а в Германии ставка Basiszins определяет ежегодный авансовый налог с Acc ETF.',
    source: 'FD.nl / Finanzfluss',
    publishedAt: 'Налоговое право • NL & DE',
    tag: 'Налоги в Европе',
    url: 'https://fd.nl/',
  },
  {
    id: 'curated-ucits-2',
    title: 'Ирландский домициль (IE) сохраняет преимущество по налогу на дивиденды США (15% вместо 30%)',
    summary:
      'Благодаря налоговому соглашению США–Ирландия ирландские UCITS ETF (IE00...) экономят ~0.20–0.25% в год на американских акциях по сравнению с фондами без льготного договора.',
    source: 'BankerOnWheels / Curvo',
    publishedAt: 'Структура ETF • IE vs LU',
    tag: 'UCITS ETF',
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

function classifyTag(title: string, fallbackTag: Exclude<NewsTag, 'Все новости'>): Exclude<NewsTag, 'Все новости'> {
  const lower = title.toLowerCase();
  if (lower.includes('tax') || lower.includes('irs') || lower.includes('box 3') || lower.includes('fiscal')) {
    return 'Налоги в Европе';
  }
  if (lower.includes('ecb') || lower.includes('rate') || lower.includes('inflation') || lower.includes('central bank') || lower.includes('fed')) {
    return 'ЕЦБ и Ставки';
  }
  if (lower.includes('etf') || lower.includes('ucits') || lower.includes('vanguard') || lower.includes('ishares') || lower.includes('index')) {
    return 'UCITS ETF';
  }
  if (lower.includes('nvidia') || lower.includes('nvda') || lower.includes('apple') || lower.includes('ai ') || lower.includes('asml') || lower.includes('tech')) {
    return 'Акции и ИИ (NVDA/Tech)';
  }
  return fallbackTag;
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const MarketNewsFeed: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<NewsTag>('Все новости');
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
            collected.push({
              id: `live-${feed.source}-${entry.link}`,
              title: cleanTitle,
              summary:
                cleanDesc.length > 15
                  ? `${cleanDesc}${cleanDesc.length >= 180 ? '...' : ''}`
                  : 'Открыть полную новость на сайте финансового издания.',
              source: feed.source,
              publishedAt: entry.pubDate ? entry.pubDate.slice(0, 16) : 'Live RSS',
              tag: classifyTag(cleanTitle, feed.defaultTag),
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
    if (selectedTag === 'Все новости') return merged;
    return merged.filter((item) => item.tag === selectedTag);
  }, [liveItems, selectedTag]);

  return (
    <section
      aria-label="Live Financial News and European Market Insights"
      className="fintech-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Newspaper className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Финансовые новости, обзоры рынков и налоги Европы
            </h2>
            {liveItems.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <Radio className="h-3 w-3" />
                Live RSS ({liveItems.length}){lastUpdated ? ` • ${lastUpdated}` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                <TrendingUp className="h-3 w-3 text-cyan-400" />
                Проверенная сводка ЕС + Порталы
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Живые заголовки Yahoo Finance / CNBC Europe (при доступности сети) вместе с ключевыми
            обзорами по UCITS ETF, ставкам ЕЦБ, тех-акциям и налоговым изменениям в Европе.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchLiveNews()}
          disabled={isLoadingLive}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
          <span>{isLoadingLive ? 'Загрузка...' : 'Обновить ленту'}</span>
        </button>
      </div>

      {/* Tag Filter Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Tag className="mr-1 h-3.5 w-3.5 text-slate-400" />
        {NEWS_TAGS.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              {tag}
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
                  {item.tag}
                </span>
                <span className="font-mono text-slate-400">
                  {item.isLive ? 'LIVE • ' : ''}
                  {item.publishedAt}
                </span>
              </div>

              <h3 className="mt-2 text-xs leading-snug font-bold text-white group-hover:text-emerald-300 sm:text-sm">
                {item.title}
              </h3>

              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{item.summary}</p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px]">
              <span className="font-semibold text-slate-300">{item.source}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                Читать <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Trusted European Financial News Portals */}
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
        <p className="mb-2 text-xs font-bold text-slate-200">
          Прямые ссылки на проверенные деловые и ETF-порталы Европы:
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
