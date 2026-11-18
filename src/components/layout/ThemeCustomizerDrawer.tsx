import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Layers,
  Minimize2,
  Maximize2,
  Palette,
  RotateCcw,
  Sliders,
  Square,
  Type,
  X,
} from 'lucide-react';
import type { FontFamilyOption, FontSizeOption, ThemeMode } from '../../types';
import { tr, useAppPreferences } from '../../utils/i18n';
import {
  type BorderStyleOption,
  type BorderWidthOption,
  DEFAULT_DARK_CONFIG,
  DEFAULT_LIGHT_CONFIG,
  type HslColor,
  type ModeThemeConfig,
  THEME_PRESETS,
  type ThemeStudioState,
  buildThemeExportJson,
  downloadThemeJsonFile,
  formatThemeCssSnippet,
  hexToHsl,
  hslToCss,
  hslToHex,
  isModeConfigDefault,
} from '../../utils/themeCustomizer';

interface ThemeCustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  studioState: ThemeStudioState;
  onChangeStudioState: (next: ThemeStudioState) => void;
  fontFamily: FontFamilyOption;
  onChangeFontFamily: (font: FontFamilyOption) => void;
}

type StudioSectionTab = 'presets' | 'bg' | 'text' | 'accents' | 'borders';

const QUICK_ACCENT_SWATCHES: Array<{ label: string; hsl: HslColor }> = [
  { label: 'Sage', hsl: { h: 153, s: 51, l: 36 } },
  { label: 'Olive', hsl: { h: 82, s: 38, l: 34 } },
  { label: 'Teal', hsl: { h: 184, s: 56, l: 32 } },
  { label: 'Steel', hsl: { h: 209, s: 32, l: 38 } },
  { label: 'Cobalt', hsl: { h: 221, s: 64, l: 46 } },
  { label: 'Indigo', hsl: { h: 245, s: 44, l: 48 } },
  { label: 'Terracotta', hsl: { h: 18, s: 56, l: 42 } },
  { label: 'Sand', hsl: { h: 38, s: 52, l: 40 } },
];

interface HslControlGroupProps {
  title: string;
  color: HslColor;
  onChange: (next: HslColor) => void;
  lMin?: number;
  lMax?: number;
  sMax?: number;
  swatches?: Array<{ label: string; hsl: HslColor }>;
  lang: 'en' | 'ru';
}

const HslControlGroup: React.FC<HslControlGroupProps> = ({
  title,
  color,
  onChange,
  lMin = 5,
  lMax = 95,
  sMax = 95,
  swatches,
  lang,
}) => {
  const hexValue = hslToHex(color);

  return (
    <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold ui-text-primary">{title}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] ui-text-muted">{hexValue.toUpperCase()}</span>
          <label className="relative flex h-6 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-md border ui-border-default">
            <span
              className="h-full w-full"
              style={{ backgroundColor: hslToCss(color) }}
            />
            <input
              type="color"
              value={hexValue}
              aria-label={title}
              onChange={(e) => {
                const parsed = hexToHsl(e.target.value);
                if (parsed) {
                  onChange({
                    h: parsed.h,
                    s: Math.min(sMax, parsed.s),
                    l: Math.max(lMin, Math.min(lMax, parsed.l)),
                  });
                }
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      {swatches && swatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((sw) => (
            <button
              key={sw.label}
              type="button"
              title={sw.label}
              onClick={() =>
                onChange({
                  h: sw.hsl.h,
                  s: Math.min(sMax, sw.hsl.s),
                  l: Math.max(lMin, Math.min(lMax, sw.hsl.l)),
                })
              }
              className="h-5 w-5 rounded-full border ui-border-default transition hover:scale-110"
              style={{ backgroundColor: hslToCss(sw.hsl) }}
            />
          ))}
        </div>
      )}

      {/* Hue */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] ui-text-muted">
          <span>{tr(lang, 'Hue', 'Оттенок')}</span>
          <span className="font-mono">{Math.round(color.h)}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(color.h)}
          onChange={(e) => onChange({ ...color, h: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg"
          style={{
            background:
              'linear-gradient(to right, #dc2626, #ca8a04, #16a34a, #0d9488, #2563eb, #7c3aed, #db2777, #dc2626)',
          }}
        />
      </div>

      {/* Saturation */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] ui-text-muted">
          <span>{tr(lang, 'Saturation', 'Насыщенность')}</span>
          <span className="font-mono">{Math.round(color.s)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={sMax}
          value={Math.round(color.s)}
          onChange={(e) => onChange({ ...color, s: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Brightness / Lightness */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] ui-text-muted">
          <span>{tr(lang, 'Brightness', 'Яркость')}</span>
          <span className="font-mono">{Math.round(color.l)}%</span>
        </div>
        <input
          type="range"
          min={lMin}
          max={lMax}
          value={Math.round(color.l)}
          onChange={(e) => onChange({ ...color, l: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};

export const ThemeCustomizerDrawer: React.FC<ThemeCustomizerDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  studioState,
  onChangeStudioState,
  fontFamily,
  onChangeFontFamily,
}) => {
  const { lang, fontSize, setFontSize } = useAppPreferences();
  const [section, setSection] = useState<StudioSectionTab>('presets');
  const [dockLeft, setDockLeft] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const currentConfig: ModeThemeConfig = isLight ? studioState.light : studioState.dark;
  const isDefault = isModeConfigDefault(currentConfig, theme);

  const updateCurrentMode = (patch: Partial<ModeThemeConfig>) => {
    const updated: ModeThemeConfig = { ...currentConfig, ...patch };
    onChangeStudioState({
      ...studioState,
      [theme]: updated,
    });
  };

  const handleResetMode = () => {
    onChangeStudioState({
      ...studioState,
      [theme]: isLight ? DEFAULT_LIGHT_CONFIG : DEFAULT_DARK_CONFIG,
    });
  };

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(formatThemeCssSnippet(theme, currentConfig));
      setCopiedCss(true);
      globalThis.setTimeout(() => setCopiedCss(false), 2000);
    } catch {
      setCopiedCss(false);
    }
  };

  const handleCopyJson = async () => {
    const json = buildThemeExportJson({
      theme,
      fontFamily,
      fontSize,
      studioState,
    });
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      globalThis.setTimeout(() => setCopiedJson(false), 2500);
    } catch {
      downloadThemeJsonFile(json);
    }
  };

  const handleDownloadJson = () => {
    const json = buildThemeExportJson({
      theme,
      fontFamily,
      fontSize,
      studioState,
    });
    downloadThemeJsonFile(json);
  };

  const sectionTabs: Array<{
    id: StudioSectionTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'presets', label: tr(lang, 'Presets', 'Готовые'), icon: <Sliders className="h-3.5 w-3.5" /> },
    { id: 'bg', label: tr(lang, 'Background', 'Фон и Блоки'), icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'text', label: tr(lang, 'Text & Font', 'Шрифт'), icon: <Type className="h-3.5 w-3.5" /> },
    { id: 'accents', label: tr(lang, 'Tabs & Steps', 'Вкладки и Шаги'), icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'borders', label: tr(lang, 'Borders', 'Границы'), icon: <Square className="h-3.5 w-3.5" /> },
  ];

  return (
    <aside
      aria-label={tr(lang, 'Color & Theme Studio', 'Студия цветовой схемы')}
      className={`fixed bottom-4 z-50 w-[min(94vw,390px)] rounded-2xl border ui-border-default ui-surface-card-solid shadow-2xl transition-all ${
        dockLeft ? 'left-4' : 'right-4'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 border-b ui-border-subtle px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="ui-soft-pill inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
            <Palette className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold ui-text-primary sm:text-sm">
              {tr(lang, 'Color & Theme Studio', 'Настройка цветовой схемы')}
            </h2>
            <p className="truncate text-[10px] ui-text-muted">
              {isLight
                ? tr(lang, 'Editing Light mode live', 'Живая настройка Светлой темы')
                : tr(lang, 'Editing Dark mode live', 'Живая настройка Тёмной темы')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            title={tr(lang, 'Switch Light/Dark mode', 'Переключить Светлую/Тёмную тему')}
            className="rounded-lg border ui-border-default ui-surface-elevated px-2 py-1 text-[10px] font-bold ui-text-secondary ui-hover-elevated"
          >
            {isLight ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            onClick={() => setDockLeft((p) => !p)}
            title={tr(lang, 'Move panel left/right', 'Перенести панель влево/вправо')}
            className="rounded-lg border ui-border-default ui-surface-elevated px-2 py-1 text-[10px] font-bold ui-text-secondary ui-hover-elevated"
          >
            {dockLeft ? '→' : '←'}
          </button>
          <button
            type="button"
            onClick={() => setMinimized((p) => !p)}
            title={minimized ? tr(lang, 'Expand', 'Развернуть') : tr(lang, 'Minimize', 'Свернуть')}
            className="rounded-lg p-1 ui-text-muted ui-hover-elevated"
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr(lang, 'Close color studio', 'Закрыть настройку цветов')}
            className="rounded-lg p-1 ui-text-muted ui-hover-elevated"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Section Switcher Pills */}
          <div className="flex flex-wrap gap-1 border-b ui-border-subtle px-3 py-2">
            {sectionTabs.map((t) => {
              const active = section === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSection(t.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                    active
                      ? 'ui-selected-pill'
                      : 'ui-border-default ui-surface-deep ui-text-body ui-hover-elevated'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Controls Body */}
          <div className="max-h-[56vh] overflow-y-auto p-3.5 space-y-3">
            {section === 'presets' && (
              <div className="space-y-2">
                <p className="text-[11px] ui-text-muted">
                  {tr(
                    lang,
                    'Pick a starting palette and fine-tune any section (background, text, tabs, steps, borders) using the tabs above:',
                    'Выберите готовую основу и при желании докрутите любой блок (фон, шрифт, вкладки, шаги, границы) во вкладках выше:'
                  )}
                </p>
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChangeStudioState({
                        light: preset.light,
                        dark: preset.dark,
                      })
                    }
                    className="flex w-full items-center justify-between gap-2.5 rounded-xl border ui-border-default ui-surface-deep p-2.5 text-left transition hover:border-emerald-500/60 ui-hover-elevated"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold ui-text-primary">
                        {tr(lang, preset.nameEn, preset.nameRu)}
                      </div>
                      <div className="text-[11px] ui-text-muted">
                        {tr(lang, preset.descEn, preset.descRu)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {preset.previewSwatches.map((hex, i) => (
                        <span
                          key={`${preset.id}-${i}`}
                          className="h-4 w-4 rounded-full border ui-border-default"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {section === 'bg' && (
              <div className="space-y-3">
                <HslControlGroup
                  title={tr(lang, 'Page Background', 'Фон страницы')}
                  color={currentConfig.background}
                  onChange={(background) => updateCurrentMode({ background })}
                  lMin={isLight ? 84 : 3}
                  lMax={isLight ? 100 : 20}
                  sMax={45}
                  lang={lang}
                />

                <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold ui-text-primary">
                    <span>{tr(lang, 'Card Surface Brightness Offset', 'Контраст карточек к фону')}</span>
                    <span className="font-mono text-[11px] ui-text-muted">
                      {currentConfig.cardLightnessOffset >= 0 ? '+' : ''}
                      {currentConfig.cardLightnessOffset}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-8}
                    max={12}
                    value={currentConfig.cardLightnessOffset}
                    onChange={(e) =>
                      updateCurrentMode({ cardLightnessOffset: Number(e.target.value) })
                    }
                    className="h-2 w-full cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[10px] ui-text-muted">
                    {tr(
                      lang,
                      'Makes cards slightly brighter or darker than the main page background.',
                      'Делает карточки светлее или темнее относительно общего фона страницы.'
                    )}
                  </p>
                </div>
              </div>
            )}

            {section === 'text' && (
              <div className="space-y-3">
                <HslControlGroup
                  title={tr(lang, 'Primary Text Color', 'Цвет основного шрифта')}
                  color={currentConfig.text}
                  onChange={(text) => updateCurrentMode({ text })}
                  lMin={isLight ? 4 : 70}
                  lMax={isLight ? 35 : 98}
                  sMax={65}
                  lang={lang}
                />

                <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold ui-text-primary">
                    <span>{tr(lang, 'Secondary / Muted Text Contrast', 'Контраст подписей и пояснений')}</span>
                    <span className="font-mono text-[11px] ui-text-muted">
                      {currentConfig.mutedContrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={85}
                    value={currentConfig.mutedContrast}
                    onChange={(e) =>
                      updateCurrentMode({ mutedContrast: Number(e.target.value) })
                    }
                    className="h-2 w-full cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3 space-y-2">
                  <div className="text-xs font-bold ui-text-primary">
                    {tr(lang, 'Font Family & Size', 'Гарнитура и размер шрифта')}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'inter', label: 'Inter' },
                        { id: 'jakarta', label: 'Jakarta' },
                        { id: 'serif', label: 'Serif' },
                      ] as Array<{ id: FontFamilyOption; label: string }>
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onChangeFontFamily(f.id)}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
                          fontFamily === f.id
                            ? 'ui-selected-pill'
                            : 'ui-border-default ui-surface-card ui-text-body'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['normal', 'large', 'xl'] as FontSizeOption[]).map((sz, i) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontSize(sz)}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold ${
                          fontSize === sz
                            ? 'ui-soft-pill'
                            : 'ui-border-default ui-surface-card ui-text-body'
                        }`}
                      >
                        {i === 0 ? 'A (100%)' : i === 1 ? 'A+ (112%)' : 'A++ (125%)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === 'accents' && (
              <div className="space-y-3">
                <HslControlGroup
                  title={tr(lang, 'Active Navigation Tabs (1–4)', 'Подсветка активной вкладки (1–4)')}
                  color={currentConfig.tabAccent}
                  onChange={(tabAccent) => updateCurrentMode({ tabAccent })}
                  lMin={22}
                  lMax={68}
                  sMax={90}
                  swatches={QUICK_ACCENT_SWATCHES}
                  lang={lang}
                />

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border ui-border-subtle ui-surface-deep px-3 py-2 text-xs font-medium ui-text-secondary">
                  <input
                    type="checkbox"
                    checked={currentConfig.syncStepWithTab}
                    onChange={(e) =>
                      updateCurrentMode({ syncStepWithTab: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span>
                    {tr(
                      lang,
                      'Use same color for Steps (1–3) & selected buttons',
                      'Использовать этот же цвет для Шагов (1–3) и выбранных позиций'
                    )}
                  </span>
                </label>

                {!currentConfig.syncStepWithTab && (
                  <HslControlGroup
                    title={tr(lang, 'Steps & Selected Positions', 'Акценты шагов и выбранных кнопок')}
                    color={currentConfig.stepAccent}
                    onChange={(stepAccent) => updateCurrentMode({ stepAccent })}
                    lMin={22}
                    lMax={68}
                    sMax={90}
                    swatches={QUICK_ACCENT_SWATCHES}
                    lang={lang}
                  />
                )}

                <HslControlGroup
                  title={tr(lang, 'Secondary Accent (Forecast & Badges)', 'Второй акцент (Прогноз графика и теги)')}
                  color={currentConfig.secondaryAccent}
                  onChange={(secondaryAccent) => updateCurrentMode({ secondaryAccent })}
                  lMin={24}
                  lMax={68}
                  sMax={80}
                  swatches={QUICK_ACCENT_SWATCHES}
                  lang={lang}
                />
              </div>
            )}

            {section === 'borders' && (
              <div className="space-y-3">
                <div className="rounded-xl border ui-border-subtle ui-surface-deep p-3 space-y-2.5">
                  <div className="text-xs font-bold ui-text-primary">
                    {tr(lang, 'Border Thickness', 'Толщина границ')}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: '1px', label: tr(lang, 'Thin (1px)', 'Тонкие (1px)') },
                        { id: '1.5px', label: tr(lang, 'Medium (1.5px)', 'Средние (1.5px)') },
                        { id: '2px', label: tr(lang, 'Bold (2px)', 'Жирные (2px)') },
                      ] as Array<{ id: BorderWidthOption; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateCurrentMode({ borderWidth: opt.id })}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${
                          currentConfig.borderWidth === opt.id
                            ? 'ui-selected-pill'
                            : 'ui-border-default ui-surface-card ui-text-body'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 text-xs font-bold ui-text-primary">
                    {tr(lang, 'Border Style', 'Тип границ')}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'solid', label: tr(lang, 'Solid', 'Сплошная') },
                        { id: 'dashed', label: tr(lang, 'Dashed', 'Штрих') },
                        { id: 'dotted', label: tr(lang, 'Dotted', 'Пунктир') },
                      ] as Array<{ id: BorderStyleOption; label: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateCurrentMode({ borderStyle: opt.id })}
                        className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${
                          currentConfig.borderStyle === opt.id
                            ? 'ui-selected-pill'
                            : 'ui-border-default ui-surface-card ui-text-body'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <HslControlGroup
                  title={tr(lang, 'Border Color & Brightness', 'Цвет и светлота границ')}
                  color={currentConfig.borderColor}
                  onChange={(borderColor) => updateCurrentMode({ borderColor })}
                  lMin={isLight ? 52 : 12}
                  lMax={isLight ? 94 : 52}
                  sMax={50}
                  lang={lang}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="space-y-2 border-t ui-border-subtle px-3.5 py-2.5">
            <p className="text-[10px] leading-snug ui-text-muted">
              {tr(
                lang,
                'Copy JSON or download .json and send it to me — I will set it as the default theme.',
                'Скопируйте JSON или скачайте .json и отправьте мне — я поставлю эти цвета по умолчанию.'
              )}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={handleResetMode}
                disabled={isDefault}
                className="inline-flex items-center gap-1 rounded-lg border ui-border-default ui-surface-elevated px-2 py-1.5 text-[11px] font-semibold ui-text-secondary transition ui-hover-elevated disabled:opacity-45"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{tr(lang, 'Reset', 'Сброс')}</span>
              </button>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCss}
                  title={tr(lang, 'Copy CSS variables', 'Копировать CSS-переменные')}
                  className="inline-flex items-center gap-1 rounded-lg border ui-border-default ui-surface-elevated px-2 py-1.5 text-[11px] font-semibold ui-text-secondary transition ui-hover-elevated"
                >
                  {copiedCss ? (
                    <>
                      <Check className="h-3.5 w-3.5 ui-text-sage" />
                      <span>CSS</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>CSS</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  title={tr(lang, 'Download theme JSON file', 'Скачать файл настроек .json')}
                  className="inline-flex items-center gap-1 rounded-lg border ui-border-default ui-surface-elevated px-2 py-1.5 text-[11px] font-semibold ui-text-secondary transition ui-hover-elevated"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>.json</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="ui-selected-pill inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition"
                >
                  {copiedJson ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{tr(lang, 'JSON Copied!', 'Скопировано!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{tr(lang, 'Copy JSON', 'Копировать JSON')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default ThemeCustomizerDrawer;
