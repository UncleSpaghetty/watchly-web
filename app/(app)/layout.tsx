import type { Metadata } from 'next';

import { AuthenticatedAppShell } from '@/components/layout/authenticated-app-shell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
