import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impostazioni',
  description:
    'Gestisci notifiche, preferenze, piattaforme e account Watchly.',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
