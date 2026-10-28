'use client';

import { CalendarDays, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

import { Poster } from '@/components/series/poster';
import { ErrorState, ListSkeleton } from '@/components/ui/feedback';
import { api } from '@/lib/api';
import {
  formatLongDate,
  getRomeCalendarWeek,
  getRomeTodayIso,
} from '@/lib/date/italy';
import { useQuery } from '@tanstack/react-query';

export function HomeView() {
  const week = getRomeCalendarWeek(0);
  const today = getRomeTodayIso();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const following = useQuery({
    queryKey: ['following'],
    queryFn: () => api.following(),
  });
  const calendar = useQuery({
    queryKey: ['calendar', week.from, week.to],
    queryFn: () => api.calendar(week.from, week.to),
  });

  if (following.isPending || calendar.isPending)
    return <ListSkeleton rows={6} />;
  if (following.isError)
    return (
      <ErrorState
        error={following.error}
        onRetry={() => void following.refetch()}
      />
    );
  if (calendar.isError)
    return (
      <ErrorState
        error={calendar.error}
        onRetry={() => void calendar.refetch()}
      />
    );

  const nextSeries = following.data
    .filter((series) => series.nextAirDate && series.nextAirDate >= today)
    .sort((a, b) => a.nextAirDate!.localeCompare(b.nextAirDate!))[0];
  const continueWatching = following.data.filter(
    (series) => series.nextUnwatchedEpisodeId || series.watchedEpisodes > 0,
  );

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-kicker">LA TUA SERATA</p>
        <h1>
          Bentornato{me.data?.name ? `, ${me.data.name.split(' ')[0]}` : ''}
        </h1>
        <p>
          {nextSeries?.nextAirDate
            ? `${nextSeries.title} torna ${formatLongDate(nextSeries.nextAirDate)}.`
            : 'Consulta il calendario o riprendi una delle serie che stai seguendo.'}
        </p>
        <div className="home-hero-actions">
          <Link href="/" className="home-primary-action">
            <CalendarDays size={17} aria-hidden /> Apri il calendario
          </Link>
          <Link href="/my-series" className="home-secondary-action">
            I miei seguiti <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-week-title">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">IN PROGRAMMA</p>
            <h2 id="home-week-title">Questa settimana</h2>
          </div>
          <Link href="/">Vedi calendario</Link>
        </div>
        <div className="home-week-strip">
          {week.days.map((day) => {
            const count = calendar.data.entries.filter(
              (entry) => entry.date === day.iso,
            ).length;
            const weekday = new Intl.DateTimeFormat('it-IT', {
              timeZone: 'UTC',
              weekday: 'short',
            })
              .format(new Date(`${day.iso}T00:00:00Z`))
              .replace('.', '');
            return (
              <Link
                href="/"
                key={day.iso}
                className={
                  day.iso === today ? 'home-day home-day-today' : 'home-day'
                }
              >
                <span>{weekday}</span>
                <strong>{day.day}</strong>
                <i
                  className={
                    count ? 'home-day-dot home-day-dot-active' : 'home-day-dot'
                  }
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-section" aria-labelledby="continue-title">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">LA TUA LIBRERIA</p>
            <h2 id="continue-title">Continua a guardare</h2>
          </div>
          <Link href="/my-series">Tutte le serie</Link>
        </div>
        {continueWatching.length ? (
          <ul className="home-series-grid">
            {continueWatching.slice(0, 4).map((series) => {
              const percentage = series.airedEpisodes
                ? Math.round(
                    (series.watchedEpisodes / series.airedEpisodes) * 100,
                  )
                : 0;
              return (
                <li className="home-series-card" key={series.id}>
                  <Poster
                    url={series.posterUrl}
                    title={series.title}
                    className="home-series-poster"
                  />
                  <div>
                    <Link href={`/series/${series.id}`}>
                      <h3>{series.title}</h3>
                    </Link>
                    <p>
                      {series.watchedEpisodes}/{series.airedEpisodes} episodi
                    </p>
                    <span className="home-progress">
                      <i style={{ width: `${percentage}%` }} />
                    </span>
                  </div>
                  {series.nextUnwatchedEpisodeId ? (
                    <Link
                      href={`/series/${series.id}#episode-${series.nextUnwatchedEpisodeId}`}
                      className="home-play"
                      aria-label={`Riprendi ${series.title}`}
                    >
                      <Play size={16} fill="currentColor" aria-hidden />
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="home-empty">Le serie con progressi appariranno qui.</p>
        )}
      </section>
    </div>
  );
}
