import React, { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import type { CountryTaxRule } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';
import { AnexoJSampleTab } from './AnexoJSampleTab';
import { TaxDeadlinesTab } from './TaxDeadlinesTab';
import { TaxRemindersTab } from './TaxRemindersTab';
import {
  type CustomReminder,
  DEFAULT_CUSTOM_REMINDERS,
  REMINDERS_STORAGE_KEY,
  type ToolkitTab,
} from './taxToolkitHelpers';

interface TaxFilingToolkitProps {
  selectedCountry: CountryTaxRule;
}

export const TaxFilingToolkit: React.FC<TaxFilingToolkitProps> = ({ selectedCountry }) => {
  const { lang } = useAppPreferences();
  const [activeTab, setActiveTab] = useState<ToolkitTab>('deadlines');

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

  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(customReminders));
    } catch {
      // ignore storage errors
    }
  }, [customReminders]);

  const handleAddReminder = (item: CustomReminder) => {
    setCustomReminders((prev) => [item, ...prev]);
  };

  const handleDeleteReminder = (id: string) => {
    setCustomReminders((prev) => prev.filter((item) => item.id !== id));
  };

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

      {activeTab === 'deadlines' && <TaxDeadlinesTab selectedCountry={selectedCountry} />}

      {activeTab === 'sample' && <AnexoJSampleTab />}

      {activeTab === 'reminders' && (
        <TaxRemindersTab
          customReminders={customReminders}
          onAddReminder={handleAddReminder}
          onDeleteReminder={handleDeleteReminder}
        />
      )}
    </section>
  );
};
