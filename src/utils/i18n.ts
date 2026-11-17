import { createContext, useContext } from 'react';
import type { FontSizeOption, LanguageMode, ThemeMode } from '../types';

export interface AppPreferencesContextValue {
  lang: LanguageMode;
  setLang: (lang: LanguageMode) => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const AppPreferencesContext = createContext<AppPreferencesContextValue>({
  lang: 'ru',
  setLang: () => {},
  fontSize: 'normal',
  setFontSize: () => {},
  theme: 'light',
  setTheme: () => {},
});

export function useAppPreferences(): AppPreferencesContextValue {
  return useContext(AppPreferencesContext);
}

/**
 * Helper to return English or Russian string based on current language mode.
 */
export function tr(lang: LanguageMode, en: string, ru: string): string {
  return lang === 'en' ? en : ru;
}
