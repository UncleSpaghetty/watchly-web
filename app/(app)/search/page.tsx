'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { SeriesCard } from '@/components/series/series-card';
import { Chip, SelectField, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, sourceLabels, type CatalogSource, type SeriesKind } from '@/lib/api';

type SourceFilter = 'all' | CatalogSource;
type KindFilter = 'all' | SeriesKind;

const sourceItems: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'Tutte' },
  { value: 'kitsu', label: sourceLabels.kitsu },
  { value: 'anilist', label: sourceLabels.anilist },
  { value: 'tmdb', label: sourceLabels.tmdb },
];

export default function SearchPage() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [kind, setKind] = useState<KindFilter>('all');
  const [format, setFormat] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<'relevance' | 'rating' | 'year' | 'title'>('relevance');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ['search', debounced, kind, source, format, year, genre, status, sort],
    queryFn: ({ signal }) =>
      api.search(
        debounced,
        {
          kind,
          source,
          format: format || undefined,
          year: year ? Number(year) : undefined,
          genre: genre || undefined,
          status: status || undefined,
          sort,
        },
        signal,
      ),
    enabled,
  });

  return (
    <div>
      <PageHeader
        eyebrow="CATALOGO"
        title="Cerca"
        subtitle="Cerca anime e serie TV e restringi i risultati per formato, anno e genere."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'anime', 'tv'] as const).map((value) => (
          <Chip key={value} selected={kind === value} onClick={() => setKind(value)}>
            {value === 'all' ? 'Tutti' : value === 'anime' ? 'Anime' : 'Serie TV'}
          </Chip>
        ))}
      </div>

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
          placeholder="Cerca un titolo"
          aria-label="Ricerca titoli"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <TextField
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          placeholder="Formato (TV, ONA, Film…)"
          aria-label="Formato"
        />
        <TextField
          type="number"
          min="1900"
          max="2100"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          placeholder="Anno"
          aria-label="Anno"
        />
        <TextField
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          placeholder="Genere"
          aria-label="Genere"
        />
        <SelectField value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Stato di pubblicazione">
          <option value="">Tutti gli stati</option>
          <option value="releasing">In corso</option>
          <option value="finished">Conclusa</option>
          <option value="upcoming">In arrivo</option>
          <option value="hiatus">In pausa</option>
          <option value="cancelled">Cancellata</option>
        </SelectField>
        <SelectField value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Ordina risultati">
          <option value="relevance">Rilevanza</option>
          <option value="rating">Valutazione</option>
          <option value="year">Anno</option>
          <option value="title">Titolo</option>
        </SelectField>
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
