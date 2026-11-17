import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const { lang } = useAppPreferences();
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-label={tr(lang, 'Regulatory and Educational Disclaimer', 'Правовое и образовательное предупреждение')}
      className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-950/45 via-slate-900/90 to-slate-900/95 px-3.5 py-2 text-xs text-amber-100/90 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="truncate text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-300">
              {tr(lang, 'Educational Notice:', 'Важное предупреждение:')}
            </span>{' '}
            {tr(
              lang,
              'Past 3Y/5Y performance & ratings do not guarantee future results. Not financial, legal, or tax advice.',
              'Прошлая доходность (3Y/5Y) не гарантирует будущих результатов. Это образовательный инструмент, а не инвест- или налоговая консультация.'
            )}
          </p>
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20"
          >
            {expanded ? (
              <>
                <span className="hidden sm:inline">{tr(lang, 'Hide Legal Notes', 'Свернуть')}</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">{tr(lang, 'Legal & Tax Notes', 'Подробнее')}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {expanded && !compact && (
        <div className="mt-2.5 space-y-2.5 border-t border-amber-500/20 pt-2.5 text-[11px] leading-relaxed text-slate-300">
          <p className="text-slate-200">
            {tr(
              lang,
              'Past performance and historical investment ratings (3Y / 5Y backtests) are not promised or reliable indicators of future results. Future projections are mathematical models for educational illustration only, and European country tax summaries do not constitute personalized financial, legal, or tax advice.',
              'Историческая доходность и бэктесты за 3 и 5 лет не являются обещанием или надёжным индикатором будущих доходов. Прогнозы представляют собой математические модели для обучения, а налоговые справки по странам ЕС не заменяют консультацию сертифицированного налогового советника.'
            )}
          </p>
          <div className="grid gap-2.5 md:grid-cols-3">
            <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-slate-100">
                  {tr(lang, 'Market Risk & Drawdowns', 'Рыночный риск и просадки')}
                </p>
                <p className="mt-0.5 text-slate-400">
                  {tr(
                    lang,
                    'UCITS equity ETFs fluctuate daily and can experience 20%–45% temporary drawdowns. Capital invested is at risk and returns may be lower than modeled scenarios.',
                    'Акционные UCITS ETF колеблются ежедневно и могут временно падать на 20%–45%. Капитал подвержен риску, а реальная доходность может отличаться от моделей.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-slate-100">
                  {tr(lang, 'Live Market Feed & Currency', 'Живые котировки и валюта')}
                </p>
                <p className="mt-0.5 text-slate-400">
                  {tr(
                    lang,
                    'Live prices use delayed/real-time Yahoo Finance European exchange feeds (fallback to verified 5Y baseline snapshots when offline). Always verify KIDs & ISINs on justETF before trading.',
                    'Цены загружаются с Yahoo Finance (при офлайне или лимитах включается проверенная 5-летняя база). Всегда сверяйте KID и ISIN на justETF перед покупкой.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-2.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-slate-100">
                  {tr(lang, 'Tax Residency & Legislation', 'Налоговое резидентство')}
                </p>
                <p className="mt-0.5 text-slate-400">
                  {tr(
                    lang,
                    'Tax laws (e.g., Portugal Lei n.º 31/2024, Netherlands Box 3, Germany Vorabpauschale, Austria Meldefonds) evolve regularly. Consult a licensed local tax advisor for official filings.',
                    'Налоговые законы (Португалия Lei n.º 31/2024, Нидерланды Box 3, Германия Vorabpauschale, Австрия Meldefonds) регулярно обновляются. Проверяйте правила с местным бухгалтером.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
