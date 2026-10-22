import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/date/italy';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {actions}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-soft ${className}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Caricamento" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Si è verificato un errore.';
  return (
    <div role="alert" className="rounded-xl border border-accent/50 bg-accent/10 p-4">
      <p className="text-sm">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-2 text-sm font-medium text-primary underline">
          Riprova
        </button>
      ) : null}
    </div>
  );
}

export function StaleBanner({ lastSyncAt }: { lastSyncAt: string | null }) {
  return (
    <div role="status" className="mb-4 rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm">
      L&apos;ultimo aggiornamento non è andato a buon fine: i dati potrebbero non essere aggiornati
      {lastSyncAt ? ` (ultimo riuscito: ${formatDateTime(lastSyncAt)})` : ''}.
    </div>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-primary text-background hover:opacity-90',
    ghost: 'border border-border bg-surface hover:bg-soft',
    danger: 'border border-accent/60 text-accent hover:bg-accent/10',
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  );
}
