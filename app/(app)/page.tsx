import type { Metadata } from 'next';

import { HomeView } from '@/components/home/home-view';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Consulta prossime uscite, serie in corso e attività recenti su Watchly.',
};

export default function Page() {
  return <HomeView />;
}
