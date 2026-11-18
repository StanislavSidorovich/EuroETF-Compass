import type {
  CatalogCategory,
  ETFInstrument,
  InstrumentType,
  PortfolioAllocationItem,
} from '../../types';

export type DrawerCategoryTab = CatalogCategory;
export type DropdownAddMode = 'mix' | 'replace';

export interface PresetAssetSpec {
  candidates: string[];
  weightPct: number;
}

export interface PortfolioPresetSpec {
  id: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  items: PresetAssetSpec[];
}

export const PORTFOLIO_PRESET_SPECS: PortfolioPresetSpec[] = [
  {
    id: 'vwce-100',
    labelEn: '🌍 100% Global ETF (VWCE)',
    labelRu: '🌍 100% Мировой ETF (VWCE)',
    descEn: 'Single global UCITS ETF (~3,650 stocks, Developed + EM, auto-reinvested)',
    descRu: 'Единый мировой UCITS ETF (~3 650 компаний, авто-реинвестирование)',
    items: [{ candidates: ['vwce', 'VWCE.DE'], weightPct: 100 }],
  },
  {
    id: 'vwce-xeon',
    labelEn: '⚖️ Careful 80% Global + 20% Cash',
    labelRu: '⚖️ Осторожный: 80% Мир + 20% Кэш',
    descEn: 'Global equities + 20% defensive ECB €STR overnight cash buffer',
    descRu: 'Мировые акции + 20% защитная подушка по ставке ЕЦБ €STR',
    items: [
      { candidates: ['vwce', 'VWCE.DE'], weightPct: 80 },
      { candidates: ['xeon', 'XEON.DE'], weightPct: 20 },
    ],
  },
  {
    id: 'vwce-nvda-aapl',
    labelEn: '🚀 Global ETF + NVIDIA & Apple',
    labelRu: '🚀 Мировой ETF + NVIDIA и Apple',
    descEn: '60% global index core + 20% NVIDIA + 20% Apple satellite tilt',
    descRu: '60% индексное ядро + 20% NVIDIA + 20% Apple',
    items: [
      { candidates: ['vwce', 'VWCE.DE'], weightPct: 60 },
      { candidates: ['nvda', 'NVDA'], weightPct: 20 },
      { candidates: ['aapl', 'AAPL'], weightPct: 20 },
    ],
  },
  {
    id: 'eqqb-nvda-msft',
    labelEn: '💻 US Tech & AI (EQQB + NVDA + MSFT)',
    labelRu: '💻 Технологии США и ИИ (EQQB + NVDA + MSFT)',
    descEn: '50% Nasdaq-100 Acc + 25% NVIDIA + 25% Microsoft (higher volatility)',
    descRu: '50% Nasdaq-100 Acc + 25% NVIDIA + 25% Microsoft (высокий риск)',
    items: [
      { candidates: ['eqqb', 'EQQB.DE'], weightPct: 50 },
      { candidates: ['nvda', 'NVDA'], weightPct: 25 },
      { candidates: ['msft', 'MSFT'], weightPct: 25 },
    ],
  },
  {
    id: 'europe-champions',
    labelEn: '🇪🇺 European Champions',
    labelRu: '🇪🇺 Чемпионы Европы',
    descEn: '50% MSCI Europe + 20% ASML + 15% SAP + 15% EDP Portugal',
    descRu: '50% MSCI Europe + 20% ASML + 15% SAP + 15% EDP.LS',
    items: [
      { candidates: ['eunk', 'eunk-de', 'EUNK.DE', 'meud', 'MEUD.PA'], weightPct: 50 },
      { candidates: ['asml', 'asml-as', 'ASML.AS', 'ASML'], weightPct: 20 },
      { candidates: ['sap', 'sap-de', 'SAP.DE', 'SAP'], weightPct: 15 },
      { candidates: ['edp', 'edp-ls', 'EDP.LS', 'EDP'], weightPct: 15 },
    ],
  },
  {
    id: 'vgwl-100',
    labelEn: '🔄 All-World Dist Twin (VGWL)',
    labelRu: '🔄 Dist-близнец (VGWL)',
    descEn: 'Same FTSE All-World index with cash dividends to compare local tax drag',
    descRu: 'Тот же индекс FTSE All-World, но с выплатой дивидендов для сравнения налогов',
    items: [{ candidates: ['vgwl', 'VGWL.DE'], weightPct: 100 }],
  },
];

export const SLICE_COLORS = [
  'bg-[#2d8a61]',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-teal-600',
  'bg-rose-500',
];

export const SEARCH_ALIASES: Record<string, string[]> = {
  NVDA: ['nvidia', 'gpu', 'нвидиа'],
  AAPL: ['apple', 'iphone', 'mac', 'эппл'],
  MSFT: ['microsoft', 'windows', 'azure', 'майкрософт'],
  GOOGL: ['google', 'alphabet', 'youtube', 'гугл'],
  META: ['facebook', 'fb', 'instagram', 'whatsapp', 'мета', 'фейсбук'],
  AMZN: ['amazon', 'aws', 'амазон'],
  TSLA: ['tesla', 'ev', 'тесла'],
  AVGO: ['broadcom'],
  'BRK-B': ['berkshire', 'buffett', 'бахет', 'беркшир'],
  LLY: ['lilly', 'eli lilly'],
  JPM: ['jpmorgan', 'chase'],
  COST: ['costco'],
  'ASML.AS': ['asml', 'netherlands', 'holland', 'нидерланды'],
  'NOVO-B.CO': ['novo', 'nordisk', 'ozempic', 'denmark'],
  NVO: ['novo', 'nordisk', 'ozempic', 'denmark'],
  'SAP.DE': ['sap', 'germany', 'германия'],
  'MC.PA': ['lvmh', 'louis vuitton', 'france', 'франция'],
  'SIE.DE': ['siemens', 'сименс', 'germany'],
  'SHEL.AS': ['shell', 'oil', 'netherlands'],
  'NESN.SW': ['nestle', 'switzerland', 'швейцария'],
  'EDP.LS': ['edp', 'portugal', 'lisbon', 'energias', 'португалия'],
  'VWCE.DE': ['world', 'all-world', 'мир', 'мировой'],
  'VGWL.DE': ['world', 'dist', 'мир', 'дивиденд'],
  'SXR8.DE': ['s&p', 'sp500', 'usa', 'сша'],
  'VUAA.DE': ['s&p', 'sp500', 'vanguard', 'сша'],
  'VUSA.DE': ['s&p', 'sp500', 'dist', 'сша'],
  'EQQB.DE': ['nasdaq', 'qqq', 'tech', 'наздак'],
  'EQQQ.DE': ['nasdaq', 'qqq', 'tech', 'наздак'],
  'XEON.DE': ['cash', 'estr', 'overnight', 'кэш', 'облигации'],
};

export const NAME_TO_TICKER_QUERY: Record<string, string> = {
  NVIDIA: 'NVDA',
  APPLE: 'AAPL',
  MICROSOFT: 'MSFT',
  GOOGLE: 'GOOGL',
  ALPHABET: 'GOOGL',
  FACEBOOK: 'META',
  META: 'META',
  AMAZON: 'AMZN',
  TESLA: 'TSLA',
  NETFLIX: 'NFLX',
  AMD: 'AMD',
  BROADCOM: 'AVGO',
  BERKSHIRE: 'BRK-B',
  COSTCO: 'COST',
  JPMORGAN: 'JPM',
  ASML: 'ASML.AS',
  NOVO: 'NOVO-B.CO',
  'NOVO NORDISK': 'NOVO-B.CO',
  SAP: 'SAP.DE',
  LVMH: 'MC.PA',
  SIEMENS: 'SIE.DE',
  SHELL: 'SHEL.AS',
  NESTLE: 'NESN.SW',
  EDP: 'EDP.LS',
  PORTUGAL: 'EDP.LS',
};

export const INITIAL_DRAWER_VISIBLE_LIMIT = 8;

export function getInstrumentType(etf: ETFInstrument): InstrumentType {
  if (etf.instrumentType) return etf.instrumentType;
  if (
    etf.assetClass === 'Individual Stock (US)' ||
    etf.assetClass === 'Individual Stock (Europe)' ||
    etf.provider === 'US Corporation (NASDAQ/NYSE)' ||
    etf.provider === 'European Corporation'
  ) {
    return 'Stock';
  }
  if (
    etf.id.startsWith('custom-') &&
    !/\b(etf|ucits|fund|index|swap|ishares|vanguard|xtrackers|invesco|amundi|spdr)\b/i.test(
      etf.name
    )
  ) {
    return 'Stock';
  }
  return 'ETF';
}

export function getInstrumentCategory(etf: ETFInstrument): CatalogCategory {
  if (etf.catalogCategory) return etf.catalogCategory;
  const type = getInstrumentType(etf);
  if (type === 'Stock') {
    if (
      etf.assetClass === 'Individual Stock (Europe)' ||
      /\.(DE|AS|PA|SW|LS|L|MI|MC|BR|CO)$/i.test(etf.ticker)
    ) {
      return 'Europe Stocks';
    }
    return 'US Stocks';
  }
  if (etf.assetClass === 'US Equities' || etf.assetClass === 'Tech / Nasdaq Equities') {
    return 'US ETFs';
  }
  if (etf.assetClass === 'European Equities' || etf.assetClass === 'EUR Money Market / Bonds') {
    return 'Europe & Bond ETFs';
  }
  return 'Global ETFs';
}

export function resolveCandidateAsset(
  etfs: ETFInstrument[],
  candidates: string[]
): ETFInstrument | undefined {
  const lower = candidates.map((c) => c.toLowerCase());
  const upper = candidates.map((c) => c.toUpperCase());
  return (
    etfs.find((e) => lower.includes(e.id.toLowerCase())) ??
    etfs.find((e) => upper.includes(e.ticker.toUpperCase())) ??
    etfs.find((e) => e.altTickers.some((alt) => upper.includes(alt.toUpperCase())))
  );
}

export function resolveTickerQuery(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (NAME_TO_TICKER_QUERY[upper]) {
    return NAME_TO_TICKER_QUERY[upper];
  }
  return upper;
}

export function formatCurrencyPrice(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  return `${symbol}${value.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isPresetMatch(
  presetItems: PortfolioAllocationItem[],
  current: PortfolioAllocationItem[]
): boolean {
  const nonZero = current.filter((item) => item.weightPct > 0);
  if (presetItems.length !== nonZero.length) return false;
  const currentMap = new Map(nonZero.map((item) => [item.etfId, Math.round(item.weightPct)]));
  return presetItems.every((p) => currentMap.get(p.etfId) === p.weightPct);
}

export function matchesSearchQuery(etf: ETFInstrument, q: string): boolean {
  if (!q) return true;
  const aliases = SEARCH_ALIASES[etf.ticker.toUpperCase()] ?? [];
  return (
    etf.ticker.toLowerCase().includes(q) ||
    etf.altTickers.some((alt) => alt.toLowerCase().includes(q)) ||
    etf.name.toLowerCase().includes(q) ||
    etf.shortName.toLowerCase().includes(q) ||
    etf.isin.toLowerCase().includes(q) ||
    etf.wkn.toLowerCase().includes(q) ||
    etf.provider.toLowerCase().includes(q) ||
    etf.indexTracked.toLowerCase().includes(q) ||
    aliases.some((alias) => alias.includes(q))
  );
}
