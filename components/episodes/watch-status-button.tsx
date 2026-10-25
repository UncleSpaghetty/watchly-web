'use client';

import { Check } from 'lucide-react';

export function WatchStatusButton({
  watched,
  disabled = false,
  onToggle,
}: {
  watched: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={watched}
      aria-label={watched ? 'Segna come non visto' : 'Segna come visto'}
      disabled={disabled}
      onClick={onToggle}
      className={`watch-status ${watched ? 'watch-status-on' : ''}`}
    >
      {watched ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
      <span>{watched ? 'Visto' : 'Da vedere'}</span>
    </button>
  );
}
