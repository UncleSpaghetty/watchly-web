'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AvailabilityBadge } from '@/components/series/availability-badge';
import { Poster } from '@/components/series/poster';
import { Button, EmptyState, ErrorState, ListSkeleton, StaleBanner } from '@/components/ui/feedback';
import { api, type CalendarEntry, type CalendarMode, type SeriesKind } from '@/lib/api';
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

export function CalendarView() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>('week');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string>(() => getRomeTodayIso());
  const [kind, setKind] = useState<SeriesKind | 'all'>('all');
  const [hideWatched, setHideWatched] = useState(false);

  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const mode: CalendarMode = settings.data?.calendarMode ?? 'italy';
  const setMode = useMutation({
    mutationFn: (calendarMode: CalendarMode) => api.patchSettings({ calendarMode }),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data);
    },
  });

  const week = useMemo(() => getRomeCalendarWeek(offset), [offset]);
  const month = useMemo(() => getRomeCalendarMonth(offset), [offset]);
  const range = view === 'week' ? { from: week.from, to: week.to } : getMonthRange(month);
  const label = view === 'week' ? week.label : month.label;

  const calendar = useQuery({
    queryKey: ['calendar', range.from, range.to, mode],
    queryFn: () => api.calendar(range.from, range.to, mode),
    enabled: settings.isSuccess || settings.isError,
  });
  const watched = useWatchedMutation();

  const entries = useMemo(
    () =>
      (calendar.data?.entries ?? []).filter(
        (e) => (kind === 'all' || e.series.kind === kind) && !(hideWatched && e.watchedAt),
      ),
    [calendar.data, kind, hideWatched],
  );
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
        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-sm ${
          isSelected ? 'border-primary bg-primary/15' : 'border-border bg-surface hover:bg-soft'
        } ${iso === today ? 'font-bold text-primary' : ''}`}
      >
        {day}
        <span className={`h-1.5 w-1.5 rounded-full ${count ? 'bg-accent' : 'bg-transparent'}`} />
      </button>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div role="group" aria-label="Vista" className="flex gap-1">
          {(['week', 'month'] as const).map((v) => (
            <Button key={v} variant={view === v ? 'primary' : 'ghost'} aria-pressed={view === v} onClick={() => changeView(v)}>
              {v === 'week' ? 'Settimana' : 'Mese'}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" aria-label="Periodo precedente" onClick={() => move(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <p className="font-semibold capitalize">{label}</p>
          {offset !== 0 ? (
            <button type="button" className="text-xs text-primary underline" onClick={() => changeView(view)}>
              Torna a oggi
            </button>
          ) : null}
        </div>
        <Button variant="ghost" aria-label="Periodo successivo" onClick={() => move(1)}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-xs text-muted" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {view === 'week'
          ? week.days.map((d) => dayCell(d.iso, d.day))
          : month.days.map((d, i) => (d ? dayCell(d.iso, d.day) : <span key={`pad-${i}`} />))}
      </div>

      <div className="my-4 flex flex-wrap items-center gap-2 text-sm">
        <select aria-label="Filtro categoria" value={kind} onChange={(e) => setKind(e.target.value as SeriesKind | 'all')} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="all">Tutte</option>
          <option value="anime">Anime</option>
          <option value="tv">Serie TV</option>
        </select>
        <select aria-label="Tipo di date" value={mode} onChange={(e) => setMode.mutate(e.target.value as CalendarMode)} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="italy">Disponibilità in Italia</option>
          <option value="original">Programmazione originale</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hideWatched} onChange={(e) => setHideWatched(e.target.checked)} />
          Nascondi visti
        </label>
      </div>

      {calendar.data?.stale ? <StaleBanner lastSyncAt={calendar.data.lastSuccessfulSyncAt} /> : null}
      {mode === 'original' ? (
        <p className="mb-3 text-xs text-muted">Sono mostrate le date di prima trasmissione originale, non quelle di disponibilità in Italia.</p>
      ) : null}

      <h2 className="mb-3 font-semibold capitalize">{formatLongDate(selected)}</h2>
      {calendar.isPending ? (
        <ListSkeleton rows={2} />
      ) : calendar.isError ? (
        <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
      ) : selectedEntries.length === 0 ? (
        <EmptyState
          title="Nessun episodio in questo giorno"
          hint={mode === 'italy' ? 'Mostriamo solo episodi con una data italiana disponibile.' : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {selectedEntries.map((e) => (
            <li key={e.episodeId} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
              <Poster url={e.series.posterUrl} title={e.series.title} />
              <div className="min-w-0 flex-1">
                <Link href={`/series/${e.series.id}`} className="block truncate font-semibold hover:underline">
                  {e.series.title}
                </Link>
                <p className="text-sm text-muted">
                  {e.seasonNumber ? `S${e.seasonNumber} · ` : ''}
                  {e.episodeNumber ? `Ep. ${e.episodeNumber}` : 'Episodio'}
                  {e.episodeTitle ? ` — ${e.episodeTitle}` : ''}
                </p>
                <div className="mt-1.5">
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
      {watched.isError ? <div className="mt-3"><ErrorState error={watched.error} /></div> : null}
    </div>
  );
}
