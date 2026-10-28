import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/date/italy";

import { Card } from "./controls";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  const titleClassName = `${eyebrow ? "mt-2 " : ""}text-[clamp(1.85rem,4vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.035em]`;

  return (
    <header className="page-heading mb-7 flex items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={titleClassName}>{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-[15px] leading-6 text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-[16px] bg-soft ${className}`}
    />
  );
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
    <Card className="text-center">
      <p className="text-[17px] font-bold">{title}</p>
      {hint ? (
        <p className="mt-2 text-sm leading-6 text-muted">{hint}</p>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Si è verificato un errore.";
  return (
    <Card role="alert" className="border-accent/50 bg-accent/10 p-4">
      <p className="text-sm leading-6">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm font-semibold text-primary underline"
        >
          Riprova
        </button>
      ) : null}
    </Card>
  );
}

export function StaleBanner({ lastSyncAt }: { lastSyncAt: string | null }) {
  return (
    <div
      role="status"
      className="mb-4 rounded-[16px] border border-warn/50 bg-warn/10 p-3 text-sm"
    >
      L&apos;ultimo aggiornamento non è andato a buon fine: i dati potrebbero
      non essere aggiornati
      {lastSyncAt ? ` (ultimo riuscito: ${formatDateTime(lastSyncAt)})` : ""}.
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "border-primary bg-primary text-[#061511] hover:opacity-90",
    ghost: "border-border bg-transparent text-foreground hover:bg-soft",
    danger: "border-accent/70 bg-transparent text-accent hover:bg-accent/10",
  }[variant];

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition-[transform,background-color,border-color,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${styles} ${className}`}
    />
  );
}
