import type { Metadata } from "next";
import Link from "next/link";

import { EmailLoginForm } from "@/components/auth/email-login-form";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export const metadata: Metadata = {
  title: "Accedi",
  description:
    "Accedi a Watchly per consultare il calendario e gestire le serie che segui.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="login-shell flex min-h-dvh items-center justify-center px-6 py-10">
      <section className="login-panel w-full max-w-sm rounded-[24px] border border-border p-6 sm:p-7">
        <h1 className="mb-1 text-3xl font-bold text-primary">Watchly</h1>
        <p className="mb-6 text-muted">Accedi per vedere il tuo calendario.</p>
        <GoogleLoginButton />

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            oppure
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <EmailLoginForm />

        <p className="mt-5 text-xs leading-5 text-muted">
          Continuando, accetti i{" "}
          <Link
            className="text-primary underline underline-offset-2"
            href="/terms"
          >
            Termini di servizio
          </Link>{" "}
          e dichiari di aver letto l&apos;
          <Link
            className="text-primary underline underline-offset-2"
            href="/privacy"
          >
            Informativa privacy
          </Link>
          .
        </p>
        <Link
          className="mt-4 inline-block text-xs text-muted underline underline-offset-2 hover:text-foreground"
          href="/about"
        >
          Informazioni su Watchly
        </Link>
      </section>
    </main>
  );
}
