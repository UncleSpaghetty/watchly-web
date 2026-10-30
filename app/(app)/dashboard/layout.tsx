import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Statistiche',
  description:
    'Consulta statistiche, progressi e attività delle serie che segui su Watchly.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
