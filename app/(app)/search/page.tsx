'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type CatalogSource, type SeriesKind, sourceLabels } from '@/lib/api';

export default function SearchPage() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState<SeriesKind | 'all'>('all');
  const [source, setSource] = useState<CatalogSource | 'all'>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ['search', debounced, kind, source],
    queryFn: ({ signal }) => api.search(debounced, kind, source, signal),
    enabled,
  });

  return (
    <div>
      <PageHeader title="Cerca" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cerca anime o serie TV"
        aria-label="Cerca anime o serie TV"
        className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-3"
      />
      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        <select aria-label="Categoria" value={kind} onChange={(e) => setKind(e.target.value as SeriesKind | 'all')} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="all">Anime e Serie TV</option>
          <option value="anime">Anime</option>
          <option value="tv">Serie TV</option>
        </select>
        <select aria-label="Fonte" value={source} onChange={(e) => setSource(e.target.value as CatalogSource | 'all')} className="rounded-lg border border-border bg-surface px-2 py-2">
          <option value="all">Tutte le fonti</option>
          {(Object.keys(sourceLabels) as CatalogSource[]).map((s) => (
            <option key={s} value={s}>
              {sourceLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {!enabled ? (
        <EmptyState title="Inserisci almeno 2 caratteri" hint="Cerca un titolo per iniziare." />
      ) : results.isPending ? (
        <ListSkeleton />
      ) : results.isError ? (
        <ErrorState error={results.error} onRetry={() => void results.refetch()} />
      ) : results.data.length === 0 ? (
        <EmptyState title="Nessun risultato" />
      ) : (
        <ul className="space-y-3">
          {results.data.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
