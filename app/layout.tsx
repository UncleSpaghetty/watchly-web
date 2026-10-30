import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

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
    <html lang="it" className="dark">
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
