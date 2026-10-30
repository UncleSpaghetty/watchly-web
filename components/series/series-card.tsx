'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { sourceLabels, type SeriesSummary } from '@/lib/api';
import { useFollowMutation } from '@/lib/hooks';

import { Poster } from './poster';

export function FollowButton({
  seriesId,
  following,
  showLabel = false,
}: {
  seriesId: string;
  following: boolean;
  showLabel?: boolean;
}) {
  const mutation = useFollowMutation();
  return (
    <Button
      variant={following ? 'default' : 'outline'}
      aria-pressed={following}
      aria-label={following ? 'Smetti di seguire' : 'Segui'}
      title={following ? 'Smetti di seguire' : 'Segui'}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ seriesId, follow: !following })}
      className={`follow-button relative z-10 shrink-0 ${showLabel ? 'gap-2 px-4' : 'h-11 w-11 px-0'}`}
    >
      <Heart
        size={20}
        className={following ? 'fill-current' : ''}
        aria-hidden
      />
      {showLabel ? <span>{following ? 'Seguita' : 'Segui'}</span> : null}
    </Button>
  );
}

export function SeriesCard({
  series,
  footer,
  actions,
  variant = 'list',
}: {
  series: SeriesSummary;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'list' | 'catalog' | 'watchlist';
}) {
  return (
    <li
      className={`series-card series-card-${variant} motion-card group relative flex gap-3 rounded-[16px] border border-border bg-surface/95 p-2.5`}
    >
      <Link
        href={`/series/${series.id}`}
        aria-label={`Apri ${series.title}`}
        className="absolute inset-0 rounded-[14px]"
      />
      <Poster
        url={series.posterUrl}
        title={series.title}
        className="series-card-poster"
      />
      <div className="pointer-events-none min-w-0 flex-1">
        <p className="truncate text-[16px] font-bold">{series.title}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {series.kind === 'anime' ? 'Anime' : 'Serie TV'}
          {series.format ? ` · ${series.format}` : ''}
          {series.year ? ` · ${series.year}` : ''} ·{' '}
          {sourceLabels[series.source]}
        </p>
        {footer}
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-end gap-2">
        <FollowButton seriesId={series.id} following={series.following} />
        {actions}
      </div>
    </li>
  );
}
