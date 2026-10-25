'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppNav } from '@/components/layout/app-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { ListSkeleton } from '@/components/ui/feedback';
import { api, ApiError } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace('/login');
  }, [unauthorized, router]);

  if (me.isPending || unauthorized) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-dvh md:flex">
      <AppNav />
      <main className="app-main relative z-10 mx-auto w-full max-w-3xl flex-1 px-[22px] pb-28 md:pb-10">
        <OfflineBanner />
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
