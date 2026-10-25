'use client';

import { CalendarDays, Heart, Newspaper, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Calendario', Icon: CalendarDays },
  { href: '/search', label: 'Cerca', Icon: Search },
  { href: '/news', label: 'News', Icon: Newspaper },
  { href: '/my-series', label: 'Le mie serie', Icon: Heart },
  { href: '/settings', label: 'Impostazioni', Icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <nav
      aria-label="Navigazione principale"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface md:static md:inset-auto md:w-56 md:shrink-0 md:flex-col md:gap-1 md:border-r md:border-t-0 md:p-3"
    >
      <span className="hidden px-3 py-4 text-xl font-bold text-primary md:block">Watchly</span>
      {items.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] md:flex-none md:flex-row md:gap-3 md:rounded-[14px] md:px-3 md:py-2.5 md:text-sm ${
              active ? 'text-primary md:bg-soft' : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon size={22} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
