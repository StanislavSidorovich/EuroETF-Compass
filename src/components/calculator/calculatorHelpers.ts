import { tr } from '../../utils/i18n';
import type { CountryTaxRule, ETFInstrument, LanguageMode } from '../../types';

export const BUDGET_PRESETS_EUR = [1000, 5000, 10000, 25000, 50000];
export const MONTHLY_PRESETS_EUR = [0, 100, 250, 500, 1000];
export const FEATURED_COUNTRY_CODES = ['PT', 'NL', 'DE'];

export const REGION_LABELS_RU: Record<CountryTaxRule['regionGroup'], string> = {
  'Featured Core': 'Приоритетные (PT / NL / DE)',
  'Western Europe': 'Западная Европа',
  DACH: 'DACH (DE / AT / CH)',
  'Southern Europe': 'Южная Европа',
  'Central & Eastern Europe': 'Центр. и Вост. Европа',
  'Nordics & UK': 'Сев. Европа и UK',
};

export interface CompositionPillItem {
  id: string;
  ticker: string;
  pct: number;
  label: string;
  policy: ETFInstrument['distributionPolicy'];
}

export function formatEur(value: number, decimals = 0): string {
  return `€${value.toLocaleString('en-IE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatEurDetailed(value: number): string {
  return `€${value.toLocaleString('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getVerdictBadgeClasses(
  verdict: CountryTaxRule['verdict'],
  isLight: boolean
): string {
  switch (verdict) {
    case 'ACC_STRONGLY_PREFERRED':
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return 'ui-soft-pill';
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return isLight
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-amber-500/40 bg-amber-500/15 text-amber-200';
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return isLight
        ? 'border-sky-300 bg-sky-50 text-sky-800'
        : 'border-sky-500/40 bg-sky-500/15 text-sky-200';
  }
}

export function getLocalizedVerdictTitle(country: CountryTaxRule, lang: LanguageMode): string {
  if (lang === 'en') return country.verdictTitle;
  switch (country.verdict) {
    case 'ACC_PREFERRED_WITH_HOLDING_DISCOUNT':
      return 'Acc ETF имеет двойное преимущество: отсрочка + скидка до 30% за срок владения';
    case 'ACC_STRONGLY_PREFERRED':
      return 'Acc ETF намного выгоднее Dist: полная отсрочка налога на дивиденды';
    case 'DIST_UP_TO_ALLOWANCE_THEN_ACC':
      return 'Dist в пределах годовой льготы, далее Acc выгоднее и проще';
    case 'ACC_PREFERRED_WITH_REPORTING_CHECK':
      return 'Acc выгоднее, но важен статус отчётности фонда (Meldefonds / ERI)';
    case 'NEUTRAL_WEALTH_TAX_ACC_CONVENIENT':
      return 'Налог на капитал одинаковый — Acc удобнее за счёт авто-реинвестирования';
  }
}

export function getAssetShortCategoryLabel(etf: ETFInstrument, lang: LanguageMode): string {
  const isStock =
    etf.instrumentType === 'Stock' ||
    etf.assetClass === 'Individual Stock (US)' ||
    etf.assetClass === 'Individual Stock (Europe)' ||
    etf.provider === 'US Corporation (NASDAQ/NYSE)' ||
    etf.provider === 'European Corporation';

  if (isStock) {
    const clean = (etf.shortName || etf.name).replace(/\s*\([^)]*\)\s*$/g, '').trim();
    return clean || etf.ticker;
  }

  switch (etf.assetClass) {
    case 'Global Equities':
    case 'Developed World Equities':
      return tr(lang, 'Global ETF', 'Мировой ETF');
    case 'US Equities':
      return tr(lang, 'US ETF (S&P 500)', 'ETF США (S&P 500)');
    case 'Tech / Nasdaq Equities':
      return tr(lang, 'Nasdaq-100 ETF', 'ETF Nasdaq-100');
    case 'Emerging Markets':
      return tr(lang, 'EM ETF', 'ETF EM');
    case 'European Equities':
      return tr(lang, 'Europe ETF', 'Европейский ETF');
    case 'EUR Money Market / Bonds':
      return tr(lang, '€STR Cash ETF', 'Кэш-ETF €STR');
    default:
      return etf.shortName || 'ETF';
  }
}
