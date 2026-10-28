'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type ThemeChoice = 'dark' | 'light' | 'system';
type AccentChoice = 'mint' | 'sage' | 'blue' | 'violet' | 'rose';

const THEME_KEY = 'watchly-theme';
const ACCENT_KEY = 'watchly-accent';
const CHANGE_EVENT = 'watchly-appearance-change';

const themes: Array<{
  value: ThemeChoice;
  label: string;
  Icon: typeof Moon;
}> = [
  { value: 'dark', label: 'Scuro', Icon: Moon },
  { value: 'light', label: 'Chiaro', Icon: Sun },
  { value: 'system', label: 'Sistema', Icon: Monitor },
];

const accents: Array<{ value: AccentChoice; label: string }> = [
  { value: 'mint', label: 'Menta' },
  { value: 'sage', label: 'Salvia' },
  { value: 'blue', label: 'Blu' },
  { value: 'violet', label: 'Viola' },
  { value: 'rose', label: 'Rosa' },
];

function readPreferences(): string {
  if (typeof window === 'undefined') return 'system|mint';
  const theme = window.localStorage.getItem(THEME_KEY) ?? 'system';
  const accent = window.localStorage.getItem(ACCENT_KEY) ?? 'mint';
  return `${theme}|${accent}`;
}

function applyPreferences(theme: ThemeChoice, accent: AccentChoice) {
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.accent = accent;
}

function subscribe(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const notify = () => callback();
  const handleMedia = () => {
    const [theme, accent] = readPreferences().split('|') as [
      ThemeChoice,
      AccentChoice,
    ];
    applyPreferences(theme, accent);
    callback();
  };
  window.addEventListener('storage', notify);
  window.addEventListener(CHANGE_EVENT, notify);
  media.addEventListener('change', handleMedia);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(CHANGE_EVENT, notify);
    media.removeEventListener('change', handleMedia);
  };
}

export function ThemeControl() {
  const snapshot = useSyncExternalStore(
    subscribe,
    readPreferences,
    () => 'system|mint',
  );
  const [theme, accent] = snapshot.split('|') as [ThemeChoice, AccentChoice];

  const updateTheme = (next: ThemeChoice) => {
    window.localStorage.setItem(THEME_KEY, next);
    applyPreferences(next, accent);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const updateAccent = (next: AccentChoice) => {
    window.localStorage.setItem(ACCENT_KEY, next);
    applyPreferences(theme, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <div className="appearance-control">
      <fieldset>
        <legend>Tema</legend>
        <div className="theme-choice-grid" role="radiogroup" aria-label="Tema">
          {themes.map(({ value, label, Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                className="theme-choice"
                onClick={() => updateTheme(value)}
              >
                <Icon size={21} aria-hidden />
                <span>{label}</span>
                {selected ? (
                  <Check className="theme-choice-check" size={14} aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Colore accento</legend>
        <div
          className="accent-choice-row"
          role="radiogroup"
          aria-label="Colore accento"
        >
          {accents.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-label={label}
              aria-checked={accent === value}
              className={`accent-choice accent-choice-${value}`}
              onClick={() => updateAccent(value)}
            >
              {accent === value ? <Check size={16} aria-hidden /> : null}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
