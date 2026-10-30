'use client';

import { Bookmark, CheckCircle2, CircleMinus, Clock3 } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';

export function WatchStatusButton({
  watched,
  disabled = false,
  disabledLabel,
  onToggle,
}: {
  watched: boolean;
  disabled?: boolean;
  disabledLabel?: string;
  onToggle: () => void;
}) {
  const label =
    disabled && disabledLabel
      ? disabledLabel
      : watched
        ? 'Visto'
        : 'Da vedere';
  const DisabledIcon =
    disabledLabel === 'In arrivo' || disabledLabel === 'Esce oggi'
      ? Clock3
      : CircleMinus;

  return (
    <Toggle
      pressed={watched}
      role="checkbox"
      aria-checked={watched}
      aria-label={
        disabled && disabledLabel
          ? disabledLabel
          : watched
            ? 'Segna come non visto'
            : 'Segna come visto'
      }
      title={disabled ? disabledLabel : undefined}
      disabled={disabled}
      onPressedChange={onToggle}
      className={`watch-status min-h-11 ${watched ? 'watch-status-on' : ''}`}
    >
      {disabled && disabledLabel ? (
        <DisabledIcon size={18} aria-hidden />
      ) : watched ? (
        <CheckCircle2 size={18} aria-hidden />
      ) : (
        <Bookmark size={18} aria-hidden />
      )}
      <span>{label}</span>
    </Toggle>
  );
}
