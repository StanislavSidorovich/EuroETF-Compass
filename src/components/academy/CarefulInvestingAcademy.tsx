import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  RotateCcw,
  Scale,
  ShieldCheck,
  Square,
} from 'lucide-react';
import { ACADEMY_LESSONS, CAREFUL_INVESTOR_CHECKLIST } from '../../data/academyContent';
import type { AcademyLesson } from '../../types';

function getHighlightStyle(
  type: NonNullable<AcademyLesson['sections'][number]['highlightBox']>['type']
) {
  switch (type) {
    case 'tip':
      return {
        container: 'border-emerald-500/35 ui-tint-sage',
        title: 'ui-text-sage',
        icon: <Lightbulb className="h-4 w-4 ui-text-sage" />,
      };
    case 'warning':
      return {
        container: 'border-amber-500/35 ui-tint-sand',
        title: 'ui-text-sand',
        icon: <AlertTriangle className="h-4 w-4 ui-text-sand" />,
      };
    case 'math':
      return {
        container: 'border-cyan-500/35 ui-tint-cool',
        title: 'ui-text-cool',
        icon: <Calculator className="h-4 w-4 ui-text-cool" />,
      };
    case 'legal':
      return {
        container: 'border-cyan-500/35 ui-tint-cool',
        title: 'ui-text-cool',
        icon: <Scale className="h-4 w-4 ui-text-cool" />,
      };
  }
}

export const CarefulInvestingAcademy: React.FC = () => {
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const activeLesson = ACADEMY_LESSONS[activeLessonIndex] ?? ACADEMY_LESSONS[0];
  const totalChecklist = CAREFUL_INVESTOR_CHECKLIST.length;
  const checkedCount = CAREFUL_INVESTOR_CHECKLIST.filter(
    (item) => checkedItems[item.id]
  ).length;
  const readinessPct = Math.round((checkedCount / totalChecklist) * 100);

  const toggleChecklistItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setCheckedItems({});
  };

  const markAllChecklist = () => {
    const next: Record<string, boolean> = {};
    for (const item of CAREFUL_INVESTOR_CHECKLIST) {
      next[item.id] = true;
    }
    setCheckedItems(next);
  };

  return (
    <div className="space-y-6">
      {/* Academy Header & Lesson Stepper */}
      <section className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 ui-text-sage" />
              <h2 className="text-lg font-bold ui-text-primary sm:text-xl">
                Careful ETF Investing Academy — UCITS, Acc vs. Dist &amp; Risk Control
              </h2>
            </div>
            <p className="mt-1 text-xs ui-text-muted">
              Evidence-based curriculum on why diversified European UCITS ETFs beat stock picking,
              how Accumulating ETFs compound, and how to avoid costly tax traps.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold ui-text-sage">
            5 Core Modules • Pre-Flight Checklist
          </span>
        </div>

        {/* Lesson Stepper Cards */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {ACADEMY_LESSONS.map((lesson, idx) => {
            const active = idx === activeLessonIndex;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonIndex(idx)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                    : 'ui-border-subtle ui-surface-deep hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-[10px] font-bold uppercase ${
                        active ? 'ui-text-sage' : 'ui-text-muted'
                      }`}
                    >
                      Lesson 0{lesson.stepNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] ui-text-muted">
                      <Clock className="h-3 w-3" /> {lesson.readTimeMinutes}m
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug ui-text-primary">
                    {lesson.title}
                  </p>
                </div>
                <span className="mt-2 inline-block text-[10px] font-medium ui-text-cool">
                  {lesson.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Lesson Body */}
        <article className="mt-6 rounded-2xl border ui-border-subtle ui-surface-deep p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b ui-border-subtle pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold ui-text-sage">
                  Step {activeLesson.stepNumber} of {ACADEMY_LESSONS.length}
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold ui-text-cool">
                  {activeLesson.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs ui-text-muted">
                  <Clock className="h-3.5 w-3.5" /> {activeLesson.readTimeMinutes} min read
                </span>
              </div>
              <h3 className="text-lg font-extrabold ui-text-primary sm:text-xl">
                {activeLesson.title}
              </h3>
              <p className="text-xs ui-text-body sm:text-sm">{activeLesson.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLessonIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeLessonIndex === 0}
                className="inline-flex items-center gap-1 rounded-xl border ui-border-default ui-surface-card px-3 py-1.5 text-xs font-semibold ui-text-secondary transition ui-hover-elevated disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveLessonIndex((prev) =>
                    Math.min(ACADEMY_LESSONS.length - 1, prev + 1)
                  )
                }
                disabled={activeLessonIndex === ACADEMY_LESSONS.length - 1}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="mt-4 rounded-xl border border-emerald-500/25 ui-tint-sage p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider ui-text-sage">
              Key Takeaways
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {activeLesson.keyTakeaways.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-xs leading-relaxed ui-text-secondary"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 ui-text-sage" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Sections */}
          <div className="mt-5 space-y-5">
            {activeLesson.sections.map((section) => {
              const box = section.highlightBox
                ? getHighlightStyle(section.highlightBox.type)
                : null;
              return (
                <div key={section.heading} className="space-y-2.5">
                  <h4 className="text-sm font-bold ui-text-primary sm:text-base">
                    {section.heading}
                  </h4>
                  <p className="text-xs leading-relaxed ui-text-body sm:text-sm">
                    {section.body}
                  </p>
                  {section.highlightBox && box && (
                    <div className={`rounded-xl border p-3.5 ${box.container}`}>
                      <div className={`flex items-center gap-2 text-xs font-bold ${box.title}`}>
                        {box.icon}
                        <span>{section.highlightBox.title}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed ui-text-secondary">
                        {section.highlightBox.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Side-by-Side Comparison */}
          {activeLesson.interactiveComparison && (
            <div className="mt-6 grid gap-4 border-t ui-border-subtle pt-5 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/35 ui-tint-sage p-4">
                <h4 className="text-sm font-bold ui-text-sage">
                  {activeLesson.interactiveComparison.leftTitle}
                </h4>
                <ul className="mt-2.5 space-y-2 text-xs ui-text-secondary">
                  {activeLesson.interactiveComparison.leftPoints.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 ui-text-sage" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-500/35 ui-tint-sand p-4">
                <h4 className="text-sm font-bold ui-text-sand">
                  {activeLesson.interactiveComparison.rightTitle}
                </h4>
                <ul className="mt-2.5 space-y-2 text-xs ui-text-secondary">
                  {activeLesson.interactiveComparison.rightPoints.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 ui-text-sand" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* Interactive Pre-Flight Careful Investor Checklist */}
      <section className="fintech-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 ui-text-sage" />
              <h2 className="text-lg font-bold ui-text-primary">
                Pre-Flight Careful Investor Checklist
              </h2>
            </div>
            <p className="mt-1 text-xs ui-text-muted">
              Verify every safety criterion below before committing money to any ETF or broker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-bold tabular-nums ui-text-sage">
              Readiness Score: {checkedCount}/{totalChecklist} ({readinessPct}%)
            </div>
            <button
              type="button"
              onClick={markAllChecklist}
              className="rounded-xl border ui-border-default ui-surface-card px-3 py-1.5 text-xs font-semibold ui-text-secondary transition hover:border-slate-500"
            >
              Check All
            </button>
            <button
              type="button"
              onClick={resetChecklist}
              className="inline-flex items-center gap-1 rounded-xl border ui-border-default ui-surface-card px-3 py-1.5 text-xs font-semibold ui-text-body transition hover:border-slate-500"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Readiness Progress Bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full ui-surface-elevated">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                checkedCount === totalChecklist
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>
          {checkedCount === totalChecklist && (
            <p className="mt-2 text-xs font-semibold ui-text-sage">
              8/8 Verified — You have checked UCITS custody, Irish domicile treaty efficiency,
              country Acc/Dist tax impact, low TER/TD, fund liquidity, diversification, local
              registries, and emergency reserves.
            </p>
          )}
        </div>

        {/* Checklist Items */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CAREFUL_INVESTOR_CHECKLIST.map((item) => {
            const isChecked = Boolean(checkedItems[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklistItem(item.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  isChecked
                    ? 'border-emerald-500/50 ui-tint-sage'
                    : 'ui-border-subtle ui-surface-deep hover:border-slate-500'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 ui-text-sage" />
                  ) : (
                    <Square className="h-5 w-5 ui-text-subtle" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded ui-surface-elevated px-2 py-0.5 text-[10px] font-semibold ui-text-cool">
                      {item.category}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-bold leading-snug sm:text-sm ${
                      isChecked ? 'ui-text-sage' : 'ui-text-primary'
                    }`}
                  >
                    {item.question}
                  </p>
                  <p className="text-[11px] leading-relaxed ui-text-muted">
                    {item.whyItMatters}
                  </p>
                  <p className="text-[11px] font-medium ui-text-sage">
                    Target: {item.recommendedTarget}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
