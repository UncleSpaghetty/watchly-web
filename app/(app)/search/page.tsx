'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { Chip, SegmentedTabs, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type CatalogSource, type SeriesKind, sourceLabels } from '@/lib/api';

type KindFilter = SeriesKind | 'all';

type SourceFilter = CatalogSource | 'all';

const kindItems: Array<{ value: KindFilter; label: string }> = [
  { value: 'all', label: 'Tutti' },
  { value: 'anime', label: 'Anime' },
  { value: 'tv', label: 'Serie TV' },
];

export default function SearchPage() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState<KindFilter>('anime');
  const [source, setSource] = useState<SourceFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    if (kind === 'tv' && source !== 'tmdb') setSource('tmdb');
    if (kind === 'anime' && source === 'tmdb') setSource('all');
  }, [kind, source]);

  const placeholder = useMemo(() => {
    if (kind === 'anime') return 'Cerca un anime';
    if (kind === 'tv') return 'Cerca una serie TV';
    return 'Cerca anime o serie TV';
  }, [kind]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ['search', debounced, kind, source],
    queryFn: ({ signal }) => api.search(debounced, kind, source, signal),
    enabled,
  });

  const sourceItems = useMemo(() => {
    const allItem: Array<{ value: SourceFilter; label: string }> = [{ value: 'all', label: 'Tutte' }];

    if (kind === 'tv') return [{ value: 'tmdb' as const, label: sourceLabels.tmdb }];

    if (kind === 'anime') {
      return [
        ...allItem,
        { value: 'kitsu' as const, label: sourceLabels.kitsu },
        { value: 'anilist' as const, label: sourceLabels.anilist },
      ];
    }

    return [
      ...allItem,
      ...(Object.keys(sourceLabels) as CatalogSource[]).map((s) => ({ value: s, label: sourceLabels[s] })),
    ];
  }, [kind]);

  return (
    <div>
      <PageHeader eyebrow="CATALOGO" title="Cerca" />

      <SegmentedTabs value={kind} ariaLabel="Categoria" items={kindItems} onChange={setKind} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="text-[13px] text-muted">Fonte</p>
        {sourceItems.map((item) => (
          <Chip
            key={item.value}
            selected={source === item.value}
            onClick={() => setSource(item.value)}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      <div className="mt-4">
        <TextField
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Ricerca titoli"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <div className="mt-6">
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
    </div>
  );
}