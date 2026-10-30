'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { WatchStatusButton } from '@/components/episodes/watch-status-button';
import { Poster } from '@/components/series/poster';
import { FollowButton } from '@/components/series/series-card';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from '@/components/ui/feedback';
import { api, ApiError, sourceLabels } from '@/lib/api';
import {
  formatDateTime,
  formatLongDate,
  getRomeTodayIso,
} from '@/lib/date/italy';
import { useSeriesWatchedMutation, useSyncMutation, useWatchedMutation } from '@/lib/hooks';

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
  const bulkWatched = useSeriesWatchedMutation(id);
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setNowMs(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (series.isPending) return <ListSkeleton rows={3} />;
  if (series.isError) {
    const notFound =
      series.error instanceof ApiError && series.error.status === 404;
    return notFound ? (
      <EmptyState
        title="Serie non trovata"
        hint="Il titolo richiesto non esiste."
      />
    ) : (
      <ErrorState error={series.error} onRetry={() => void series.refetch()} />
    );
  }

  const s = series.data;
  const today = getRomeTodayIso();
  const episodeItems = episodes.data ?? [];
  const nextUnwatched = episodeItems.find(
    (episode) =>
      !episode.watchedAt &&
      (!episode.airAt
        ? !!episode.airDate && episode.airDate <= today
        : new Date(episode.airAt).getTime() <= nowMs),
  );
  const preferredServices = new Set(settings.data?.preferredServices ?? []);
  const watchProviders = [...s.watchProviders].sort(
    (left, right) =>
      Number(preferredServices.has(right.name)) -
      Number(preferredServices.has(left.name)),
  );
  const seasonProgress = Object.entries(
    episodeItems.reduce<Record<string, { total: number; watched: number; backlog: number }>>(
      (groups, episode) => {
        const key = String(episode.seasonNumber ?? 1);
        const group = groups[key] ?? { total: 0, watched: 0, backlog: 0 };
        group.total += 1;
        if (episode.watchedAt) group.watched += 1;
        if (
          !episode.watchedAt &&
          episode.airDate &&
          episode.airDate <= today
        ) group.backlog += 1;
        groups[key] = group;
        return groups;
      },
      {},
    ),
  );
  return (
    <div>
      <Button
        variant="link"
        onClick={() => router.back()}
        className="mb-4"
      >
        ← Indietro
      </Button>

      <div className="detail-hero group mb-5 flex gap-4 overflow-hidden rounded-[20px] border border-border bg-surface/90 p-4 sm:p-5">
        <Poster
          url={s.posterUrl}
          title={s.title}
          className="h-36 w-24 rounded-[10px]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.2em] text-primary">
            {s.kind === 'anime' ? 'ANIME' : 'SERIE TV'}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{s.title}</h1>
          {s.alternativeTitles?.length ? (
            <p className="mt-1 text-sm text-muted">
              {s.alternativeTitles.join(' · ')}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            {s.format ? `${s.format}` : ''}
            {s.year ? `${s.format ? ' · ' : ''}${s.year}` : ''}
            {s.status ? ` · ${s.status}` : ''}
            {s.seasons ? ` · ${s.seasons} stagioni` : ''} ·{' '}
            {sourceLabels[s.source]}
          </p>
          <p className="mt-2 text-xs text-muted">
            {s.episodeRuntimeMinutes
              ? `~${s.episodeRuntimeMinutes} min per episodio`
              : 'Durata non disponibile'}
            {s.averageRating !== null
              ? ` · voto provider ${Math.round(s.averageRating)}/100`
              : ''}
          </p>
          {s.genres.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.genres.map((genre) => (
                <span
                  className="rounded-full border border-border bg-soft px-2.5 py-1 text-xs text-muted"
                  key={genre}
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <FollowButton seriesId={s.id} following={s.following} showLabel />
            <Button
              variant="ghost"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              {sync.isPending ? 'Aggiornamento…' : 'Aggiorna informazioni'}
            </Button>
            {nextUnwatched ? (
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById(`episode-${nextUnwatched.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              >
                Prossimo non visto
              </Button>
            ) : null}
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
          Aggiornamento{' '}
          {sync.data.status === 'partial' ? 'parziale' : 'non riuscito'}: i dati
          precedenti restano visibili.
        </p>
      ) : null}
      <p className="mb-4 text-xs text-muted">
        {s.lastSyncAt
          ? `Ultimo aggiornamento: ${formatDateTime(s.lastSyncAt)}`
          : 'Mai aggiornato'}
      </p>

      {s.synopsis ? (
        <p className="mb-6 text-sm leading-relaxed text-muted">{s.synopsis}</p>
      ) : null}

      <section className="mb-6 rounded-[18px] border border-border bg-surface/95 p-4">
        <h2 className="text-[17px] font-bold">Dove guardare</h2>
        {watchProviders.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {watchProviders.map((provider) => (
              <a
                key={`${provider.id}-${provider.type}`}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-soft px-3 py-2 text-sm font-semibold hover:border-primary"
              >
                {provider.name} · {provider.type === 'flatrate' || provider.type === 'stream' ? 'streaming' : provider.type}
                {preferredServices.has(provider.name) ? ' · preferito' : ''}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Nessun collegamento streaming comunicato dai provider per questo titolo.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          I collegamenti provengono da TMDB o AniList e possono riferirsi al titolo generale: verifica il catalogo del servizio prima della visione.
        </p>
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">Episodi</h2>
        {s.following && episodeItems.length ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              disabled={bulkWatched.isPending}
              onClick={() => bulkWatched.mutate(true)}
            >
              Segna gli episodi usciti come visti
            </Button>
            <Button
              variant="ghost"
              disabled={bulkWatched.isPending}
              onClick={() => bulkWatched.mutate(false)}
            >
              Segna tutti come non visti
            </Button>
          </div>
        ) : null}
      </div>
      {bulkWatched.data ? (
        <p role="status" className="mb-3 text-sm text-muted">
          Aggiornati {bulkWatched.data.updated} episodi
          {bulkWatched.data.skippedFuture
            ? `; ${bulkWatched.data.skippedFuture} non ancora usciti o senza data sono rimasti invariati.`
            : '.'}
        </p>
      ) : null}
      {bulkWatched.isError ? <div className="mb-3"><ErrorState error={bulkWatched.error} /></div> : null}
      {seasonProgress.length ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {seasonProgress.map(([season, progress]) => (
            <div key={season} className="rounded-[14px] border border-border bg-surface/95 p-3 text-sm">
              <p className="font-bold">Stagione {season}</p>
              <p className="mt-1 text-muted">
                {progress.watched}/{progress.total} visti · {progress.backlog ? `${progress.backlog} da recuperare` : 'In pari'}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {episodes.isPending ? (
        <ListSkeleton rows={3} />
      ) : episodes.isError ? (
        <ErrorState
          error={episodes.error}
          onRetry={() => void episodes.refetch()}
        />
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
            const isFuture = e.airAt
              ? new Date(e.airAt).getTime() > nowMs
              : !!episodeDate && episodeDate > today;
            return (
              <li
                key={e.id}
                id={`episode-${e.id}`}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                className={`episode-row list-reveal ${isPast ? 'episode-row-past' : 'episode-row-upcoming'}`}
              >
                <div className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-soft px-2 text-sm font-bold text-primary">
                  {e.seasonNumber ? `S${e.seasonNumber}` : 'EP'}
                  <span className="mx-0.5 text-muted">·</span>
                  {e.number ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold ${e.watchedAt ? 'text-muted line-through' : ''}`}
                  >
                    {e.title ??
                      (e.number ? `Episodio ${e.number}` : 'Episodio')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Data di uscita:{' '}
                    {e.airDate ? formatLongDate(e.airDate) : 'non disponibile'}
                    {e.durationMinutes ? ` · ${e.durationMinutes} min` : ''}
                  </p>
                  <p className="mt-2 text-xs font-medium text-muted">
                    Fonte: {sourceLabels[e.source]}
                  </p>
                </div>
                <WatchStatusButton
                  watched={!!e.watchedAt}
                  disabled={watched.isPending || isFuture}
                  disabledLabel={isFuture ? 'Non ancora uscito' : undefined}
                  onToggle={() =>
                    watched.mutate({ episodeId: e.id, watched: !e.watchedAt })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
