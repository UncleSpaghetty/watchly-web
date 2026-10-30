import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'I miei seguiti',
  description:
    'Gestisci le serie che segui, i preferiti e i tuoi progressi su Watchly.',
};

export default function MySeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
