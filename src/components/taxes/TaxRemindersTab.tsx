import React, { useState } from 'react';
import {
  BellPlus,
  CalendarClock,
  CheckCircle2,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import {
  type CustomReminder,
  downloadIcsEvent,
  getNextAnnualDate,
} from './taxToolkitHelpers';

interface TaxRemindersTabProps {
  customReminders: CustomReminder[];
  onAddReminder: (reminder: CustomReminder) => void;
  onDeleteReminder: (id: string) => void;
}

export const TaxRemindersTab: React.FC<TaxRemindersTabProps> = ({
  customReminders,
  onAddReminder,
  onDeleteReminder,
}) => {
  const { lang } = useAppPreferences();
  const [newReminderDate, setNewReminderDate] = useState(() => getNextAnnualDate(4, 10));
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');

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
    onAddReminder(item);
    setNewReminderTitle('');
    setNewReminderNotes('');
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

  return (
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
                      onClick={() => onDeleteReminder(rem.id)}
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
  );
};
