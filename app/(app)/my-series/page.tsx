"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Bell,
  BellOff,
  MoreVertical,
  Play,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Poster } from "@/components/series/poster";
import { Chip, SelectField, TextField } from "@/components/ui/controls";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
} from "@/components/ui/feedback";
import { api, type WatchStatus } from "@/lib/api";
import { formatLongDate } from "@/lib/date/italy";
import { useFollowingUpdateMutation } from "@/lib/hooks";

type Sort = "title" | "next" | "backlog" | "status";

const statusOptions: Array<{ value: WatchStatus | "all"; label: string }> = [
  { value: "all", label: "Tutti" },
  { value: "in_list", label: "In lista" },
  { value: "planned", label: "Da iniziare" },
  { value: "watching", label: "In corso" },
  { value: "paused", label: "In pausa" },
  { value: "completed", label: "Completata" },
  { value: "dropped", label: "Abbandonata" },
];

const statusFilterOptions = statusOptions.filter((option) =>
  ["all", "watching", "planned", "paused", "completed"].includes(option.value),
);

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<WatchStatus | "all", string>;

export default function MySeriesPage() {
  const [status, setStatus] = useState<WatchStatus | "all">("all");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<Sort>("title");
  const following = useQuery({
    queryKey: ["following"],
    queryFn: () => api.following(),
  });
  const update = useFollowingUpdateMutation();

  const items = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase("it-IT");
    const source = Array.isArray(following.data) ? following.data : [];
    const visible = source.filter((series) => {
      if (!series.following) return false;
      if (status !== "all" && series.watchStatus !== status) return false;
      if (!needle) return true;
      return [series.title, ...(series.alternativeTitles ?? [])].some((title) =>
        title.toLocaleLowerCase("it-IT").includes(needle),
      );
    });
    visible.sort((left, right) => {
      if (left.favorite !== right.favorite) return left.favorite ? -1 : 1;
      if (sort === "backlog")
        return right.backlogEpisodes - left.backlogEpisodes;
      if (sort === "next")
        return (left.nextAirDate ?? "9999").localeCompare(
          right.nextAirDate ?? "9999",
        );
      if (sort === "status")
        return statusLabels[left.watchStatus].localeCompare(
          statusLabels[right.watchStatus],
        );
      return left.title.localeCompare(right.title, "it");
    });
    return visible;
  }, [following.data, filter, sort, status]);

  const statusCounts = useMemo(() => {
    const source = Array.isArray(following.data)
      ? following.data.filter((series) => series.following)
      : [];
    return statusOptions.reduce<Record<WatchStatus | "all", number>>(
      (counts, option) => {
        counts[option.value] =
          option.value === "all"
            ? source.length
            : source.filter((series) => series.watchStatus === option.value)
                .length;
        return counts;
      },
      {
        all: 0,
        in_list: 0,
        planned: 0,
        watching: 0,
        paused: 0,
        completed: 0,
        dropped: 0,
      },
    );
  }, [following.data]);

  return (
    <div className="following-page">
      <PageHeader
        title="I miei seguiti"
        subtitle="Tutte le serie che stai seguendo o che hai aggiunto alla tua libreria."
      />

      <section className="filter-panel" aria-label="Filtri della watchlist">
        <div className="following-local-search">
          <TextField
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Cerca anime e serie"
            aria-label="Cerca nelle tue serie"
          />
        </div>

        <div className="following-status-filters">
          {statusFilterOptions.map((item) => (
            <Chip
              key={item.value}
              selected={status === item.value}
              onClick={() => setStatus(item.value)}
            >
              <span>{item.label}</span>
              <span
                className="filter-count"
                aria-label={`${statusCounts[item.value]} titoli`}
              >
                {statusCounts[item.value]}
              </span>
            </Chip>
          ))}
        </div>

        <label className="following-sort-row">
          <ArrowUpDown size={16} aria-hidden />
          <span>Ordina per</span>
          <SelectField
            aria-label="Ordina watchlist"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="title">Titolo</option>
            <option value="next">Prossima uscita</option>
            <option value="backlog">Da recuperare</option>
            <option value="status">Stato</option>
          </SelectField>
        </label>
      </section>

      <div className="mt-6">
        {following.isPending ? (
          <ListSkeleton />
        ) : following.isError ? (
          <ErrorState
            error={following.error}
            onRetry={() => void following.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={filter.trim() ? "Nessun risultato" : "Nessuna serie seguita"}
            hint={
              filter.trim()
                ? "Prova a modificare la ricerca o lo stato selezionato."
                : "Usa Esplora per aggiungere titoli alla tua lista."
            }
          />
        ) : (
          <ul className="series-grid series-grid-watchlist">
            {items.map((series) => {
              const percentage = series.airedEpisodes
                ? Math.round(
                    (series.watchedEpisodes / series.airedEpisodes) * 100,
                  )
                : 0;
              return (
                <li className="following-card" key={series.id}>
                  <div className="following-card-cover">
                    <Poster
                      url={series.posterUrl}
                      title={series.title}
                      className="following-poster"
                    />
                    <span className="following-status">
                      {statusLabels[series.watchStatus]}
                    </span>
                  </div>

                  <div className="following-card-body">
                    <div className="following-card-title-row">
                      <div className="min-w-0">
                        <Link href={`/series/${series.id}`}>
                          <h2>{series.title}</h2>
                        </Link>
                        <p>
                          {series.kind === "anime" ? "Anime" : "Serie TV"}
                          {series.year ? ` · ${series.year}` : ""}
                        </p>
                      </div>

                      <details className="following-menu">
                        <summary aria-label={`Azioni per ${series.title}`}>
                          <MoreVertical size={19} aria-hidden />
                        </summary>
                        <div className="following-menu-panel">
                          <button
                            type="button"
                            aria-label={
                              series.favorite
                                ? "Rimuovi dai preferiti"
                                : "Aggiungi ai preferiti"
                            }
                            aria-pressed={series.favorite}
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({
                                seriesId: series.id,
                                patch: { favorite: !series.favorite },
                              })
                            }
                            className="following-menu-action"
                          >
                            <Star
                              size={17}
                              className={series.favorite ? "fill-current" : ""}
                            />
                          </button>
                          <button
                            type="button"
                            aria-label={
                              series.notificationsEnabled === false
                                ? "Attiva avvisi per la serie"
                                : "Disattiva avvisi per la serie"
                            }
                            aria-pressed={series.notificationsEnabled !== false}
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({
                                seriesId: series.id,
                                patch: {
                                  notificationsEnabled:
                                    series.notificationsEnabled === false,
                                },
                              })
                            }
                            className="following-menu-action"
                          >
                            {series.notificationsEnabled === false ? (
                              <BellOff size={17} />
                            ) : (
                              <Bell size={17} />
                            )}
                          </button>
                          <SelectField
                            aria-label={`Stato di ${series.title}`}
                            value={series.watchStatus}
                            disabled={update.isPending}
                            onChange={(event) =>
                              update.mutate({
                                seriesId: series.id,
                                patch: {
                                  watchStatus: event.target
                                    .value as WatchStatus,
                                },
                              })
                            }
                            className="w-full px-2 py-1 text-xs"
                          >
                            {statusOptions.slice(1).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectField>
                        </div>
                      </details>
                    </div>

                    <p className="following-progress-label">
                      {series.watchedEpisodes}/{series.airedEpisodes} visti
                      {series.backlogEpisodes
                        ? ` · ${series.backlogEpisodes} da recuperare`
                        : " · In pari"}
                    </p>
                    <span className="following-progress-track">
                      <i style={{ width: `${percentage}%` }} />
                    </span>

                    <div className="following-card-meta">
                      <p>
                        <span>Prossimo episodio</span>
                        {series.nextAirDate
                          ? formatLongDate(series.nextAirDate)
                          : "Non pianificato"}
                      </p>
                      {series.nextUnwatchedEpisodeId ? (
                        <Link
                          href={`/series/${series.id}#episode-${series.nextUnwatchedEpisodeId}`}
                          className="following-resume"
                        >
                          <Play size={16} fill="currentColor" aria-hidden />
                          <span>Riprendi</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {update.isError ? (
        <div className="mt-3">
          <ErrorState error={update.error} />
        </div>
      ) : null}
    </div>
  );
}
