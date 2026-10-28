'use client';

import { useQuery } from '@tanstack/react-query';
import { Bookmark, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { FollowButton } from '@/components/series/series-card';
import { Card, Chip, SelectField, TextField } from '@/components/ui/controls';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, type NewsItem } from '@/lib/api';
import { formatDateTime } from '@/lib/date/italy';
import { useNewsStateMutation } from '@/lib/hooks';

type Feed = 'all' | 'followed' | 'saved';

export default function NewsPage() {
  const [feed, setFeed] = useState<Feed>('all');
  const [category, setCategory] = useState<NewsItem['category']>(null);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(text.trim()), 350);
    return () => clearTimeout(timeout);
  }, [text]);
  const filters = {
    followed: feed === 'followed',
    saved: feed === 'saved',
    category,
    q: query || undefined,
  };
  const news = useQuery({
    queryKey: ['news', filters],
    queryFn: () => api.news(filters),
  });
  const state = useNewsStateMutation();

  return (
    <div>
      <PageHeader
        eyebrow="AGGIORNAMENTI"
        title="News"
        subtitle="Notizie da fonti editoriali."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {(['all', 'followed', 'saved'] as const).map((value) => (
          <Chip key={value} selected={feed === value} onClick={() => setFeed(value)}>
            {value === 'all' ? 'Tutte' : value === 'followed' ? 'Dai miei seguiti' : 'Salvate'}
          </Chip>
        ))}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <TextField
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Cerca nelle notizie"
          aria-label="Cerca nelle notizie"
        />
        <SelectField
          value={category ?? ''}
          onChange={(event) => setCategory((event.target.value || null) as NewsItem['category'])}
          aria-label="Categoria notizie"
        >
          <option value="">Tutte le categorie</option>
          <option value="series">Serie</option>
          <option value="anime">Anime</option>
          <option value="manga">Manga</option>
          <option value="gaming">Gaming</option>
          <option value="events">Eventi</option>
        </SelectField>
      </div>

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
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted">
                  {n.source}
                  {n.publishedAt ? ` · ${formatDateTime(n.publishedAt)}` : null}
                  {n.category ? ` · ${n.category}` : null}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={n.saved ? 'Rimuovi dai salvati' : 'Salva notizia'}
                      aria-pressed={n.saved}
                      disabled={state.isPending}
                      onClick={() => state.mutate({ newsId: n.id, patch: { saved: !n.saved } })}
                      className="rounded-lg border border-border p-2 text-primary"
                    >
                      <Bookmark size={16} className={n.saved ? 'fill-current' : ''} />
                    </button>
                    <button
                      type="button"
                      aria-label={n.readAt ? 'Segna come non letta' : 'Segna come letta'}
                      aria-pressed={!!n.readAt}
                      disabled={state.isPending}
                      onClick={() => state.mutate({ newsId: n.id, patch: { read: !n.readAt } })}
                      className="rounded-lg border border-border p-2 text-primary"
                    >
                      <CheckCheck size={16} />
                    </button>
                  </div>
                </div>
                <h2 className="mt-1 text-[16px] font-bold">{n.title}</h2>
                {n.excerpt ? <p className="mt-2 text-sm leading-6 text-muted">{n.excerpt}</p> : null}
                {/^https:\/\//.test(n.url) ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => state.mutate({ newsId: n.id, patch: { read: true } })}
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
      {state.isError ? <div className="mt-3"><ErrorState error={state.error} /></div> : null}
    </div>
  );
}
