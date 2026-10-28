'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { Chip, SelectField, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type SeriesKind, type WatchStatus } from '@/lib/api';
import { formatLongDate } from '@/lib/date/italy';
import { useFollowingUpdateMutation } from '@/lib/hooks';

type SeriesFilter = SeriesKind | 'all';
type Sort = 'title' | 'next' | 'backlog' | 'status';

const kindFilters: Array<{ label: string; value: SeriesFilter }> = [
  { label: 'Tutte', value: 'all' },
  { label: 'Anime', value: 'anime' },
  { label: 'Serie TV', value: 'tv' },
];

const statusOptions: Array<{ value: WatchStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'in_list', label: 'In lista' },
  { value: 'planned', label: 'Da iniziare' },
  { value: 'watching', label: 'In corso' },
  { value: 'paused', label: 'In pausa' },
  { value: 'completed', label: 'Completata' },
  { value: 'dropped', label: 'Abbandonata' },
];

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<WatchStatus | 'all', string>;

export default function MySeriesPage() {
  const [kind, setKind] = useState<SeriesFilter>('all');
  const [status, setStatus] = useState<WatchStatus | 'all'>('all');
  const [filter, setFilter] = useState('');
  const [onlyBacklog, setOnlyBacklog] = useState(false);
  const [sort, setSort] = useState<Sort>('title');
  const following = useQuery({ queryKey: ['following'], queryFn: () => api.following() });
  const update = useFollowingUpdateMutation();

  const items = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase('it-IT');
    const source = Array.isArray(following.data) ? following.data : [];
    const visible = source.filter((series) => {
      if (!series.following) return false;
      if (kind !== 'all' && series.kind !== kind) return false;
      if (status !== 'all' && series.watchStatus !== status) return false;
      if (onlyBacklog && series.backlogEpisodes === 0) return false;
      if (!needle) return true;
      return [series.title, ...(series.alternativeTitles ?? [])].some((title) =>
        title.toLocaleLowerCase('it-IT').includes(needle),
      );
    });
    visible.sort((left, right) => {
      if (left.favorite !== right.favorite) return left.favorite ? -1 : 1;
      if (sort === 'backlog') return right.backlogEpisodes - left.backlogEpisodes;
      if (sort === 'next')
        return (left.nextAirDate ?? '9999').localeCompare(right.nextAirDate ?? '9999');
      if (sort === 'status')
        return statusLabels[left.watchStatus].localeCompare(statusLabels[right.watchStatus]);
      return left.title.localeCompare(right.title, 'it');
    });
    return visible;
  }, [following.data, filter, kind, onlyBacklog, sort, status]);

  return (
    <div>
      <PageHeader
        eyebrow="LA TUA WATCHLIST"
        title="Le mie serie"
        subtitle="Organizza i titoli, riprendi dal prossimo episodio e tieni sotto controllo gli arretrati."
      />

      <TextField
        type="search"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Cerca nelle tue serie"
        aria-label="Cerca nelle tue serie"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {kindFilters.map((item) => (
          <Chip key={item.value} selected={kind === item.value} onClick={() => setKind(item.value)}>
            {item.label}
          </Chip>
        ))}
        <Chip selected={onlyBacklog} onClick={() => setOnlyBacklog((value) => !value)}>
          Da recuperare
        </Chip>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SelectField
          aria-label="Filtra per stato"
          value={status}
          onChange={(event) => setStatus(event.target.value as WatchStatus | 'all')}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
        <SelectField
          aria-label="Ordina watchlist"
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
        >
          <option value="title">Ordina per titolo</option>
          <option value="next">Ordina per prossima uscita</option>
          <option value="backlog">Ordina per arretrati</option>
          <option value="status">Ordina per stato</option>
        </SelectField>
      </div>

      <div className="mt-6">
        {following.isPending ? (
          <ListSkeleton />
        ) : following.isError ? (
          <ErrorState error={following.error} onRetry={() => void following.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filter.trim() || onlyBacklog ? 'Nessun risultato' : 'Nessuna serie seguita'}
            hint={onlyBacklog ? 'Sei in pari con i filtri selezionati.' : 'Usa Cerca per aggiungere titoli alla tua lista.'}
          />
        ) : (
          <ul className="space-y-3">
            {items.map((series) => {
              const percentage = series.airedEpisodes
                ? Math.round((series.watchedEpisodes / series.airedEpisodes) * 100)
                : 0;
              return (
                <SeriesCard
                  key={series.id}
                  series={series}
                  footer={
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-primary">
                        {statusLabels[series.watchStatus]} · {series.watchedEpisodes}/{series.airedEpisodes} visti
                        {series.backlogEpisodes ? ` · ${series.backlogEpisodes} da recuperare` : ' · In pari'}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-muted">
                        {series.nextAirDate
                          ? `Prossimo episodio: ${formatLongDate(series.nextAirDate)}`
                          : 'Data del prossimo episodio non disponibile'}
                      </p>
                    </div>
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        aria-label={series.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                        aria-pressed={series.favorite}
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({
                            seriesId: series.id,
                            patch: { favorite: !series.favorite },
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-primary"
                      >
                        <Star size={17} className={series.favorite ? 'fill-current' : ''} />
                      </button>
                      <button
                        type="button"
                        aria-label={series.notificationsEnabled === false ? 'Attiva avvisi per la serie' : 'Disattiva avvisi per la serie'}
                        aria-pressed={series.notificationsEnabled !== false}
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate({
                            seriesId: series.id,
                            patch: { notificationsEnabled: series.notificationsEnabled === false },
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-primary"
                      >
                        {series.notificationsEnabled === false ? <BellOff size={17} /> : <Bell size={17} />}
                      </button>
                      <SelectField
                        aria-label={`Stato di ${series.title}`}
                        value={series.watchStatus}
                        disabled={update.isPending}
                        onChange={(event) =>
                          update.mutate({
                            seriesId: series.id,
                            patch: { watchStatus: event.target.value as WatchStatus },
                          })
                        }
                        className="max-w-36 px-2 py-1 text-xs"
                      >
                        {statusOptions.slice(1).map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </SelectField>
                      {series.nextUnwatchedEpisodeId ? (
                        <Link
                          href={`/series/${series.id}#episode-${series.nextUnwatchedEpisodeId}`}
                          className="rounded-xl border border-primary px-2.5 py-2 text-xs font-bold text-primary"
                        >
                          Riprendi
                        </Link>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
      {update.isError ? <div className="mt-3"><ErrorState error={update.error} /></div> : null}
    </div>
  );
}
