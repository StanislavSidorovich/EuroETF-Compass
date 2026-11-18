import type { ThemeMode } from '../types';

export type BorderWidthOption = '1px' | '1.5px' | '2px';
export type BorderStyleOption = 'solid' | 'dashed' | 'dotted';

export interface HslColor {
  h: number; // 0..360
  s: number; // 0..100
  l: number; // 0..100
}

export interface ModeThemeConfig {
  background: HslColor;      // Page background
  cardLightnessOffset: number; // -12..+12 relative to background (clamped)
  text: HslColor;            // Primary text
  mutedContrast: number;     // 25..80% (higher = stronger contrast for secondary/muted text)
  tabAccent: HslColor;       // Active navigation tab highlight
  stepAccent: HslColor;      // Steps, primary CTA & selected presets/buttons
  syncStepWithTab: boolean;  // Keep stepAccent locked to tabAccent by default
  secondaryAccent: HslColor; // Cool accent (forecast curve, secondary badges)
  borderWidth: BorderWidthOption;
  borderStyle: BorderStyleOption;
  borderColor: HslColor;     // Card/control borders
}

export interface ThemeStudioState {
  light: ModeThemeConfig;
  dark: ModeThemeConfig;
}

export interface ThemePresetDefinition {
  id: string;
  nameEn: string;
  nameRu: string;
  descEn: string;
  descRu: string;
  previewSwatches: [string, string, string]; // [bg, primary, secondary]
  light: ModeThemeConfig;
  dark: ModeThemeConfig;
}

export const THEME_STUDIO_STORAGE_KEY = 'euroetf_theme_studio_v1';

export const DEFAULT_LIGHT_CONFIG: ModeThemeConfig = {
  background: { h: 145, s: 18, l: 96 },       // #f4f7f5
  cardLightnessOffset: 4,                     // #ffffff
  text: { h: 222, s: 47, l: 11 },             // #0f172a
  mutedContrast: 58,
  tabAccent: { h: 153, s: 51, l: 36 },        // #2d8a61
  stepAccent: { h: 153, s: 51, l: 36 },       // #2d8a61
  syncStepWithTab: true,
  secondaryAccent: { h: 209, s: 25, l: 37 },  // #486178
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: { h: 213, s: 27, l: 84 },      // #cbd5e1
};

export const DEFAULT_DARK_CONFIG: ModeThemeConfig = {
  background: { h: 222, s: 42, l: 6 },        // #090d16
  cardLightnessOffset: 5,                     // ~#111827
  text: { h: 210, s: 40, l: 96 },             // #f1f5f9
  mutedContrast: 58,
  tabAccent: { h: 153, s: 46, l: 42 },        // #3b9b72 / #2d8a61
  stepAccent: { h: 153, s: 46, l: 42 },
  syncStepWithTab: true,
  secondaryAccent: { h: 209, s: 24, l: 57 },  // #7792ab
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: { h: 215, s: 25, l: 27 },      // #334155
};

export const DEFAULT_THEME_STUDIO_STATE: ThemeStudioState = {
  light: DEFAULT_LIGHT_CONFIG,
  dark: DEFAULT_DARK_CONFIG,
};

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'sage-steel',
    nameEn: 'Sage & Steel (Default)',
    nameRu: 'Шалфей и Сталь (Стандарт)',
    descEn: 'Calm European sage green with muted steel blue.',
    descRu: 'Спокойный шалфейно-зелёный и приглушённый стальной синий.',
    previewSwatches: ['#f4f7f5', '#2d8a61', '#486178'],
    light: DEFAULT_LIGHT_CONFIG,
    dark: DEFAULT_DARK_CONFIG,
  },
  {
    id: 'warm-paper',
    nameEn: 'Warm Paper & Olive',
    nameRu: 'Тёплая бумага и Олива',
    descEn: 'Low-glare cream paper background with olive & bronze accents.',
    descRu: 'Мягкий кремовый фон без бликов, оливковый и тёплый бронзовый.',
    previewSwatches: ['#f7f4ec', '#5f7337', '#8c6a3d'],
    light: {
      background: { h: 42, s: 33, l: 95 },
      cardLightnessOffset: 4,
      text: { h: 30, s: 22, l: 14 },
      mutedContrast: 60,
      tabAccent: { h: 82, s: 35, l: 33 },
      stepAccent: { h: 82, s: 35, l: 33 },
      syncStepWithTab: true,
      secondaryAccent: { h: 34, s: 39, l: 39 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 38, s: 22, l: 82 },
    },
    dark: {
      background: { h: 30, s: 16, l: 8 },
      cardLightnessOffset: 5,
      text: { h: 40, s: 24, l: 93 },
      mutedContrast: 58,
      tabAccent: { h: 82, s: 38, l: 44 },
      stepAccent: { h: 82, s: 38, l: 44 },
      syncStepWithTab: true,
      secondaryAccent: { h: 36, s: 42, l: 55 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 32, s: 14, l: 24 },
    },
  },
  {
    id: 'nordic-slate',
    nameEn: 'Nordic Slate & Teal',
    nameRu: 'Северный сланец и Морской',
    descEn: 'Cool Scandinavian slate surfaces with deep teal highlights.',
    descRu: 'Прохладный скандинавский сланец и глубокий морской акцент.',
    previewSwatches: ['#f1f5f9', '#1f6f78', '#475569'],
    light: {
      background: { h: 210, s: 35, l: 96 },
      cardLightnessOffset: 4,
      text: { h: 218, s: 40, l: 12 },
      mutedContrast: 62,
      tabAccent: { h: 186, s: 59, l: 30 },
      stepAccent: { h: 212, s: 46, l: 38 },
      syncStepWithTab: false,
      secondaryAccent: { h: 215, s: 20, l: 40 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 213, s: 24, l: 83 },
    },
    dark: {
      background: { h: 216, s: 34, l: 8 },
      cardLightnessOffset: 5,
      text: { h: 210, s: 32, l: 95 },
      mutedContrast: 58,
      tabAccent: { h: 186, s: 52, l: 44 },
      stepAccent: { h: 212, s: 48, l: 52 },
      syncStepWithTab: false,
      secondaryAccent: { h: 215, s: 24, l: 58 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 216, s: 22, l: 26 },
    },
  },
  {
    id: 'high-contrast',
    nameEn: 'Crisp Terminal (Bold Borders)',
    nameRu: 'Чёткий Контраст (Жирные рамки)',
    descEn: 'Pure crisp contrast, cobalt-blue tabs, emerald steps, 1.5px borders.',
    descRu: 'Максимальная чёткость текста, синие вкладки, зелёные шаги, рамки 1.5px.',
    previewSwatches: ['#ffffff', '#1d4ed8', '#15803d'],
    light: {
      background: { h: 210, s: 20, l: 97 },
      cardLightnessOffset: 3,
      text: { h: 222, s: 65, l: 7 },
      mutedContrast: 74,
      tabAccent: { h: 220, s: 68, l: 42 },
      stepAccent: { h: 148, s: 64, l: 31 },
      syncStepWithTab: false,
      secondaryAccent: { h: 215, s: 45, l: 36 },
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderColor: { h: 215, s: 24, l: 71 },
    },
    dark: {
      background: { h: 224, s: 48, l: 4 },
      cardLightnessOffset: 5,
      text: { h: 210, s: 40, l: 98 },
      mutedContrast: 72,
      tabAccent: { h: 217, s: 72, l: 56 },
      stepAccent: { h: 150, s: 58, l: 43 },
      syncStepWithTab: false,
      secondaryAccent: { h: 210, s: 44, l: 60 },
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderColor: { h: 215, s: 28, l: 34 },
    },
  },
  {
    id: 'soft-pastel',
    nameEn: 'Soft Low-Glare',
    nameRu: 'Мягкий приглушённый',
    descEn: 'Reduced saturation for long reading sessions.',
    descRu: 'Пониженная насыщенность для долгой спокойной работы.',
    previewSwatches: ['#f2f4f3', '#4d7c68', '#687687'],
    light: {
      background: { h: 150, s: 10, l: 94 },
      cardLightnessOffset: 4,
      text: { h: 215, s: 24, l: 17 },
      mutedContrast: 50,
      tabAccent: { h: 154, s: 26, l: 40 },
      stepAccent: { h: 154, s: 26, l: 40 },
      syncStepWithTab: true,
      secondaryAccent: { h: 212, s: 14, l: 47 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 210, s: 12, l: 84 },
    },
    dark: {
      background: { h: 220, s: 22, l: 9 },
      cardLightnessOffset: 4,
      text: { h: 210, s: 18, l: 90 },
      mutedContrast: 48,
      tabAccent: { h: 154, s: 28, l: 46 },
      stepAccent: { h: 154, s: 28, l: 46 },
      syncStepWithTab: true,
      secondaryAccent: { h: 212, s: 16, l: 56 },
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { h: 215, s: 14, l: 25 },
    },
  },
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function hslToCss(c: HslColor, alpha?: number): string {
  const h = Math.round(((c.h % 360) + 360) % 360);
  const s = Math.round(clamp(c.s, 0, 100));
  const l = Math.round(clamp(c.l, 0, 100));
  if (typeof alpha === 'number') {
    return `hsla(${h}, ${s}%, ${l}%, ${clamp(alpha, 0, 1)})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hslToHex(c: HslColor): string {
  const h = ((c.h % 360) + 360) % 360;
  const s = clamp(c.s, 0, 100) / 100;
  const l = clamp(c.l, 0, 100) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHsl(hex: string): HslColor | null {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function buildTailwindRamp(base: HslColor): Record<string, string> {
  const h = ((base.h % 360) + 360) % 360;
  const s = clamp(base.s, 0, 100);
  const l500 = clamp(base.l, 18, 72);
  return {
    '50': hslToCss({ h, s: clamp(s * 0.85, 8, 95), l: 96 }),
    '100': hslToCss({ h, s: clamp(s * 0.9, 10, 95), l: 90 }),
    '200': hslToCss({ h, s: clamp(s * 0.9, 10, 95), l: 79 }),
    '300': hslToCss({ h, s: clamp(s * 0.95, 10, 95), l: clamp(l500 + 22, 54, 78) }),
    '400': hslToCss({ h, s, l: clamp(l500 + 10, 38, 68) }),
    '500': hslToCss({ h, s, l: l500 }),
    '600': hslToCss({ h, s: clamp(s * 1.05, 0, 100), l: clamp(l500 - 7, 16, 58) }),
    '700': hslToCss({ h, s: clamp(s * 1.05, 0, 100), l: clamp(l500 - 13, 12, 48) }),
    '800': hslToCss({ h, s: clamp(s * 0.95, 0, 100), l: clamp(l500 - 18, 10, 38) }),
    '900': hslToCss({ h, s: clamp(s * 0.9, 0, 100), l: clamp(l500 - 22, 8, 28) }),
    '950': hslToCss({ h, s: clamp(s * 0.85, 0, 100), l: 9 }),
  };
}

function isSameHsl(a: HslColor, b: HslColor): boolean {
  return a.h === b.h && a.s === b.s && a.l === b.l;
}

export function isModeConfigDefault(config: ModeThemeConfig, theme: ThemeMode): boolean {
  const def = theme === 'light' ? DEFAULT_LIGHT_CONFIG : DEFAULT_DARK_CONFIG;
  return (
    isSameHsl(config.background, def.background) &&
    config.cardLightnessOffset === def.cardLightnessOffset &&
    isSameHsl(config.text, def.text) &&
    config.mutedContrast === def.mutedContrast &&
    isSameHsl(config.tabAccent, def.tabAccent) &&
    isSameHsl(config.stepAccent, def.stepAccent) &&
    config.syncStepWithTab === def.syncStepWithTab &&
    isSameHsl(config.secondaryAccent, def.secondaryAccent) &&
    config.borderWidth === def.borderWidth &&
    config.borderStyle === def.borderStyle &&
    isSameHsl(config.borderColor, def.borderColor)
  );
}

const MANAGED_CSS_VAR_KEYS = [
  '--ui-bg-app',
  '--ui-bg-grid-line',
  '--ui-bg-card',
  '--ui-border-card',
  '--ui-surface-app',
  '--ui-surface-deep',
  '--ui-surface-deep-solid',
  '--ui-surface-card',
  '--ui-surface-card-solid',
  '--ui-surface-elevated',
  '--ui-surface-elevated-solid',
  '--ui-surface-hover',
  '--ui-header-bg',
  '--ui-ticker-bg',
  '--ui-tint-sage',
  '--ui-tint-cool',
  '--ui-border-subtle',
  '--ui-border-default',
  '--ui-border-input',
  '--ui-border-width',
  '--ui-border-style',
  '--ui-text-primary',
  '--ui-text-secondary',
  '--ui-text-body',
  '--ui-text-muted',
  '--ui-text-subtle',
  '--ui-accent-primary',
  '--ui-accent-primary-hover',
  '--ui-accent-primary-soft',
  '--ui-accent-primary-border',
  '--ui-accent-primary-text',
  '--ui-accent-sage',
  '--ui-accent-sage-text',
  '--ui-accent-sage-soft',
  '--ui-tab-active-bg',
  '--ui-tab-active-border',
  '--ui-tab-active-ring',
  '--ui-tab-active-badge-bg',
  '--ui-tab-active-text',
  '--ui-tab-active-icon',
  '--ui-step-bg',
  '--ui-step-text',
  '--ui-accent-cool',
  '--ui-accent-cool-text',
  '--ui-input-bg',
  '--ui-input-text',
  '--ui-input-placeholder',
  '--ui-chart-text-primary',
  '--ui-chart-text-muted',
  '--ui-chart-sage-stroke',
  ...['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].flatMap((step) => [
    `--color-emerald-${step}`,
    `--color-sky-${step}`,
    `--color-cyan-${step}`,
  ]),
];

export function computeCssVarsForMode(theme: ThemeMode, config: ModeThemeConfig): Record<string, string> {
  const isLight = theme === 'light';
  const bg = config.background;
  const cardL = clamp(bg.l + config.cardLightnessOffset, isLight ? 84 : 5, isLight ? 100 : 24);
  const deepL = isLight ? clamp(cardL - 2, 82, 98) : clamp(bg.l - 2, 2, 16);
  const elevatedL = isLight ? clamp(cardL - 5, 78, 96) : clamp(cardL + 6, 8, 28);
  const hoverL = isLight ? clamp(elevatedL - 5, 72, 92) : clamp(elevatedL + 6, 12, 34);

  const primary = config.syncStepWithTab ? config.tabAccent : config.stepAccent;
  const tab = config.tabAccent;
  const sec = config.secondaryAccent;

  // Interpolate secondary/muted text between primary text lightness and background lightness
  const contrastFrac = clamp(config.mutedContrast, 20, 85) / 100;
  const lerpTextL = (weight: number) =>
    Math.round(bg.l + (config.text.l - bg.l) * clamp(contrastFrac * weight, 0.25, 0.96));

  const primaryRamp = buildTailwindRamp(primary);
  const secRamp = buildTailwindRamp(sec);

  const vars: Record<string, string> = {
    '--ui-bg-app': hslToCss(bg),
    '--ui-bg-grid-line': hslToCss(primary, isLight ? 0.045 : 0.05),
    '--ui-bg-card': isLight
      ? hslToCss({ h: bg.h, s: clamp(bg.s * 0.6, 0, 35), l: cardL })
      : `linear-gradient(180deg, ${hslToCss({ h: bg.h, s: clamp(bg.s * 0.85, 4, 48), l: cardL }, 0.94)} 0%, ${hslToCss(
          { h: bg.h, s: clamp(bg.s * 0.9, 4, 48), l: clamp(cardL - 3, 4, 20) },
          0.97
        )} 100%)`,
    '--ui-border-card': hslToCss(config.borderColor, isLight ? 1 : 0.65),
    '--ui-surface-app': hslToCss({ h: bg.h, s: bg.s, l: cardL }, 0.94),
    '--ui-surface-deep': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: deepL }, isLight ? 1 : 0.72),
    '--ui-surface-deep-solid': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: deepL }),
    '--ui-surface-card': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: cardL }, isLight ? 1 : 0.88),
    '--ui-surface-card-solid': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: cardL }),
    '--ui-surface-elevated': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: elevatedL }, isLight ? 1 : 0.85),
    '--ui-surface-elevated-solid': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: elevatedL }),
    '--ui-surface-hover': hslToCss({ h: bg.h, s: clamp(bg.s * 0.7, 0, 40), l: hoverL }),
    '--ui-header-bg': hslToCss(
      { h: bg.h, s: clamp(bg.s * 0.85, 0, 40), l: isLight ? clamp(cardL - 1, 84, 99) : clamp(cardL + 2, 7, 24) },
      0.96
    ),
    '--ui-ticker-bg': hslToCss(
      { h: bg.h, s: clamp(bg.s * 0.85, 0, 40), l: isLight ? clamp(bg.l - 1, 82, 97) : clamp(cardL + 4, 9, 26) }
    ),
    '--ui-tint-sage': isLight
      ? hslToCss({ h: primary.h, s: clamp(primary.s * 0.8, 12, 80), l: 94 })
      : hslToCss({ h: primary.h, s: clamp(primary.s * 0.75, 10, 70), l: 13 }, 0.42),
    '--ui-tint-cool': isLight
      ? hslToCss({ h: sec.h, s: clamp(sec.s * 0.7, 10, 60), l: 94 })
      : hslToCss({ h: sec.h, s: clamp(sec.s * 0.7, 10, 60), l: 14 }, 0.42),

    '--ui-border-subtle': hslToCss(config.borderColor, isLight ? 0.9 : 0.75),
    '--ui-border-default': hslToCss(config.borderColor),
    '--ui-border-input': hslToCss(config.borderColor),
    '--ui-border-width': config.borderWidth,
    '--ui-border-style': config.borderStyle,

    '--ui-text-primary': hslToCss(config.text),
    '--ui-text-secondary': hslToCss({ h: config.text.h, s: clamp(config.text.s * 0.9, 0, 80), l: lerpTextL(0.92) }),
    '--ui-text-body': hslToCss({ h: config.text.h, s: clamp(config.text.s * 0.75, 0, 70), l: lerpTextL(0.8) }),
    '--ui-text-muted': hslToCss({ h: config.text.h, s: clamp(config.text.s * 0.65, 0, 60), l: lerpTextL(0.65) }),
    '--ui-text-subtle': hslToCss({ h: config.text.h, s: clamp(config.text.s * 0.55, 0, 50), l: lerpTextL(0.52) }),

    '--ui-accent-primary': hslToCss(primary),
    '--ui-accent-primary-hover': hslToCss({ ...primary, l: clamp(primary.l - 6, 15, 70) }),
    '--ui-accent-primary-soft': isLight
      ? hslToCss({ h: primary.h, s: clamp(primary.s * 0.85, 12, 85), l: 92 })
      : hslToCss({ h: primary.h, s: clamp(primary.s * 0.8, 12, 80), l: primary.l }, 0.2),
    '--ui-accent-primary-border': hslToCss(primary, isLight ? 0.45 : 0.5),
    '--ui-accent-primary-text': isLight
      ? hslToCss({ h: primary.h, s: clamp(primary.s * 1.05, 15, 90), l: clamp(primary.l - 10, 18, 38) })
      : hslToCss({ h: primary.h, s: clamp(primary.s * 0.9, 15, 85), l: clamp(primary.l + 24, 58, 82) }),

    '--ui-accent-sage': hslToCss(primary),
    '--ui-accent-sage-text': isLight
      ? hslToCss({ h: primary.h, s: clamp(primary.s * 1.05, 15, 90), l: clamp(primary.l - 10, 18, 38) })
      : hslToCss({ h: primary.h, s: clamp(primary.s * 0.9, 15, 85), l: clamp(primary.l + 24, 58, 82) }),
    '--ui-accent-sage-soft': isLight
      ? hslToCss({ h: primary.h, s: clamp(primary.s * 1.05, 15, 90), l: clamp(primary.l - 10, 18, 38) })
      : hslToCss({ h: primary.h, s: clamp(primary.s * 0.85, 15, 80), l: clamp(primary.l + 30, 68, 86) }),

    '--ui-tab-active-bg': isLight
      ? hslToCss({ h: tab.h, s: clamp(tab.s * 0.85, 12, 85), l: 93 })
      : hslToCss(tab, 0.17),
    '--ui-tab-active-border': hslToCss(tab),
    '--ui-tab-active-ring': hslToCss(tab, 0.32),
    '--ui-tab-active-badge-bg': hslToCss(tab),
    '--ui-tab-active-text': isLight
      ? hslToCss({ h: tab.h, s: clamp(tab.s * 1.05, 15, 90), l: clamp(tab.l - 13, 16, 36) })
      : hslToCss({ h: tab.h, s: clamp(tab.s * 0.9, 15, 85), l: clamp(tab.l + 26, 62, 86) }),
    '--ui-tab-active-icon': isLight
      ? hslToCss({ h: tab.h, s: clamp(tab.s * 1.05, 15, 90), l: clamp(tab.l - 9, 18, 40) })
      : hslToCss({ h: tab.h, s: clamp(tab.s * 0.9, 15, 85), l: clamp(tab.l + 22, 58, 82) }),

    '--ui-step-bg': hslToCss(primary),
    '--ui-step-text': '#ffffff',

    '--ui-accent-cool': hslToCss(sec),
    '--ui-accent-cool-text': isLight
      ? hslToCss({ h: sec.h, s: clamp(sec.s * 1.05, 10, 80), l: clamp(sec.l - 6, 18, 42) })
      : hslToCss({ h: sec.h, s: clamp(sec.s * 0.95, 10, 75), l: clamp(sec.l + 18, 56, 80) }),

    '--ui-input-bg': hslToCss({ h: bg.h, s: clamp(bg.s * 0.6, 0, 35), l: isLight ? cardL : deepL }),
    '--ui-input-text': hslToCss(config.text),
    '--ui-input-placeholder': hslToCss({ h: config.text.h, s: 18, l: isLight ? 60 : 48 }),

    '--ui-chart-text-primary': hslToCss(config.text),
    '--ui-chart-text-muted': hslToCss({ h: config.text.h, s: clamp(config.text.s * 0.65, 0, 60), l: lerpTextL(0.65) }),
    '--ui-chart-sage-stroke': hslToCss(primary),
  };

  for (const [step, val] of Object.entries(primaryRamp)) {
    vars[`--color-emerald-${step}`] = val;
  }
  for (const [step, val] of Object.entries(secRamp)) {
    vars[`--color-sky-${step}`] = val;
    vars[`--color-cyan-${step}`] = val;
  }

  return vars;
}

export function applyCustomThemeToDocument(theme: ThemeMode, state: ThemeStudioState): void {
  if (typeof document === 'undefined') return;
  const rootStyle = document.documentElement.style;
  const config = theme === 'light' ? state.light : state.dark;

  if (isModeConfigDefault(config, theme)) {
    for (const key of MANAGED_CSS_VAR_KEYS) {
      rootStyle.removeProperty(key);
    }
    document.documentElement.classList.remove('has-custom-borders');
    return;
  }

  const vars = computeCssVarsForMode(theme, config);
  for (const [key, val] of Object.entries(vars)) {
    rootStyle.setProperty(key, val);
  }

  if (config.borderWidth !== '1px' || config.borderStyle !== 'solid') {
    document.documentElement.classList.add('has-custom-borders');
  } else {
    document.documentElement.classList.remove('has-custom-borders');
  }
}

export function loadThemeStudioState(): ThemeStudioState {
  try {
    const raw = localStorage.getItem(THEME_STUDIO_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_STUDIO_STATE;
    const parsed = JSON.parse(raw) as Partial<ThemeStudioState>;
    return {
      light: { ...DEFAULT_LIGHT_CONFIG, ...(parsed.light ?? {}) },
      dark: { ...DEFAULT_DARK_CONFIG, ...(parsed.dark ?? {}) },
    };
  } catch {
    return DEFAULT_THEME_STUDIO_STATE;
  }
}

export function saveThemeStudioState(state: ThemeStudioState): void {
  try {
    localStorage.setItem(THEME_STUDIO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function formatThemeCssSnippet(theme: ThemeMode, config: ModeThemeConfig): string {
  const vars = computeCssVarsForMode(theme, config);
  const lines = [
    `/* EuroETF Compass — Custom ${theme.toUpperCase()} Palette */`,
    `--ui-bg-app: ${vars['--ui-bg-app']};`,
    `--ui-bg-card: ${vars['--ui-bg-card']};`,
    `--ui-text-primary: ${vars['--ui-text-primary']};`,
    `--ui-text-muted: ${vars['--ui-text-muted']};`,
    `--ui-tab-active-border: ${vars['--ui-tab-active-border']};`,
    `--ui-accent-primary: ${vars['--ui-accent-primary']};`,
    `--ui-accent-cool: ${vars['--ui-accent-cool']};`,
    `--ui-border-default: ${vars['--ui-border-default']};`,
    `--ui-border-width: ${vars['--ui-border-width']};`,
    `--ui-border-style: ${vars['--ui-border-style']};`,
  ];
  return lines.join('\n');
}
