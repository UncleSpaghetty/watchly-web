"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Clapperboard,
  Film,
  Grid2X2,
  ListFilter,
  Search,
  Tv,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { SeriesCard } from "@/components/series/series-card";
import { Chip, SelectField } from "@/components/ui/controls";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
} from "@/components/ui/feedback";
import { api, type SeriesKind } from "@/lib/api";

type KindFilter = "all" | SeriesKind | "film";

const genreItems = [
  { value: "Action", label: "Azione" },
  { value: "Adventure", label: "Avventura" },
  { value: "Comedy", label: "Commedia" },
  { value: "Drama", label: "Drammatico" },
  { value: "Fantasy", label: "Fantasy" },
  { value: "Science Fiction", label: "Fantascienza" },
  { value: "Mystery", label: "Mistero" },
  { value: "Romance", label: "Romantico" },
  { value: "Thriller", label: "Thriller" },
];
const currentYear = new Date().getFullYear();
const yearItems = Array.from({ length: 50 }, (_, index) => currentYear - index);

export default function SearchPage() {
  return <CatalogPage />;
}

export function CatalogPage({
  initialKind = "all",
  title = "Esplora",
  subtitle = "Cerca e scopri nuovi anime, serie TV e film.",
}: {
  initialKind?: KindFilter;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <SearchContent
        initialKind={initialKind}
        title={title}
        subtitle={subtitle}
      />
    </Suspense>
  );
}

function SearchContent({
  initialKind,
  title,
  subtitle,
}: {
  initialKind: KindFilter;
  title: string;
  subtitle: string;
}) {
  const searchParams = useSearchParams();
  const [text, setText] = useState(() => searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState("");
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<"relevance" | "rating" | "year" | "title">(
    "relevance",
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const enabled = debounced.length >= 2;
  const results = useQuery({
    queryKey: ["search", debounced, kind, year, genre, sort],
    queryFn: ({ signal }) =>
      api.search(
        debounced,
        {
          kind: kind === "film" ? "all" : kind,
          source: "all",
          format: kind === "film" ? "movie" : undefined,
          year: year ? Number(year) : undefined,
          genre: genre || undefined,
          sort,
        },
        signal,
      ),
    enabled,
  });

  return (
    <div className="search-page">

      <PageHeader title={title} subtitle={subtitle} />


      <label className="explore-search explore-search-desktop">
        <Search size={19} aria-hidden />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Cerca anime e serie"
          aria-label="Ricerca titoli"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>

      <section className="filter-panel" aria-label="Filtri di ricerca">
        <label className="explore-search explore-search-mobile">
          <Search size={19} aria-hidden />
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Cerca anime e serie"
            aria-label="Ricerca titoli"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>

        <div className="explore-kind-filters">
          {(["all", "anime", "tv", "film"] as const).map((value) => (
            <Chip
              key={value}
              selected={kind === value}
              onClick={() => setKind(value)}
            >
              {value === "all" ? (
                <Grid2X2 size={14} aria-hidden />
              ) : value === "anime" ? (
                <Clapperboard size={15} aria-hidden />
              ) : value === "tv" ? (
                <Tv size={15} aria-hidden />
              ) : (
                <Film size={15} aria-hidden />
              )}
              {value === "all"
                ? "Tutti"
                : value === "anime"
                  ? "Anime"
                  : value === "tv"
                    ? "Serie TV"
                    : "Film"}
            </Chip>
          ))}
        </div>

        <div className="search-primary-filters">
          <SelectField
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            aria-label="Genere"
          >
            <option value="">Tutti i generi</option>
            {genreItems.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            value={year}
            onChange={(event) => setYear(event.target.value)}
            aria-label="Anno"
          >
            <option value="">Tutti gli anni</option>
            {yearItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
          <label className="explore-sort-control">
            <span>Ordina per</span>
            <ListFilter size={19} aria-hidden />
            <SelectField
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              aria-label="Ordina risultati"
            >
              <option value="relevance">Più rilevanti</option>
              <option value="rating">Valutazione</option>
              <option value="year">Anno</option>
              <option value="title">Titolo</option>
            </SelectField>
          </label>
        </div>
      </section>

      <div className="mt-6">
        {!enabled ? (
          <EmptyState
            title="Inserisci almeno 2 caratteri"
            hint="Cerca un titolo per iniziare."
          />
        ) : results.isPending ? (
          <ListSkeleton />
        ) : results.isError ? (
          <ErrorState
            error={results.error}
            onRetry={() => void results.refetch()}
          />
        ) : results.data.length === 0 ? (
          <EmptyState title="Nessun risultato" />
        ) : (
          <>
            <p
              className="mb-3 text-sm font-semibold text-muted"
              aria-live="polite"
            >
              {results.data.length}{" "}
              {results.data.length === 1 ? "risultato" : "risultati"}
            </p>
            <ul className="series-grid series-grid-catalog">
              {results.data.map((s) => (
                <SeriesCard key={s.id} series={s} variant="catalog" />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
