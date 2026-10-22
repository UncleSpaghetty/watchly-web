'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type SeriesKind } from '@/lib/api';
import { formatLongDate } from '@/lib/date/italy';

export default function MySeriesPage() {
  const [kind, setKind] = useState<SeriesKind | 'all'>('all');
  const [filter, setFilter] = useState('');
  const following = useQuery({ queryKey: ['following'], queryFn: () => api.following() });

  const items = (following.data ?? []).filter(
    (s) =>
      s.following &&
      (kind === 'all' || s.kind === kind) &&
      [s.title, ...s.alternativeTitles].some((t) => t.toLowerCase().includes(filter.trim().toLowerCase())),
  );

  return (
    <div>
      <PageHeader title="Le mie serie" />
      <div className="mb-5 flex gap-2">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Cerca nella lista"
          aria-label="Cerca nella lista"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5"
        />
        <select aria-label="Categoria" value={kind} onChange={(e) => setKind(e.target.value as SeriesKind | 'all')} className="rounded-lg border border-border bg-surface px-2">
          <option value="all">Tutte</option>
          <option value="anime">Anime</option>
          <option value="tv">Serie TV</option>
        </select>
      </div>
      {following.isPending ? (
        <ListSkeleton />
      ) : following.isError ? (
        <ErrorState error={following.error} onRetry={() => void following.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Nessuna serie seguita" hint="Usa Cerca per aggiungere titoli alla tua lista." />
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <SeriesCard
              key={s.id}
              series={s}
              footer={
                <p className="mt-1 text-xs text-muted">
                  {s.nextItalianAvailability?.localDate
                    ? `Prossima uscita in Italia: ${formatLongDate(s.nextItalianAvailability.localDate)}`
                    : 'Data italiana non ancora disponibile'}
                </p>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
