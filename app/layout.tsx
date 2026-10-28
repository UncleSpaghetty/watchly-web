import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

const appearanceScript = `
try {
  const choice = localStorage.getItem('watchly-theme') || 'system';
  const resolved = choice === 'system'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : choice;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.accent = localStorage.getItem('watchly-accent') || 'mint';
} catch (_) {}
`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://watchly.unclespaghetty.com",
  ),
  title: { default: "Watchly", template: "%s · Watchly" },
  description: "Segui anime e serie TV e consulta il calendario delle uscite.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Watchly",
    statusBarStyle: "black-translucent",
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#07110e",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
