"use client";

import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/ui/feedback";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/date/italy";

export default function ProfilePage() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    staleTime: 5 * 60_000,
  });

  if (me.isPending) return <ListSkeleton rows={2} />;
  if (me.isError) {
    return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  }

  const user = me.data;
  const initial = user.name.charAt(0).toLocaleUpperCase("it");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="ACCOUNT"
        title="Il tuo profilo"
        subtitle="I dettagli dell’account con cui stai usando Watchly."
        actions={
          <Link
            href="/settings"
            aria-label="Apri impostazioni"
            title="Impostazioni"
            className="mt-5 inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-border text-muted transition-colors hover:bg-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Settings size={20} aria-hidden />
          </Link>
        }
      />

      <Card>
        <div className="flex items-center gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-primary text-2xl font-bold text-[#061511]"
            aria-hidden="true"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{user.name}</h2>
            <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Membro dal
            </dt>
            <dd className="mt-1 text-sm">{formatDateTime(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Lingua
            </dt>
            <dd className="mt-1 text-sm">Italiano ({user.locale})</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Fuso orario
            </dt>
            <dd className="mt-1 text-sm">{user.timezone}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
