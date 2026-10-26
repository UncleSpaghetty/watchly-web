'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { Chip, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type SeriesKind } from '@/lib/api';
import { formatLongDate } from '@/lib/date/italy';

type SeriesFilter = SeriesKind | 'all';

const filters: Array<{ label: string; value: SeriesFilter }> = [
  { label: 'Tutte', value: 'all' },
  { label: 'Anime', value: 'anime' },
  { label: 'Serie TV', value: 'tv' },
];

export default function MySeriesPage() {
  const [kind, setKind] = useState<SeriesFilter>('all');
  const [filter, setFilter] = useState('');
  const following = useQuery({ queryKey: ['following'], queryFn: () => api.following() });

  const items = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase('it-IT');
    const source = Array.isArray(following.data) ? following.data : [];

    return source.filter((s) => {
      if (!s.following) return false;
      if (kind !== 'all' && s.kind !== kind) return false;
      if (!needle) return true;
      return [s.title, ...(s.alternativeTitles ?? [])].some((t) =>
        t.toLocaleLowerCase('it-IT').includes(needle),
      );
    });
  }, [following.data, filter, kind]);

  return (
    <div>
      <PageHeader
        eyebrow="LA TUA WATCHLIST"
        title="Le mie serie"
        subtitle="I titoli che hai scelto di seguire."
      />

      <TextField
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Cerca nelle tue serie"
        aria-label="Cerca nelle tue serie"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Chip key={item.value} selected={kind === item.value} onClick={() => setKind(item.value)}>
            {item.label}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        {following.isPending ? (
          <ListSkeleton />
        ) : following.isError ? (
          <ErrorState error={following.error} onRetry={() => void following.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title={filter.trim() ? 'Nessun risultato' : 'Nessuna serie seguita'}
            hint={
              filter.trim()
                ? 'Non ci sono serie seguite che corrispondono alla ricerca.'
                : 'Usa Cerca per aggiungere titoli alla tua lista.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                footer={
                  <p className="mt-1 text-xs text-muted">
                    {s.nextAirDate
                      ? `Prossimo episodio: ${formatLongDate(s.nextAirDate)}`
                      : 'Data del prossimo episodio non ancora disponibile'}
                  </p>
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
