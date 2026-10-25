'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AvailabilityBadge } from '@/components/series/availability-badge';
import { Poster } from '@/components/series/poster';
import { FollowButton } from '@/components/series/series-card';
import { Button, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/feedback';
import { api, ApiError, sourceLabels } from '@/lib/api';
import { formatDateTime, formatLongDate } from '@/lib/date/italy';
import { useSyncMutation, useWatchedMutation } from '@/lib/hooks';

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const series = useQuery({ queryKey: ['series', id], queryFn: () => api.getSeries(id) });
  const episodes = useQuery({ queryKey: ['episodes', id], queryFn: () => api.getEpisodes(id) });
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
  return (
    <div>
      <Link href="/search" className="mb-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← Indietro
      </Link>

      <div className="mb-4 flex gap-4">
        <Poster url={s.posterUrl} title={s.title} className="h-36 w-24 rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">{s.kind === 'anime' ? 'ANIME' : 'SERIE TV'}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{s.title}</h1>
          {s.alternativeTitles.length ? (
            <p className="mt-1 text-sm text-muted">{s.alternativeTitles.join(' · ')}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            {s.format ? `${s.format}` : ''}
            {s.year ? `${s.format ? ' · ' : ''}${s.year}` : ''}
            {s.status ? ` · ${s.status}` : ''}
            {s.seasons ? ` · ${s.seasons} stagioni` : ''} · {sourceLabels[s.source]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <FollowButton seriesId={s.id} following={s.following} />
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
      {sync.data?.status === 'partial' || sync.data?.status === 'failed' ? (
        <p role="status" className="mb-3 text-sm text-warn">
          Aggiornamento {sync.data.status === 'partial' ? 'parziale' : 'non riuscito'}: i dati precedenti restano visibili.
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
        <ul className="space-y-2">
          {episodes.data.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {e.seasonNumber ? `S${e.seasonNumber} · ` : ''}
                  {e.number ? `Ep. ${e.number}` : 'Episodio'}
                  {e.title ? ` — ${e.title}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Prima trasmissione originale: {e.originalAirDate ? formatLongDate(e.originalAirDate) : 'n.d.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AvailabilityBadge availability={e.availability} />
                  {e.availability.localDate ? (
                    <span className="text-xs text-muted">{formatLongDate(e.availability.localDate)}</span>
                  ) : null}
                  {e.availability.sourceUrl && /^https:\/\//.test(e.availability.sourceUrl) ? (
                    <a
                      href={e.availability.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary underline"
                    >
                      Fonte
                    </a>
                  ) : null}
                </div>
              </div>
              <Button
                variant={e.watchedAt ? 'primary' : 'ghost'}
                aria-pressed={!!e.watchedAt}
                onClick={() => watched.mutate({ episodeId: e.id, watched: !e.watchedAt })}
              >
                {e.watchedAt ? 'Visto' : 'Da vedere'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}