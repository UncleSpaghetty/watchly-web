'use client';

import type React from 'react';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

const baseField =
  'w-full rounded-[14px] border border-border bg-surface px-4 py-3.5 text-[15px] placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx(baseField, className)} />;
}

export function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={cx(
        'min-h-11 rounded-[14px] border border-border bg-surface px-4 py-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
    />
  );
}

export function Chip({
  selected,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={cx(
        'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-[transform,background-color,border-color,color] hover:-translate-y-0.5 active:translate-y-0',
        selected
          ? 'border-primary bg-primary text-surface'
          : 'border-border text-muted hover:bg-soft hover:text-foreground',
        className,
      )}
    />
  );
}

export function SegmentedTabs<T extends string>({
  value,
  items,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  items: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx('flex rounded-[14px] border border-border bg-surface p-1', className)}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cx(
              'flex-1 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-[transform,background-color,color] active:scale-[0.98]',
              selected ? 'bg-soft text-primary' : 'text-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return (
    <div {...props} className={cx('motion-card rounded-[18px] border border-border bg-surface/95 p-5', className)} />
  );
}
