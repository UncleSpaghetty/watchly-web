'use client';

import Link from 'next/link';

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
      onClick={() => mutation.mutate({ seriesId, follow: !following })}
    >
      {following ? 'Non seguire' : 'Segui'}
    </Button>
  );
}

export function SeriesCard({ series, footer }: { series: SeriesSummary; footer?: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-[14px] border border-border bg-surface p-2.5">
      <Poster url={series.posterUrl} title={series.title} />
      <div className="min-w-0 flex-1">
        <Link href={`/series/${series.id}`} className="block truncate text-[16px] font-bold hover:underline">
          {series.title}
        </Link>
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