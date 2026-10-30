import type { Metadata } from 'next';

import { CalendarView } from '@/components/calendar/calendar-view';

export const metadata: Metadata = {
  title: 'Calendario',
  description:
    'Consulta il calendario personale degli episodi delle serie che segui su Watchly.',
};

export default function CalendarPage() {
  return <CalendarView />;
}
