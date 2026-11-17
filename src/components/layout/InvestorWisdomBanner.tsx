import React, { useState } from 'react';
import {
  Quote,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { ThemeMode } from '../../types';

interface WisdomQuote {
  id: string;
  author: string;
  role: string;
  tag: string;
  quoteRu: string;
  quoteOriginal: string;
  practicalTakeaway: string;
}

const INVESTOR_QUOTES: WisdomQuote[] = [
  {
    id: 'bogle',
    author: 'Джон Богл (John C. Bogle)',
    role: 'Основатель Vanguard и создатель первого в мире индексного фонда',
    tag: 'Философия широких ETF',
    quoteRu: '«Не ищите иголку в стоге сена. Просто купите весь стог сена!»',
    quoteOriginal: 'Don’t look for the needle in the haystack. Just buy the haystack!',
    practicalTakeaway:
      'Покупая один широкий UCITS ETF (например, VWCE или IWDA), вы сразу становитесь совладельцем 1 500–3 600 крупнейших компаний мира без риска банкротства отдельной фирмы.',
  },
  {
    id: 'munger',
    author: 'Чарли Мангер (Charlie Munger)',
    role: 'Вице-председатель Berkshire Hathaway, партнёр Уоррена Баффетта',
    tag: 'Магия сложного процента и Acc ETF',
    quoteRu:
      '«Первое правило сложного процента: никогда не прерывайте его работу без крайней необходимости.»',
    quoteOriginal: 'The first rule of compounding: Never interrupt it unnecessarily.',
    practicalTakeaway:
      'Именно поэтому аккумулирующие (Acc) ETF побеждают дивидендные (Dist) в Португалии и большинстве стран ЕС: дивиденды реинвестируются внутри фонда без ежегодного вычета 26–28% налога.',
  },
  {
    id: 'buffett',
    author: 'Уоррен Баффетт (Warren Buffett)',
    role: 'Глава Berkshire Hathaway, легендарный долгосрочный инвестор',
    tag: 'Терпение и налоговая льгота',
    quoteRu:
      '«Фондовый рынок — это механизм перераспределения денег от нетерпеливых к терпеливым.»',
    quoteOriginal:
      'The stock market is a device for transferring money from the impatient to the patient.',
    practicalTakeaway:
      'В Португалии закон Lei n.º 31/2024 буквально платит вам за терпение: при удержании актива дольше 8 лет налог на прирост капитала снижается с 28% до 19.6%.',
  },
  {
    id: 'samuelson',
    author: 'Пол Самуэльсон (Paul Samuelson)',
    role: 'Лауреат Нобелевской премии по экономике',
    tag: 'Осторожный подход без казино',
    quoteRu:
      '«Инвестирование должно напоминать наблюдение за тем, как сохнет краска или как растёт трава. Если вам нужен азарт — возьмите $800 и поезжайте в Лас-Вегас.»',
    quoteOriginal:
      'Investing should be more like watching paint dry or watching grass grow.',
    practicalTakeaway:
      'Скучный ежемесячный план (Sparplan) в глобальный ETF обгоняет 88% активных трейдеров на дистанции 10–15 лет за счёт низких комиссий (TER 0.07%–0.22%) и дисциплины.',
  },
  {
    id: 'housel',
    author: 'Морган Хаузел (Morgan Housel)',
    role: 'Автор мирового бестселлера «Психология денег»',
    tag: 'Истинная ценность капитала',
    quoteRu:
      '«Настоящее богатство — это то, чего не видно. Это не купленные в кредит машины, а финансовая свобода и контроль над собственным временем.»',
    quoteOriginal:
      'Wealth is what you don’t see. It’s financial assets that haven’t yet been converted into the stuff you see.',
    practicalTakeaway:
      'Каждое пополнение портфеля — это покупка вашей будущей независимости, когда ваш капитал начинает приносить больше, чем вы тратите.',
  },
  {
    id: 'graham',
    author: 'Бенджамин Грэм (Benjamin Graham)',
    role: 'Автор книги «Разумный инвестор», учитель Уоррена Баффетта',
    tag: 'Защита от эмоций',
    quoteRu:
      '«Главная проблема инвестора — и даже его худший враг — это, скорее всего, он сам.»',
    quoteOriginal:
      'The investor’s chief problem—and even his worst enemy—is likely to be himself.',
    practicalTakeaway:
      'Чёткий план, понимание налогов своей страны и диверсификация между мировыми ETF и надёжными гигантами защищают от панических продаж на просадках.',
  },
];

interface HabitPreset {
  id: string;
  label: string;
  subtitle: string;
  monthlyEur: number;
}

const HABIT_PRESETS: HabitPreset[] = [
  {
    id: 'coffee',
    label: '☕ €4 в день (Кофе / мелочи)',
    subtitle: '€120 / месяц в Acc ETF',
    monthlyEur: 120,
  },
  {
    id: 'dinner',
    label: '🍽️ €10 в день (Привычка)',
    subtitle: '€300 / месяц в Acc ETF',
    monthlyEur: 300,
  },
  {
    id: 'freedom',
    label: '🚀 €20 в день (Фокус на капитал)',
    subtitle: '€600 / месяц в Acc ETF',
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
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [selectedHabitIdx, setSelectedHabitIdx] = useState(1);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                    Мудрость капитала · {quoteIdx + 1}/{INVESTOR_QUOTES.length}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      isLight
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                        : 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                    }`}
                  >
                    {currentQuote.tag}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    title="Предыдущая цитата"
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
                    title="Следующая цитата"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      isLight
                        ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <span>Ещё мысль</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <blockquote
                className={`text-sm sm:text-base font-semibold leading-snug mb-1.5 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {currentQuote.quoteRu}
              </blockquote>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
                <span className="font-semibold text-[#2d8a61]">{currentQuote.author}</span>
                <span>•</span>
                <span className="truncate">{currentQuote.role}</span>
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
                <span className="font-semibold text-[#2d8a61]">Как это работает здесь: </span>
                {currentQuote.practicalTakeaway}
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
                  Сила времени и дисциплины
                </span>
                <span className="text-[11px] text-slate-400">Горизонт 15 лет (при ~8.8% CAGR)</span>
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
                        {preset.label}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          active ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        €{preset.monthlyEur}/мес
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
                  <div className="text-[10px] text-slate-400">Внесено лично</div>
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
                    Чистый рост (Acc)
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
                  <div className="text-[10px] text-amber-600 font-semibold">Итоговый капитал</div>
                  <div className="text-sm font-extrabold text-amber-600 tabular-nums">
                    €{total15Y.toLocaleString('en-US')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/20 text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a61]" />
                Деньги работают, пока вы отдыхаете
              </span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('academy')}
                  className="inline-flex items-center gap-1 font-semibold text-[#2d8a61] hover:underline"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Как начать без ошибок →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
