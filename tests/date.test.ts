import { describe, expect, it } from 'vitest';

import {
  addDays,
  getMonthRange,
  getRomeCalendarMonth,
  getRomeCalendarWeek,
  getRomeTodayIso,
} from '@/lib/date/italy';

describe('date Europe/Rome', () => {
  it('usa il giorno di Roma vicino alla mezzanotte UTC', () => {
    expect(getRomeTodayIso(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
    expect(getRomeTodayIso(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01');
    expect(getRomeTodayIso(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02');
  });

  it('la settimana inizia di lunedì', () => {
    const week = getRomeCalendarWeek(0, new Date('2026-10-22T10:00:00Z')); // giovedì
    expect(week.from).toBe('2026-10-19');
    expect(week.to).toBe('2026-10-25');
    expect(week.days.find((d) => d.isToday)?.iso).toBe('2026-10-22');
  });

  it('attraversa il cambio ora legale senza sfasare i giorni', () => {
    const week = getRomeCalendarWeek(0, new Date('2026-10-27T10:00:00Z'));
    expect(week.days.map((d) => d.iso)).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
  });

  it('gestisce il cambio anno con offset di settimana', () => {
    const week = getRomeCalendarWeek(1, new Date('2026-12-29T10:00:00Z'));
    expect(week.from).toBe('2027-01-04');
  });

  it('il mese ha celle multiple di 7 e lunedì come primo giorno', () => {
    const month = getRomeCalendarMonth(0, new Date('2026-11-10T10:00:00Z'));
    expect(month.days.length % 7).toBe(0);
    expect(month.days.findIndex((d) => d?.day === 1)).toBe(6); // 1 nov 2026 è domenica
    expect(getMonthRange(month)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('offset mese attraversa l\'anno', () => {
    expect(getRomeCalendarMonth(2, new Date('2026-12-15T10:00:00Z')).year).toBe(2027);
  });

  it('addDays opera su date civili', () => {
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
