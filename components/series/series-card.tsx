'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';

import { Button } from '@/components/ui/feedback';
import { sourceLabels, type SeriesSummary } from '@/lib/api';
import { useFollowMutation } from '@/lib/hooks';

import { Poster } from './poster';

export function FollowButton({ seriesId, following }: { seriesId: string; following: boolean }) {
  const mutation = useFollowMutation();
  return (
    <Button
      variant={following ? 'ghost' : 'primary'}
      aria-pressed={following}
      aria-label={following ? 'Smetti di seguire' : 'Segui'}
      title={following ? 'Smetti di seguire' : 'Segui'}
      onClick={() => mutation.mutate({ seriesId, follow: !following })}
      className="relative z-10 h-11 w-11 shrink-0 px-0"
    >
      {following ? <BookmarkCheck size={20} aria-hidden /> : <Bookmark size={20} aria-hidden />}
    </Button>
  );
}

export function SeriesCard({ series, footer }: { series: SeriesSummary; footer?: React.ReactNode }) {
  return (
    <li className="relative flex gap-3 rounded-[14px] border border-border bg-surface p-2.5 transition-colors hover:bg-soft">
      <Link
        href={`/series/${series.id}`}
        aria-label={`Apri ${series.title}`}
        className="absolute inset-0 rounded-[14px]"
      />
      <Poster url={series.posterUrl} title={series.title} />
      <div className="pointer-events-none min-w-0 flex-1">
        <p className="truncate text-[16px] font-bold">{series.title}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {series.kind === 'anime' ? 'Anime' : 'Serie TV'}
          {series.format ? ` · ${series.format}` : ''}
          {series.year ? ` · ${series.year}` : ''} · {sourceLabels[series.source]}
        </p>
        {footer}
      </div>
      <FollowButton seriesId={series.id} following={series.following} />
    </li>
  );
}
