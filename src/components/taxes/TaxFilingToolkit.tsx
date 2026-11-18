import React, { useEffect, useMemo, useState } from 'react';
import {
  BellPlus,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { CountryTaxRule, LanguageMode } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';

interface TaxFilingToolkitProps {
  selectedCountry: CountryTaxRule;
}

type ToolkitTab = 'deadlines' | 'sample' | 'reminders';

interface CustomReminder {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string;
}

const REMINDERS_STORAGE_KEY = 'euroetf_tax_reminders_v1';

const DEFAULT_CUSTOM_REMINDERS: CustomReminder[] = [
  {
    id: 'default-pt-anexo-j',
    date: `${new Date().getFullYear() + 1}-04-05`,
    title: 'IRS Modelo 3 + Anexo J (Portugal)',
    notes: 'Quadro 9.2A (sales), Quadro 8A (dividends) & Quadro 11 (foreign IBAN) on Portal das Finanças.',
  },
];

function computeYearsBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

function getPortugalHoldingDiscount(
  yearsHeld: number,
  lang: LanguageMode
): {
  discountPct: number;
  effectiveRatePct: number;
  tierLabel: string;
} {
  if (yearsHeld >= 8) {
    return {
      discountPct: 30,
      effectiveRatePct: 19.6,
      tierLabel: tr(
        lang,
        'Over 8 years → 30% discount (Lei n.º 31/2024)',
        'Свыше 8 лет → скидка 30% (Lei n.º 31/2024)'
      ),
    };
  }
  if (yearsHeld >= 5) {
    return {
      discountPct: 20,
      effectiveRatePct: 22.4,
      tierLabel: tr(
        lang,
        '5–8 years → 20% discount (Lei n.º 31/2024)',
        '5–8 лет → скидка 20% (Lei n.º 31/2024)'
      ),
    };
  }
  if (yearsHeld >= 2) {
    return {
      discountPct: 10,
      effectiveRatePct: 25.2,
      tierLabel: tr(
        lang,
        '2–5 years → 10% discount (Lei n.º 31/2024)',
        '2–5 лет → скидка 10% (Lei n.º 31/2024)'
      ),
    };
  }
  return {
    discountPct: 0,
    effectiveRatePct: 28.0,
    tierLabel: tr(
      lang,
      'Under 2 years → 0% discount (standard 28% rate)',
      'Менее 2 лет → 0% скидка (базовая ставка 28%)'
    ),
  };
}

function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function downloadIcsEvent(params: {
  filename: string;
  dateStr: string;
  title: string;
  description: string;
}): void {
  const dtStart = formatIcsDate(params.dateStr);
  const startObj = new Date(params.dateStr);
  const nextDayObj = new Date(startObj.getTime() + 24 * 60 * 60 * 1000);
  const dtEnd = Number.isNaN(nextDayObj.getTime())
    ? dtStart
    : nextDayObj.toISOString().slice(0, 10).replace(/-/g, '');

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `euroetf-${dtStart}-${Math.random().toString(36).slice(2, 9)}@euroetf-compass`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EuroETF Compass//Tax Filing Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcsText(params.title)}`,
    `DESCRIPTION:${escapeIcsText(params.description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P2D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(params.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = params.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getNextAnnualDate(month: number, day: number): string {
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    year += 1;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export const TaxFilingToolkit: React.FC<TaxFilingToolkitProps> = ({ selectedCountry }) => {
  const { lang } = useAppPreferences();
  const [activeTab, setActiveTab] = useState<ToolkitTab>('deadlines');

  // Interactive Quadro 9.2A generator state
  const [assetLabel, setAssetLabel] = useState('VWCE.DE (UCITS ETF Acc)');
  const [codigo, setCodigo] = useState<'G20' | 'G01'>('G20');
  const [paisFonte, setPaisFonte] = useState('372 (Irlanda)');
  const [buyDate, setBuyDate] = useState('2021-04-15');
  const [buyPrice, setBuyPrice] = useState<number>(6000);
  const [sellDate, setSellDate] = useState('2026-06-20');
  const [sellPrice, setSellPrice] = useState<number>(9400);
  const [commission, setCommission] = useState<number>(4);

  // Custom Reminders persisted in localStorage
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() => {
    try {
      const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomReminder[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_CUSTOM_REMINDERS;
  });

  const [newReminderDate, setNewReminderDate] = useState(() => getNextAnnualDate(4, 10));
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(customReminders));
    } catch {
      // ignore storage errors
    }
  }, [customReminders]);

  const userRowMath = useMemo(() => {
    const yearsHeld = computeYearsBetween(buyDate, sellDate);
    const tier = getPortugalHoldingDiscount(yearsHeld, lang);
    const grossGain = sellPrice - buyPrice - commission;
    const taxableGain = grossGain > 0 ? grossGain * (1 - tier.discountPct / 100) : grossGain;
    const taxDue = grossGain > 0 ? grossGain * (tier.effectiveRatePct / 100) : 0;

    return {
      yearsHeld,
      tier,
      grossGain,
      taxableGain,
      taxDue,
    };
  }, [buyDate, sellDate, buyPrice, sellPrice, commission, lang]);

  const handleDownloadAnexoJHtml = () => {
    const paisCode = paisFonte.split(' ')[0] || '372';
    const isEn = lang === 'en';
    const htmlDoc = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'ru'}">
<head>
  <meta charset="UTF-8" />
  <title>${isEn ? 'Sample Template IRS Modelo 3 — Anexo J (Portugal)' : 'Памятка-образец IRS Modelo 3 — Anexo J (Portugal)'}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; color: #0f172a; background: #ffffff; max-width: 960px; margin: 32px auto; padding: 0 20px; line-height: 1.5; }
    h1 { font-size: 22px; color: #1f7a53; border-bottom: 2px solid #2d8a61; padding-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 24px; color: #0f172a; }
    .meta { background: #f4f7f5; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #eff8f3; color: #1a6244; font-weight: 700; }
    .user-row { background: #fffbeb; font-weight: 600; }
    .note { margin-top: 16px; padding: 12px; background: #fef3c7; border-left: 4px solid #d97706; font-size: 12px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px;">
    <button onclick="window.print()" style="background:#2d8a61;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">🖨️ ${isEn ? 'Print / Save as PDF' : 'Распечатать / Сохранить в PDF'}</button>
  </div>
  <h1>${isEn ? 'IRS Modelo 3 — Anexo J: Filled Sample (Portugal)' : 'IRS Modelo 3 — Anexo J: Образец заполнения (Португалия)'}</h1>
  <div class="meta">
    <strong>${isEn ? 'Taxpayer (fictional sample):' : 'Налогоплательщик (образец):'}</strong> João Silva &nbsp;|&nbsp; <strong>NIF:</strong> 245 890 123 &nbsp;|&nbsp; <strong>${isEn ? 'Filing Window:' : 'Срок подачи:'}</strong> ${isEn ? 'April 1 – June 30' : '1 апреля – 30 июня'}<br/>
    <strong>${isEn ? 'Important:' : 'Важно:'}</strong> ${isEn ? 'If you only bought Acc ETFs during the tax year and sold nothing, Quadro 9.2A is not required!' : 'Если в отчётном году вы только покупали Acc ETF и не продавали их — Quadro 9.2A не заполняется!'}
  </div>

  <h2>Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (${isEn ? 'ETF & Stock Sales' : 'Продажи ETF и акций'})</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>${isEn ? 'Asset (Reference)' : 'Актив (справочно)'}</th>
        <th>País da Fonte</th>
        <th>Código</th>
        <th>Data Realização</th>
        <th>Valor Realização (€)</th>
        <th>Data Aquisição</th>
        <th>Valor Aquisição (€)</th>
        <th>Despesas (€)</th>
        <th>${isEn ? 'Lei 31/2024 Discount' : 'Льгота Lei 31/2024'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>901</td>
        <td>VWCE.DE (Vanguard All-World Acc)</td>
        <td>372 (Irlanda)</td>
        <td>G20</td>
        <td>2026-06-15</td>
        <td>13,840.00</td>
        <td>2020-05-10</td>
        <td>9,200.00</td>
        <td>4.00</td>
        <td>${isEn ? '20% off (>5y → 22.4%)' : '20% скидка (>5 лет → 22.4%)'}</td>
      </tr>
      <tr>
        <td>902</td>
        <td>NVDA (NVIDIA Corp.)</td>
        <td>840 (EUA)</td>
        <td>G01</td>
        <td>2026-09-20</td>
        <td>4,500.00</td>
        <td>2023-03-12</td>
        <td>1,800.00</td>
        <td>2.50</td>
        <td>${isEn ? '10% off (3.5y → 25.2%)' : '10% скидка (3.5 года → 25.2%)'}</td>
      </tr>
      <tr class="user-row">
        <td>903 (${isEn ? 'Your Row' : 'Ваша строка'})</td>
        <td>${assetLabel}</td>
        <td>${paisCode}</td>
        <td>${codigo}</td>
        <td>${sellDate}</td>
        <td>${sellPrice.toFixed(2)}</td>
        <td>${buyDate}</td>
        <td>${buyPrice.toFixed(2)}</td>
        <td>${commission.toFixed(2)}</td>
        <td>${userRowMath.tier.discountPct}% (${userRowMath.yearsHeld.toFixed(1)}y → ${userRowMath.tier.effectiveRatePct}% | ~€${userRowMath.taxDue.toFixed(2)})</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 8A — Rendimentos de Capitais (${isEn ? 'Only if cash dividends received' : 'Только если получали кэш-дивиденды'})</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>Código</th>
        <th>País da Fonte</th>
        <th>Rendimento Bruto (€)</th>
        <th>Imposto Pago no Estrangeiro (€)</th>
        <th>${isEn ? 'Notes' : 'Комментарий'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>801</td>
        <td>E11 / E10</td>
        <td>840 (EUA) / 372 (IE)</td>
        <td>120.00</td>
        <td>18.00</td>
        <td>${isEn ? 'Sample for Dist ETF or dividend stocks. Empty for Acc ETFs!' : 'Пример для Dist ETF или акций с дивидендами. Для Acc ETF здесь пусто!'}</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 11 — Contas de Depósito ou de Títulos Abertas no Estrangeiro</h2>
  <p style="font-size:13px;">${isEn ? 'Declare the IBAN of any foreign brokerage account (DEGIRO/flatexDEGIRO, Interactive Brokers IE/HU, XTB Poland, Trading 212) held outside Portugal.' : 'Обязательно укажите IBAN иностранного брокерского счёта (DEGIRO/flatexDEGIRO, Interactive Brokers Ireland/Hungary, XTB Poland, Trading 212), если счёт открыт за пределами Португалии.'}</p>

  <div class="note">
    <strong>${isEn ? 'Disclaimer:' : 'Отказ от ответственности:'}</strong> ${isEn ? 'Generated by EuroETF Compass for educational purposes only. Verify official codes (G01/G20, E10/E11) on Portal das Finanças or with a certified Contabilista Certificado.' : 'Этот шаблон сформирован в EuroETF Compass исключительно в образовательных целях. Проверяйте актуальные коды (G01/G20, E10/E11) на Portal das Finanças или у сертифицированного Contabilista Certificado.'}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IRS-Anexo-J-Template-${sellDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newReminderTitle.trim();
    if (!trimmedTitle || !newReminderDate) return;
    const item: CustomReminder = {
      id: `rem-${Date.now()}`,
      date: newReminderDate,
      title: trimmedTitle,
      notes:
        newReminderNotes.trim() ||
        tr(
          lang,
          'Tax / investing reminder from EuroETF Compass',
          'Налоговое / инвестиционное напоминание EuroETF Compass'
        ),
    };
    setCustomReminders((prev) => [item, ...prev]);
    setNewReminderTitle('');
    setNewReminderNotes('');
  };

  const handleDeleteReminder = (id: string) => {
    setCustomReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const presetIcsButtons = [
    {
      id: 'pt-irs',
      label: tr(
        lang,
        '📅 File IRS Modelo 3 + Anexo J in Portugal (April 1 – June 30)',
        '📅 Подать декларацию IRS Modelo 3 + Anexo J в Португалии (1 апреля — 30 июня)'
      ),
      filename: 'portugal-irs-anexo-j-filing.ics',
      dateStr: getNextAnnualDate(4, 1),
      title: tr(
        lang,
        'File IRS Modelo 3 + Anexo J (Portugal)',
        'Подать IRS Modelo 3 + Anexo J в Португалии'
      ),
      description: tr(
        lang,
        'IRS filing window on Portal das Finanças: Apr 1 – Jun 30. Check sales in Quadro 9.2A, dividends in Quadro 8A, and foreign IBAN in Quadro 11. Tax payment due Aug 31.',
        'Окно подачи IRS на Portal das Finanças: 1 апреля – 30 июня. Проверить продажи в Quadro 9.2A, дивиденды в Quadro 8A и иностранный IBAN в Quadro 11. Оплата до 31 августа.'
      ),
    },
    {
      id: 'broker-report',
      label: tr(
        lang,
        '📅 Download Annual Broker Tax Report XTB / DEGIRO / IBKR (Feb 15)',
        '📅 Скачать годовой налоговый отчёт брокера XTB / DEGIRO / IBKR (15 февраля)'
      ),
      filename: 'download-broker-annual-tax-report.ics',
      dateStr: getNextAnnualDate(2, 15),
      title: tr(
        lang,
        'Download Annual Broker Tax Report (XTB / DEGIRO / IBKR)',
        'Скачать годовой налоговый отчёт брокера (XTB / DEGIRO / IBKR)'
      ),
      description: tr(
        lang,
        'Export PDF/CSV statement of trades and dividends for the prior tax year.',
        'Выгрузить PDF/CSV отчёт о сделках и дивидендах за прошлый год для подготовки декларации.'
      ),
    },
    {
      id: 'nl-box3',
      label: tr(
        lang,
        '📅 Snapshot Jan 1 Portfolio Balance for Netherlands Box 3 (Jan 2)',
        '📅 Зафиксировать баланс счёта на 1 января для Box 3 Нидерланды (2 января)'
      ),
      filename: 'netherlands-box3-peildatum-snapshot.ics',
      dateStr: getNextAnnualDate(1, 2),
      title: tr(
        lang,
        'Snapshot Jan 1 Balance (Peildatum) for NL Box 3',
        'Зафиксировать баланс на 1 января (Peildatum) для Box 3 Нидерланды'
      ),
      description: tr(
        lang,
        'Save Jan 1 portfolio & cash valuation screenshot/PDF for Belastingdienst Box 3 (filing window Mar 1 – May 1).',
        'Сохранить скриншот/выписку стоимости портфеля и кэша на 1 января (Peildatum) для Belastingdienst Box 3 (окно подачи: 1 марта – 1 мая).'
      ),
    },
    {
      id: 'pt-holding-check',
      label: tr(
        lang,
        '📅 Check 2 / 5 / 8-Year ETF Holding Milestone (Portugal Lei n.º 31/2024)',
        '📅 Проверить дату льготы 2 / 5 / 8 лет владения ETF (Португалия Lei n.º 31/2024)'
      ),
      filename: 'portugal-lei-31-2024-holding-check.ics',
      dateStr: getNextAnnualDate(11, 15),
      title: tr(
        lang,
        'Check 2 / 5 / 8-Year ETF Holding Tiers (Lei n.º 31/2024)',
        'Проверить даты владения 2 / 5 / 8 лет ETF (Lei n.º 31/2024)'
      ),
      description: tr(
        lang,
        'Before selling FIFO lots, check if lots are near 2y (10% off), 5y (20% off), or 8y (30% off -> 19.6% effective tax).',
        'Перед продажей лотов по FIFO проверить, не приближается ли срок 2 года (10% скидка), 5 лет (20%) или 8 лет (30% -> 19.6% налог).'
      ),
    },
  ];

  const subTabs: Array<{ id: ToolkitTab; icon: React.ReactNode; label: string }> = [
    {
      id: 'deadlines',
      icon: <CalendarCheck2 className="h-4 w-4" />,
      label: tr(lang, '📅 1. Deadlines', '📅 1. Сроки подачи'),
    },
    {
      id: 'sample',
      icon: <FileText className="h-4 w-4" />,
      label: tr(lang, '📄 2. Filled Sample Form (Anexo J)', '📄 2. Образец IRS Anexo J'),
    },
    {
      id: 'reminders',
      icon: <CalendarClock className="h-4 w-4" />,
      label: tr(
        lang,
        `🔔 3. Calendar Reminders (.ics) (${customReminders.length})`,
        `🔔 3. Напоминалки в календарь (.ics) (${customReminders.length})`
      ),
    },
  ];

  return (
    <section
      aria-label={tr(
        lang,
        'Tax Filing Toolkit, Portugal Anexo J Sample & Calendar Reminders',
        'Налоговый практикум, образец IRS Anexo J и напоминания в календарь'
      )}
      className="fintech-card rounded-2xl p-5 sm:p-6"
    >
      {/* Toolkit Header + 3 Sub-Tabs */}
      <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 ui-text-sage" />
            <h2 className="text-lg font-bold ui-text-primary sm:text-xl">
              {tr(
                lang,
                'Tax Filing Toolkit: Deadlines, Filled IRS Anexo J & Calendar Reminders',
                'Налоговый практикум: Что и когда заполнять, образец IRS Anexo J и Напоминалки'
              )}
            </h2>
          </div>
          <p className="mt-1 text-xs ui-text-muted">
            {tr(
              lang,
              'Choose a sub-tab below for national filing windows, a worked Portugal IRS Modelo 3 — Anexo J template, or .ics calendar alerts.',
              'Выберите вкладку ниже: календарь сроков подачи, готовый образец португальской формы IRS Modelo 3 — Anexo J или напоминания в календарь (.ics).'
            )}
          </p>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold ui-text-sage lg:self-center">
          <span>{tr(lang, 'Active Country:', 'Активная страна:')}</span>
          <span>
            {selectedCountry.flag} {selectedCountry.name}
          </span>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div
        role="tablist"
        aria-label={tr(lang, 'Tax toolkit sections', 'Разделы налогового практикума')}
        className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        {subTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/15 ui-text-sage shadow-xs ring-1 ring-emerald-500/35'
                  : 'ui-border-subtle ui-surface-card ui-text-body ui-hover-elevated hover:text-[var(--ui-text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Filing Calendar & Rules */}
      {activeTab === 'deadlines' && (
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
      )}

      {/* SUB-TAB 2: Filled Portugal IRS Modelo 3 — Anexo J Sample + Interactive Generator */}
      {activeTab === 'sample' && (
        <div className="mt-5">
          <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 ui-text-sage" />
                <h3 className="text-base font-bold ui-text-primary sm:text-lg">
                  {tr(
                    lang,
                    'Filled Sample: Portugal IRS Modelo 3 — Anexo J',
                    'Заполненный образец португальской формы IRS Modelo 3 — Anexo J'
                  )}
                </h3>
              </div>
              <p className="mt-1 text-xs ui-text-muted">
                {tr(
                  lang,
                  'Fictional Portugal tax resident example:',
                  'Пример для вымышленного резидента Португалии:'
                )}{' '}
                <span className="font-semibold ui-text-secondary">João Silva, NIF 245 890 123</span>{' '}
                {tr(
                  lang,
                  '(foreign broker outside Portugal, e.g., IBKR / DEGIRO / XTB).',
                  '(брокер за пределами Португалии, например IBKR / DEGIRO / XTB).'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAnexoJHtml}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <Download className="h-4 w-4" />
              <span>
                {tr(
                  lang,
                  'Download Anexo J Cheat-Sheet (.html / Print PDF)',
                  'Скачать шаблон Anexo J (.html / Печать в PDF)'
                )}
              </span>
            </button>
          </div>

          {/* Quadro 9.2A Table */}
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider ui-text-sage">
              Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (
              {tr(lang, 'Sales', 'Продажи')})
            </h4>
            <div className="overflow-x-auto rounded-xl border ui-border-subtle">
              <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b ui-border-subtle ui-surface-card text-[11px] font-semibold ui-text-body">
                    <th className="px-3 py-2.5">Linha</th>
                    <th className="px-3 py-2.5">{tr(lang, 'Asset (Ref.)', 'Актив (справочно)')}</th>
                    <th className="px-3 py-2.5">País da Fonte</th>
                    <th className="px-3 py-2.5">Código</th>
                    <th className="px-3 py-2.5">Data Realização</th>
                    <th className="px-3 py-2.5 text-right">Valor Realização</th>
                    <th className="px-3 py-2.5">Data Aquisição</th>
                    <th className="px-3 py-2.5 text-right">Valor Aquisição</th>
                    <th className="px-3 py-2.5 text-right">Despesas</th>
                    <th className="px-3 py-2.5">
                      {tr(lang, 'Lei n.º 31/2024 Tier', 'Льгота Lei n.º 31/2024')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border-subtle)] ui-surface-deep">
                  <tr>
                    <td className="px-3 py-2.5 font-mono font-bold ui-text-sage">901</td>
                    <td className="px-3 py-2.5 font-semibold ui-text-primary">
                      VWCE.DE (Vanguard All-World Acc)
                    </td>
                    <td className="px-3 py-2.5 font-mono ui-text-body">372 (Irlanda)</td>
                    <td className="px-3 py-2.5 font-mono ui-text-cool">G20 (ETF/UP)</td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">2026-06-15</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                      €13,840.00
                    </td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">2020-05-10</td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€9,200.00</td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-muted">€4.00</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold ui-text-sage">
                        {tr(lang, '>5y → 20% off (22.4%)', '>5 лет → 20% скидка (22.4%)')}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 font-mono font-bold ui-text-sage">902</td>
                    <td className="px-3 py-2.5 font-semibold ui-text-primary">NVDA (NVIDIA Corp.)</td>
                    <td className="px-3 py-2.5 font-mono ui-text-body">840 (EUA)</td>
                    <td className="px-3 py-2.5 font-mono ui-text-cool">G01 (Ações)</td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">2026-09-20</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                      €4,500.00
                    </td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">2023-03-12</td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€1,800.00</td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-muted">€2.50</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold ui-text-cool">
                        {tr(lang, '3.5y → 10% off (25.2%)', '3.5 года → 10% скидка (25.2%)')}
                      </span>
                    </td>
                  </tr>
                  {/* User Generated Live Row */}
                  <tr className="ui-tint-sand">
                    <td className="px-3 py-2.5 font-mono font-bold ui-text-sand">903*</td>
                    <td className="px-3 py-2.5 font-bold ui-text-sand">{assetLabel}</td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">{paisFonte}</td>
                    <td className="px-3 py-2.5 font-mono ui-text-sand">{codigo}</td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">{sellDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold ui-text-primary">
                      €{sellPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 font-mono ui-text-secondary">{buyDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">
                      €{buyPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-body">
                      €{commission.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold ui-text-sand">
                        {userRowMath.yearsHeld.toFixed(1)}
                        {tr(lang, 'y', 'л')} → {userRowMath.tier.discountPct}%{' '}
                        {tr(lang, 'off', 'скидка')} ({userRowMath.tier.effectiveRatePct}%)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quadro 8A Example Table */}
          <div className="mt-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider ui-text-cool">
              Quadro 8A — Rendimentos de Capitais (
              {tr(
                lang,
                'Dividend example for Dist ETFs / stocks',
                'Пример заполнения дивидендов для Dist ETF / акций'
              )}
              )
            </h4>
            <div className="overflow-x-auto rounded-xl border ui-border-subtle">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b ui-border-subtle ui-surface-card text-[11px] font-semibold ui-text-body">
                    <th className="px-3 py-2">Linha</th>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">País da Fonte</th>
                    <th className="px-3 py-2 text-right">Rendimento Bruto (€)</th>
                    <th className="px-3 py-2 text-right">Imposto Pago no Estrangeiro (€)</th>
                    <th className="px-3 py-2">{tr(lang, 'Explanation', 'Пояснение')}</th>
                  </tr>
                </thead>
                <tbody className="ui-surface-deep">
                  <tr>
                    <td className="px-3 py-2.5 font-mono font-bold ui-text-cool">801</td>
                    <td className="px-3 py-2.5 font-mono ui-text-primary">E11 / E10</td>
                    <td className="px-3 py-2.5 font-mono ui-text-body">
                      840 (EUA) / 372 (Irlanda)
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                      €120.00
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€18.00</td>
                    <td className="px-3 py-2.5 text-[11px] ui-text-body">
                      {tr(
                        lang,
                        'Filled only if you received cash dividends. For Acc ETFs there are no rows in Quadro 8A!',
                        'Заполняется только если вы получали денежные дивиденды. Для Acc ETF строк в Quadro 8A нет!'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Quadro 9.2A Row Generator */}
          <div className="mt-5 rounded-2xl border border-emerald-500/30 ui-surface-deep p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 ui-text-sage" />
                <h4 className="text-sm font-bold ui-text-primary">
                  {tr(
                    lang,
                    'Interactive Generator: Generate Quadro 9.2A Row for Your Numbers',
                    'Интерактивный генератор: «Сгенерировать строку Quadro 9.2A под мои цифры»'
                  )}
                </h4>
              </div>
              <span className="text-[11px] ui-text-muted">
                {tr(
                  lang,
                  'Updates row 903* above and the downloadable HTML sheet',
                  'Обновляет строку 903* в таблице и HTML-памятке выше'
                )}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
                  {tr(lang, 'Asset & Code Type', 'Актив и тип кода')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={assetLabel}
                    onChange={(e) => setAssetLabel(e.target.value)}
                    className="w-full rounded-lg border ui-input px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                  />
                  <select
                    aria-label="Anexo J code"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value as 'G20' | 'G01')}
                    className="rounded-lg border ui-input px-2 py-1.5 font-mono text-xs font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="G20">G20</option>
                    <option value="G01">G01</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
                  {tr(
                    lang,
                    'País da Fonte (ETF / Stock Domicile)',
                    'País da Fonte (Домициль ETF/акции)'
                  )}
                </label>
                <select
                  value={paisFonte}
                  onChange={(e) => setPaisFonte(e.target.value)}
                  className="w-full rounded-lg border ui-input px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="372 (Irlanda)">372 (Irlanda — VWCE, SXR8, IWDA)</option>
                  <option value="442 (Luxemburgo)">442 (Luxemburgo — Amundi/LU)</option>
                  <option value="840 (EUA)">840 (Estados Unidos — NVDA, AAPL)</option>
                  <option value="276 (Alemanha)">276 (Alemanha — SAP, SIE)</option>
                  <option value="528 (Países Baixos)">528 (Países Baixos — ASML)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
                  {tr(lang, 'Buy Date / Cost Basis (€)', 'Дата покупки / Цена покупки (€)')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    className="w-full rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(Math.max(0, Number(e.target.value)))}
                    className="w-24 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
                  {tr(
                    lang,
                    'Sell Date / Proceeds (€) + Fee (€)',
                    'Дата продажи / Выручка (€) + Комиссия (€)'
                  )}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={sellDate}
                    onChange={(e) => setSellDate(e.target.value)}
                    className="w-full rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Math.max(0, Number(e.target.value)))}
                    className="w-24 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={commission}
                    title={tr(lang, 'Broker commission (Despesas)', 'Комиссия брокера (Despesas)')}
                    onChange={(e) => setCommission(Math.max(0, Number(e.target.value)))}
                    className="w-16 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
                <span className="text-[11px] ui-text-muted">
                  {tr(lang, 'Holding Period', 'Срок владения')}
                </span>
                <p className="mt-0.5 font-mono text-base font-extrabold ui-text-primary">
                  {userRowMath.yearsHeld.toFixed(2)} {tr(lang, 'yrs', 'лет')}
                </p>
                <span className="text-[10px] ui-text-muted">{userRowMath.tier.tierLabel}</span>
              </div>
              <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
                <span className="text-[11px] ui-text-muted">
                  {tr(lang, 'Pre-Tax Gain', 'Прибыль до налога')}
                </span>
                <p
                  className={`mt-0.5 font-mono text-base font-extrabold ${
                    userRowMath.grossGain >= 0 ? 'ui-text-sage' : 'ui-text-rose'
                  }`}
                >
                  €{userRowMath.grossGain.toFixed(2)}
                </p>
                <span className="text-[10px] ui-text-muted">
                  {tr(lang, 'Proceeds − Cost − Fees', 'Продажа − Покупка − Комиссии')}
                </span>
              </div>
              <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
                <span className="text-[11px] ui-text-muted">
                  {tr(lang, 'IRS Rate (Lei n.º 31/2024)', 'Ставка IRS (Lei n.º 31/2024)')}
                </span>
                <p className="mt-0.5 font-mono text-base font-extrabold ui-text-cool">
                  {userRowMath.tier.effectiveRatePct.toFixed(1)}%
                </p>
                <span className="text-[10px] ui-text-muted">
                  {tr(
                    lang,
                    `${userRowMath.tier.discountPct}% discount off tax base`,
                    `Скидка ${userRowMath.tier.discountPct}% с налоговой базы`
                  )}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-500/35 ui-tint-sage p-3">
                <span className="text-[11px] ui-text-sage">
                  {tr(lang, 'Estimated IRS Tax', 'Расчётный налог IRS')}
                </span>
                <p className="mt-0.5 font-mono text-base font-extrabold ui-text-sage">
                  €{userRowMath.taxDue.toFixed(2)}
                </p>
                <span className="text-[10px] ui-text-muted">
                  {tr(lang, 'Net proceeds:', 'Чистыми на руки:')} €
                  {(sellPrice - userRowMath.taxDue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Calendar (.ics) & Custom Local Reminders */}
      {activeTab === 'reminders' && (
        <div className="mt-5">
          <div className="flex flex-col gap-2 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 ui-text-cool" />
                <h3 className="text-base font-bold ui-text-primary sm:text-lg">
                  {tr(
                    lang,
                    'Calendar Reminders (.ics for Apple / Google / Outlook + Local List)',
                    'Напоминалки (.ics для Apple / Google / Outlook Календаря + локальный список)'
                  )}
                </h3>
              </div>
              <p className="mt-1 text-xs ui-text-muted">
                {tr(
                  lang,
                  'Download one-click calendar events or save your own custom tax & holding-period milestones.',
                  'Скачайте готовые события в один клик (импортируются в Apple Calendar, Google Calendar, Outlook) или добавьте собственную памятку по дате.'
                )}
              </p>
            </div>
          </div>

          {/* 4 One-Click .ics Preset Buttons */}
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {presetIcsButtons.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  downloadIcsEvent({
                    filename: preset.filename,
                    dateStr: preset.dateStr,
                    title: preset.title,
                    description: preset.description,
                  })
                }
                className="group flex items-center justify-between gap-3 rounded-xl border ui-border-subtle ui-surface-deep p-3.5 text-left transition ui-hover-elevated hover:border-emerald-500/50"
              >
                <div>
                  <p className="text-xs font-bold ui-text-primary group-hover:text-[var(--ui-accent-sage-text)]">
                    {preset.label}
                  </p>
                  <p className="mt-1 text-[11px] ui-text-muted">
                    {tr(lang, 'Next date:', 'Следующая дата:')}{' '}
                    <span className="font-mono ui-text-cool">{preset.dateStr}</span> •{' '}
                    {tr(lang, 'click to download', 'нажми, чтобы скачать')} <code>.ics</code>
                  </p>
                </div>
                <Download className="h-4 w-4 shrink-0 ui-text-sage" />
              </button>
            ))}
          </div>

          {/* Interactive Custom Reminder Form + List */}
          <div className="mt-5 grid gap-4 lg:grid-cols-12">
            <form
              onSubmit={handleAddCustomReminder}
              className="space-y-3 rounded-xl border ui-border-subtle ui-surface-deep p-4 lg:col-span-5"
            >
              <div className="flex items-center gap-2 text-xs font-bold ui-text-primary">
                <BellPlus className="h-4 w-4 ui-text-sage" />
                <span>{tr(lang, 'Create Custom Reminder', 'Создать свою напоминалку')}</span>
              </div>

              <div>
                <label className="mb-1 block text-[11px] ui-text-muted">
                  {tr(lang, 'Reminder Date', 'Дата напоминания')}
                </label>
                <input
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  required
                  className="w-full rounded-lg border ui-input px-3 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] ui-text-muted">
                  {tr(lang, 'Title', 'Название')}
                </label>
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder={tr(
                    lang,
                    'e.g., Check 5-year VWCE.DE lot milestone',
                    'Например: Проверить 5-летний лот VWCE.DE'
                  )}
                  required
                  className="w-full rounded-lg border ui-input px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] ui-text-muted">
                  {tr(lang, 'Notes (optional)', 'Заметка (необязательно)')}
                </label>
                <input
                  type="text"
                  value={newReminderNotes}
                  onChange={(e) => setNewReminderNotes(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Download IBKR statement and verify FIFO',
                    'Скачать отчёт IBKR и сверить FIFO'
                  )}
                  className="w-full rounded-lg border ui-input px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{tr(lang, 'Save Reminder', 'Сохранить напоминание')}</span>
              </button>
            </form>

            <div className="space-y-2.5 rounded-xl border ui-border-subtle ui-surface-deep p-4 lg:col-span-7">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold ui-text-primary">
                  <CheckCircle2 className="h-4 w-4 ui-text-sage" />
                  {tr(lang, 'My Saved Reminders', 'Мои сохранённые напоминания')} (
                  {customReminders.length})
                </span>
                <span className="text-[10px] ui-text-muted">
                  {tr(lang, 'Stored locally in browser', 'Хранятся локально в браузере')}
                </span>
              </div>

              {customReminders.length === 0 ? (
                <p className="py-6 text-center text-xs ui-text-muted">
                  {tr(
                    lang,
                    'No reminders yet. Add a date on the left or download presets above.',
                    'Список напоминаний пуст. Добавьте дату слева или скачайте готовые пресеты выше.'
                  )}
                </p>
              ) : (
                <div className="space-y-2">
                  {customReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="flex flex-col justify-between gap-2 rounded-xl border ui-border-subtle ui-surface-card p-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold ui-text-sage">
                            {rem.date}
                          </span>
                          <span className="text-xs font-bold ui-text-primary">{rem.title}</span>
                        </div>
                        <p className="mt-1 text-[11px] ui-text-muted">{rem.notes}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            downloadIcsEvent({
                              filename: `reminder-${rem.date}.ics`,
                              dateStr: rem.date,
                              title: rem.title,
                              description: rem.notes,
                            })
                          }
                          title={tr(lang, 'Download to calendar (.ics)', 'Скачать в календарь (.ics)')}
                          className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold ui-text-cool transition hover:bg-cyan-500/20"
                        >
                          <Download className="h-3 w-3" />
                          <span>.ics</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(rem.id)}
                          aria-label={`Delete reminder ${rem.title}`}
                          className="rounded-lg border ui-border-default ui-surface-elevated p-1.5 ui-text-muted transition hover:text-[var(--ui-accent-rose-text)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
