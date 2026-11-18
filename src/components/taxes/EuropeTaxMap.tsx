import React, { useMemo, useState } from 'react';
import { Compass, Info, MapPin, ShieldCheck } from 'lucide-react';
import type { CountryTaxRule, LanguageMode, TaxArchetype } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';

interface EuropeTaxMapProps {
  countries: CountryTaxRule[];
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
}

interface MapNodeCoords {
  code: string;
  x: number;
  y: number;
  labelDx?: number;
  labelDy?: number;
  shortTag: string;
  territoryPath: string;
}

/**
 * Geographic SVG coordinates (viewBox 0 0 800 520) for all 15 covered European countries.
 * Each country has both a stylized territory shape and an interactive pin/badge.
 */
const EUROPE_COUNTRY_LAYOUT: MapNodeCoords[] = [
  {
    code: 'PT',
    x: 92,
    y: 410,
    shortTag: '19.6% (>8y)',
    territoryPath: 'M 72 372 L 106 372 L 104 446 L 76 446 Z',
  },
  {
    code: 'ES',
    x: 158,
    y: 405,
    shortTag: '19–28%',
    territoryPath: 'M 108 364 L 214 358 L 222 418 L 160 454 L 106 446 Z',
  },
  {
    code: 'FR',
    x: 245,
    y: 302,
    shortTag: '30% / PEA',
    territoryPath: 'M 185 266 L 288 250 L 306 320 L 270 358 L 198 354 Z',
  },
  {
    code: 'IE',
    x: 120,
    y: 196,
    shortTag: '41% (8y)',
    territoryPath: 'M 94 176 L 138 170 L 142 222 L 98 228 Z',
  },
  {
    code: 'GB',
    x: 190,
    y: 196,
    shortTag: '0% ISA',
    territoryPath: 'M 164 132 L 210 132 L 224 228 L 162 238 L 154 190 Z',
  },
  {
    code: 'BE',
    x: 274,
    y: 238,
    shortTag: '0% CGT',
    territoryPath: 'M 252 224 L 296 222 L 298 254 L 254 256 Z',
  },
  {
    code: 'NL',
    x: 294,
    y: 196,
    shortTag: 'Box 3',
    territoryPath: 'M 268 176 L 318 174 L 316 218 L 268 220 Z',
  },
  {
    code: 'DE',
    x: 374,
    y: 236,
    shortTag: '18.46%',
    territoryPath: 'M 322 182 L 424 180 L 430 278 L 324 282 L 314 230 Z',
  },
  {
    code: 'CH',
    x: 328,
    y: 312,
    shortTag: '0% CGT',
    territoryPath: 'M 302 292 L 356 290 L 356 328 L 304 330 Z',
  },
  {
    code: 'AT',
    x: 428,
    y: 306,
    shortTag: '27.5%',
    territoryPath: 'M 372 288 L 474 286 L 474 324 L 372 326 Z',
  },
  {
    code: 'IT',
    x: 392,
    y: 398,
    shortTag: '26%',
    territoryPath: 'M 340 342 L 404 342 L 448 432 L 422 464 L 368 416 Z',
  },
  {
    code: 'CZ',
    x: 454,
    y: 254,
    shortTag: '0% (>3y)',
    territoryPath: 'M 426 236 L 486 238 L 484 274 L 426 274 Z',
  },
  {
    code: 'PL',
    x: 526,
    y: 204,
    shortTag: '19%',
    territoryPath: 'M 464 166 L 584 164 L 588 236 L 468 238 Z',
  },
  {
    code: 'RO',
    x: 616,
    y: 332,
    shortTag: '1% / 3%',
    territoryPath: 'M 556 296 L 672 296 L 668 368 L 560 366 Z',
  },
  {
    code: 'SE',
    x: 454,
    y: 94,
    shortTag: '~1% ISK',
    territoryPath: 'M 420 34 L 494 34 L 482 146 L 422 142 Z',
  },
];

function getRegimeColors(archetype: TaxArchetype, lang: LanguageMode): {
  fill: string;
  fillSelected: string;
  stroke: string;
  badgeBg: string;
  badgeText: string;
  label: string;
  dotColor: string;
} {
  switch (archetype) {
    case 'PURE_DEFERRAL_ACC_WINS':
      return {
        fill: 'rgba(45, 138, 97, 0.28)',
        fillSelected: 'rgba(45, 138, 97, 0.62)',
        stroke: '#3b9b72',
        badgeBg: 'border-emerald-500/40 bg-emerald-500/15',
        badgeText: 'ui-text-sage',
        label: tr(
          lang,
          'Tax Deferral: Acc ETFs Win',
          'Отложенный налог: Acc ETF лидируют'
        ),
        dotColor: '#2d8a61',
      };
    case 'IMPUTED_ANNUAL_TAX_HYBRID':
      return {
        fill: 'rgba(90, 119, 144, 0.24)',
        fillSelected: 'rgba(72, 97, 120, 0.56)',
        stroke: '#5a7790',
        badgeBg: 'border-cyan-500/40 bg-cyan-500/15',
        badgeText: 'ui-text-cool',
        label: tr(
          lang,
          'Annual Imputed / Hybrid (DE, AT, CH, GB)',
          'Ежегодный учёт / гибрид (DE, AT, CH, GB)'
        ),
        dotColor: '#486178',
      };
    case 'WEALTH_OR_DEEMED_DISPOSAL':
      return {
        fill: 'rgba(179, 137, 58, 0.24)',
        fillSelected: 'rgba(179, 137, 58, 0.54)',
        stroke: '#b3893a',
        badgeBg: 'border-amber-500/40 bg-amber-500/15',
        badgeText: 'ui-text-sand',
        label: tr(
          lang,
          'Wealth Tax / 8-Yr Deemed Disposal (NL, IE, SE)',
          'Налог на капитал / 8-летний цикл (NL, IE, SE)'
        ),
        dotColor: '#b3893a',
      };
  }
}

export const EuropeTaxMap: React.FC<EuropeTaxMapProps> = ({
  countries,
  selectedCountryCode,
  onSelectCountry,
}) => {
  const { lang } = useAppPreferences();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const countryByCode = useMemo(() => {
    const map = new Map<string, CountryTaxRule>();
    for (const c of countries) {
      map.set(c.code, c);
    }
    return map;
  }, [countries]);

  const inspectedCode = hoveredCode ?? selectedCountryCode;
  const inspectedCountry =
    countryByCode.get(inspectedCode) ??
    countryByCode.get(selectedCountryCode) ??
    countries[0];

  const inspectedColors = getRegimeColors(inspectedCountry.archetype, lang);

  return (
    <section
      aria-label={tr(lang, 'Interactive European ETF Tax Map', 'Интерактивная карта налоговых режимов ETF в Европе')}
      className="fintech-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 ui-text-sage" />
            <h2 className="text-lg font-bold ui-text-primary">
              {tr(
                lang,
                `Interactive European ETF Tax Map (${countries.length} Countries)`,
                `Интерактивная карта налоговых режимов ETF в Европе (${countries.length} стран)`
              )}
            </h2>
          </div>
          <p className="mt-1 text-xs ui-text-muted">
            {tr(
              lang,
              'Hover or click any country on the map to inspect its effective UCITS ETF tax rate and switch the entire calculator to that jurisdiction.',
              'Наведите или нажмите на любую страну на карте, чтобы посмотреть эффективную ставку налога на UCITS ETF и переключить весь калькулятор на эту юрисдикцию.'
            )}
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 font-semibold ui-text-sage">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2d8a61]" />
            {tr(lang, 'Tax Deferral (Acc wins)', 'Отложенный налог (Acc wins)')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 font-semibold ui-text-cool">
            <span className="h-2.5 w-2.5 rounded-full bg-[#486178]" />
            {tr(lang, 'Annual Tax / ISA', 'Годовой расчёт / ISA')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 font-semibold ui-text-sand">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b3893a]" />
            Box 3 / ISK / 8-Yr Deemed
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* SVG Continental Canvas */}
        <div className="relative overflow-hidden rounded-2xl border ui-border-subtle ui-surface-deep p-3 lg:col-span-8">
          <svg
            viewBox="0 0 800 520"
            role="img"
            aria-label="Stylized map of Europe colored by ETF tax regime"
            className="h-auto w-full select-none"
          >
            <defs>
              <radialGradient id="europeOceanGlow" cx="45%" cy="48%" r="65%">
                <stop offset="0%" stopColor="rgba(90, 119, 144, 0.11)" />
                <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
              </radialGradient>
            </defs>

            {/* Ocean backdrop & subtle lat/long grid */}
            <rect width="800" height="520" rx="16" fill="url(#europeOceanGlow)" />
            {[100, 200, 300, 400].map((yLine) => (
              <line
                key={`lat-${yLine}`}
                x1="20"
                y1={yLine}
                x2="780"
                y2={yLine}
                stroke="rgba(148,163,184,0.12)"
                strokeDasharray="4 6"
              />
            ))}
            {[160, 320, 480, 640].map((xLine) => (
              <line
                key={`lon-${xLine}`}
                x1={xLine}
                y1="20"
                x2={xLine}
                y2="500"
                stroke="rgba(148,163,184,0.12)"
                strokeDasharray="4 6"
              />
            ))}

            {/* Stylized Continental Mass Silhouette (Background Context) */}
            <g opacity="0.22" fill="rgba(148, 163, 184, 0.35)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.2">
              {/* Scandinavia & Nordics context */}
              <path d="M 385 125 L 408 46 L 456 22 L 516 30 L 538 92 L 500 144 L 430 152 Z" />
              {/* Non-covered Eastern / Balkan context */}
              <path d="M 590 164 L 728 174 L 748 330 L 668 415 L 555 430 L 490 365 L 478 278 Z" />
              {/* Sicily & Mediterranean islands */}
              <path d="M 405 470 L 434 468 L 426 488 L 402 484 Z" />
              <path d="M 244 416 L 262 414 L 258 430 L 242 428 Z" />
            </g>

            {/* Sea Labels */}
            <text x="52" y="128" fill="var(--ui-chart-text-muted)" opacity="0.6" fontSize="10" fontWeight="600" letterSpacing="0.14em">
              ATLANTIC OCEAN
            </text>
            <text x="242" y="484" fill="var(--ui-chart-text-muted)" opacity="0.6" fontSize="10" fontWeight="600" letterSpacing="0.14em">
              MEDITERRANEAN SEA
            </text>
            <text x="275" y="135" fill="var(--ui-chart-text-muted)" opacity="0.55" fontSize="9" fontWeight="600" letterSpacing="0.12em">
              NORTH SEA
            </text>

            {/* Interactive Country Territories & Nodes */}
            {EUROPE_COUNTRY_LAYOUT.map((node) => {
              const country = countryByCode.get(node.code);
              if (!country) return null;

              const isSelected = country.code === selectedCountryCode;
              const isHovered = country.code === hoveredCode;
              const colors = getRegimeColors(country.archetype, lang);

              return (
                <g
                  key={node.code}
                  role="button"
                  tabIndex={0}
                  aria-label={`${country.name} (${country.code}): effective ETF tax ${country.effectiveEquityEtfTaxRatePct}%`}
                  onClick={() => onSelectCountry(country.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectCountry(country.code);
                    }
                  }}
                  onMouseEnter={() => setHoveredCode(country.code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  className="cursor-pointer outline-none"
                >
                  {/* Stylized Territory Polygon */}
                  <path
                    d={node.territoryPath}
                    fill={isSelected || isHovered ? colors.fillSelected : colors.fill}
                    stroke={isSelected ? 'var(--ui-chart-text-primary)' : colors.stroke}
                    strokeWidth={isSelected ? 2.4 : isHovered ? 2 : 1.25}
                    strokeLinejoin="round"
                    style={{ transition: 'all 180ms ease' }}
                  />

                  {/* Interactive Pill Marker */}
                  <g transform={`translate(${node.x}, ${node.y})`}>
                    {isSelected && (
                      <circle
                        r="21"
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.85"
                      />
                    )}
                    <rect
                      x="-26"
                      y="-14"
                      width="52"
                      height="28"
                      rx="8"
                      fill={isSelected ? colors.dotColor : 'rgba(15, 23, 42, 0.88)'}
                      stroke={isSelected ? '#ffffff' : colors.stroke}
                      strokeWidth={isSelected || isHovered ? 1.8 : 1.1}
                    />
                    <text
                      x="0"
                      y="-1"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="800"
                    >
                      {country.flag} {country.code}
                    </text>
                    <text
                      x="0"
                      y="10"
                      textAnchor="middle"
                      fill={isSelected ? '#f8fafc' : '#cbd5e1'}
                      fontSize="8"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      {node.shortTag}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Hover / Selected Country Inspector Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border ui-border-subtle ui-surface-deep p-4 lg:col-span-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ui-text-muted">
                <Compass className="h-3.5 w-3.5 ui-text-sage" />
                {hoveredCode
                  ? tr(lang, 'Country Preview', 'Предпросмотр страны')
                  : tr(lang, 'Selected Jurisdiction', 'Выбранная юрисдикция')}
              </span>
              {inspectedCountry.code === selectedCountryCode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold ui-text-sage">
                  <ShieldCheck className="h-3 w-3" /> {tr(lang, 'Active', 'Активна')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-4xl">{inspectedCountry.flag}</span>
              <div>
                <h3 className="text-lg font-extrabold ui-text-primary">
                  {inspectedCountry.name} ({inspectedCountry.code})
                </h3>
                <p className="text-xs ui-text-muted">{inspectedCountry.regionGroup}</p>
              </div>
            </div>

            <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${inspectedColors.badgeBg} ${inspectedColors.badgeText}`}>
              {inspectedColors.label}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
                <span className="text-[11px] ui-text-muted">
                  {tr(lang, 'Effective ETF Rate', 'Эфф. ставка ETF')}
                </span>
                <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums ui-text-sage">
                  {inspectedCountry.effectiveEquityEtfTaxRatePct}%
                </p>
              </div>
              <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
                <span className="text-[11px] ui-text-muted">
                  {tr(lang, 'Dividend Tax', 'Налог на дивиденды')}
                </span>
                <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums ui-text-sand">
                  {inspectedCountry.dividendTaxRatePct}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
              <p className="text-xs font-bold ui-text-primary">{inspectedCountry.verdictTitle}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed ui-text-body">
                {inspectedCountry.verdictSummary}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t ui-border-subtle pt-3">
            <div className="flex items-start gap-2 text-[11px] ui-text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 ui-text-cool" />
              <span>
                {tr(lang, 'Tax Form:', 'Декларация:')}{' '}
                <strong className="ui-text-secondary">{inspectedCountry.taxDeclarationForm}</strong>
              </span>
            </div>
            {inspectedCountry.code !== selectedCountryCode && (
              <button
                type="button"
                onClick={() => onSelectCountry(inspectedCountry.code)}
                className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
              >
                {tr(lang, 'Select', 'Выбрать')} {inspectedCountry.flag} {inspectedCountry.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
