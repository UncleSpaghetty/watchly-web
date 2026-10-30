import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profilo',
  description: 'Consulta i dettagli del tuo profilo Watchly.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
