import React from 'react';
import { CalendarCheck2, Info } from 'lucide-react';
import type { CountryTaxRule } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';

interface TaxDeadlinesTabProps {
  selectedCountry: CountryTaxRule;
}

export const TaxDeadlinesTab: React.FC<TaxDeadlinesTabProps> = ({ selectedCountry }) => {
  const { lang } = useAppPreferences();

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck2 className="h-4 w-4 ui-text-cool" />
        <h3 className="text-sm font-bold uppercase tracking-wider ui-text-secondary">
          {tr(
            lang,
            'When & What to File (European Taxpayer Calendar)',
            'Когда и какую форму подавать (Календарь налогоплательщика)'
          )}
        </h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Portugal PT */}
        <div className="rounded-2xl border border-emerald-500/35 ui-tint-sage p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold ui-text-primary">
              🇵🇹 {tr(lang, 'Portugal (PT)', 'Португалия (PT)')}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold ui-text-sage">
              {tr(lang, 'Apr 1 – Jun 30', '1 апр – 30 июн')}
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed ui-text-secondary">
            <li>
              <strong className="ui-text-sage">
                {tr(lang, 'Portal & Form:', 'Портал и форма:')}
              </strong>{' '}
              <code>Portal das Finanças</code> → <strong>IRS Modelo 3 + Anexo J</strong>{' '}
              {tr(
                lang,
                '(for foreign brokers like XTB, DEGIRO, IBKR, Trading 212). Tax payment due by August 31.',
                '(для иностранных брокеров вроде XTB, DEGIRO, IBKR, Trading 212). Оплата налога — до 31 августа.'
              )}
            </li>
            <li className="rounded-xl border border-emerald-500/30 ui-surface-deep p-2.5">
              <strong className="ui-text-sage">
                {tr(lang, 'Golden Rule for Acc ETFs:', 'Главное правило для Acc ETF:')}
              </strong>{' '}
              {tr(
                lang,
                'If during the year you only bought Accumulating ETFs (VWCE.DE, SXR8.DE, EUNL.DE) and sold nothing, you report zero gains/dividends in IRS! You only file Anexo J Quadro 9.2A when selling or Quadro 8A if receiving cash dividends (+ foreign IBAN in Quadro 11).',
                'Если в течение года вы только покупали аккумулирующий ETF (VWCE.DE, SXR8.DE, EUNL.DE) и не продавали его — в декларации IRS за этот год ничего указывать не нужно! Декларируется только факт продажи (Anexo J, Quadro 9.2A) или получение кэш-дивидендов (Quadro 8A) + иностранный IBAN (Quadro 11).'
              )}
            </li>
          </ul>
        </div>

        {/* Netherlands NL */}
        <div className="rounded-2xl border border-amber-500/30 ui-tint-sand p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold ui-text-primary">
              🇳🇱 {tr(lang, 'Netherlands (NL)', 'Нидерланды (NL)')}
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold ui-text-sand">
              {tr(lang, 'Mar 1 – May 1', '1 мар – 1 мая')}
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed ui-text-secondary">
            <li>
              <strong className="ui-text-sand">
                {tr(lang, 'Portal & Form:', 'Портал и форма:')}
              </strong>{' '}
              <code>Mijn Belastingdienst</code> → <strong>Aangifte Inkomstenbelasting</strong>,{' '}
              {tr(lang, 'section', 'раздел')} <strong>Box 3 (Sparen en Beleggen)</strong>.
            </li>
            <li>
              <strong>{tr(lang, 'What to record:', 'Что фиксировать:')}</strong>{' '}
              {tr(
                lang,
                'Snapshot the market value of all ETFs, stocks, and cash on January 1 (Peildatum). Above the tax-free threshold (~€57k / €114k couple), Box 3 wealth tax or actual return (Tegenbewijsregeling) applies.',
                'Снимок рыночной стоимости всех ETF, акций и кэша ровно на 1 января (Peildatum). Выше необлагаемого порога (~€57,000 / €114,000 для пары) начисляется налог Box 3 либо фактическая доходность по правилу Tegenbewijsregeling.'
              )}
            </li>
          </ul>
        </div>

        {/* Germany DE */}
        <div className="rounded-2xl border border-blue-500/30 ui-surface-deep p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold ui-text-primary">
              🇩🇪 {tr(lang, 'Germany (DE)', 'Германия (DE)')}
            </span>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold ui-text-cool">
              {tr(lang, 'By July 31', 'до 31 июля')}
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed ui-text-secondary">
            <li>
              <strong className="ui-text-cool">
                {tr(lang, 'Portal & Form:', 'Портал и форма:')}
              </strong>{' '}
              <code>ELSTER</code> → <strong>Anlage KAP / KAP-INV</strong>.
            </li>
            <li>
              <strong>Steuereinfach:</strong>{' '}
              {tr(
                lang,
                'German brokers (Trade Republic, Scalable Capital, ING) automatically withhold Vorabpauschale, apply 30% Teilfreistellung, and track your €1,000 Freistellungsauftrag. Mandatory Anlage KAP applies only to foreign brokers (IBKR, DEGIRO).',
                'Немецкие брокеры (Trade Republic, Scalable Capital, ING) автоматически удерживают Vorabpauschale и учитывают 30% Teilfreistellung + лимит €1,000 (Freistellungsauftrag). Обязательная подача Anlage KAP нужна только для зарубежных брокеров (IBKR, DEGIRO).'
              )}
            </li>
          </ul>
        </div>
      </div>

      {selectedCountry.code !== 'PT' &&
        selectedCountry.code !== 'NL' &&
        selectedCountry.code !== 'DE' && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border ui-border-subtle ui-surface-deep p-3 text-xs ui-text-body">
            <Info className="mt-0.5 h-4 w-4 shrink-0 ui-text-cool" />
            <span>
              {tr(lang, 'For your selected country', 'Для выбранной вами страны')}{' '}
              <strong>
                {selectedCountry.flag} {selectedCountry.name}
              </strong>{' '}
              {tr(lang, 'the primary tax declaration form is:', 'основная форма:')}{' '}
              <strong className="ui-text-primary">{selectedCountry.taxDeclarationForm}</strong>.
            </span>
          </div>
        )}
    </div>
  );
};
