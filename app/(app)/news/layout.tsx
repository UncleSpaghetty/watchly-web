import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notizie',
  description:
    'Leggi e salva le ultime notizie su anime, serie TV e manga su Watchly.',
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
