import Image from 'next/image';

export function Poster({
  url,
  title,
  className = 'h-20 w-14',
}: {
  url: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[8px] bg-soft ${className}`}>
      {url ? (
        <Image src={url} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span aria-hidden className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
          {title.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}