import Link from "next/link";

import { legalConfig } from "@/lib/legal";

export function LegalConfigNotice() {
  if (legalConfig.isComplete) return null;

  return (
    <aside className="mb-8 rounded-[16px] border border-warn/50 bg-warn/10 p-4 text-sm leading-6 text-warn">
      <strong>Configurazione legale incompleta.</strong> Prima della
      pubblicazione inserire nome del titolare e contatto privacy nelle
      variabili d&apos;ambiente indicate nella documentazione.
    </aside>
  );
}

export function ControllerDetails() {
  return (
    <address className="not-italic">
      <strong>{legalConfig.controllerName}</strong>
      {legalConfig.controllerAddress ? (
        <>
          <br />
          {legalConfig.controllerAddress}
        </>
      ) : null}
      <br />
      {legalConfig.contactEmail ? (
        <a
          className="text-primary underline underline-offset-4"
          href={`mailto:${legalConfig.contactEmail}`}
        >
          {legalConfig.contactEmail}
        </a>
      ) : (
        <span>Contatto privacy da configurare</span>
      )}
    </address>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Informazioni legali" className={className}>
      <Link href="/about">Informazioni</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Termini</Link>
    </nav>
  );
}
