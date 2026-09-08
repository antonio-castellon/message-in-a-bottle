import type { Category } from './domain/types';
import { TOPIC_KEYS } from './domain/types';
import { translate } from './i18n';

export function categoryLabel(category: Category, locale: string): string {
  return translate(locale, TOPIC_KEYS[category]);
}

export function shortId(uuid: string, size = 8): string {
  return uuid.replace(/-/g, '').slice(0, size);
}

export function relativeTime(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const delta = Date.now() - t;
  const sec = Math.round(delta / 1000);
  if (sec < 45) return translate(locale, 'time.justNow');
  const min = Math.round(sec / 60);
  if (min < 60) return translate(locale, 'time.minAgo', { n: min });
  const hr = Math.round(min / 60);
  if (hr < 24) return translate(locale, 'time.hAgo', { n: hr });
  const day = Math.round(hr / 24);
  if (day < 14) return translate(locale, 'time.dAgo', { n: day });
  return new Date(t).toLocaleDateString();
}

export function expiryLabel(expiresAt: string | null, locale: string): string | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return null;
  if (t <= Date.now()) return translate(locale, 'expiry.expired');
  const min = Math.round((t - Date.now()) / 60000);
  if (min < 60) return translate(locale, 'expiry.inMin', { n: min });
  const hr = Math.round(min / 60);
  if (hr < 48) return translate(locale, 'expiry.inH', { n: hr });
  return translate(locale, 'expiry.onDate', { date: new Date(t).toLocaleDateString() });
}
