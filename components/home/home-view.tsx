'use client';

import { CalendarDays, ChevronRight, Compass, Play } from 'lucide-react';
import Link from 'next/link';

import { IOSInstallCard } from '@/components/pwa/ios-install-card';
import { Poster } from '@/components/series/poster';
import { ErrorState, ListSkeleton } from '@/components/ui/feedback';
import { Progress } from '@/components/ui/progress';
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
  const isFreshUser = !following.data.some((series) => series.following);
  const firstName = me.data?.name?.split(' ')[0];

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-kicker">
          {isFreshUser ? 'INIZIA DA QUI' : 'LA TUA SERATA'}
        </p>
        <h1>
          {isFreshUser ? 'Benvenuto' : 'Bentornato'}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p>
          {isFreshUser
            ? 'Cerca anime e serie TV, aggiungili ai tuoi seguiti e costruisci il tuo calendario personale.'
            : nextSeries?.nextAirDate
            ? `${nextSeries.title} torna ${formatLongDate(nextSeries.nextAirDate)}.`
            : 'Consulta il calendario o riprendi una delle serie che stai seguendo.'}
        </p>
        <div className="home-hero-actions">
          <Link
            href={isFreshUser ? '/search' : '/calendar'}
            className="home-primary-action"
          >
            {isFreshUser ? (
              <Compass size={17} aria-hidden />
            ) : (
              <CalendarDays size={17} aria-hidden />
            )}
            {isFreshUser ? 'Esplora il catalogo' : 'Apri il calendario'}
          </Link>
          <Link
            href={isFreshUser ? '/calendar' : '/my-series'}
            className="home-secondary-action"
          >
            {isFreshUser ? 'Scopri il calendario' : 'I miei seguiti'}{' '}
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      {isFreshUser && me.data?.id ? (
        <IOSInstallCard userId={me.data.id} />
      ) : null}

      <section className="home-section" aria-labelledby="home-week-title">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">IN PROGRAMMA</p>
            <h2 id="home-week-title">Questa settimana</h2>
          </div>
          <Link href="/calendar">Vedi calendario</Link>
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
                href="/calendar"
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
                    <Progress
                      value={percentage}
                      aria-label={`${percentage}% completato`}
                      className="home-progress"
                    />
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
