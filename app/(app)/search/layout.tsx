import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Esplora',
  description:
    'Cerca e scopri anime, serie TV e film da aggiungere alla tua libreria Watchly.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
