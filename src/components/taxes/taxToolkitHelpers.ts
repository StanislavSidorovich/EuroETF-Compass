import type { LanguageMode } from '../../types';
import { tr } from '../../utils/i18n';

export type ToolkitTab = 'deadlines' | 'sample' | 'reminders';

export interface CustomReminder {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string;
}

export const REMINDERS_STORAGE_KEY = 'euroetf_tax_reminders_v1';

export const DEFAULT_CUSTOM_REMINDERS: CustomReminder[] = [
  {
    id: 'default-pt-anexo-j',
    date: `${new Date().getFullYear() + 1}-04-05`,
    title: 'IRS Modelo 3 + Anexo J (Portugal)',
    notes: 'Quadro 9.2A (sales), Quadro 8A (dividends) & Quadro 11 (foreign IBAN) on Portal das Finanças.',
  },
];

export function computeYearsBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

export function getPortugalHoldingDiscount(
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

export function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

export function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function downloadIcsEvent(params: {
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

export function getNextAnnualDate(month: number, day: number): string {
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
