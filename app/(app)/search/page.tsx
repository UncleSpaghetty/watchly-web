"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Clapperboard,
  Film,
  Grid2X2,
  Tv,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { SeriesCard } from "@/components/series/series-card";
import { ChoiceGroup } from "@/components/ui/controls";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const sortItems = [
  { value: "relevance", label: "Più rilevanti" },
  { value: "rating", label: "Valutazione" },
  { value: "year", label: "Anno" },
  { value: "title", label: "Titolo" },
] as const;

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


      <div className="explore-search-desktop">
        <Input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Cerca anime e serie"
          aria-label="Ricerca titoli"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <section className="filter-panel" aria-label="Filtri di ricerca">
        <div className="explore-search-mobile">
          <Input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Cerca anime e serie"
            aria-label="Ricerca titoli"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <ChoiceGroup
          ariaLabel="Tipo di contenuto"
          className="explore-kind-filters"
          value={kind}
          onChange={setKind}
          items={(["all", "anime", "tv", "film"] as const).map((value) => ({
            value,
            label: (
              <>
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
              </>
            ),
          }))}
        />

        <div className="search-primary-filters">
          <Select
            items={[
              { value: "all", label: "Tutti i generi" },
              ...genreItems,
            ]}
            value={genre}
            onValueChange={(value) =>
              setGenre(!value || value === "all" ? "" : value)
            }
          >
            <SelectTrigger aria-label="Genere">
              <SelectValue placeholder="Tutti i generi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i generi</SelectItem>
              {genreItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: "all", label: "Tutti gli anni" },
              ...yearItems.map((item) => ({
                value: String(item),
                label: String(item),
              })),
            ]}
            value={year}
            onValueChange={(value) =>
              setYear(!value || value === "all" ? "" : value)
            }
          >
            <SelectTrigger aria-label="Anno">
              <SelectValue placeholder="Tutti gli anni" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli anni</SelectItem>
              {yearItems.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="explore-sort-control">
            <span>
              <ArrowUpDown size={16} aria-hidden />
              Ordinamento
            </span>
            <Select
              items={sortItems}
              value={sort}
              onValueChange={(value) => setSort(value as typeof sort)}
            >
              <SelectTrigger aria-label="Ordina risultati" className="sort-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
