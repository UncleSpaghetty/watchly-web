import Image from 'next/image';

export function Poster({
  url,
  title,
  className = 'series-card-poster',
}: {
  url: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`poster-frame relative shrink-0 overflow-hidden rounded-[8px] bg-soft ${className}`}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          sizes="(min-width: 900px) 260px, 96px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center text-lg font-bold text-muted"
        >
          {title.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}
