'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Heart,
  Newspaper,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { api } from '@/lib/api';
import { formatLongDate, getRomeTodayIso } from '@/lib/date/italy';

const sections = [
  {
    label: 'Esplora',
    items: [
      { href: '/', label: 'Calendario', Icon: CalendarDays },
      { href: '/search', label: 'Cerca', Icon: Search },
      { href: '/news', label: 'News', Icon: Newspaper },
    ],
  },
  {
    label: 'La tua libreria',
    items: [{ href: '/my-series', label: 'Le mie serie', Icon: Heart }],
  },
  {
    label: 'Account',
    items: [{ href: '/settings', label: 'Impostazioni', Icon: Settings }],
  },
] as const;

function NextEpisodeCard() {
  const today = getRomeTodayIso();
  const following = useQuery({
    queryKey: ['following'],
    queryFn: () => api.following(),
  });
  const nextSeries = following.data
    ?.filter((series) => series.nextAirDate && series.nextAirDate >= today)
    .sort((a, b) => a.nextAirDate!.localeCompare(b.nextAirDate!))[0];

  if (following.isPending) {
    return (
      <div
        className="app-nav-next app-nav-next-loading"
        aria-label="Caricamento prossimo episodio"
      >
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (!nextSeries?.nextAirDate) {
    return (
      <Link className="app-nav-next" href="/my-series">
        <span className="app-nav-next-kicker">
          <Sparkles size={14} aria-hidden />
          Prossimo episodio
        </span>
        <strong className="app-nav-next-title">Nessuna data in arrivo</strong>
        <span className="app-nav-next-date">
          {following.isError
            ? 'Calendario non disponibile'
            : 'Controlla le serie che segui'}
        </span>
      </Link>
    );
  }

  return (
    <Link className="app-nav-next" href={`/series/${nextSeries.id}`}>
      <span className="app-nav-next-kicker">
        <Sparkles size={14} aria-hidden />
        Prossimo episodio
      </span>
      <strong className="app-nav-next-title">{nextSeries.title}</strong>
      <span className="app-nav-next-date">
        {nextSeries.nextAirDate === today
          ? 'Oggi'
          : formatLongDate(nextSeries.nextAirDate)}
      </span>
    </Link>
  );
}

export function AppNav({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const displayName = userName?.trim() || 'Utente Watchly';
  const initial = displayName.charAt(0).toLocaleUpperCase('it');
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="app-nav pb-safe fixed inset-x-0 bottom-0 z-20 flex border-t border-border md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:flex-col md:border-r md:border-t-0 md:p-5">
      <Link
        className="app-nav-brand hidden md:flex"
        href="/"
        aria-label="Watchly, calendario"
      >
        <span className="app-nav-logo" aria-hidden="true">
          <Image alt="" height={44} preload src="/icons/icon.svg" width={44} />
        </span>
        <span>
          <span className="block text-xl font-bold leading-tight text-foreground">
            Watchly
          </span>
          <span className="mt-1 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
            Anime &amp; TV tracker
          </span>
        </span>
      </Link>

      <nav
        aria-label="Navigazione principale"
        className="flex w-full md:mt-8 md:flex-col"
      >
        {sections.map((section) => (
          <div className="contents md:mb-6 md:block" key={section.label}>
            <p className="app-nav-section-label hidden md:block">
              {section.label}
            </p>
            <div className="contents md:flex md:flex-col md:gap-1">
              {section.items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`app-nav-link flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] md:flex-none md:flex-row md:gap-3 md:rounded-[14px] md:px-3 md:py-2.5 md:text-sm ${
                      active
                        ? 'app-nav-link-active text-primary md:bg-soft'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <Icon size={22} aria-hidden />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="app-nav-footer mt-auto hidden md:block">
        <NextEpisodeCard />

        <div className="app-nav-account">
          <span className="app-nav-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">
              Connesso come
            </span>
            <span
              className="mt-0.5 block truncate text-sm font-semibold text-foreground"
              title={displayName}
            >
              {displayName}
            </span>
          </span>
        </div>

        <nav className="app-nav-legal" aria-label="Link informativi">
          <Link href="/about">Info</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Termini</Link>
        </nav>
      </div>
    </aside>
  );
}
