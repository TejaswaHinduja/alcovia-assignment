import type { SessionType } from '@/types/api';

/** deep_focus → "Deep Focus" (API returns snake_case, design shows title case). */
export function titleCaseType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** durationMs → "25 min" (API returns milliseconds, design shows minutes). */
export function formatDuration(durationMs: number): string {
  return `${Math.round(durationMs / 60000)} min`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formatted manually rather than via Intl/toLocaleString, which is unreliable
// on Hermes across locales.
function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Accepts epoch-ms (sessions list) or an ISO string (session detail) and
 * renders "Today, 2:30 PM" / "Yesterday, …" / "Thu, …" / "Jul 7, …".
 */
export function formatWhen(when: number | string): string {
  const d = new Date(when);
  const time = formatTime(d);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${WEEKDAYS[d.getDay()]}, ${time}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${time}`;
}

/** Visual identity for each session type, reused by History and Session Detail. */
export const SESSION_VISUALS: Record<SessionType, { icon: string; tint: 'purple' | 'green' | 'amber' }> = {
  deep_focus: { icon: '🎯', tint: 'purple' },
  quick_sprint: { icon: '⚡', tint: 'green' },
  pomodoro: { icon: '🍅', tint: 'amber' },
};
