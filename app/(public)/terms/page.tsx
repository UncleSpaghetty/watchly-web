import type { Metadata } from "next";

import {
  ControllerDetails,
  LegalConfigNotice,
} from "@/components/legal/legal-notice";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termini di servizio",
  description: "Condizioni applicabili all’utilizzo del servizio Watchly.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="legal-document">
      <p className="legal-eyebrow">TERMINI</p>
      <h1>Termini di servizio</h1>
      <p className="legal-lead">
        Questi termini disciplinano l&apos;utilizzo di Watchly. Ultimo
        aggiornamento: {legalConfig.lastUpdated}.
      </p>

      <LegalConfigNotice />

      <section>
        <h2>1. Gestore e accettazione</h2>
        <ControllerDetails />
        <p>
          Accedendo, creando un account o utilizzando Watchly, l&apos;utente
          dichiara di aver letto e accettato questi termini. Se non li accetta,
          non deve utilizzare il servizio.
        </p>
      </section>

      <section>
        <h2>2. Descrizione del servizio</h2>
        <p>
          Watchly consente di cercare anime e serie TV, seguire titoli,
          consultare date pubblicate dai provider, segnare episodi come visti e
          ricevere notifiche facoltative. Watchly non è un servizio di
          streaming, non vende contenuti audiovisivi e non concede diritti sulle
          opere indicate.
        </p>
      </section>

      <section>
        <h2>3. Account</h2>
        <ul>
          <li>
            L&apos;accesso avviene tramite Google o credenziali Watchly
            abilitate.
          </li>
          <li>
            L&apos;utente è responsabile della sicurezza del proprio account e
            dei dispositivi utilizzati.
          </li>
          <li>
            Non è consentito usare identità altrui, aggirare i controlli di
            accesso o condividere sessioni in modo abusivo.
          </li>
          <li>
            L&apos;utente deve comunicare tempestivamente accessi non
            autorizzati o problemi di sicurezza.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Uso consentito</h2>
        <p>È vietato:</p>
        <ul>
          <li>
            usare il servizio per finalità illecite o lesive dei diritti di
            terzi;
          </li>
          <li>
            interferire con sicurezza, disponibilità o funzionamento del
            servizio;
          </li>
          <li>
            effettuare scraping massivo, reverse engineering o accessi
            automatizzati non autorizzati;
          </li>
          <li>aggirare limiti tecnici, rate limit o misure di protezione;</li>
          <li>
            riutilizzare contenuti o dati di terzi in violazione delle relative
            licenze.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Dati e servizi di terzi</h2>
        <p>
          Informazioni, immagini, date e notizie possono provenire da AniList,
          Kitsu, TMDB e altre fonti indicate. Tali contenuti restano soggetti ai
          diritti e alle condizioni dei rispettivi titolari. Date, stato delle
          serie e disponibilità possono essere incompleti, modificati o
          ritardati dai provider; l&apos;utente deve verificare le informazioni
          importanti presso la fonte ufficiale.
        </p>
        <p className="legal-attribution">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
        <p>
          I collegamenti esterni portano a servizi autonomi, soggetti ai propri
          termini e informative. Watchly non controlla né garantisce contenuti,
          disponibilità o sicurezza dei siti terzi.
        </p>
      </section>

      <section>
        <h2>6. Disponibilità e modifiche</h2>
        <p>
          Il servizio può essere aggiornato, sospeso o modificato per
          manutenzione, sicurezza, evoluzione tecnica o indisponibilità dei
          provider. Non è garantita l&apos;assenza di interruzioni o errori.
          Eventuali modifiche rilevanti che riducano sostanzialmente le
          funzionalità saranno comunicate quando ragionevolmente possibile.
        </p>
      </section>

      <section>
        <h2>7. Sospensione e cessazione</h2>
        <p>
          L&apos;accesso può essere sospeso o chiuso in caso di violazioni,
          rischi di sicurezza, obblighi legali o uso capace di danneggiare il
          servizio o terzi. L&apos;utente può smettere di usare Watchly in
          qualsiasi momento e richiedere la cancellazione dell&apos;account
          secondo l&apos;Informativa privacy.
        </p>
      </section>

      <section>
        <h2>8. Responsabilità</h2>
        <p>
          Nei limiti consentiti dalla legge, Watchly è fornito “così com&apos;è”
          e il gestore non risponde di decisioni prese facendo affidamento su
          date o dati di terzi, né di interruzioni dovute a reti, provider o
          dispositivi fuori dal proprio controllo. Nulla in questi termini
          limita i diritti inderogabili del consumatore o responsabilità che non
          possono essere escluse per legge.
        </p>
      </section>

      <section>
        <h2>9. Proprietà intellettuale</h2>
        <p>
          Il software, il marchio e gli elementi originali di Watchly
          appartengono ai rispettivi titolari. I marchi, le immagini e i
          metadati delle opere appartengono ai fornitori o agli aventi diritto e
          sono utilizzati nei limiti delle licenze applicabili.
        </p>
      </section>

      <section>
        <h2>10. Legge applicabile</h2>
        <p>
          I termini sono regolati dalla legge italiana. Per i consumatori resta
          competente il giudice del luogo di residenza o domicilio previsto
          dalla normativa applicabile. Sono fatti salvi gli eventuali diritti
          inderogabili riconosciuti dalla legge del Paese dell&apos;utente.
        </p>
      </section>

      <section>
        <h2>11. Modifiche ai termini</h2>
        <p>
          I termini possono essere aggiornati per modifiche normative o del
          servizio. La versione vigente e la relativa data sono sempre
          pubblicate in questa pagina. In caso di modifiche sostanziali sarà
          fornita un&apos;informazione adeguata prima della loro efficacia.
        </p>
      </section>

      <section>
        <h2>12. Contatti</h2>
        <p>Per domande sui termini o sul servizio è possibile contattare:</p>
        <ControllerDetails />
      </section>
    </article>
  );
}
