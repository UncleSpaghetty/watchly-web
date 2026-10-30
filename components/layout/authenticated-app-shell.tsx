'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppNav } from '@/components/layout/app-nav';
import { AppTopbar } from '@/components/layout/app-topbar';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { AnimeLoader } from '@/components/ui/anime-loader';
import { api, ApiError } from '@/lib/api';

export function AuthenticatedAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [minimumLoadingTimeElapsed, setMinimumLoadingTimeElapsed] =
    useState(false);
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setMinimumLoadingTimeElapsed(true),
      1_000,
    );

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (unauthorized && minimumLoadingTimeElapsed) router.replace('/login');
  }, [minimumLoadingTimeElapsed, unauthorized, router]);

  if (me.isPending || unauthorized || !minimumLoadingTimeElapsed) {
    return <AnimeLoader />;
  }

  return (
    <div className="app-shell min-h-dvh md:flex">
      <AppNav />
      <main className="app-main relative z-10 w-full min-w-0 flex-1 px-4 pb-28 sm:px-6 md:pb-10 lg:px-8">
        <div className="app-frame mx-auto w-full max-w-[1180px]">
          <AppTopbar userName={me.data?.name} />
          <OfflineBanner />
          <div className="page-enter">{children}</div>
        </div>
      </main>
    </div>
  );
}
