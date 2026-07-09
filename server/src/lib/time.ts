const DAY_MS = 86_400_000;

/** [start, end) of the UTC day containing `ms`. */
export function dayBounds(ms: number): [number, number] {
  const d = new Date(ms);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return [start, start + DAY_MS];
}

/** [start, end) of the Mon–Sun UTC week containing `ms`. */
export function weekBounds(ms: number): [number, number] {
  const [dayStart] = dayBounds(ms);
  const dow = new Date(dayStart).getUTCDay(); // 0=Sun … 6=Sat
  const daysFromMonday = (dow + 6) % 7;
  const start = dayStart - daysFromMonday * DAY_MS;
  return [start, start + 7 * DAY_MS];
}

/** [start, end) of the UTC month containing `ms`. */
export function monthBounds(ms: number): [number, number] {
  const d = new Date(ms);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  return [start, end];
}

export type Filter = 'today' | 'week' | 'month';

/** Returns the [start, end) epoch-ms window for a filter, or null for "all". */
export function filterBounds(filter: string | undefined, refNow: number): [number, number] | null {
  switch (filter) {
    case 'today':
      return dayBounds(refNow);
    case 'week':
      return weekBounds(refNow);
    case 'month':
      return monthBounds(refNow);
    case undefined:
    case '':
      return null;
    default:
      throw new Error(`Unknown filter "${filter}"`);
  }
}
