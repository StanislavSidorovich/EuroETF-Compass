import React, { useState } from 'react';
import {
  Quote,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Clock,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { ThemeMode } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';

interface WisdomQuote {
  id: string;
  authorEn: string;
  authorRu: string;
  roleEn: string;
  roleRu: string;
  tagEn: string;
  tagRu: string;
  quoteEn: string;
  quoteRu: string;
  practicalTakeawayEn: string;
  practicalTakeawayRu: string;
}

const INVESTOR_QUOTES: WisdomQuote[] = [
  {
    id: 'bogle',
    authorEn: 'John C. Bogle',
    authorRu: 'Джон Богл (John C. Bogle)',
    roleEn: 'Founder of Vanguard & creator of the world’s first index fund',
    roleRu: 'Основатель Vanguard и создатель первого в мире индексного фонда',
    tagEn: 'Broad ETF Philosophy',
    tagRu: 'Философия широких ETF',
    quoteEn: '“Don’t look for the needle in the haystack. Just buy the haystack!”',
    quoteRu: '«Не ищите иголку в стоге сена. Просто купите весь стог сена!»',
    practicalTakeawayEn:
      'Buying a single broad UCITS ETF (e.g., VWCE or IWDA) immediately makes you a co-owner of 1,500–3,600 leading companies worldwide without single-company bankruptcy risk.',
    practicalTakeawayRu:
      'Покупая один широкий UCITS ETF (например, VWCE или IWDA), вы сразу становитесь совладельцем 1 500–3 600 крупнейших компаний мира без риска банкротства отдельной фирмы.',
  },
  {
    id: 'munger',
    authorEn: 'Charlie Munger',
    authorRu: 'Чарли Мангер (Charlie Munger)',
    roleEn: 'Vice Chairman of Berkshire Hathaway, partner of Warren Buffett',
    roleRu: 'Вице-председатель Berkshire Hathaway, партнёр Уоррена Баффетта',
    tagEn: 'Compounding & Acc ETFs',
    tagRu: 'Магия сложного процента и Acc ETF',
    quoteEn: '“The first rule of compounding: Never interrupt it unnecessarily.”',
    quoteRu:
      '«Первое правило сложного процента: никогда не прерывайте его работу без крайней необходимости.»',
    practicalTakeawayEn:
      'That is why Accumulating (Acc) ETFs beat Distributing (Dist) ETFs in Portugal and most of Europe: dividends compound inside the fund without an annual 26–28% tax drag.',
    practicalTakeawayRu:
      'Именно поэтому аккумулирующие (Acc) ETF побеждают дивидендные (Dist) в Португалии и большинстве стран ЕС: дивиденды реинвестируются внутри фонда без ежегодного вычета 26–28% налога.',
  },
  {
    id: 'buffett',
    authorEn: 'Warren Buffett',
    authorRu: 'Уоррен Баффетт (Warren Buffett)',
    roleEn: 'Chairman of Berkshire Hathaway, legendary long-term investor',
    roleRu: 'Глава Berkshire Hathaway, легендарный долгосрочный инвестор',
    tagEn: 'Patience & Tax Discounts',
    tagRu: 'Терпение и налоговая льгота',
    quoteEn:
      '“The stock market is a device for transferring money from the impatient to the patient.”',
    quoteRu:
      '«Фондовый рынок — это механизм перераспределения денег от нетерпеливых к терпеливым.»',
    practicalTakeawayEn:
      'In Portugal, Lei n.º 31/2024 literally pays you for patience: holding an ETF for over 8 years reduces the capital gains tax rate from 28% down to 19.6%.',
    practicalTakeawayRu:
      'В Португалии закон Lei n.º 31/2024 буквально платит вам за терпение: при удержании актива дольше 8 лет налог на прирост капитала снижается с 28% до 19.6%.',
  },
  {
    id: 'samuelson',
    authorEn: 'Paul Samuelson',
    authorRu: 'Пол Самуэльсон (Paul Samuelson)',
    roleEn: 'Nobel Memorial Prize laureate in Economic Sciences',
    roleRu: 'Лауреат Нобелевской премии по экономике',
    tagEn: 'Careful Investing, No Casino',
    tagRu: 'Осторожный подход без казино',
    quoteEn:
      '“Investing should be more like watching paint dry or watching grass grow. If you want excitement, take $800 and go to Las Vegas.”',
    quoteRu:
      '«Инвестирование должно напоминать наблюдение за тем, как сохнет краска или как растёт трава. Если вам нужен азарт — возьмите $800 и поезжайте в Лас-Вегас.»',
    practicalTakeawayEn:
      'A boring monthly savings plan (Sparplan) into a global ETF outperforms ~88% of active traders over 10–15 years thanks to ultra-low fees (TER 0.07%–0.22%) and discipline.',
    practicalTakeawayRu:
      'Скучный ежемесячный план (Sparplan) в глобальный ETF обгоняет 88% активных трейдеров на дистанции 10–15 лет за счёт низких комиссий (TER 0.07%–0.22%) и дисциплины.',
  },
  {
    id: 'housel',
    authorEn: 'Morgan Housel',
    authorRu: 'Морган Хаузел (Morgan Housel)',
    roleEn: 'Author of “The Psychology of Money”',
    roleRu: 'Автор мирового бестселлера «Психология денег»',
    tagEn: 'True Meaning of Capital',
    tagRu: 'Истинная ценность капитала',
    quoteEn:
      '“Wealth is what you don’t see. It’s financial assets that haven’t yet been converted into the stuff you see.”',
    quoteRu:
      '«Настоящее богатство — это то, чего не видно. Это не купленные в кредит машины, а финансовая свобода и контроль над собственным временем.»',
    practicalTakeawayEn:
      'Every monthly contribution buys your future independence—the moment when your portfolio generates more than your daily expenses.',
    practicalTakeawayRu:
      'Каждое пополнение портфеля — это покупка вашей будущей независимости, когда ваш капитал начинает приносить больше, чем вы тратите.',
  },
  {
    id: 'graham',
    authorEn: 'Benjamin Graham',
    authorRu: 'Бенджамин Грэм (Benjamin Graham)',
    roleEn: 'Author of “The Intelligent Investor”, mentor to Warren Buffett',
    roleRu: 'Автор книги «Разумный инвестор», учитель Уоррена Баффетта',
    tagEn: 'Emotional Discipline',
    tagRu: 'Защита от эмоций',
    quoteEn:
      '“The investor’s chief problem—and even his worst enemy—is likely to be himself.”',
    quoteRu:
      '«Главная проблема инвестора — и даже его худший враг — это, скорее всего, он сам.»',
    practicalTakeawayEn:
      'A written plan, understanding your country’s tax rules, and diversifying across global ETFs and blue-chip giants protect you from panic selling during dips.',
    practicalTakeawayRu:
      'Чёткий план, понимание налогов своей страны и диверсификация между мировыми ETF и надёжными гигантами защищают от панических продаж на просадках.',
  },
];

interface HabitPreset {
  id: string;
  labelEn: string;
  labelRu: string;
  monthlyEur: number;
}

const HABIT_PRESETS: HabitPreset[] = [
  {
    id: 'coffee',
    labelEn: '☕ €4/day (Coffee)',
    labelRu: '☕ €4 в день (Кофе)',
    monthlyEur: 120,
  },
  {
    id: 'dinner',
    labelEn: '🍽️ €10/day (Habit)',
    labelRu: '🍽️ €10 в день (Привычка)',
    monthlyEur: 300,
  },
  {
    id: 'freedom',
    labelEn: '🚀 €20/day (Capital)',
    labelRu: '🚀 €20 в день (Капитал)',
    monthlyEur: 600,
  },
];

interface InvestorWisdomBannerProps {
  theme?: ThemeMode;
  onNavigateTab?: (tab: 'calculator' | 'taxes' | 'ecosystem' | 'academy') => void;
}

function computeFutureValue(monthlyEur: number, years: number, annualRate = 0.088): number {
  const months = years * 12;
  const r = Math.pow(1 + annualRate, 1 / 12) - 1;
  return Math.round(monthlyEur * ((Math.pow(1 + r, months) - 1) / r));
}

export const InvestorWisdomBanner: React.FC<InvestorWisdomBannerProps> = ({
  theme = 'light',
  onNavigateTab,
}) => {
  const { lang } = useAppPreferences();
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [selectedHabitIdx, setSelectedHabitIdx] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentQuote = INVESTOR_QUOTES[quoteIdx];
  const currentHabit = HABIT_PRESETS[selectedHabitIdx];

  const invested15Y = currentHabit.monthlyEur * 12 * 15;
  const total15Y = computeFutureValue(currentHabit.monthlyEur, 15, 0.088);
  const pureGrowth15Y = total15Y - invested15Y;

  const isLight = theme === 'light';

  const handlePrev = () => {
    setQuoteIdx((prev) => (prev === 0 ? INVESTOR_QUOTES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setQuoteIdx((prev) => (prev + 1) % INVESTOR_QUOTES.length);
  };

  return (
    <section
      className={`border-b transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-[#eef5f1] via-[#f6f9f7] to-[#eef4f1] border-slate-200/90'
          : 'bg-gradient-to-r from-slate-900/95 via-[#0f241c]/80 to-slate-900/95 border-slate-800/80'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${isCollapsed ? 'py-2' : 'py-3.5'}`}>
        {isCollapsed ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isLight
                    ? 'bg-[#e3f1ea] text-[#1f6e4b] border border-[#b8decb]'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                <Quote className="w-3 h-3" />
                {tr(lang, currentQuote.authorEn, currentQuote.authorRu)}
              </span>
              <span className={`truncate italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {tr(lang, currentQuote.quoteEn, currentQuote.quoteRu)}
              </span>
              <span className="hidden md:inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                €{currentHabit.monthlyEur}/{tr(lang, 'mo', 'мес')} → €{total15Y.toLocaleString('en-US')} (15Y)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>
                {tr(
                  lang,
                  'Show investor wisdom & habit builder',
                  'Показать мудрость инвесторов и тренажёр привычек'
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  isLight
                    ? 'border-slate-300 bg-white/80 text-slate-600 hover:bg-white'
                    : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{tr(lang, 'Collapse quotes', 'Свернуть цитаты')}</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left 7 Cols: Rotating Investor Wisdom & Practical Meaning */}
              <div
                className={`lg:col-span-7 rounded-xl p-4 border flex flex-col justify-between transition-all ${
                  isLight
                    ? 'bg-white/95 border-slate-200/90 shadow-xs'
                    : 'bg-slate-900/90 border-slate-800/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                          isLight
                            ? 'bg-[#e3f1ea] text-[#1f6e4b] border border-[#b8decb]'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        <Quote className="w-3 h-3" />
                        {tr(lang, 'Capital Wisdom', 'Мудрость капитала')} · {quoteIdx + 1}/
                        {INVESTOR_QUOTES.length}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                          isLight
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                            : 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {tr(lang, currentQuote.tagEn, currentQuote.tagRu)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        title={tr(lang, 'Previous quote', 'Предыдущая цитата')}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLight
                            ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        title={tr(lang, 'Next quote', 'Следующая цитата')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                          isLight
                            ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            : 'border-slate-700 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span>{tr(lang, 'Next quote', 'Ещё мысль')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <blockquote
                    className={`text-sm sm:text-base font-semibold leading-snug mb-1.5 ${
                      isLight ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {tr(lang, currentQuote.quoteEn, currentQuote.quoteRu)}
                  </blockquote>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
                    <span className="font-semibold text-[#2d8a61]">
                      {tr(lang, currentQuote.authorEn, currentQuote.authorRu)}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      {tr(lang, currentQuote.roleEn, currentQuote.roleRu)}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed border flex items-start gap-2 ${
                    isLight
                      ? 'bg-[#f3f8f5] border-[#cce5d8] text-slate-700'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#2d8a61] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#2d8a61]">
                      {tr(lang, 'How it works here: ', 'Как это работает здесь: ')}
                    </span>
                    {tr(
                      lang,
                      currentQuote.practicalTakeawayEn,
                      currentQuote.practicalTakeawayRu
                    )}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Interactive "Habit to Capital" Engagement Micro-Widget */}
              <div
                className={`lg:col-span-5 rounded-xl p-4 border flex flex-col justify-between ${
                  isLight
                    ? 'bg-white/95 border-slate-200/90 shadow-xs'
                    : 'bg-slate-900/90 border-slate-800/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2d8a61]">
                      <Clock className="w-3.5 h-3.5" />
                      {tr(lang, 'Power of Time & Habits', 'Сила времени и дисциплины')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {tr(lang, '15-Year Horizon (~8.8% CAGR)', 'Горизонт 15 лет (при ~8.8% CAGR)')}
                    </span>
                  </div>

                  {/* 3 Habit Selector Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {HABIT_PRESETS.map((preset, idx) => {
                      const active = idx === selectedHabitIdx;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedHabitIdx(idx)}
                          className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                            active
                              ? 'bg-[#2d8a61] text-white border-[#2d8a61] shadow-xs'
                              : isLight
                                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[11px] font-semibold leading-tight truncate">
                            {tr(lang, preset.labelEn, preset.labelRu)}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              active ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            €{preset.monthlyEur}/{tr(lang, 'mo', 'мес')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Result Comparison Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-2.5">
                    <div
                      className={`rounded-lg p-2 border ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">
                        {tr(lang, 'Contributed', 'Внесено лично')}
                      </div>
                      <div className="text-sm font-bold tabular-nums">
                        €{invested15Y.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div
                      className={`rounded-lg p-2 border ${
                        isLight
                          ? 'bg-[#eef7f2] border-[#c2e0d0]'
                          : 'bg-emerald-950/30 border-emerald-800/50'
                      }`}
                    >
                      <div className="text-[10px] text-[#2d8a61] font-medium">
                        {tr(lang, 'Net Growth (Acc)', 'Чистый рост (Acc)')}
                      </div>
                      <div className="text-sm font-bold text-[#2d8a61] tabular-nums">
                        +€{pureGrowth15Y.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div
                      className={`rounded-lg p-2 border ${
                        isLight
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-amber-950/30 border-amber-800/50'
                      }`}
                    >
                      <div className="text-[10px] text-amber-600 font-semibold">
                        {tr(lang, 'Total Capital', 'Итоговый капитал')}
                      </div>
                      <div className="text-sm font-extrabold text-amber-600 tabular-nums">
                        €{total15Y.toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/20 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a61]" />
                    {tr(lang, 'Money works while you rest', 'Деньги работают, пока вы отдыхаете')}
                  </span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('academy')}
                      className="inline-flex items-center gap-1 font-semibold text-[#2d8a61] hover:underline"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>
                        {tr(lang, 'How to start carefully →', 'Как начать без ошибок →')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
