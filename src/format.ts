import { CATEGORY_LABELS, type Category } from './domain/types';

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category];
}

export function shortId(uuid: string, size = 8): string {
  return uuid.replace(/-/g, '').slice(0, size);
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const delta = Date.now() - t;
  const sec = Math.round(delta / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day} d ago`;
  return new Date(t).toLocaleDateString();
}

export function expiryLabel(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return null;
  if (t <= Date.now()) return 'expired';
  const min = Math.round((t - Date.now()) / 60000);
  if (min < 60) return `expires in ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `expires in ${hr} h`;
  return `expires ${new Date(t).toLocaleDateString()}`;
}
