'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { WatchStatusButton } from '@/components/episodes/watch-status-button';
import { Poster } from '@/components/series/poster';
import { FollowButton } from '@/components/series/series-card';
import { Button, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/feedback';
import { api, ApiError, sourceLabels } from '@/lib/api';
import { formatDateTime, formatLongDate, getRomeTodayIso } from '@/lib/date/italy';
import { useSyncMutation, useWatchedMutation } from '@/lib/hooks';

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const series = useQuery({
    queryKey: ['series', id],
    queryFn: () => api.getSeries(id),
  });
  const episodes = useQuery({
    queryKey: ['episodes', id],
    queryFn: () => api.getEpisodes(id),
  });
  const sync = useSyncMutation(id);
  const watched = useWatchedMutation();

  if (series.isPending) return <ListSkeleton rows={3} />;
  if (series.isError) {
    const notFound = series.error instanceof ApiError && series.error.status === 404;
    return notFound ? (
      <EmptyState title="Serie non trovata" hint="Il titolo richiesto non esiste." />
    ) : (
      <ErrorState error={series.error} onRetry={() => void series.refetch()} />
    );
  }

  const s = series.data;
  const today = getRomeTodayIso();
  return (
    <div>
      <Link href="/search" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← Indietro
      </Link>

      <div className="detail-hero group mb-5 flex gap-4 overflow-hidden rounded-[20px] border border-border bg-surface/90 p-4 sm:p-5">
        <Poster url={s.posterUrl} title={s.title} className="h-36 w-24 rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">{s.kind === 'anime' ? 'ANIME' : 'SERIE TV'}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{s.title}</h1>
          {s.alternativeTitles?.length ? (
            <p className="mt-1 text-sm text-muted">{s.alternativeTitles.join(' · ')}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            {s.format ? `${s.format}` : ''}
            {s.year ? `${s.format ? ' · ' : ''}${s.year}` : ''}
            {s.status ? ` · ${s.status}` : ''}
            {s.seasons ? ` · ${s.seasons} stagioni` : ''} · {sourceLabels[s.source]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <FollowButton seriesId={s.id} following={s.following} showLabel />
            <Button variant="ghost" disabled={sync.isPending} onClick={() => sync.mutate()}>
              {sync.isPending ? 'Aggiornamento…' : 'Aggiorna informazioni'}
            </Button>
          </div>
        </div>
      </div>

      {sync.isError ? (
        <div className="mb-3">
          <ErrorState error={sync.error} />
        </div>
      ) : null}
      {sync.data?.status === 'queued' || sync.data?.status === 'running' ? (
        <p role="status" className="mb-3 text-sm text-muted">
          Aggiornamento avviato. I nuovi dati saranno disponibili a breve.
        </p>
      ) : null}
      {sync.data?.status === 'partial' || sync.data?.status === 'failed' ? (
        <p role="status" className="mb-3 text-sm text-warn">
          Aggiornamento {sync.data.status === 'partial' ? 'parziale' : 'non riuscito'}: i dati precedenti restano
          visibili.
        </p>
      ) : null}
      <p className="mb-4 text-xs text-muted">
        {s.lastSyncAt ? `Ultimo aggiornamento: ${formatDateTime(s.lastSyncAt)}` : 'Mai aggiornato'}
      </p>

      {s.synopsis ? <p className="mb-6 text-sm leading-relaxed text-muted">{s.synopsis}</p> : null}

      <h2 className="mb-3 text-[17px] font-bold">Episodi</h2>
      {episodes.isPending ? (
        <ListSkeleton rows={3} />
      ) : episodes.isError ? (
        <ErrorState error={episodes.error} onRetry={() => void episodes.refetch()} />
      ) : episodes.data.length === 0 ? (
        <EmptyState
          title="Nessun episodio noto"
          hint="Puoi comunque seguire la serie: gli episodi appariranno appena disponibili."
        />
      ) : (
        <ul className="space-y-2.5">
          {episodes.data.map((e, index) => {
            const episodeDate = e.airDate;
            const isPast = episodeDate ? episodeDate < today : false;
            return (
              <li
                key={e.id}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                className={`episode-row list-reveal ${isPast ? 'episode-row-past' : 'episode-row-upcoming'}`}
              >
                <div className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-soft px-2 text-sm font-bold text-primary">
                  {e.seasonNumber ? `S${e.seasonNumber}` : 'EP'}
                  <span className="mx-0.5 text-muted">·</span>
                  {e.number ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${e.watchedAt ? 'text-muted line-through' : ''}`}>
                    {e.title ?? (e.number ? `Episodio ${e.number}` : 'Episodio')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Data di uscita: {e.airDate ? formatLongDate(e.airDate) : 'non disponibile'}
                  </p>
                  <p className="mt-2 text-xs font-medium text-muted">Fonte: {sourceLabels[e.source]}</p>
                </div>
                <WatchStatusButton
                  watched={!!e.watchedAt}
                  disabled={watched.isPending}
                  onToggle={() => watched.mutate({ episodeId: e.id, watched: !e.watchedAt })}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
