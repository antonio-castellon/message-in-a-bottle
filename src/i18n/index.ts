import * as Localization from 'expo-localization';

import { EN, type TxKey, type TxTable } from './en';
import { LANGUAGES, normalizeLanguage } from './languages';
import { LOCALES } from './locales';

export type { TxKey };
export { LANGUAGES, languageLabel, languageNative, isLanguageCode, normalizeLanguage } from './languages';

export const UI_LOCALES = ['en', ...Object.keys(LOCALES).filter((c) => c !== 'en')].filter(
  (code, i, all) => all.indexOf(code) === i && LANGUAGES.some((l) => l.code === code),
);

const cache = new Map<string, TxTable>();

function tableFor(locale: string): TxTable {
  const code = resolveUiLocale(locale);
  const hit = cache.get(code);
  if (hit) return hit;
  const merged: TxTable = { ...EN, ...(LOCALES[code] ?? {}) };
  cache.set(code, merged);
  return merged;
}

export function resolveUiLocale(tag: string): string {
  const normalized = normalizeLanguage(tag) ?? 'en';
  if (normalized === 'en' || LOCALES[normalized]) return normalized;
  return 'en';
}

export function deviceLanguage(): string {
  const tag =
    Localization.getLocales()[0]?.languageTag ??
    Localization.getLocales()[0]?.languageCode ??
    'en';
  return resolveUiLocale(tag);
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

export function translate(locale: string, key: TxKey, vars?: Record<string, string | number>): string {
  return interpolate(tableFor(locale)[key] ?? EN[key] ?? key, vars);
}

export function isUiLocale(code: string): boolean {
  return code === 'en' || Boolean(LOCALES[code]);
}
