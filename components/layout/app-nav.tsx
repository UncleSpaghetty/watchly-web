"use client";

import {
  BarChart3,
  CalendarDays,
  Compass,
  Heart,
  Home,
  LayoutDashboard,
  Settings,
  Newspaper,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const desktopItems = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/calendar", label: "Calendario", Icon: CalendarDays },
  { href: "/search", label: "Esplora", Icon: Compass },
  { href: "/my-series", label: "I miei seguiti", Icon: Heart },
  { href: "/news", label: "Notizie", Icon: Newspaper },
  { href: "/dashboard", label: "Statistiche", Icon: BarChart3 },
  { href: "/settings", label: "Impostazioni", Icon: Settings },
] as const;

const mobileItems = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", Icon: CalendarDays },
  { href: "/search", label: "Esplora", Icon: Search },
  { href: "/my-series", label: "Seguiti", Icon: Heart },
  { href: "/dashboard", label: "Statistiche", Icon: BarChart3 },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="app-nav pb-safe fixed inset-x-0 bottom-0 z-20 flex border-t border-border md:sticky md:top-0 md:h-dvh md:w-[218px] md:shrink-0 md:flex-col md:border-r md:border-t-0 md:p-5">
      <Link
        className="app-nav-brand hidden md:flex"
        href="/"
        aria-label="Watchly, home"
      >
        <span className="app-nav-logo" aria-hidden="true">
          <Image
            alt=""
            className="nocturne-mark"
            height={54}
            preload
            src="/images/watchly-nocturne-mark.png"
            width={54}
          />
        </span>
        <span>
          <span className="block text-xl font-bold leading-tight text-foreground">
            Watchly
          </span>
        </span>
      </Link>

      <nav
        aria-label="Navigazione principale"
        className="flex w-full md:hidden"
      >
        {mobileItems.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`app-nav-link flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] ${
                active
                  ? "app-nav-link-active text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={22} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Navigazione principale"
        className="hidden w-full md:mt-8 md:flex md:flex-col"
      >
        {desktopItems.map(({ href, label, Icon }) => {
          const active =
            label === "I miei seguiti"
              ? isActive("/my-series")
              : isActive(href);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`app-nav-link flex flex-none flex-row items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm ${
                label === "Notizie" ? "mt-1" : ""
              } ${
                active
                  ? "app-nav-link-active bg-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={21} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
