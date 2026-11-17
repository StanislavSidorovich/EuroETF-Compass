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
import type { CountryTaxRule } from '../../types';

interface TaxFilingToolkitProps {
  selectedCountry: CountryTaxRule;
}

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
    title: 'Подать IRS Modelo 3 + Anexo J (Португалия)',
    notes: 'Проверить продажи в Quadro 9.2A, дивиденды в Quadro 8A и IBAN брокера в Quadro 11 на Portal das Finanças.',
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

function getPortugalHoldingDiscount(yearsHeld: number): {
  discountPct: number;
  effectiveRatePct: number;
  tierLabel: string;
} {
  if (yearsHeld >= 8) {
    return {
      discountPct: 30,
      effectiveRatePct: 19.6,
      tierLabel: 'Свыше 8 лет → скидка 30% (Lei n.º 31/2024)',
    };
  }
  if (yearsHeld >= 5) {
    return {
      discountPct: 20,
      effectiveRatePct: 22.4,
      tierLabel: '5–8 лет → скидка 20% (Lei n.º 31/2024)',
    };
  }
  if (yearsHeld >= 2) {
    return {
      discountPct: 10,
      effectiveRatePct: 25.2,
      tierLabel: '2–5 лет → скидка 10% (Lei n.º 31/2024)',
    };
  }
  return {
    discountPct: 0,
    effectiveRatePct: 28.0,
    tierLabel: 'Менее 2 лет → 0% скидка (базовая ставка 28%)',
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
    'PRODID:-//EuroETF Compass//Tax Filing Reminder//RU',
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
    const tier = getPortugalHoldingDiscount(yearsHeld);
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
  }, [buyDate, sellDate, buyPrice, sellPrice, commission]);

  const handleDownloadAnexoJHtml = () => {
    const paisCode = paisFonte.split(' ')[0] || '372';
    const htmlDoc = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <title>Памятка-образец IRS Modelo 3 — Anexo J (Portugal)</title>
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
    <button onclick="window.print()" style="background:#2d8a61;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">🖨️ Распечатать / Сохранить в PDF</button>
  </div>
  <h1>IRS Modelo 3 — Anexo J: Образец заполнения (Португалия)</h1>
  <div class="meta">
    <strong>Налогоплательщик (образец):</strong> João Silva &nbsp;|&nbsp; <strong>NIF:</strong> 245 890 123 &nbsp;|&nbsp; <strong>Срок подачи:</strong> 1 апреля – 30 июня<br/>
    <strong>Важно:</strong> Если в отчётном году вы только покупали Acc ETF и не продавали их — Quadro 9.2A не заполняется!
  </div>

  <h2>Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (Продажи ETF и акций)</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>Актив (справочно)</th>
        <th>País da Fonte</th>
        <th>Código</th>
        <th>Data Realização (Продажа)</th>
        <th>Valor Realização (€)</th>
        <th>Data Aquisição (Покупка)</th>
        <th>Valor Aquisição (€)</th>
        <th>Despesas (€)</th>
        <th>Льгота Lei 31/2024</th>
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
        <td>20% скидка (&gt;5 лет → 22.4%)</td>
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
        <td>10% скидка (3.5 года → 25.2%)</td>
      </tr>
      <tr class="user-row">
        <td>903 (Ваша строка)</td>
        <td>${assetLabel}</td>
        <td>${paisCode}</td>
        <td>${codigo}</td>
        <td>${sellDate}</td>
        <td>${sellPrice.toFixed(2)}</td>
        <td>${buyDate}</td>
        <td>${buyPrice.toFixed(2)}</td>
        <td>${commission.toFixed(2)}</td>
        <td>${userRowMath.tier.discountPct}% скидка (${userRowMath.yearsHeld.toFixed(1)} лет → ${userRowMath.tier.effectiveRatePct}% | налог ~€${userRowMath.taxDue.toFixed(2)})</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 8A — Rendimentos de Capitais (Только если получали кэш-дивиденды)</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>Código</th>
        <th>País da Fonte</th>
        <th>Rendimento Bruto (€)</th>
        <th>Imposto Pago no Estrangeiro (€)</th>
        <th>Комментарий</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>801</td>
        <td>E11 / E10</td>
        <td>840 (EUA) / 372 (IE)</td>
        <td>120.00</td>
        <td>18.00</td>
        <td>Пример для Dist ETF или акций с дивидендами. Для Acc ETF здесь пусто!</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 11 — Contas de Depósito ou de Títulos Abertas no Estrangeiro</h2>
  <p style="font-size:13px;">Обязательно укажите IBAN иностранного брокерского счёта (DEGIRO/flatexDEGIRO, Interactive Brokers Ireland/Hungary, XTB Poland, Trading 212), если открыт счёт за пределами Португалии.</p>

  <div class="note">
    <strong>Отказ от ответственности:</strong> Этот шаблон сформирован в EuroETF Compass исключительно в образовательных целях. Проверяйте актуальные коды (G01/G20, E10/E11) и суммы в личном кабинете Portal das Finanças или у сертифицированного Contabilista Certificado.
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
      notes: newReminderNotes.trim() || 'Налоговое / инвестиционное напоминание EuroETF Compass',
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
      label: '📅 Подать декларацию IRS Modelo 3 + Anexo J в Португалии (1 апреля — 30 июня)',
      filename: 'portugal-irs-anexo-j-filing.ics',
      dateStr: getNextAnnualDate(4, 1),
      title: 'Подать IRS Modelo 3 + Anexo J в Португалии',
      description:
        'Окно подачи IRS на Portal das Finanças: 1 апреля – 30 июня. Проверить продажи в Quadro 9.2A, дивиденды в Quadro 8A и иностранный IBAN в Quadro 11. Оплата до 31 августа.',
    },
    {
      id: 'broker-report',
      label: '📅 Скачать годовой налоговый отчёт брокера XTB / DEGIRO / IBKR (15 февраля)',
      filename: 'download-broker-annual-tax-report.ics',
      dateStr: getNextAnnualDate(2, 15),
      title: 'Скачать годовой налоговый отчёт брокера (XTB / DEGIRO / IBKR)',
      description:
        'Выгрузить PDF/CSV отчёт о сделках и дивидендах за прошлый год для подготовки декларации.',
    },
    {
      id: 'nl-box3',
      label: '📅 Зафиксировать баланс счёта на 1 января для Box 3 Нидерланды (2 января)',
      filename: 'netherlands-box3-peildatum-snapshot.ics',
      dateStr: getNextAnnualDate(1, 2),
      title: 'Зафиксировать баланс на 1 января (Peildatum) для Box 3 Нидерланды',
      description:
        'Сохранить скриншот/выписку стоимости портфеля и кэша на 1 января (Peildatum) для Belastingdienst Box 3 (окно подачи: 1 марта – 1 мая).',
    },
    {
      id: 'pt-holding-check',
      label: '📅 Проверить дату льготы 2 / 5 / 8 лет владения ETF (Португалия Lei n.º 31/2024)',
      filename: 'portugal-lei-31-2024-holding-check.ics',
      dateStr: getNextAnnualDate(11, 15),
      title: 'Проверить даты владения 2 / 5 / 8 лет ETF (Lei n.º 31/2024)',
      description:
        'Перед продажей лотов по FIFO проверить, не приближается ли срок 2 года (10% скидка), 5 лет (20%) или 8 лет (30% -> 19.6% налог).',
    },
  ];

  return (
    <section
      aria-label="Tax Filing Toolkit, Portugal Anexo J Sample & Calendar Reminders"
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white sm:text-xl">
                Налоговый практикум: Что и когда заполнять, образец IRS Anexo J и Напоминалки
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Практическая шпаргалка по срокам деклараций, конкретный пример заполнения португальской
              формы <span className="font-mono text-emerald-300">IRS Modelo 3 — Anexo J</span> и
              экспорт напоминаний в календарь.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span>Активная страна:</span>
            <span>
              {selectedCountry.flag} {selectedCountry.name}
            </span>
          </div>
        </div>

        {/* SECTION A: Filing Calendar & Rules */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Раздел A — Когда и какую форму подавать (Календарь налогоплательщика)
            </h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Portugal PT */}
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-white">🇵🇹 Португалия (PT)</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  1 апр – 30 июн
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-200">
                <li>
                  <strong className="text-emerald-300">Портал и форма:</strong>{' '}
                  <code>Portal das Finanças</code> → <strong>IRS Modelo 3 + Anexo J</strong> (для
                  иностранных брокеров вроде XTB, DEGIRO, IBKR, Trading 212). Оплата налога — до{' '}
                  <strong>31 августа</strong>.
                </li>
                <li className="rounded-xl border border-emerald-500/30 bg-slate-950/60 p-2.5">
                  <strong className="text-emerald-300">Главное правило для Acc ETF:</strong> Если в
                  течение года вы <strong>только покупали</strong> аккумулирующий ETF (
                  <code>VWCE.DE</code>, <code>SXR8.DE</code>, <code>EUNL.DE</code>) и{' '}
                  <strong>не продавали</strong> его — в декларации IRS за этот год{' '}
                  <strong>ничего указывать не нужно</strong>! Декларируется только факт{' '}
                  <strong>продажи</strong> (<code>Anexo J, Quadro 9.2A</code>) или получение
                  кэш-дивидендов (<code>Anexo J, Quadro 8A</code>) + иностранный IBAN (
                  <code>Quadro 11</code>).
                </li>
              </ul>
            </div>

            {/* Netherlands NL */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-white">🇳🇱 Нидерланды (NL)</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  1 мар – 1 мая
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-200">
                <li>
                  <strong className="text-amber-300">Портал и форма:</strong>{' '}
                  <code>Mijn Belastingdienst</code> → <strong>Aangifte Inkomstenbelasting</strong>,
                  раздел <strong>Box 3 (Sparen en Beleggen)</strong>.
                </li>
                <li>
                  <strong>Что фиксировать:</strong> Снимок рыночной стоимости всех ETF, акций и
                  кэша ровно на <strong>1 января (Peildatum)</strong>. Выше необлагаемого порога
                  (~€57,000 / €114,000 для пары) начисляется Box 3 налог, либо фактическая доходность
                  по правилу <em>Tegenbewijsregeling</em>.
                </li>
              </ul>
            </div>

            {/* Germany DE */}
            <div className="rounded-2xl border border-blue-500/30 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-white">🇩🇪 Германия (DE)</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                  до 31 июля
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-200">
                <li>
                  <strong className="text-cyan-300">Портал и форма:</strong>{' '}
                  <code>ELSTER</code> → <strong>Anlage KAP / KAP-INV</strong>.
                </li>
                <li>
                  <strong>Steuereinfach:</strong> Немецкие брокеры (Trade Republic, Scalable
                  Capital, ING) автоматически удерживают <em>Vorabpauschale</em> и учитывают
                  30% <em>Teilfreistellung</em> + лимит €1,000 (<em>Freistellungsauftrag</em>).
                  Обязательная подача Anlage KAP нужна только для зарубежных брокеров (IBKR,
                  DEGIRO).
                </li>
              </ul>
            </div>
          </div>

          {selectedCountry.code !== 'PT' &&
            selectedCountry.code !== 'NL' &&
            selectedCountry.code !== 'DE' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span>
                  Для выбранной вами страны{' '}
                  <strong>
                    {selectedCountry.flag} {selectedCountry.name}
                  </strong>{' '}
                  основная форма: <strong className="text-white">{selectedCountry.taxDeclarationForm}</strong>.
                </span>
              </div>
            )}
        </div>
      </div>

      {/* SECTION B: Filled Portugal IRS Modelo 3 — Anexo J Sample + Interactive Generator */}
      <div className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white sm:text-lg">
                Раздел B — Заполненный образец португальской формы IRS Modelo 3 — Anexo J
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Пример для вымышленного резидента Португалии:{' '}
              <span className="font-semibold text-slate-200">João Silva, NIF 245 890 123</span>{' '}
              (брокер за пределами Португалии, например IBKR / DEGIRO / XTB).
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadAnexoJHtml}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <Download className="h-4 w-4" />
            <span>Скачать заполненный шаблон-памятку Anexo J (.html / Печать в PDF)</span>
          </button>
        </div>

        {/* Quadro 9.2A Table */}
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (Продажи)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-300">
                  <th className="px-3 py-2.5">Linha</th>
                  <th className="px-3 py-2.5">Актив (справочно)</th>
                  <th className="px-3 py-2.5">País da Fonte</th>
                  <th className="px-3 py-2.5">Código</th>
                  <th className="px-3 py-2.5">Data Realização</th>
                  <th className="px-3 py-2.5 text-right">Valor Realização</th>
                  <th className="px-3 py-2.5">Data Aquisição</th>
                  <th className="px-3 py-2.5 text-right">Valor Aquisição</th>
                  <th className="px-3 py-2.5 text-right">Despesas</th>
                  <th className="px-3 py-2.5">Льгота Lei n.º 31/2024</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                <tr>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-300">901</td>
                  <td className="px-3 py-2.5 font-semibold text-white">
                    VWCE.DE (Vanguard All-World Acc)
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">372 (Irlanda)</td>
                  <td className="px-3 py-2.5 font-mono text-cyan-300">G20 (ETF/UP)</td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">2026-06-15</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">
                    €13,840.00
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">2020-05-10</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-200">€9,200.00</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400">€4.00</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      &gt;5 лет → 20% скидка (22.4%)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-300">902</td>
                  <td className="px-3 py-2.5 font-semibold text-white">NVDA (NVIDIA Corp.)</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">840 (EUA)</td>
                  <td className="px-3 py-2.5 font-mono text-cyan-300">G01 (Ações)</td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">2026-09-20</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">
                    €4,500.00
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">2023-03-12</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-200">€1,800.00</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400">€2.50</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      3.5 года → 10% скидка (25.2%)
                    </span>
                  </td>
                </tr>
                {/* User Generated Live Row */}
                <tr className="bg-amber-950/10">
                  <td className="px-3 py-2.5 font-mono font-bold text-amber-300">903*</td>
                  <td className="px-3 py-2.5 font-bold text-amber-200">{assetLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">{paisFonte}</td>
                  <td className="px-3 py-2.5 font-mono text-amber-300">{codigo}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">{sellDate}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                    €{sellPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-200">{buyDate}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-200">
                    €{buyPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                    €{commission.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {userRowMath.yearsHeld.toFixed(1)}л → {userRowMath.tier.discountPct}% скидка (
                      {userRowMath.tier.effectiveRatePct}%)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quadro 8A Example Table */}
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            Quadro 8A — Rendimentos de Capitais (Пример заполнения дивидендов для Dist ETF / акций)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-300">
                  <th className="px-3 py-2">Linha</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">País da Fonte</th>
                  <th className="px-3 py-2 text-right">Rendimento Bruto (€)</th>
                  <th className="px-3 py-2 text-right">Imposto Pago no Estrangeiro (€)</th>
                  <th className="px-3 py-2">Пояснение</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950/60">
                <tr>
                  <td className="px-3 py-2.5 font-mono font-bold text-cyan-300">801</td>
                  <td className="px-3 py-2.5 font-mono text-white">E11 / E10</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">840 (EUA) / 372 (Irlanda)</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">
                    €120.00
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-200">€18.00</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-300">
                    Заполняется только если вы получали денежные дивиденды. Для{' '}
                    <strong className="text-emerald-300">Acc ETF</strong> строк в Quadro 8A нет!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive "Сгенерировать строку Quadro 9.2A под мои цифры" */}
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                Интерактивный генератор: «Сгенерировать строку Quadro 9.2A под мои цифры»
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Обновляет строку 903* в таблице и HTML-памятке выше
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                Актив и тип кода
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={assetLabel}
                  onChange={(e) => setAssetLabel(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
                <select
                  aria-label="Anexo J code"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value as 'G20' | 'G01')}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-cyan-300 outline-none focus:border-emerald-500"
                >
                  <option value="G20">G20</option>
                  <option value="G01">G01</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                País da Fonte (Домициль ETF/акции)
              </label>
              <select
                value={paisFonte}
                onChange={(e) => setPaisFonte(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="372 (Irlanda)">372 (Irlanda — VWCE, SXR8, IWDA)</option>
                <option value="442 (Luxemburgo)">442 (Luxemburgo — Amundi/LU)</option>
                <option value="840 (EUA)">840 (Estados Unidos — NVDA, AAPL)</option>
                <option value="276 (Alemanha)">276 (Alemanha — SAP, SIE)</option>
                <option value="528 (Países Baixos)">528 (Países Baixos — ASML)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                Дата покупки / Цена покупки (€)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Math.max(0, Number(e.target.value)))}
                  className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                Дата продажи / Выручка (€) + Комиссия (€)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={sellDate}
                  onChange={(e) => setSellDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Math.max(0, Number(e.target.value)))}
                  className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={commission}
                  title="Комиссия брокера (Despesas)"
                  onChange={(e) => setCommission(Math.max(0, Number(e.target.value)))}
                  className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 font-mono text-xs text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-[11px] text-slate-400">Срок владения</span>
              <p className="mt-0.5 font-mono text-base font-extrabold text-white">
                {userRowMath.yearsHeld.toFixed(2)} лет
              </p>
              <span className="text-[10px] text-slate-400">{userRowMath.tier.tierLabel}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-[11px] text-slate-400">Прибыль до налога</span>
              <p
                className={`mt-0.5 font-mono text-base font-extrabold ${
                  userRowMath.grossGain >= 0 ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                €{userRowMath.grossGain.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Продажа − Покупка − Комиссии</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-[11px] text-slate-400">Ставка IRS (Lei n.º 31/2024)</span>
              <p className="mt-0.5 font-mono text-base font-extrabold text-cyan-300">
                {userRowMath.tier.effectiveRatePct.toFixed(1)}%
              </p>
              <span className="text-[10px] text-slate-400">
                Скидка {userRowMath.tier.discountPct}% с налоговой базы
              </span>
            </div>
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 p-3">
              <span className="text-[11px] text-emerald-300">Расчётный налог IRS</span>
              <p className="mt-0.5 font-mono text-base font-extrabold text-emerald-300">
                €{userRowMath.taxDue.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">
                Чистыми на руки: €{(sellPrice - userRowMath.taxDue).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: Calendar (.ics) & Custom Local Reminders */}
      <div className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white sm:text-lg">
                Раздел C — Напоминалки (.ics для Apple / Google / Outlook Календаря + локальный список)
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Скачайте готовые события в один клик (импортируются в Apple Calendar, Google Calendar,
              Outlook) или добавьте собственную памятку по дате.
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
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-left transition hover:border-emerald-500/50 hover:bg-slate-900"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                  {preset.label}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Следующая дата: <span className="font-mono text-cyan-300">{preset.dateStr}</span>{' '}
                  • нажми, чтобы скачать <code>.ics</code>
                </p>
              </div>
              <Download className="h-4 w-4 shrink-0 text-emerald-400" />
            </button>
          ))}
        </div>

        {/* Interactive Custom Reminder Form + List */}
        <div className="mt-5 grid gap-4 lg:grid-cols-12">
          <form
            onSubmit={handleAddCustomReminder}
            className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <BellPlus className="h-4 w-4 text-emerald-400" />
              <span>Создать свою напоминалку</span>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Дата напоминания</label>
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Название</label>
              <input
                type="text"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                placeholder="Например: Проверить 5-летний лот VWCE.DE"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Заметка (необязательно)</label>
              <input
                type="text"
                value={newReminderNotes}
                onChange={(e) => setNewReminderNotes(e.target.value)}
                placeholder="Скачать отчёт IBKR и сверить FIFO"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Сохранить напоминание</span>
            </button>
          </form>

          <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Мои сохранённые напоминания ({customReminders.length})
              </span>
              <span className="text-[10px] text-slate-400">Хранятся локально в браузере</span>
            </div>

            {customReminders.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Список напоминаний пуст. Добавьте дату слева или скачайте готовые пресеты выше.
              </p>
            ) : (
              <div className="space-y-2">
                {customReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                          {rem.date}
                        </span>
                        <span className="text-xs font-bold text-white">{rem.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{rem.notes}</p>
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
                        title="Скачать в календарь (.ics)"
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                      >
                        <Download className="h-3 w-3" />
                        <span>.ics</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem.id)}
                        aria-label={`Delete reminder ${rem.title}`}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:text-rose-400"
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
    </section>
  );
};
