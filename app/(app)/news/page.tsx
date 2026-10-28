/* eslint-disable @next/next/no-img-element */
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Bookmark,
  CheckCheck,
  Grid2X2,
  Play,
  Tv,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FollowButton } from "@/components/series/series-card";
import { Card, Chip } from "@/components/ui/controls";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
} from "@/components/ui/feedback";
import { api, type NewsItem } from "@/lib/api";
import { formatDateTime } from "@/lib/date/italy";
import { useNewsStateMutation } from "@/lib/hooks";

type Feed = "all" | "followed" | "saved";

const categoryItems: Array<{
  value: NewsItem["category"];
  label: string;
  Icon: LucideIcon;
}> = [
  { value: null, label: "Tutte le categorie", Icon: Grid2X2 },
  { value: "anime", label: "Anime", Icon: Play },
  { value: "series", label: "Serie TV", Icon: Tv },
  { value: "manga", label: "Manga", Icon: BookOpen },
];

export default function NewsPage() {
  const [feed, setFeed] = useState<Feed>("followed");
  const [category, setCategory] = useState<NewsItem["category"]>(null);
  const filters = {
    followed: feed === "followed",
    saved: feed === "saved",
    category,
  };
  const news = useQuery({
    queryKey: ["news", filters],
    queryFn: () => api.news(filters),
  });
  const state = useNewsStateMutation();

  return (
    <div className="news-page">
      <PageHeader
        title="Feed"
        subtitle="Le ultime notizie da anime, serie e manga, selezionate per te."
      />

      <section className="filter-panel mb-6" aria-label="Filtri del feed">
        <div className="news-feed-filters">
          {(["followed", "all", "saved"] as const).map((value) => (
            <Chip
              key={value}
              selected={feed === value}
              onClick={() => setFeed(value)}
            >
              {value === "all"
                ? "Tutti"
                : value === "followed"
                  ? "Per te"
                  : "Salvati"}
            </Chip>
          ))}
        </div>
        <div className="news-category-filters" aria-label="Categoria notizie">
          {categoryItems.map(({ Icon, ...item }) => (
            <Chip
              key={item.value ?? "all"}
              selected={category === item.value}
              onClick={() => setCategory(item.value)}
            >
              <Icon size={15} aria-hidden />
              {item.value === null ? (
                <>
                  <span className="news-category-long">{item.label}</span>
                  <span className="news-category-short">Tutte</span>
                </>
              ) : (
                item.label
              )}
            </Chip>
          ))}
        </div>
      </section>

      {news.isPending ? (
        <ListSkeleton />
      ) : news.isError ? (
        <ErrorState error={news.error} onRetry={() => void news.refetch()} />
      ) : !news.data.configured ? (
        <EmptyState title="Nessun feed configurato" />
      ) : news.data.items.length === 0 ? (
        <EmptyState title="Nessuna notizia disponibile" />
      ) : (
        <section aria-labelledby="all-news-title">
          <h2 id="all-news-title" className="news-section-title">
            Tutte le notizie
          </h2>
          <ul className="news-grid">
            {news.data.items.map((n) => (
              <li key={n.id}>
                <Card className="news-card h-full p-5">
                  {n.imageUrl ? (
                    <img
                      className="news-card-image"
                      src={n.imageUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted">
                      {n.source}
                      {n.publishedAt
                        ? ` · ${formatDateTime(n.publishedAt)}`
                        : null}
                      {n.category ? ` · ${n.category}` : null}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={
                          n.saved ? "Rimuovi dai salvati" : "Salva notizia"
                        }
                        aria-pressed={n.saved}
                        disabled={state.isPending}
                        onClick={() =>
                          state.mutate({
                            newsId: n.id,
                            patch: { saved: !n.saved },
                          })
                        }
                        className="rounded-lg border border-border p-2 text-primary"
                      >
                        <Bookmark
                          size={16}
                          className={n.saved ? "fill-current" : ""}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={
                          n.readAt ? "Segna come non letta" : "Segna come letta"
                        }
                        aria-pressed={!!n.readAt}
                        disabled={state.isPending}
                        onClick={() =>
                          state.mutate({
                            newsId: n.id,
                            patch: { read: !n.readAt },
                          })
                        }
                        className="rounded-lg border border-border p-2 text-primary"
                      >
                        <CheckCheck size={16} />
                      </button>
                    </div>
                  </div>
                  <h2 className="mt-1 text-[16px] font-bold">{n.title}</h2>
                  {n.excerpt ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {n.excerpt}
                    </p>
                  ) : null}
                  {/^https:\/\//.test(n.url) ? (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        state.mutate({ newsId: n.id, patch: { read: true } })
                      }
                      className="mt-3 inline-block text-sm font-semibold text-primary underline"
                    >
                      Leggi sulla fonte
                    </a>
                  ) : null}
                  {n.relatedSeries.length ? (
                    <ul className="mt-4 space-y-2 border-t border-border pt-4">
                      {n.relatedSeries.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <Link
                            href={`/series/${r.id}`}
                            className="text-sm font-semibold hover:underline"
                          >
                            {r.title}
                          </Link>
                          <FollowButton
                            seriesId={r.id}
                            following={r.following}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      {state.isError ? (
        <div className="mt-3">
          <ErrorState error={state.error} />
        </div>
      ) : null}
    </div>
  );
}
