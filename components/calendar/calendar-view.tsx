'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AvailabilityBadge } from '@/components/series/availability-badge';
import { Poster } from '@/components/series/poster';
import { SegmentedTabs } from '@/components/ui/controls';
import { Button, EmptyState, ErrorState, ListSkeleton, PageHeader, StaleBanner } from '@/components/ui/feedback';
import { api, type CalendarEntry } from '@/lib/api';
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
  const [selected, setSelected] = useState<string>(() => getRomeTodayIso());

  const week = useMemo(() => getRomeCalendarWeek(offset), [offset]);
  const month = useMemo(() => getRomeCalendarMonth(offset), [offset]);
  const range = view === 'week' ? { from: week.from, to: week.to } : getMonthRange(month);
  const label = view === 'week' ? week.label : month.label;

  const calendar = useQuery({
    queryKey: ['calendar', range.from, range.to, 'original'],
    queryFn: () => api.calendar(range.from, range.to, 'original'),
  });
  const watched = useWatchedMutation();

  const entries = useMemo(() => calendar.data?.entries ?? [], [calendar.data]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [entries]);

  const today = getRomeTodayIso();
  const selectedEntries = byDay.get(selected) ?? [];

  const changeView = (next: View) => {
    setView(next);
    setOffset(0);
    setSelected(today);
  };
  const move = (delta: number) => {
    const nextOffset = offset + delta;
    setOffset(nextOffset);
    const target = view === 'week' ? getRomeCalendarWeek(nextOffset) : getRomeCalendarMonth(nextOffset);
    setSelected(
      view === 'week'
        ? (target as ReturnType<typeof getRomeCalendarWeek>).from
        : (target as ReturnType<typeof getRomeCalendarMonth>).days.find((d) => d)!.iso,
    );
  };

  const dayCell = (iso: string, day: number) => {
    const count = byDay.get(iso)?.length ?? 0;
    const isSelected = iso === selected;
    return (
      <button
        key={iso}
        type="button"
        onClick={() => setSelected(iso)}
        aria-pressed={isSelected}
        aria-label={`${formatLongDate(iso)}${count ? `, ${count} episodi` : ''}`}
        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] border text-sm ${
          isSelected ? 'border-primary bg-soft text-primary' : 'border-border bg-surface hover:bg-soft'
        } ${iso === today ? 'font-bold' : ''}`}
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

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" aria-label="Periodo precedente" onClick={() => move(-1)} className="px-3">
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <p className="font-semibold capitalize">{label}</p>
          {offset !== 0 ? (
            <button type="button" className="text-xs font-semibold text-primary underline" onClick={() => changeView(view)}>
              Torna a oggi
            </button>
          ) : null}
        </div>
        <Button variant="ghost" aria-label="Periodo successivo" onClick={() => move(1)} className="px-3">
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs text-muted" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {view === 'week'
          ? week.days.map((d) => dayCell(d.iso, d.day))
          : month.days.map((d, i) => (d ? dayCell(d.iso, d.day) : <span key={`pad-${i}`} />))}
      </div>

      {calendar.data?.stale ? <StaleBanner lastSyncAt={calendar.data.lastSuccessfulSyncAt} /> : null}

      <h2 className="mb-3 mt-6 text-[17px] font-bold capitalize">{formatLongDate(selected)}</h2>
      {calendar.isPending ? (
        <ListSkeleton rows={2} />
      ) : calendar.isError ? (
        <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
      ) : selectedEntries.length === 0 ? (
        <EmptyState title="Nessun episodio in questo giorno" />
      ) : (
        <ul className="space-y-3">
          {selectedEntries.map((e) => (
            <li key={e.episodeId} className="flex gap-3 rounded-[14px] border border-border bg-surface p-2.5">
              <Poster url={e.series.posterUrl} title={e.series.title} />
              <div className="min-w-0 flex-1">
                <Link href={`/series/${e.series.id}`} className="block truncate text-[16px] font-bold hover:underline">
                  {e.series.title}
                </Link>
                <p className="mt-0.5 text-[13px] text-muted">
                  {e.seasonNumber ? `S${e.seasonNumber} · ` : ''}
                  {e.episodeNumber ? `Ep. ${e.episodeNumber}` : 'Episodio'}
                  {e.episodeTitle ? ` — ${e.episodeTitle}` : ''}
                </p>
                <div className="mt-2">
                  <AvailabilityBadge availability={e.availability} />
                </div>
              </div>
              <Button
                variant={e.watchedAt ? 'primary' : 'ghost'}
                aria-pressed={!!e.watchedAt}
                onClick={() => watched.mutate({ episodeId: e.episodeId, watched: !e.watchedAt })}
              >
                {e.watchedAt ? 'Visto' : 'Da vedere'}
              </Button>
            </li>
          ))}
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
