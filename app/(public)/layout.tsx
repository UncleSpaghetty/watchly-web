import Link from "next/link";

import { LegalLinks } from "@/components/legal/legal-notice";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="legal-shell min-h-dvh">
      <header className="legal-header">
        <Link className="text-xl font-bold text-primary" href="/">
          Watchly
        </Link>
        <LegalLinks className="legal-nav" />
      </header>
      <main className="legal-content">{children}</main>
      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} Watchly</span>
        <LegalLinks className="legal-footer-links" />
      </footer>
    </div>
  );
}
