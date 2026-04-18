// src/constants/languages.ts
export const LANGUAGES = [
  { code: 'zh', label: '中文', native: '中文' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'it', label: 'Italiano', native: 'Italiano' },
  { code: 'es', label: 'Español', native: 'Español' },
  { code: 'de', label: 'Deutsch', native: 'Deutsch' },
  { code: 'ja', label: '日本語', native: '日本語' },
  { code: 'ko', label: '한국어', native: '한국어' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];
export const DEFAULT_DIARY_LANG = 'zh';
export const DEFAULT_TARGET_LANG = 'en';
