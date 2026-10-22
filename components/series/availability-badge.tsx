import type { Availability } from '@/lib/api';

const labels: Record<Availability['status'], { text: string; className: string }> = {
  confirmed: { text: 'Disponibile in Italia', className: 'bg-primary/20 text-primary' },
  estimated: { text: 'Previsto, non verificato', className: 'bg-warn/20 text-warn' },
  original: { text: 'Uscita originale', className: 'bg-soft text-muted' },
  unknown: { text: 'Data italiana non disponibile', className: 'bg-soft text-muted' },
  disputed: { text: 'Data contestata', className: 'bg-accent/20 text-accent' },
  withdrawn: { text: 'Data ritirata', className: 'bg-accent/20 text-accent' },
};

export function availabilityLabel(status: Availability['status']): string {
  return labels[status].text;
}

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const { text, className } = labels[availability.status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {text}
      {availability.service ? ` · ${availability.service}` : ''}
    </span>
  );
}
