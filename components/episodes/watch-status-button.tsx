'use client';

import { Check } from 'lucide-react';

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
  return (
    <Toggle
      pressed={watched}
      role="checkbox"
      aria-checked={watched}
      aria-label={disabled && disabledLabel ? disabledLabel : watched ? 'Segna come non visto' : 'Segna come visto'}
      title={disabled ? disabledLabel : undefined}
      disabled={disabled}
      onPressedChange={onToggle}
      className={`watch-status min-h-11 ${watched ? 'watch-status-on' : ''}`}
    >
      {watched ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
      <span>{disabled && disabledLabel ? disabledLabel : watched ? 'Visto' : 'Da vedere'}</span>
    </Toggle>
  );
}
