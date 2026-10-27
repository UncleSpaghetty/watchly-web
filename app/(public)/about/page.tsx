import type { Metadata } from "next";
import Link from "next/link";

import { LegalConfigNotice } from "@/components/legal/legal-notice";

export const metadata: Metadata = {
  title: "Informazioni",
  description:
    "Informazioni su Watchly, funzionalità, fonti e documenti legali.",
};

export default function AboutPage() {
  return (
    <article className="legal-document">
      <p className="legal-eyebrow">INFORMAZIONI</p>
      <h1>Segui le tue serie, senza perdere il prossimo episodio.</h1>
      <p className="legal-lead">
        Watchly è un servizio web che consente di cercare anime e serie TV,
        creare una watchlist, consultare il calendario degli episodi e tenere
        traccia di quelli già visti.
      </p>

      <LegalConfigNotice />

      <section>
        <h2>Cosa offre Watchly</h2>
        <ul>
          <li>
            Calendario personale degli episodi basato sulle date pubblicate dai
            provider.
          </li>
          <li>Ricerca e schede informative per anime e serie TV.</li>
          <li>
            Watchlist, stato degli episodi visti e notifiche push facoltative.
          </li>
          <li>Accesso tramite Google o credenziali Watchly già abilitate.</li>
        </ul>
      </section>

      <section>
        <h2>Fonti e attribuzioni</h2>
        <p>
          Metadati, immagini e date possono provenire da AniList, Kitsu, TMDB e
          dalle fonti indicate nelle singole notizie. I rispettivi nomi, marchi
          e contenuti appartengono ai loro titolari. Watchly non è un servizio
          di streaming e non ospita episodi.
        </p>
        <p className="legal-attribution">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.{" "}
          <a href="https://www.themoviedb.org" rel="noreferrer" target="_blank">
            Visita TMDB
          </a>
        </p>
      </section>

      <section>
        <h2>Trasparenza</h2>
        <p>
          Consulta l&apos;<Link href="/privacy">Informativa privacy</Link> per
          sapere quali dati vengono trattati e i{" "}
          <Link href="/terms">Termini di servizio</Link> per conoscere le
          condizioni d&apos;uso.
        </p>
      </section>

      <Link className="legal-primary-link" href="/login">
        Vai all&apos;accesso
      </Link>
    </article>
  );
}
