'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Heart,
  ListVideo,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type CSSProperties, type ReactNode } from 'react';

import { SegmentedTabs } from '@/components/ui/controls';
import { ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type DashboardPeriodWeeks } from '@/lib/api';

const periods: Array<{ value: DashboardPeriodWeeks; label: string }> = [
  { value: 4, label: '4 sett.' },
  { value: 12, label: '12 sett.' },
  { value: 26, label: '6 mesi' },
  { value: 52, label: '1 anno' },
];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="dashboard-kpi">
      <div className="dashboard-kpi-icon" aria-hidden>
        {icon}
      </div>
      <p className="dashboard-kpi-label">{label}</p>
      <strong className="dashboard-kpi-value">{value}</strong>
      <p className="dashboard-kpi-hint">{hint}</p>
    </article>
  );
}

export function DashboardView({ showHeader = true }: { showHeader?: boolean }) {
  const dashboard = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.dashboard(12),
    staleTime: 30_000,
  });

  return (
    <div>
      {showHeader ? (
        <PageHeader
          eyebrow="IL TUO ANDAMENTO"
          title="Dashboard"
          subtitle="Una lettura sintetica delle serie che segui e degli episodi segnati come visti."
        />
      ) : null}

      {dashboard.isPending ? (
        <ListSkeleton rows={6} />
      ) : dashboard.isError ? (
        <ErrorState
          error={dashboard.error}
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        <DashboardContent data={dashboard.data} />
      )}
    </div>
  );
}

function DashboardContent({
  data,
}: {
  data: Awaited<ReturnType<typeof api.dashboard>>;
}) {
  const { kpis } = data;
  const totalKinds = data.watchlistBreakdown.anime + data.watchlistBreakdown.tv;
  const animePercentage = totalKinds
    ? Math.round((data.watchlistBreakdown.anime * 100) / totalKinds)
    : 0;
  const maxGenre = Math.max(
    1,
    ...data.genres.items.map((genre) => genre.count),
  );

  return (
    <>
      <section
        className="dashboard-kpi-grid"
        aria-label="Indicatori principali"
      >
        <KpiCard
          label="Serie seguite"
          value={kpis.followedSeries}
          hint={`${data.watchlistBreakdown.anime} anime · ${data.watchlistBreakdown.tv} TV`}
          icon={<Heart size={19} />}
        />
        <KpiCard
          label="Episodi visti"
          value={kpis.watchedEpisodes}
          hint={`Serie attuale: ${kpis.completionPercentage}% completata`}
          icon={<CheckCircle2 size={19} />}
        />
        <KpiCard
          label="Tempo stimato"
          value={formatDuration(kpis.estimatedWatchMinutes)}
          hint={`Durata nota per il ${kpis.durationCoveragePercentage}% degli episodi`}
          icon={<Clock3 size={19} />}
        />
        <KpiCard
          label="Arretrati"
          value={kpis.backlogEpisodes}
          hint={`${kpis.airedEpisodes} episodi usciti nella watchlist`}
          icon={<ListVideo size={19} />}
        />
        <KpiCard
          label="Prossimi 7 giorni"
          value={kpis.upcoming7Days}
          hint={`${kpis.upcoming30Days} uscite nei prossimi 30 giorni`}
          icon={<CalendarClock size={19} />}
        />
        <KpiCard
          label="Attività consecutiva"
          value={`${kpis.currentActivityStreak} ${kpis.currentActivityStreak === 1 ? 'giorno' : 'giorni'}`}
          hint={`Record: ${kpis.longestActivityStreak} giorni di attività`}
          icon={<Flame size={19} />}
        />
      </section>

      <section className="dashboard-panel mt-5">
        <div className="dashboard-panel-heading">
          <div>
            <p className="dashboard-panel-eyebrow">QUESTA SETTIMANA</p>
            <h2>Il prossimo passo</h2>
          </div>
          <Link className="text-sm font-semibold text-primary hover:underline" href="/my-series">
            Apri la watchlist
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/?view=week" className="rounded-[14px] border border-border bg-soft p-4">
            <strong className="text-2xl text-primary">{kpis.upcoming7Days}</strong>
            <span className="mt-1 block text-sm text-muted">episodi in arrivo</span>
          </Link>
          <Link href="/my-series" className="rounded-[14px] border border-border bg-soft p-4">
            <strong className="text-2xl text-primary">{kpis.backlogEpisodes}</strong>
            <span className="mt-1 block text-sm text-muted">episodi da recuperare</span>
          </Link>
          <Link href="/my-series" className="rounded-[14px] border border-border bg-soft p-4">
            <strong className="text-2xl text-primary">{kpis.completionPercentage}%</strong>
            <span className="mt-1 block text-sm text-muted">progresso sugli episodi usciti</span>
          </Link>
        </div>
      </section>

      <section className="dashboard-panel mt-5">
        <div className="dashboard-panel-heading">
          <div>
            <p className="dashboard-panel-eyebrow">PROGRESSO</p>
            <h2>Stato delle serie seguite</h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/my-series"
          >
            Tutte le serie
          </Link>
        </div>
        {data.seriesProgress.length ? (
          <div className="dashboard-progress-list">
            {data.seriesProgress.map((series) => (
              <Link href={`/series/${series.seriesId}`} key={series.seriesId}>
                <div className="dashboard-progress-heading">
                  <span>{series.title}</span>
                  <span>
                    {series.watched}/{series.aired} · {series.percentage}%
                  </span>
                </div>
                <span className="dashboard-progress-track">
                  <i style={{ width: `${series.percentage}%` }} />
                </span>
                <small>
                  {series.backlog
                    ? `${series.backlog} episodi arretrati`
                    : 'In pari'}
                  {series.averageRating === null
                    ? ''
                    : ` · voto provider ${Math.round(series.averageRating)}/100`}
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">
            Aggiungi una serie alla watchlist per visualizzarne il progresso.
          </p>
        )}
      </section>

      <section className="dashboard-grid mt-5">
        <DashboardActivity initialData={data} />

        <article className="dashboard-panel">
          <p className="dashboard-panel-eyebrow">WATCHLIST</p>
          <h2>Anime e serie TV</h2>
          <div className="dashboard-donut-wrap">
            <div
              className="dashboard-donut"
              role="img"
              aria-label={
                totalKinds
                  ? `${animePercentage}% anime, ${100 - animePercentage}% serie TV`
                  : 'Nessuna serie in watchlist'
              }
              style={{
                background: totalKinds
                  ? `conic-gradient(var(--color-primary) 0 ${animePercentage}%, var(--color-accent) ${animePercentage}% 100%)`
                  : 'var(--color-soft)',
              }}
            >
              <span>
                <strong>{totalKinds}</strong>
                titoli
              </span>
            </div>
            <div className="dashboard-legend">
              <p>
                <i className="bg-primary" />
                Anime <strong>{data.watchlistBreakdown.anime}</strong>
              </p>
              <p>
                <i className="bg-accent" />
                Serie TV <strong>{data.watchlistBreakdown.tv}</strong>
              </p>
            </div>
          </div>
          <div className="dashboard-rating">
            <Star size={16} aria-hidden />
            <span>Valutazione media provider</span>
            <strong>
              {kpis.averageProviderRating === null
                ? '—'
                : `${Math.round(kpis.averageProviderRating)}/100`}
            </strong>
          </div>
          <p className="mt-2 text-xs text-muted">
            Basata su {kpis.ratedSeries} titoli con voto disponibile.
          </p>
        </article>
      </section>

      <section className="dashboard-grid mt-5">
        <article className="dashboard-panel">
          <p className="dashboard-panel-eyebrow">INTERESSI</p>
          <h2>Generi più presenti</h2>
          {data.genres.items.length ? (
            <div className="dashboard-genres">
              {data.genres.items.map((genre) => (
                <div key={genre.name}>
                  <div>
                    <span>{genre.name}</span>
                    <strong>{genre.count}</strong>
                  </div>
                  <span className="dashboard-genre-track">
                    <i
                      style={{ width: `${(genre.count / maxGenre) * 100}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              I generi appariranno dopo il prossimo aggiornamento delle serie.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">
            {data.genres.basis === 'watched_episodes'
              ? 'Calcolati sugli episodi segnati come visti.'
              : 'Calcolati sulle serie attualmente seguite.'}
          </p>
        </article>

        <article className="dashboard-panel">
          <p className="dashboard-panel-eyebrow">PIÙ VISTE</p>
          <h2>Le tue serie principali</h2>
          {data.topSeries.length ? (
            <ol className="dashboard-top-series">
              {data.topSeries.map((series, index) => (
                <li key={series.seriesId}>
                  <span>{index + 1}</span>
                  <Link href={`/series/${series.seriesId}`}>
                    {series.title}
                  </Link>
                  <small>
                    {series.watched} ep. ·{' '}
                    {formatDuration(series.estimatedMinutes)}
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="dashboard-empty">
              Segna qualche episodio come visto per creare la classifica.
            </p>
          )}
        </article>
      </section>

      <p className="mt-4 text-xs leading-5 text-muted">
        Il tempo è una stima ottenuta dalle durate fornite dai provider.
        L&apos;attività indica quando un episodio è stato contrassegnato come
        visto, non una riproduzione effettiva.
      </p>
    </>
  );
}

function DashboardActivity({
  initialData,
}: {
  initialData: Awaited<ReturnType<typeof api.dashboard>>;
}) {
  const [weeks, setWeeks] = useState<DashboardPeriodWeeks>(12);
  const dashboard = useQuery({
    queryKey: ['dashboard', 'activity', weeks],
    queryFn: () => api.dashboard(weeks),
    initialData: weeks === 12 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
  const activity = dashboard.data?.activity ?? [];
  const maxActivity = Math.max(
    1,
    ...activity.map((point) => point.watchedCount),
  );
  const chartStyle = {
    '--dashboard-columns': Math.max(activity.length, 1),
  } as CSSProperties;

  return (
    <article
      className="dashboard-panel dashboard-activity-panel"
      aria-busy={dashboard.isFetching}
    >
      <div className="dashboard-panel-heading">
        <div>
          <p className="dashboard-panel-eyebrow">ATTIVITÀ</p>
          <h2>Episodi segnati come visti</h2>
        </div>
        <SegmentedTabs
          value={weeks}
          ariaLabel="Periodo del grafico"
          items={periods}
          onChange={setWeeks}
        />
      </div>

      <div className="dashboard-chart-status" aria-live="polite">
        {dashboard.isFetching
          ? 'Aggiornamento grafico…'
          : dashboard.isError
            ? 'Impossibile aggiornare il periodo.'
            : '\u00a0'}
      </div>
      <div
        className="dashboard-bars"
        data-loading={dashboard.isFetching || undefined}
        role="img"
        aria-label={`Episodi segnati come visti nelle ultime ${weeks} settimane`}
        style={chartStyle}
      >
        {activity.map((point, index) => (
          <div className="dashboard-bar-column" key={point.periodStart}>
            <span
              className="dashboard-bar"
              style={{
                height: point.watchedCount
                  ? `${Math.max(4, (point.watchedCount / maxActivity) * 100)}%`
                  : '0%',
              }}
              title={`${point.periodStart}: ${point.watchedCount} episodi`}
            />
            {(weeks <= 12 || index % Math.ceil(weeks / 12) === 0) && (
              <span className="dashboard-bar-label">
                {new Intl.DateTimeFormat('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'UTC',
                }).format(new Date(`${point.periodStart}T00:00:00Z`))}
              </span>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
