"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AppTopbar({ userName }: { userName?: string }) {
  const displayName = userName?.trim() || "Utente Watchly";
  const initial = displayName.charAt(0).toLocaleUpperCase("it");

  return (
    <header className="app-topbar">
      <Link
        className="app-topbar-brand"
        href="/home"
        aria-label="Watchly, home"
      >
        <Image
          alt=""
          className="nocturne-mark"
          height={44}
          priority
          src="/images/watchly-nocturne-mark.png"
          width={44}
        />
        <span>Watchly</span>
      </Link>

      <div className="app-topbar-actions">
        <Link
          href="/news"
          className="app-topbar-icon app-topbar-notification"
          aria-label="Apri il feed"
        >
          <Bell size={19} aria-hidden />
          <span aria-hidden />
        </Link>
        <Link
          href="/profile"
          className="app-topbar-avatar"
          aria-label={`Profilo di ${displayName}`}
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
