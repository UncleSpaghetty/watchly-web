'use client';

import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { Chip, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, sourceLabels } from '@/lib/api';

type AnimeSourceFilter = 'all' | 'kitsu' | 'anilist';

const sourceItems: Array<{ value: AnimeSourceFilter; label: string }> = [
  { value: 'all', label: 'Tutte' },
  { value: 'kitsu', label: sourceLabels.kitsu },
  { value: 'anilist', label: sourceLabels.anilist },
];

export default function SearchPage() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [source, setSource] = useState<AnimeSourceFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ['search', debounced, 'anime', source],
    queryFn: ({ signal }) => api.search(debounced, 'anime', source, signal),
    enabled,
  });

  return (
    <div>
      <PageHeader
        eyebrow="CATALOGO"
        title="Cerca"
        actions={
          <div className="group relative">
            <button
              type="button"
              aria-describedby="tv-search-tooltip"
              aria-label="Informazioni sulla ricerca Serie TV"
              className="mt-5 inline-flex size-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Info aria-hidden size={20} />
            </button>
            <div
              id="tv-search-tooltip"
              role="tooltip"
              className="pointer-events-none invisible absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-3 text-left text-sm opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <p className="font-semibold text-foreground">Ricerca Serie TV sospesa</p>
              <p className="mt-1 leading-5 text-muted">
                Per il momento puoi cercare gli anime. La ricerca TV tornerà quando
                l’integrazione con TMDB sarà nuovamente disponibile.
              </p>
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
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
          placeholder="Cerca un anime"
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
