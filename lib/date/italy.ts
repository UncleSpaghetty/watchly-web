export const ROME_TZ = 'Europe/Rome';
const DAY_MS = 86_400_000;

export interface RomeCalendarMonth {
  year: number;
  month: number;
  label: string;
  /** Celle del mese (lunedì primo giorno) come date ISO, null per le celle di riempimento */
  days: Array<{ iso: string; day: number } | null>;
}

export interface RomeWeekDay {
  iso: string;
  day: number;
  isToday: boolean;
}

export interface RomeCalendarWeek {
  label: string;
  from: string;
  to: string;
  days: RomeWeekDay[];
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getRomeDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ROME_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('Impossibile calcolare la data nel fuso Europe/Rome.');
  }
  return { year, month, day };
}

export function getRomeTodayIso(now = new Date()): string {
  const { year, month, day } = getRomeDateParts(now);
  return toIsoDate(year, month, day);
}

/** Le date `YYYY-MM-DD` sono valori civili: si elaborano sempre in UTC senza offset di fuso. */
function parseIso(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Data ISO non valida: ${iso}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function fromUtcMs(ms: number): string {
  const d = new Date(ms);
  return toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(iso: string, days: number): string {
  return fromUtcMs(parseIso(iso) + days * DAY_MS);
}

export function getRomeCalendarWeek(weekOffset: number, now = new Date()): RomeCalendarWeek {
  const todayIso = getRomeTodayIso(now);
  const todayMs = parseIso(todayIso);
  const mondayShift = (new Date(todayMs).getUTCDay() + 6) % 7;
  const monday = todayMs + (weekOffset * 7 - mondayShift) * DAY_MS;

  const days = Array.from({ length: 7 }, (_, index) => {
    const ms = monday + index * DAY_MS;
    const iso = fromUtcMs(ms);
    return { iso, day: new Date(ms).getUTCDate(), isToday: iso === todayIso };
  });

  const format = new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', day: 'numeric', month: 'short' });
  return {
    label: `${format.format(new Date(monday))} – ${format.format(new Date(monday + 6 * DAY_MS))}`,
    from: days[0]!.iso,
    to: days[6]!.iso,
    days,
  };
}

export function getRomeCalendarMonth(monthOffset: number, now = new Date()): RomeCalendarMonth {
  const today = getRomeDateParts(now);
  const first = new Date(Date.UTC(today.year, today.month - 1 + monthOffset, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth() + 1;
  const leading = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cellCount = Math.ceil((leading + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => {
    const day = index - leading + 1;
    return day > 0 && day <= daysInMonth ? { iso: toIsoDate(year, month, day), day } : null;
  });
  return {
    year,
    month,
    label: new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(first),
    days,
  };
}

export function getMonthRange(month: RomeCalendarMonth): { from: string; to: string } {
  const real = month.days.filter((d): d is { iso: string; day: number } => d !== null);
  return { from: real[0]!.iso, to: real[real.length - 1]!.iso };
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(parseIso(iso)));
}

export function formatDateTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: ROME_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoTimestamp));
}
