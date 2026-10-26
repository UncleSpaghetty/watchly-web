'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { WatchStatusButton } from '@/components/episodes/watch-status-button';
import { SegmentedTabs } from '@/components/ui/controls';
import { Button, EmptyState, ErrorState, ListSkeleton, PageHeader, StaleBanner } from '@/components/ui/feedback';
import { api, sourceLabels, type CalendarEntry } from '@/lib/api';
import {
  formatLongDate,
  getMonthRange,
  getRomeCalendarMonth,
  getRomeCalendarWeek,
  getRomeTodayIso,
} from '@/lib/date/italy';
import { useWatchedMutation } from '@/lib/hooks';

type View = 'week' | 'month';
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const viewItems: Array<{ value: View; label: string }> = [
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
];

export function CalendarView() {
  const [view, setView] = useState<View>('week');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const week = useMemo(() => getRomeCalendarWeek(offset), [offset]);
  const month = useMemo(() => getRomeCalendarMonth(offset), [offset]);
  const range = view === 'week' ? { from: week.from, to: week.to } : getMonthRange(month);
  const label = view === 'week' ? week.label : month.label;

  const calendar = useQuery({
    queryKey: ['calendar', range.from, range.to],
    queryFn: () => api.calendar(range.from, range.to),
  });
  const watched = useWatchedMutation();

  const entries = useMemo(() => calendar.data?.entries ?? [], [calendar.data]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [entries]);

  const today = getRomeTodayIso();
  const visibleEntries = selected ? (byDay.get(selected) ?? []) : entries;

  const changeView = (next: View) => {
    setView(next);
    setOffset(0);
    setSelected(null);
  };
  const move = (delta: number) => {
    setOffset((current) => current + delta);
    setSelected(null);
  };

  const dayCell = (iso: string, day: number) => {
    const count = byDay.get(iso)?.length ?? 0;
    const isSelected = iso === selected;
    return (
      <button
        key={iso}
        type="button"
        disabled={count === 0}
        onClick={() => setSelected((current) => (current === iso ? null : iso))}
        aria-pressed={isSelected}
        aria-label={`${formatLongDate(iso)}${count ? `, ${count} episodi` : ''}`}
        className={`calendar-day flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] text-sm ${
          isSelected ? 'calendar-day-selected text-background' : 'text-foreground'
        } ${iso === today ? 'calendar-day-today font-bold' : ''}`}
      >
        {day}
        <span className={`h-1.5 w-1.5 rounded-full ${count ? 'bg-accent' : 'bg-transparent'}`} />
      </button>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="WATCHLY" title="Calendario" subtitle="Uscite degli episodi che segui" />

      <SegmentedTabs value={view} ariaLabel="Vista" items={viewItems} onChange={changeView} />

      <section className="calendar-panel mt-5 rounded-[20px] border border-border bg-surface/95 p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            aria-label="Periodo precedente"
            onClick={() => move(-1)}
            className="h-10 min-h-10 w-10 px-0"
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="text-center">
            <p className="font-semibold capitalize">{label}</p>
            {offset !== 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-primary underline"
                onClick={() => changeView(view)}
              >
                Torna a oggi
              </button>
            ) : null}
          </div>
          <Button
            variant="ghost"
            aria-label="Periodo successivo"
            onClick={() => move(1)}
            className="h-10 min-h-10 w-10 px-0"
          >
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted" aria-hidden>
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {view === 'week'
            ? week.days.map((d) => dayCell(d.iso, d.day))
            : month.days.map((d, i) => (d ? dayCell(d.iso, d.day) : <span key={`pad-${i}`} />))}
        </div>
      </section>

      {calendar.data?.stale ? <StaleBanner lastSyncAt={calendar.data.lastSuccessfulSyncAt} /> : null}

      <div className="mb-3 mt-7 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <CalendarRange size={15} aria-hidden />
            {visibleEntries.length} {visibleEntries.length === 1 ? 'uscita' : 'uscite'}
          </p>
          <h2 className="mt-1 text-[19px] font-bold first-letter:uppercase">
            {selected ? formatLongDate(selected) : `Episodi ${view === 'week' ? 'della settimana' : 'del mese'}`}
          </h2>
        </div>
        {selected ? (
          <button
            type="button"
            className="text-sm font-semibold text-primary hover:underline"
            onClick={() => setSelected(null)}
          >
            Mostra tutto il periodo
          </button>
        ) : null}
      </div>
      {calendar.isPending ? (
        <ListSkeleton rows={2} />
      ) : calendar.isError ? (
        <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
      ) : visibleEntries.length === 0 ? (
        <EmptyState title={selected ? 'Nessun episodio in questo giorno' : 'Nessun episodio in questo periodo'} />
      ) : (
        <ul className="space-y-2.5">
          {visibleEntries.map((e, index) => {
            const isPast = e.date < today;
            const isToday = e.date === today;
            const shortWeekday = new Intl.DateTimeFormat('it-IT', {
              timeZone: 'UTC',
              weekday: 'short',
            })
              .format(new Date(`${e.date}T00:00:00Z`))
              .replace('.', '');
            return (
              <li
                key={e.episodeId}
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                className={`episode-row list-reveal ${isPast ? 'episode-row-past' : 'episode-row-upcoming'}`}
              >
                <div className="w-10 shrink-0 text-center">
                  <span
                    className={`block text-[22px] font-bold leading-none ${isPast ? 'text-muted' : 'text-primary'}`}
                  >
                    {Number(e.date.slice(8, 10))}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase text-muted">{shortWeekday}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/series/${e.series.id}`}
                    className={`block truncate text-[15px] font-bold hover:underline ${e.watchedAt ? 'text-muted line-through' : ''}`}
                  >
                    {e.series.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {e.seasonNumber ? `S${e.seasonNumber} · ` : ''}
                    {e.episodeNumber ? `Ep. ${e.episodeNumber}` : 'Episodio'}
                    {e.episodeTitle ? ` — ${e.episodeTitle}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-muted">{sourceLabels[e.source]}</span>
                    <span className={`text-[11px] font-bold ${isPast ? 'text-muted' : 'text-primary'}`}>
                      {isPast ? 'Già uscito' : isToday ? 'Esce oggi' : 'In arrivo'}
                    </span>
                  </div>
                </div>
                <WatchStatusButton
                  watched={!!e.watchedAt}
                  disabled={watched.isPending}
                  onToggle={() =>
                    watched.mutate({
                      episodeId: e.episodeId,
                      watched: !e.watchedAt,
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      {watched.isError ? (
        <div className="mt-3">
          <ErrorState error={watched.error} />
        </div>
      ) : null}
    </div>
  );
}
