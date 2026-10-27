'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { FollowButton } from '@/components/series/series-card';
import { Card } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/date/italy';

export default function NewsPage() {
  const news = useQuery({ queryKey: ['news'], queryFn: () => api.news() });

  return (
    <div>
      <PageHeader
        eyebrow="AGGIORNAMENTI"
        title="News"
        subtitle="Notizie da fonti editoriali."
      />

      {news.isPending ? (
        <ListSkeleton />
      ) : news.isError ? (
        <ErrorState error={news.error} onRetry={() => void news.refetch()} />
      ) : !news.data.configured ? (
        <EmptyState title="Nessun feed configurato" />
      ) : news.data.items.length === 0 ? (
        <EmptyState title="Nessuna notizia disponibile" />
      ) : (
        <ul className="space-y-3">
          {news.data.items.map((n) => (
            <li key={n.id}>
              <Card className="p-5">
                <p className="text-xs text-muted">
                  {n.source}
                  {n.publishedAt ? ` · ${formatDateTime(n.publishedAt)}` : null}
                </p>
                <h2 className="mt-1 text-[16px] font-bold">{n.title}</h2>
                {n.excerpt ? <p className="mt-2 text-sm leading-6 text-muted">{n.excerpt}</p> : null}
                {/^https:\/\//.test(n.url) ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-primary underline"
                  >
                    Leggi sulla fonte
                  </a>
                ) : null}
                {n.relatedSeries.length ? (
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {n.relatedSeries.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <Link href={`/series/${r.id}`} className="text-sm font-semibold hover:underline">
                          {r.title}
                        </Link>
                        <FollowButton seriesId={r.id} following={r.following} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
