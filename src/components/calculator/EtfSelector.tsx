import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe2,
  Info,
  Layers,
  Loader2,
  PieChart,
  Plus,
  Scale,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { getEtfExternalLinks } from '../../data/europeanPortals';
import type {
  CatalogCategory,
  ETFInstrument,
  InstrumentType,
  LiveQuoteData,
  PortfolioAllocationItem,
  ThemeMode,
} from '../../types';

export interface EtfSelectorProps {
  etfs: ETFInstrument[];
  quotesByEtfId: Record<string, LiveQuoteData>;
  allocations: PortfolioAllocationItem[];
  onChangeAllocations: (allocations: PortfolioAllocationItem[]) => void;
  onAddCustomTicker: (ticker: string) => Promise<void>;
  isFetchingCustomTicker?: boolean;
  customTickerError?: string | null;
  theme?: ThemeMode;
}

type CategoryTab = 'ALL' | CatalogCategory;
type PolicySubFilter = 'ALL' | 'Acc' | 'Dist' | 'Stock' | 'Custom';

interface PresetAssetSpec {
  candidates: string[];
  weightPct: number;
}

interface PortfolioPresetSpec {
  id: string;
  label: string;
  description: string;
  items: PresetAssetSpec[];
}

const PORTFOLIO_PRESET_SPECS: PortfolioPresetSpec[] = [
  {
    id: 'vwce-100',
    label: '🌍 100% Мировой ETF (VWCE Acc)',
    description: 'Единый мировой UCITS ETF (~3 650 компаний, развитые + EM, авто-реинвестирование)',
    items: [{ candidates: ['vwce', 'VWCE.DE'], weightPct: 100 }],
  },
  {
    id: 'vwce-xeon',
    label: '⚖️ Осторожный: 80% VWCE + 20% Кэш (XEON)',
    description: 'Мировые акции + 20% защитная подушка по ставке ЕЦБ €STR',
    items: [
      { candidates: ['vwce', 'VWCE.DE'], weightPct: 80 },
      { candidates: ['xeon', 'XEON.DE'], weightPct: 20 },
    ],
  },
  {
    id: 'vwce-nvda-aapl',
    label: '🚀 ETF + Топ Акции США (60% VWCE + 20% NVDA + 20% AAPL)',
    description: 'Надёжное индексное ядро 60% + фокус на лидеров США (NVIDIA и Apple)',
    items: [
      { candidates: ['vwce', 'VWCE.DE'], weightPct: 60 },
      { candidates: ['nvda', 'NVDA'], weightPct: 20 },
      { candidates: ['aapl', 'AAPL'], weightPct: 20 },
    ],
  },
  {
    id: 'eqqb-nvda-msft',
    label: '💻 Технологии и ИИ (50% EQQB Nasdaq + 25% NVDA + 25% MSFT)',
    description: 'Концентрированный технологический портфель с высокой волатильностью',
    items: [
      { candidates: ['eqqb', 'EQQB.DE'], weightPct: 50 },
      { candidates: ['nvda', 'NVDA'], weightPct: 25 },
      { candidates: ['msft', 'MSFT'], weightPct: 25 },
    ],
  },
  {
    id: 'europe-champions',
    label: '🇪🇺 Чемпионы Европы (50% EUNK + 20% ASML + 15% SAP + 15% EDP.LS)',
    description: 'Европейский индекс MSCI Europe + ASML, SAP и португальская EDP',
    items: [
      { candidates: ['eunk', 'eunk-de', 'EUNK.DE', 'meud', 'MEUD.PA'], weightPct: 50 },
      { candidates: ['asml', 'asml-as', 'ASML.AS', 'ASML'], weightPct: 20 },
      { candidates: ['sap', 'sap-de', 'SAP.DE', 'SAP'], weightPct: 15 },
      { candidates: ['edp', 'edp-ls', 'EDP.LS', 'EDP'], weightPct: 15 },
    ],
  },
  {
    id: 'vgwl-100',
    label: '🔄 Сравнение Dist-близнеца (100% VGWL Dist)',
    description: 'Тот же индекс FTSE All-World, но с выплатой дивидендов на счёт для сравнения налогов',
    items: [{ candidates: ['vgwl', 'VGWL.DE'], weightPct: 100 }],
  },
];

const QUICK_LOOKUP_EXAMPLES = ['NVDA', 'AMD', 'NFLX', 'CSPX.L', 'XDWD.DE', 'EDP.LS'];

const SLICE_COLORS = [
  'bg-[#2d8a61]',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-teal-600',
  'bg-rose-500',
];

const SEARCH_ALIASES: Record<string, string[]> = {
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

const NAME_TO_TICKER_QUERY: Record<string, string> = {
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
  NOVO: 'NVO',
  'NOVO NORDISK': 'NVO',
  SAP: 'SAP.DE',
  LVMH: 'MC.PA',
  SIEMENS: 'SIE.DE',
  SHELL: 'SHEL.AS',
  NESTLE: 'NESN.SW',
  EDP: 'EDP.LS',
  PORTUGAL: 'EDP.LS',
};

function getInstrumentType(etf: ETFInstrument): InstrumentType {
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

function getInstrumentCategory(etf: ETFInstrument): CatalogCategory {
  if (etf.catalogCategory) return etf.catalogCategory;
  const type = getInstrumentType(etf);
  if (type === 'Stock') {
    if (
      etf.assetClass === 'Individual Stock (Europe)' ||
      /\.(DE|AS|PA|SW|LS|L|MI|MC|BR)$/i.test(etf.ticker)
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

function resolveCandidateAsset(
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

function resolveTickerQuery(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (NAME_TO_TICKER_QUERY[upper]) {
    return NAME_TO_TICKER_QUERY[upper];
  }
  return upper;
}

function formatCurrencyPrice(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  return `${symbol}${value.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isPresetMatch(
  presetItems: PortfolioAllocationItem[],
  current: PortfolioAllocationItem[]
): boolean {
  const nonZero = current.filter((item) => item.weightPct > 0);
  if (presetItems.length !== nonZero.length) return false;
  const currentMap = new Map(nonZero.map((item) => [item.etfId, Math.round(item.weightPct)]));
  return presetItems.every((p) => currentMap.get(p.etfId) === p.weightPct);
}

export function EtfSelector({
  etfs,
  quotesByEtfId,
  allocations,
  onChangeAllocations,
  onAddCustomTicker,
  isFetchingCustomTicker = false,
  customTickerError = null,
  theme = 'dark',
}: EtfSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('ALL');
  const [policySubFilter, setPolicySubFilter] = useState<PolicySubFilter>('ALL');
  const [localLookupError, setLocalLookupError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [expandedNotesById, setExpandedNotesById] = useState<Record<string, boolean>>({});
  const [pendingAutoAddTicker, setPendingAutoAddTicker] = useState<string | null>(null);

  const knownEtfIdsBeforeFetchRef = useRef<Set<string>>(new Set());
  const isLight = theme === 'light';

  const etfById = useMemo(() => new Map(etfs.map((e) => [e.id, e])), [etfs]);
  const allocationById = useMemo(
    () => new Map(allocations.map((a) => [a.etfId, a.weightPct])),
    [allocations]
  );

  const activeAllocations = useMemo(
    () => allocations.filter((item) => item.weightPct > 0),
    [allocations]
  );

  const totalWeightPct = useMemo(
    () =>
      allocations.reduce(
        (sum, item) => sum + (Number.isFinite(item.weightPct) ? item.weightPct : 0),
        0
      ),
    [allocations]
  );

  const resolvedPresets = useMemo(() => {
    return PORTFOLIO_PRESET_SPECS.map((spec) => {
      const resolvedItems: PortfolioAllocationItem[] = [];
      for (const item of spec.items) {
        const match = resolveCandidateAsset(etfs, item.candidates);
        if (!match) return null;
        resolvedItems.push({ etfId: match.id, weightPct: item.weightPct });
      }
      return {
        id: spec.id,
        label: spec.label,
        description: spec.description,
        items: resolvedItems,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [etfs]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      ALL: etfs.length,
      'Global ETFs': 0,
      'US ETFs': 0,
      'Europe & Bond ETFs': 0,
      'US Stocks': 0,
      'Europe Stocks': 0,
    };
    for (const item of etfs) {
      const cat = getInstrumentCategory(item);
      counts[cat] += 1;
    }
    return counts;
  }, [etfs]);

  const matchesSearchQuery = (etf: ETFInstrument, q: string): boolean => {
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
      etf.assetClass.toLowerCase().includes(q) ||
      aliases.some((alias) => alias.includes(q))
    );
  };

  const filteredEtfs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = etfs.filter((etf) => {
      if (categoryTab !== 'ALL' && getInstrumentCategory(etf) !== categoryTab) {
        return false;
      }

      const instType = getInstrumentType(etf);
      if (policySubFilter === 'Acc' && (instType !== 'ETF' || etf.distributionPolicy !== 'Acc')) {
        return false;
      }
      if (policySubFilter === 'Dist' && (instType !== 'ETF' || etf.distributionPolicy !== 'Dist')) {
        return false;
      }
      if (policySubFilter === 'Stock' && instType !== 'Stock') {
        return false;
      }
      if (policySubFilter === 'Custom' && etf.provider !== 'Custom' && !etf.id.startsWith('custom-')) {
        return false;
      }

      return matchesSearchQuery(etf, q);
    });

    // Surface newly added custom live instruments at the top so users see them right away.
    return [...matched].sort((a, b) => {
      const aCustom = a.id.startsWith('custom-') ? 0 : 1;
      const bCustom = b.id.startsWith('custom-') ? 0 : 1;
      return aCustom - bCustom;
    });
  }, [etfs, categoryTab, policySubFilter, searchQuery]);

  const addAssetToPortfolio = (etfId: string) => {
    const targetEtf = etfById.get(etfId) ?? etfs.find((e) => e.id === etfId);
    const existing = allocations.find((a) => a.etfId === etfId);

    if (existing && existing.weightPct > 0) {
      setActionNotice(
        `${targetEtf?.ticker ?? etfId} уже находится в вашем портфеле (${existing.weightPct}%).`
      );
      return;
    }

    const nonZero = allocations.filter((a) => a.weightPct > 0 && a.etfId !== etfId);
    if (nonZero.length === 0) {
      onChangeAllocations([{ etfId, weightPct: 100 }]);
      setActionNotice(`Добавлено в портфель: ${targetEtf?.ticker ?? etfId} (100%).`);
      return;
    }

    // Rescale existing assets to ~80% and allocate 20% to the newly added asset
    const nextExisting = nonZero.map((item) => ({
      ...item,
      weightPct: Math.max(5, Math.round((item.weightPct * 0.8) / 5) * 5),
    }));
    const existingSum = nextExisting.reduce((sum, item) => sum + item.weightPct, 0);
    const newWeight = Math.max(5, 100 - existingSum);
    onChangeAllocations([...nextExisting, { etfId, weightPct: newWeight }]);
    setActionNotice(
      `Добавлено в портфель: ${targetEtf?.ticker ?? etfId} (${newWeight}%). Веса пересчитаны до 100%.`
    );
  };

  // Automatically add newly fetched custom ticker into the active portfolio once it lands in `etfs`
  useEffect(() => {
    if (!pendingAutoAddTicker) return;

    const targetUpper = pendingAutoAddTicker.toUpperCase();
    const newlyArrived =
      etfs.find((e) => !knownEtfIdsBeforeFetchRef.current.has(e.id)) ??
      etfs.find(
        (e) =>
          e.ticker.toUpperCase() === targetUpper ||
          e.ticker.toUpperCase().startsWith(`${targetUpper}.`) ||
          e.id === `custom-${targetUpper.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      );

    if (newlyArrived) {
      const alreadyInMix = allocations.some(
        (a) => a.etfId === newlyArrived.id && a.weightPct > 0
      );
      if (!alreadyInMix) {
        const nonZero = allocations.filter((a) => a.weightPct > 0);
        if (nonZero.length === 0) {
          onChangeAllocations([{ etfId: newlyArrived.id, weightPct: 100 }]);
        } else {
          const nextExisting = nonZero.map((item) => ({
            ...item,
            weightPct: Math.max(5, Math.round((item.weightPct * 0.8) / 5) * 5),
          }));
          const existingSum = nextExisting.reduce((sum, item) => sum + item.weightPct, 0);
          const newWeight = Math.max(5, 100 - existingSum);
          onChangeAllocations([...nextExisting, { etfId: newlyArrived.id, weightPct: newWeight }]);
        }
      }
      setActionNotice(
        `Тикер ${newlyArrived.ticker} загружен и добавлен в портфель!`
      );
      setPendingAutoAddTicker(null);
      setCategoryTab('ALL');
      setPolicySubFilter('ALL');
      return;
    }

    if (!isFetchingCustomTicker && customTickerError) {
      setPendingAutoAddTicker(null);
    }
  }, [
    etfs,
    pendingAutoAddTicker,
    isFetchingCustomTicker,
    customTickerError,
    allocations,
    onChangeAllocations,
  ]);

  const handleSelectSingle = (etfId: string) => {
    const targetEtf = etfById.get(etfId);
    onChangeAllocations([{ etfId, weightPct: 100 }]);
    setActionNotice(
      `Выбран 100% фокус на ${targetEtf?.ticker ?? etfId} — все расчёты ниже показывают доходность этого актива.`
    );
  };

  const handleWeightChange = (etfId: string, rawValue: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rawValue)));
    onChangeAllocations(
      allocations.map((item) => (item.etfId === etfId ? { ...item, weightPct: clamped } : item))
    );
  };

  const handleRemoveFromMix = (etfId: string) => {
    if (allocations.length <= 1) return;
    const remaining = allocations.filter((item) => item.etfId !== etfId);
    const sum = remaining.reduce((s, item) => s + Math.max(0, item.weightPct), 0);
    if (sum <= 0) {
      onChangeAllocations(
        remaining.map((item) => ({ ...item, weightPct: Math.round(100 / remaining.length) }))
      );
      return;
    }
    // Re-normalize remaining items to 100% cleanly when user deletes an asset
    const scaled = remaining.map((item) => ({
      ...item,
      weightPct: Math.round((Math.max(0, item.weightPct) / sum) * 100),
    }));
    const diff = 100 - scaled.reduce((s, item) => s + item.weightPct, 0);
    if (diff !== 0 && scaled.length > 0) {
      scaled[0] = { ...scaled[0], weightPct: Math.max(1, scaled[0].weightPct + diff) };
    }
    onChangeAllocations(scaled);
  };

  const handleNormalizeWeights = () => {
    if (allocations.length === 0) return;
    const sum = allocations.reduce((s, item) => s + Math.max(0, item.weightPct), 0);
    if (sum <= 0) {
      const equal = Math.floor(100 / allocations.length);
      const remainder = 100 - equal * allocations.length;
      onChangeAllocations(
        allocations.map((item, idx) => ({
          ...item,
          weightPct: equal + (idx === 0 ? remainder : 0),
        }))
      );
      return;
    }

    const scaled = allocations.map((item) => ({
      ...item,
      weightPct: Math.round((Math.max(0, item.weightPct) / sum) * 100),
    }));
    const diff = 100 - scaled.reduce((s, item) => s + item.weightPct, 0);
    if (diff !== 0 && scaled.length > 0) {
      scaled[0] = { ...scaled[0], weightPct: Math.max(0, scaled[0].weightPct + diff) };
    }
    onChangeAllocations(scaled);
  };

  const handleEqualizeWeights = () => {
    if (allocations.length === 0) return;
    const base = Math.floor(100 / allocations.length);
    const rem = 100 - base * allocations.length;
    onChangeAllocations(
      allocations.map((item, idx) => ({
        ...item,
        weightPct: base + (idx === 0 ? rem : 0),
      }))
    );
  };

  const handleSwitchToTwin = (etf: ETFInstrument) => {
    if (!etf.pairedEtfId || !etfById.has(etf.pairedEtfId)) return;
    const twinId = etf.pairedEtfId;

    if (!allocationById.has(etf.id)) {
      onChangeAllocations([{ etfId: twinId, weightPct: 100 }]);
      return;
    }

    const merged = new Map<string, number>();
    for (const item of allocations) {
      const targetId = item.etfId === etf.id ? twinId : item.etfId;
      merged.set(targetId, (merged.get(targetId) ?? 0) + item.weightPct);
    }
    onChangeAllocations(
      Array.from(merged.entries()).map(([id, weightPct]) => ({ etfId: id, weightPct }))
    );
  };

  const executeTickerLookupAndAdd = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setLocalLookupError(
        'Введите тикер или название компании (например: NVDA, AAPL, AMD, NFLX, CSPX.L, EDP.LS).'
      );
      return;
    }

    setLocalLookupError(null);
    setActionNotice(null);

    const resolvedTicker = resolveTickerQuery(trimmed);

    // Check if the ticker already exists in the current catalog
    const existingExact = etfs.find((e) => {
      const upper = resolvedTicker.toUpperCase();
      const base = e.ticker.toUpperCase().split('.')[0];
      return (
        e.ticker.toUpperCase() === upper ||
        base === upper ||
        e.altTickers.some((alt) => alt.toUpperCase() === upper)
      );
    });

    if (existingExact) {
      addAssetToPortfolio(existingExact.id);
      setSearchQuery('');
      return;
    }

    // Fetch live from Yahoo / multi-gateway service and auto-add once it arrives in `etfs`
    knownEtfIdsBeforeFetchRef.current = new Set(etfs.map((e) => e.id));
    setPendingAutoAddTicker(resolvedTicker);

    try {
      await onAddCustomTicker(resolvedTicker);
      setSearchQuery('');
    } catch (err) {
      setPendingAutoAddTicker(null);
      setLocalLookupError(
        err instanceof Error
          ? err.message
          : `Не удалось загрузить данные по тикеру "${resolvedTicker}".`
      );
    }
  };

  const handleLookupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await executeTickerQuerySafe();
  };

  const executeTickerQuerySafe = async () => {
    await executeTickerLookupAndAdd(searchQuery);
  };

  const toggleNotes = (etfId: string) => {
    setExpandedNotesById((prev) => ({ ...prev, [etfId]: !prev[etfId] }));
  };

  const combinedLookupError = customTickerError ?? localLookupError;

  const categoryTabs: Array<{ id: CategoryTab; label: string; shortCount: number }> = [
    { id: 'ALL', label: `Все активы (${categoryCounts.ALL})`, shortCount: categoryCounts.ALL },
    {
      id: 'Global ETFs',
      label: '🌍 Мировые ETF',
      shortCount: categoryCounts['Global ETFs'],
    },
    {
      id: 'US ETFs',
      label: '🇺🇸 ETF США (S&P 500 / Nasdaq)',
      shortCount: categoryCounts['US ETFs'],
    },
    {
      id: 'Europe & Bond ETFs',
      label: '🇪🇺 ETF Европы и Облигации',
      shortCount: categoryCounts['Europe & Bond ETFs'],
    },
    {
      id: 'US Stocks',
      label: '💻 Топ-12 Акций США (NVDA, AAPL, MSFT, GOOGL, META...)',
      shortCount: categoryCounts['US Stocks'],
    },
    {
      id: 'Europe Stocks',
      label: '🏰 Топ-8 Акций Европы (ASML, Novo, SAP, LVMH, EDP.LS...)',
      shortCount: categoryCounts['Europe Stocks'],
    },
  ];

  // Shared surface class helpers for crisp Light & Dark readability
  const cardSurface = isLight
    ? 'border border-slate-200 bg-white shadow-sm'
    : 'fintech-card';
  const subSurface = isLight
    ? 'border border-slate-200 bg-slate-50/90'
    : 'border border-slate-800 bg-slate-900/70';

  const trimmedQuery = searchQuery.trim();

  return (
    <div className="space-y-6">
      {/* ===================================================================
          1. TOP STRIP: "Ваш текущий портфель (На чём считается доходность)"
      =================================================================== */}
      <div className={`${cardSurface} rounded-2xl p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 border-slate-200/80 dark:border-slate-800/90"
          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isLight
                  ? 'bg-[#2d8a61]/12 text-[#2d8a61]'
                  : 'bg-[#3b9b72]/15 text-[#6ec9a0]'
              }`}
            >
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h4
                className={`text-sm font-bold sm:text-base ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                Ваш текущий портфель (На чём считается доходность)
              </h4>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Все расчёты 3Y/5Y дохода, налогов и прогноза ниже строятся строго по этим активам и
                их долям.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allocations.length > 1 && (
              <button
                type="button"
                onClick={handleEqualizeWeights}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                Поровну
              </button>
            )}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                Math.abs(totalWeightPct - 100) < 0.01
                  ? isLight
                    ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                    : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                  : isLight
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              }`}
            >
              Сумма долей: {totalWeightPct}%
            </span>
            {Math.abs(totalWeightPct - 100) >= 0.01 && (
              <button
                type="button"
                onClick={handleNormalizeWeights}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isLight
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                Выровнять до 100%
              </button>
            )}
          </div>
        </div>

        {/* Visual Stacked Allocation Bar */}
        <div
          className={`mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full ${
            isLight ? 'bg-slate-200' : 'bg-slate-800'
          }`}
        >
          {allocations.map((item, idx) => {
            const widthPct =
              totalWeightPct > 0 ? (Math.max(0, item.weightPct) / totalWeightPct) * 100 : 0;
            return (
              <div
                key={item.etfId}
                style={{ width: `${widthPct}%` }}
                className={`${SLICE_COLORS[idx % SLICE_COLORS.length]} transition-all duration-300`}
                title={`${etfById.get(item.etfId)?.ticker ?? item.etfId}: ${item.weightPct}%`}
              />
            );
          })}
        </div>

        {/* Selected Asset Cards Strip */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {allocations.map((item, idx) => {
            const etf = etfById.get(item.etfId);
            if (!etf) return null;

            const quote = quotesByEtfId[etf.id];
            const fallbackLast = etf.baselineHistory5Y[etf.baselineHistory5Y.length - 1];
            const displayPrice = quote?.currentPrice ?? fallbackLast?.close ?? 0;
            const displayCurrency = quote?.currency ?? etf.currency;
            const dayChangePct = quote?.dayChangePct ?? 0;
            const instType = getInstrumentType(etf);
            const normalizedShare =
              totalWeightPct > 0 ? (Math.max(0, item.weightPct) / totalWeightPct) * 100 : 0;

            return (
              <div
                key={item.etfId}
                className={`${subSurface} flex flex-col justify-between gap-3 rounded-xl p-3.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          SLICE_COLORS[idx % SLICE_COLORS.length]
                        }`}
                      />
                      <span
                        className={`font-mono text-sm font-bold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {etf.ticker}
                      </span>
                      {instType === 'Stock' ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isLight
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          <Building2 className="h-2.5 w-2.5" />
                          Акция / Stock
                        </span>
                      ) : (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            etf.distributionPolicy === 'Acc'
                              ? isLight
                                ? 'bg-[#2d8a61]/15 text-[#1f6e4b]'
                                : 'bg-[#2d8a61]/25 text-[#86d6b0]'
                              : isLight
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          UCITS ETF · {etf.distributionPolicy}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 truncate text-xs font-medium ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {etf.shortName || etf.name}
                    </p>
                  </div>

                  {/* Live Price & Remove Button */}
                  <div className="flex shrink-0 items-start gap-2">
                    <div className="text-right">
                      <div
                        className={`font-mono text-xs font-bold tabular-nums ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {formatCurrencyPrice(displayPrice, displayCurrency)}
                      </div>
                      <div
                        className={`font-mono text-[10px] font-semibold tabular-nums ${
                          dayChangePct >= 0
                            ? isLight
                              ? 'text-[#2d8a61]'
                              : 'text-[#6ec9a0]'
                            : isLight
                              ? 'text-rose-600'
                              : 'text-rose-400'
                        }`}
                      >
                        {dayChangePct >= 0 ? '+' : ''}
                        {dayChangePct.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromMix(item.etfId)}
                      disabled={allocations.length <= 1}
                      title={
                        allocations.length <= 1
                          ? 'В портфеле должен оставаться минимум 1 актив'
                          : `Удалить ${etf.ticker} из портфеля`
                      }
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isLight
                          ? 'border-slate-300 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                          : 'border-slate-700 bg-slate-950/70 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300'
                      }`}
                    >
                      <X className="h-3 w-3" />
                      Удалить
                    </button>
                  </div>
                </div>

                {/* Weight Slider & Numeric Input */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min={allocations.length > 1 ? 1 : 100}
                    max={100}
                    step={5}
                    value={item.weightPct}
                    onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                    aria-label={`Weight percentage for ${etf.ticker}`}
                    className={`h-1.5 flex-1 cursor-pointer ${
                      isLight ? 'accent-[#2d8a61]' : 'accent-[#3b9b72]'
                    }`}
                  />
                  <div
                    className={`flex items-center rounded-lg border px-2 py-1 ${
                      isLight
                        ? 'border-slate-300 bg-white'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.weightPct}
                      onChange={(e) => handleWeightChange(item.etfId, Number(e.target.value))}
                      aria-label={`Numeric weight percentage for ${etf.ticker}`}
                      className={`w-10 bg-transparent text-right font-mono text-xs font-semibold tabular-nums focus:outline-none ${
                        isLight ? 'text-slate-900' : 'text-slate-100'
                      }`}
                    />
                    <span className={`ml-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      %
                    </span>
                  </div>
                  {Math.abs(totalWeightPct - 100) >= 0.01 && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isLight ? 'text-amber-700' : 'text-amber-300'
                      }`}
                    >
                      ({normalizedShare.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================================================
            2. QUICK PORTFOLIO PRESET BUTTONS (6 PRESETS)
        ================================================================= */}
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.9)' }}
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${isLight ? 'text-[#2d8a61]' : 'text-[#6ec9a0]'}`} />
              Готовые портфели в 1 клик (ETF и Топ Акции)
            </div>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Мгновенно обновляет расчёт доходности 3Y/5Y и налогов
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {resolvedPresets.map((preset) => {
              const active = isPresetMatch(preset.items, allocations);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onChangeAllocations(preset.items);
                    setActionNotice(`Выбран пресет: ${preset.label}`);
                  }}
                  className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                    active
                      ? isLight
                        ? 'border-[#2d8a61] bg-[#2d8a61]/10 shadow-sm'
                        : 'border-[#3b9b72] bg-[#2d8a61]/15 shadow-lg shadow-black/20'
                      : isLight
                        ? 'border-slate-200 bg-slate-50/80 hover:border-[#2d8a61]/60 hover:bg-white'
                        : 'border-slate-700/70 bg-slate-900/60 hover:border-[#3b9b72]/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-semibold leading-snug ${
                        active
                          ? isLight
                            ? 'text-[#1f6e4b]'
                            : 'text-[#86d6b0]'
                          : isLight
                            ? 'text-slate-900 group-hover:text-[#1f6e4b]'
                            : 'text-slate-100 group-hover:text-[#86d6b0]'
                      }`}
                    >
                      {preset.label}
                    </span>
                    {active && (
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isLight
                            ? 'bg-[#2d8a61] text-white'
                            : 'bg-[#3b9b72] text-slate-950'
                        }`}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[11px] leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          3. CATEGORY BROWSER TABS & UNIFIED INSTANT SEARCH / TICKER LOOKUP
      =================================================================== */}
      <div className={`${cardSurface} rounded-2xl p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-[#2d8a61]' : 'text-[#7fd4ad]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Выбрать или добавить ETF / Акции в портфель
            </div>
            <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Ищите в каталоге (UCITS ETF + Топ-20 акций США и Европы) или загрузите любой
              биржевой тикер (например, <code className="font-mono font-semibold">AMD</code>,{' '}
              <code className="font-mono font-semibold">NFLX</code>,{' '}
              <code className="font-mono font-semibold">CSPX.L</code>) напрямую.
            </p>
          </div>

          {/* Quick Acc / Dist / Stock filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Все' },
                { id: 'Acc', label: 'ETF Acc' },
                { id: 'Dist', label: 'ETF Dist' },
                { id: 'Stock', label: 'Акции' },
                { id: 'Custom', label: 'Добавленные' },
              ] as const
            ).map((sub) => {
              const active = policySubFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setPolicySubFilter(sub.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? isLight
                        ? 'bg-[#2d8a61] text-white'
                        : 'bg-[#3b9b72] text-slate-950'
                      : isLight
                        ? 'border border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300'
                        : 'border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unified Search & Any-Ticker Bar */}
        <form onSubmit={handleLookupSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (localLookupError) setLocalLookupError(null);
              }}
              placeholder="Поиск: NVDA, NVIDIA, Apple, Facebook, META, Google, S&P, Portugal, AMD, NFLX..."
              aria-label="Поиск ETF или акций и добавление тикера с биржи"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-9 text-sm focus:outline-none ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#2d8a61]'
                  : 'border-slate-700 bg-slate-950/90 text-slate-100 placeholder:text-slate-500 focus:border-[#3b9b72]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 ${
                  isLight
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isFetchingCustomTicker || !trimmedQuery}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${
              isLight
                ? 'bg-[#2d8a61] text-white hover:bg-[#236f4d]'
                : 'bg-[#3b9b72] text-slate-950 hover:bg-[#4eb386]'
            }`}
          >
            {isFetchingCustomTicker ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Загружаем «{trimmedQuery.toUpperCase()}»...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {trimmedQuery
                  ? `Найти и добавить тикер «${trimmedQuery}» с биржи`
                  : 'Найти и добавить тикер с биржи'}
              </>
            )}
          </button>
        </form>

        {/* Quick-Lookup Ticker Chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Быстро найти и добавить:
          </span>
          {QUICK_LOOKUP_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isFetchingCustomTicker}
              onClick={() => {
                void executeTickerLookupAndAdd(example);
              }}
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold transition disabled:opacity-50 ${
                isLight
                  ? 'border-slate-300 bg-slate-50 text-sky-700 hover:border-[#2d8a61] hover:bg-[#2d8a61]/10 hover:text-[#1f6e4b]'
                  : 'border-slate-700/80 bg-slate-900 text-sky-300 hover:border-[#3b9b72]/70 hover:bg-[#2d8a61]/15 hover:text-[#86d6b0]'
              }`}
            >
              + {example}
            </button>
          ))}
        </div>

        {/* Confirmation or Error Notice */}
        {actionNotice && (
          <div
            className={`mt-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
              isLight
                ? 'border-[#2d8a61]/30 bg-[#2d8a61]/10 text-[#1f6e4b]'
                : 'border-[#3b9b72]/35 bg-[#2d8a61]/15 text-[#86d6b0]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {combinedLookupError && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
              isLight
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            <AlertCircle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            />
            <span>{combinedLookupError}</span>
          </div>
        )}

        {/* Category Browser Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {categoryTabs.map((tab) => {
            const active = categoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? isLight
                      ? 'bg-[#2d8a61] text-white shadow-sm'
                      : 'bg-[#3b9b72] text-slate-950 shadow-sm'
                    : isLight
                      ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      : 'border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id !== 'ALL' && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      active
                        ? isLight
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-950/25 text-slate-950'
                        : isLight
                          ? 'bg-slate-200/80 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.shortCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================
          4. CATALOG ASSET CARDS GRID
      =================================================================== */}
      {filteredEtfs.length === 0 ? (
        <div
          className={`${cardSurface} flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center text-sm ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <p>
            В текущей категории по запросу{' '}
            {trimmedQuery ? `«${trimmedQuery}»` : 'и фильтрам'} активы не найдены.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categoryTab !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setCategoryTab('ALL');
                  setPolicySubFilter('ALL');
                }}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isLight
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                Показать все категории ({etfs.length})
              </button>
            )}
            {trimmedQuery && (
              <button
                type="button"
                disabled={isFetchingCustomTicker}
                onClick={() => {
                  void executeTickerLookupAndAdd(trimmedQuery);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  isLight
                    ? 'bg-[#2d8a61] text-white hover:bg-[#236f4d]'
                    : 'bg-[#3b9b72] text-slate-950 hover:bg-[#4eb386]'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Найти и добавить тикер «{trimmedQuery}» с биржи
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredEtfs.map((etf) => {
            const quote = quotesByEtfId[etf.id];
            const fallbackLast = etf.baselineHistory5Y[etf.baselineHistory5Y.length - 1];
            const fallbackPrev =
              etf.baselineHistory5Y[Math.max(0, etf.baselineHistory5Y.length - 2)];
            const displayPrice = quote?.currentPrice ?? fallbackLast?.close ?? 0;
            const displayCurrency = quote?.currency ?? etf.currency;
            const dayChangePct =
              quote?.dayChangePct ??
              (fallbackPrev && fallbackPrev.close > 0
                ? ((displayPrice - fallbackPrev.close) / fallbackPrev.close) * 100
                : 0);
            const isPositiveDay = dayChangePct >= 0;
            const isLive =
              quote?.source === 'live-yahoo-proxy' || quote?.source === 'live-cors-fallback';

            const activeWeight = allocationById.get(etf.id);
            const isInMix = activeWeight !== undefined && activeWeight > 0;
            const isSelected100 =
              activeAllocations.length === 1 && activeAllocations[0].etfId === etf.id;

            const instType = getInstrumentType(etf);
            const pairedEtf = etf.pairedEtfId ? etfById.get(etf.pairedEtfId) : undefined;
            const links = getEtfExternalLinks(etf.isin, etf.ticker);
            const notesOpen = Boolean(expandedNotesById[etf.id]);

            return (
              <div
                key={etf.id}
                className={`${cardSurface} flex flex-col justify-between rounded-2xl p-4 transition-all sm:p-5 ${
                  isInMix
                    ? isLight
                      ? 'border-[#2d8a61] ring-1 ring-[#2d8a61]/30'
                      : 'border-[#3b9b72]/75 ring-1 ring-[#3b9b72]/30'
                    : isLight
                      ? 'hover:border-slate-300'
                      : 'hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Card Top: Identity + Live Price */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-mono text-base font-bold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {etf.ticker}
                        </span>
                        {instType === 'Stock' ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                              isLight
                                ? 'border-sky-200 bg-sky-50 text-sky-800'
                                : 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                            }`}
                          >
                            <Building2 className="h-3 w-3" />
                            Акция / Stock
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                              etf.distributionPolicy === 'Acc'
                                ? isLight
                                  ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                                  : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                                : isLight
                                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                                  : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            <PieChart className="h-3 w-3" />
                            UCITS ETF · {etf.distributionPolicy}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            isLight
                              ? 'border-slate-200 bg-slate-100 text-slate-700'
                              : 'border-slate-700 bg-slate-800/90 text-slate-300'
                          }`}
                        >
                          {etf.domicile}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            isLight
                              ? 'border-slate-200 bg-white text-slate-500'
                              : 'border-slate-700/70 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {etf.provider}
                        </span>
                        {isInMix && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isLight
                                ? 'bg-[#2d8a61] text-white'
                                : 'bg-[#3b9b72] text-slate-950'
                            }`}
                          >
                            В портфеле · {activeWeight}%
                          </span>
                        )}
                      </div>

                      <h4
                        className={`mt-1.5 text-sm font-semibold leading-snug ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {etf.name}
                      </h4>
                      <p className={`mt-0.5 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {etf.indexTracked}
                      </p>
                    </div>

                    {/* Live Price & Source Box */}
                    <div
                      className={`flex shrink-0 flex-row items-center justify-between gap-3 rounded-xl border px-3 py-2 sm:flex-col sm:items-end sm:gap-1 ${
                        isLight
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-800 bg-slate-950/75'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          title={
                            quote
                              ? `${quote.exchangeName} · Updated ${quote.lastUpdated}`
                              : 'Bundled 5Y historical snapshot'
                          }
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isLive
                              ? isLight
                                ? 'border-[#2d8a61]/35 bg-[#2d8a61]/10 text-[#1f6e4b]'
                                : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                              : isLight
                                ? 'border-slate-300 bg-white text-slate-600'
                                : 'border-slate-600/60 bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLive
                                ? isLight
                                  ? 'animate-pulse bg-[#2d8a61]'
                                  : 'animate-pulse bg-[#5fc497]'
                                : 'bg-slate-400'
                            }`}
                          />
                          {isLive ? 'Live' : 'Snapshot'}
                        </span>
                        <span
                          className={`font-mono text-base font-bold tabular-nums ${
                            isLight ? 'text-slate-900' : 'text-slate-100'
                          }`}
                        >
                          {formatCurrencyPrice(displayPrice, displayCurrency)}
                        </span>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums ${
                          isPositiveDay
                            ? isLight
                              ? 'text-[#2d8a61]'
                              : 'text-[#6ec9a0]'
                            : isLight
                              ? 'text-rose-600'
                              : 'text-rose-400'
                        }`}
                      >
                        {isPositiveDay ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositiveDay ? '+' : ''}
                        {dayChangePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Identifiers & Cost Grid */}
                  <div
                    className={`mt-3 grid grid-cols-2 gap-2 rounded-xl border p-2.5 text-xs sm:grid-cols-4 ${
                      isLight
                        ? 'border-slate-200 bg-slate-50/80'
                        : 'border-slate-800/90 bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <span
                        className={`block text-[10px] uppercase tracking-wider ${
                          isLight ? 'text-slate-500' : 'text-slate-500'
                        }`}
                      >
                        ISIN
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          isLight ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {etf.isin}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        {instType === 'Stock' ? 'Дивиденд (est.)' : 'WKN'}
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          isLight ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {instType === 'Stock'
                          ? `${etf.dividendYieldEst.toFixed(2)}% / год`
                          : etf.wkn}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        {instType === 'Stock' ? 'Комиссия (TER)' : 'TER (Комиссия)'}
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          isLight ? 'text-sky-700' : 'text-sky-300'
                        }`}
                      >
                        {etf.ter.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                        {instType === 'Stock' ? 'Волатильность' : 'Tracking Diff'}
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          instType === 'Stock'
                            ? isLight
                              ? 'text-amber-700'
                              : 'text-amber-300'
                            : etf.trackingDifference <= 0
                              ? isLight
                                ? 'text-[#2d8a61]'
                                : 'text-[#7fd4ad]'
                              : isLight
                                ? 'text-amber-700'
                                : 'text-amber-300'
                        }`}
                      >
                        {instType === 'Stock'
                          ? `±${etf.volatilityAnnualPct.toFixed(1)}%`
                          : `${etf.trackingDifference > 0 ? '+' : ''}${etf.trackingDifference.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls + Twin Compare + External Portals */}
                <div className="mt-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isInMix ? (
                      <button
                        type="button"
                        onClick={() => addAssetToPortfolio(etf.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          isLight
                            ? 'bg-[#2d8a61] text-white hover:bg-[#236f4d]'
                            : 'bg-[#3b9b72] text-slate-950 hover:bg-[#4eb386]'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Добавить в портфель
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                          isLight
                            ? 'border-[#2d8a61]/40 bg-[#2d8a61]/10 text-[#1f6e4b]'
                            : 'border-[#3b9b72]/40 bg-[#2d8a61]/15 text-[#86d6b0]'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        В портфеле ({activeWeight}%)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectSingle(etf.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected100
                          ? isLight
                            ? 'border border-[#2d8a61] bg-[#2d8a61]/15 text-[#1f6e4b]'
                            : 'border border-[#3b9b72] bg-[#3b9b72]/20 text-[#86d6b0]'
                          : isLight
                            ? 'border border-slate-300 bg-white text-slate-700 hover:border-[#2d8a61] hover:text-[#1f6e4b]'
                            : 'border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-[#3b9b72]/60 hover:text-[#86d6b0]'
                      }`}
                    >
                      {isSelected100 ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Выбрано 100%
                        </>
                      ) : (
                        'Выбрать 100% (Только этот актив)'
                      )}
                    </button>

                    {pairedEtf && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToTwin(etf)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          isLight
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400 hover:bg-amber-500/20'
                        }`}
                        title={`Сравнить / переключить на близнеца (${etf.distributionPolicy} ↔ ${pairedEtf.distributionPolicy})`}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Близнец: {pairedEtf.ticker} ({pairedEtf.distributionPolicy})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleNotes(etf.id)}
                      className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        isLight
                          ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Info className="h-3.5 w-3.5" />
                      Детали
                      {notesOpen ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {notesOpen && (
                    <div
                      className={`space-y-1.5 rounded-xl border p-3 text-xs leading-relaxed ${
                        isLight
                          ? 'border-slate-200 bg-slate-50 text-slate-700'
                          : 'border-slate-800 bg-slate-950/80 text-slate-300'
                      }`}
                    >
                      <div
                        className={`flex flex-wrap gap-3 text-[11px] ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <span>Репликация: {etf.replication}</span>
                        <span>·</span>
                        <span>Размер: €{etf.fundSizeBillionsEur.toFixed(1)}B</span>
                        <span>·</span>
                        <span>Позиций: {etf.holdingsCount.toLocaleString()}</span>
                        <span>·</span>
                        <span>PRIIPs Риск: {etf.riskRatingPriips}/7</span>
                      </div>
                      <p>
                        <span
                          className={`font-semibold ${
                            isLight ? 'text-[#1f6e4b]' : 'text-[#86d6b0]'
                          }`}
                        >
                          Почему в каталоге:{' '}
                        </span>
                        {etf.whyCarefulChoice}
                      </p>
                      <p>
                        <span
                          className={`font-semibold ${
                            isLight ? 'text-sky-700' : 'text-sky-300'
                          }`}
                        >
                          Налоги:{' '}
                        </span>
                        {etf.taxEfficiencyNotes}
                      </p>
                    </div>
                  )}

                  {/* External Deep Links */}
                  <div
                    className={`flex flex-wrap items-center gap-1.5 border-t pt-2.5 ${
                      isLight ? 'border-slate-200/80' : 'border-slate-800/80'
                    }`}
                  >
                    <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <Globe2 className="h-3 w-3" />
                      Проверить ISIN:
                    </span>
                    {(instType === 'Stock'
                      ? [
                          { label: 'Yahoo Finance', href: links.yahooFinance },
                          { label: 'extraETF', href: links.extraEtf },
                        ]
                      : [
                          { label: 'justETF', href: links.justEtf },
                          { label: 'extraETF', href: links.extraEtf },
                          { label: 'Finanzfluss', href: links.finanzfluss },
                          { label: 'OeKB', href: links.oekb },
                          { label: 'Yahoo', href: links.yahooFinance },
                        ]
                    ).map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
                          isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:text-sky-700'
                            : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-sky-500/50 hover:text-sky-300'
                        }`}
                      >
                        {link.label}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
