import React, { useMemo, useState } from 'react';
import {
  Compass,
  ExternalLink,
  Filter,
  Globe2,
  Link2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { ETFInstrument, EuropeanPortalResource } from '../../types';
import { EUROPEAN_PORTALS, getEtfExternalLinks } from '../../data/europeanPortals';
import { MarketNewsFeed } from './MarketNewsFeed';

interface EuropeanPortalsHubProps {
  etfs: ETFInstrument[];
  selectedCountryCode: string;
}

type PortalCategoryFilter = 'All' | EuropeanPortalResource['category'];

const PORTAL_CATEGORIES: PortalCategoryFilter[] = [
  'All',
  'ETF Screener & Analytics',
  'Broker Comparison',
  'Tax & Legal Calculator',
  'Country Official Registry',
];

export const EuropeanPortalsHub: React.FC<EuropeanPortalsHubProps> = ({
  etfs,
  selectedCountryCode,
}) => {
  const [selectedEtfId, setSelectedEtfId] = useState<string>(etfs[0]?.id ?? 'vwce');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customIsin, setCustomIsin] = useState('IE00BK5BQT80');
  const [customTicker, setCustomTicker] = useState('VWCE.DE');

  const [categoryFilter, setCategoryFilter] = useState<PortalCategoryFilter>('All');
  const [onlyMyCountry, setOnlyMyCountry] = useState(false);

  const activeEtf = useMemo(
    () => etfs.find((e) => e.id === selectedEtfId) ?? etfs[0],
    [etfs, selectedEtfId]
  );

  const effectiveIsin = useCustomInput ? customIsin.trim() : activeEtf?.isin ?? 'IE00BK5BQT80';
  const effectiveTicker = useCustomInput ? customTicker.trim() : activeEtf?.ticker ?? 'VWCE.DE';

  const deepLinks = useMemo(
    () => getEtfExternalLinks(effectiveIsin, effectiveTicker),
    [effectiveIsin, effectiveTicker]
  );

  const trackingDiffUrl =
    effectiveIsin && effectiveIsin !== 'Custom Lookup'
      ? `https://www.trackingdifferences.com/ETF/ISIN/${encodeURIComponent(effectiveIsin)}`
      : 'https://www.trackingdifferences.com/';

  const filteredPortals = useMemo(() => {
    return EUROPEAN_PORTALS.filter((portal) => {
      const catMatch = categoryFilter === 'All' || portal.category === categoryFilter;
      const countryMatch =
        !onlyMyCountry || portal.supportedCountries.includes(selectedCountryCode);
      return catMatch && countryMatch;
    });
  }, [categoryFilter, onlyMyCountry, selectedCountryCode]);

  const launchCards = [
    {
      name: 'justETF.com',
      subtitle: 'ISIN Profile, KID & Domicile',
      url: deepLinks.justEtf,
      badge: 'Screener #1',
    },
    {
      name: 'extraETF.com',
      subtitle: 'DACH Taxes & Holdings',
      url: deepLinks.extraEtf,
      badge: 'Analytics',
    },
    {
      name: 'Finanzfluss.de',
      subtitle: 'Informer & Fee Check',
      url: deepLinks.finanzfluss,
      badge: 'DACH / EU',
    },
    {
      name: 'Curvo.eu',
      subtitle: 'EU Backtest & Country Guides',
      url: deepLinks.curvo,
      badge: 'EU Taxes',
    },
    {
      name: 'OeKB Profitweb',
      subtitle: 'Meldefonds Status (my.oekb.at)',
      url: deepLinks.oekb,
      badge: 'Austria Tax',
    },
    {
      name: 'Yahoo Finance',
      subtitle: 'Live Quote & Orderbook',
      url: deepLinks.yahooFinance,
      badge: 'Market Data',
    },
    {
      name: 'TrackingDifferences',
      subtitle: 'Real TD vs Headline TER',
      url: trackingDiffUrl,
      badge: 'True Cost',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Direct ISIN & Ticker Deep-Linker */}
      <section className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 ui-text-sage" />
              <h2 className="text-lg font-bold ui-text-primary">
                Direct European ETF &amp; ISIN Deep-Linker
              </h2>
            </div>
            <p className="mt-1 text-xs ui-text-muted">
              Select any curated UCITS ETF or enter a custom ISIN / Ticker to open its live profile
              directly on justETF, extraETF, Finanzfluss, Curvo, OeKB, and Yahoo Finance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setUseCustomInput((prev) => !prev)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              useCustomInput
                ? 'border-cyan-500/60 bg-cyan-500/15 ui-text-cool'
                : 'ui-border-default ui-surface-card ui-text-body hover:border-slate-500'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            {useCustomInput ? 'Switch to Curated ETF List' : 'Enter Custom ISIN / Ticker'}
          </button>
        </div>

        {/* Selector or Custom ISIN Form */}
        {!useCustomInput ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {etfs.map((etf) => {
                const active = etf.id === activeEtf?.id;
                return (
                  <button
                    key={etf.id}
                    type="button"
                    onClick={() => setSelectedEtfId(etf.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/15 ui-text-sage ring-1 ring-emerald-500/35'
                        : 'ui-border-subtle ui-surface-card ui-text-body hover:border-slate-500'
                    }`}
                  >
                    <span className="font-mono">{etf.ticker}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        etf.distributionPolicy === 'Acc'
                          ? 'bg-emerald-500/20 ui-text-sage'
                          : 'bg-amber-500/20 ui-text-sand'
                      }`}
                    >
                      {etf.distributionPolicy}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeEtf && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border ui-border-subtle ui-surface-deep px-4 py-2.5 text-xs">
                <span className="font-semibold ui-text-primary">{activeEtf.name}</span>
                <span className="font-mono ui-text-cool">ISIN: {activeEtf.isin}</span>
                <span className="font-mono ui-text-body">WKN: {activeEtf.wkn}</span>
                <span className="font-mono ui-text-sage">
                  TER: {activeEtf.ter.toFixed(2)}% • {activeEtf.domicile}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="portal-custom-isin"
                className="mb-1 block text-xs font-semibold ui-text-body"
              >
                UCITS ETF ISIN (12 chars, e.g. IE00BK5BQT80)
              </label>
              <input
                id="portal-custom-isin"
                type="text"
                value={customIsin}
                onChange={(e) => setCustomIsin(e.target.value.toUpperCase())}
                placeholder="IE00BK5BQT80"
                className="ui-input w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="portal-custom-ticker"
                className="mb-1 block text-xs font-semibold ui-text-body"
              >
                Yahoo / Exchange Ticker (e.g. VWCE.DE, IWDA.AS)
              </label>
              <input
                id="portal-custom-ticker"
                type="text"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                placeholder="VWCE.DE"
                className="ui-input w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* 1-Click Launch Grid */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {launchCards.map((card) => (
            <a
              key={card.name}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl border ui-border-subtle ui-surface-card p-3 transition hover:border-emerald-500/50 ui-hover-elevated"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold ui-text-primary group-hover:text-emerald-500">
                    {card.name}
                  </span>
                  <span className="rounded ui-surface-elevated px-1.5 py-0.5 text-[10px] font-medium ui-text-cool">
                    {card.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] ui-text-muted">{card.subtitle}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 ui-text-muted transition group-hover:text-emerald-500" />
            </a>
          ))}
        </div>
      </section>

      {/* Filterable European Portals Directory */}
      <section className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 ui-text-cool" />
              <h2 className="text-lg font-bold ui-text-primary">
                European ETF Research, Tax &amp; Official Portal Directory
              </h2>
            </div>
            <p className="mt-1 text-xs ui-text-muted">
              Trusted European ETF screeners, tax calculators, and official government registries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOnlyMyCountry((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              onlyMyCountry
                ? 'border-emerald-400 bg-emerald-500/15 ui-text-sage'
                : 'ui-border-default ui-surface-card ui-text-body hover:border-slate-500'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {onlyMyCountry
              ? `Filtered for ${selectedCountryCode}`
              : `Filter for ${selectedCountryCode} Only`}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PORTAL_CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-600 text-white'
                    : 'border ui-border-subtle ui-surface-card ui-text-body hover:border-slate-500'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Portal Cards Grid */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPortals.map((portal) => {
            const targetUrl =
              portal.buildIsinDeepLink && effectiveIsin && effectiveIsin !== 'Custom Lookup'
                ? portal.buildIsinDeepLink(effectiveIsin, effectiveTicker)
                : portal.baseUrl;

            return (
              <div
                key={portal.id}
                className="flex flex-col justify-between rounded-xl border ui-border-subtle ui-surface-deep p-4 transition hover:border-slate-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold ui-text-cool">
                        {portal.category}
                      </span>
                      <h3 className="mt-1.5 text-sm font-bold ui-text-primary">{portal.name}</h3>
                      <span className="font-mono text-[11px] ui-text-muted">
                        {portal.domain}
                      </span>
                    </div>
                    <Compass className="h-4 w-4 shrink-0 ui-text-subtle" />
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed ui-text-body">
                    {portal.description}
                  </p>

                  <div className="mt-3 rounded-lg border ui-border-subtle ui-surface-card p-2.5 text-[11px] leading-relaxed ui-text-body">
                    <span className="font-semibold ui-text-sage">Why use it: </span>
                    {portal.whyUseIt}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t ui-border-subtle pt-3">
                  <div className="flex items-center gap-1 text-[10px] ui-text-muted">
                    <ShieldCheck className="h-3.5 w-3.5 ui-text-sage" />
                    <span>
                      {portal.supportedCountries.length >= 12
                        ? 'Pan-European'
                        : portal.supportedCountries.join(', ')}
                    </span>
                  </div>

                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg ui-surface-elevated px-2.5 py-1.5 text-xs font-semibold ui-text-sage transition hover:bg-emerald-500 hover:text-white"
                  >
                    <span>
                      {portal.buildIsinDeepLink ? `Open (${effectiveTicker})` : 'Visit Portal'}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Financial News & Market Insights */}
      <MarketNewsFeed />
    </div>
  );
};
