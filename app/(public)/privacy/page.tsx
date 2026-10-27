import type { Metadata } from "next";

import {
  ControllerDetails,
  LegalConfigNotice,
} from "@/components/legal/legal-notice";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description:
    "Informativa sul trattamento dei dati personali degli utenti di Watchly.",
};

export default function PrivacyPage() {
  return (
    <article className="legal-document">
      <p className="legal-eyebrow">PRIVACY</p>
      <h1>Informativa sul trattamento dei dati personali</h1>
      <p className="legal-lead">
        Questa informativa descrive come Watchly tratta i dati personali ai
        sensi del Regolamento (UE) 2016/679 (“GDPR”). Ultimo aggiornamento:{" "}
        {legalConfig.lastUpdated}.
      </p>

      <LegalConfigNotice />

      <section>
        <h2>1. Titolare del trattamento</h2>
        <ControllerDetails />
      </section>

      <section>
        <h2>2. Dati trattati</h2>
        <ul>
          <li>
            <strong>Dati dell&apos;account:</strong> indirizzo email e nome
            visualizzato. Se si accede con Google, vengono trattati anche
            l&apos;identificativo stabile dell&apos;account (“sub”) e
            l&apos;informazione che l&apos;email è verificata. Watchly non
            riceve la password Google e non accede a Gmail, Drive, Calendar o ad
            altri contenuti dell&apos;account. Per gli account classici, la
            password è conservata esclusivamente sotto forma di hash non
            reversibile.
          </li>
          <li>
            <strong>Dati di utilizzo:</strong> serie seguite, episodi
            contrassegnati come visti, preferenze, lingua, fuso orario e stato
            delle sincronizzazioni.
          </li>
          <li>
            <strong>Dati tecnici:</strong> sessioni applicative, date di
            accesso, user agent, identificativi di richiesta e informazioni
            necessarie alla sicurezza e alla diagnosi dei malfunzionamenti.
          </li>
          <li>
            <strong>Notifiche push:</strong> endpoint e chiavi tecniche della
            sottoscrizione, solo se l&apos;utente abilita volontariamente le
            notifiche dal proprio dispositivo.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalità e basi giuridiche</h2>
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Finalità</th>
                <th>Base giuridica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Creazione account, autenticazione e fornitura delle
                  funzionalità personali.
                </td>
                <td>Esecuzione del servizio richiesto.</td>
              </tr>
              <tr>
                <td>
                  Sicurezza, prevenzione degli abusi, diagnostica e continuità
                  del servizio.
                </td>
                <td>Legittimo interesse del titolare.</td>
              </tr>
              <tr>
                <td>Invio di notifiche push sugli episodi.</td>
                <td>Consenso, revocabile dalle impostazioni.</td>
              </tr>
              <tr>
                <td>
                  Adempimento di obblighi normativi o richieste
                  dell&apos;autorità.
                </td>
                <td>Obbligo legale.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>4. Cookie, memoria locale e Google Login</h2>
        <p>
          Watchly usa un cookie di sessione tecnico, HttpOnly e protetto,
          indispensabile per mantenere l&apos;accesso. La durata massima
          configurata è di 30 giorni; il logout revoca la sessione. Il service
          worker può usare Cache Storage per rendere disponibili asset e pagine,
          ma le API contenenti dati personali non vengono memorizzate nella
          cache applicativa.
        </p>
        <p>
          La pagina di accesso carica Google Identity Services. Google può
          trattare cookie e identificativi tecnici necessari a mostrare il
          selettore account e completare l&apos;autenticazione, secondo la
          propria{" "}
          <a
            href="https://policies.google.com/privacy"
            rel="noreferrer"
            target="_blank"
          >
            informativa privacy
          </a>
          . Watchly non utilizza attualmente cookie pubblicitari, di
          profilazione o analytics; per questo non presenta un banner di
          consenso. L&apos;introduzione futura di strumenti non tecnici
          richiederà un aggiornamento dell&apos;informativa e, quando
          necessario, il consenso preventivo.
        </p>
      </section>

      <section>
        <h2>5. Origine dei dati</h2>
        <p>
          I dati provengono dall&apos;utente, dal suo dispositivo e, per il
          login federato, da Google limitatamente ai dati identificativi
          restituiti durante l&apos;accesso. Le preferenze sulle serie sono
          generate dalle azioni compiute dall&apos;utente in Watchly.
        </p>
      </section>

      <section>
        <h2>6. Destinatari e fornitori</h2>
        <p>I dati possono essere trattati, nei limiti necessari, da:</p>
        <ul>
          <li>Vercel, per l&apos;hosting del frontend;</li>
          <li>
            DigitalOcean e i fornitori infrastrutturali collegati, per API,
            database e rete;
          </li>
          <li>Google, per l&apos;autenticazione dell&apos;account;</li>
          <li>
            servizi Web Push e produttori del browser o dispositivo, se le
            notifiche sono abilitate;
          </li>
          <li>
            AniList, Kitsu e TMDB, ai quali il backend può inviare termini di
            ricerca e dati tecnici senza trasmettere l&apos;identità Google
            dell&apos;utente;
          </li>
          <li>autorità o soggetti legittimati, quando previsto dalla legge.</li>
        </ul>
      </section>

      <section>
        <h2>7. Trasferimenti internazionali</h2>
        <p>
          Alcuni fornitori possono trattare dati al di fuori dello Spazio
          Economico Europeo. In tali casi il trasferimento avviene sulla base di
          una decisione di adeguatezza, clausole contrattuali standard o altro
          meccanismo previsto dagli articoli 44 e seguenti del GDPR, secondo
          quanto applicabile al rispettivo fornitore.
        </p>
      </section>

      <section>
        <h2>8. Conservazione</h2>
        <ul>
          <li>
            account, watchlist e storico degli episodi: fino alla cancellazione
            dell&apos;account;
          </li>
          <li>
            sessioni attive: fino a 30 giorni, salvo logout o revoca anticipata;
          </li>
          <li>
            sottoscrizioni push: fino alla disattivazione, scadenza tecnica o
            cancellazione dell&apos;account;
          </li>
          <li>
            log tecnici e record di sicurezza: per il tempo proporzionato a
            diagnosi, sicurezza e obblighi applicabili.
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Sicurezza</h2>
        <p>
          Watchly applica misure tecniche e organizzative proporzionate, tra cui
          connessioni HTTPS, cookie HttpOnly e Secure in produzione, hashing
          delle password e dei token di sessione, controlli di origine,
          autorizzazione per utente e limitazione delle richieste. Nessun
          sistema può tuttavia garantire sicurezza assoluta.
        </p>
      </section>

      <section>
        <h2>10. Diritti dell&apos;interessato</h2>
        <p>
          L&apos;utente può chiedere accesso, rettifica, cancellazione,
          limitazione, portabilità e opposizione nei casi previsti dal GDPR,
          oltre a revocare il consenso alle notifiche senza pregiudicare i
          trattamenti precedenti. Le richieste vanno inviate al contatto del
          titolare. È inoltre possibile proporre reclamo al{" "}
          <a
            href="https://www.garanteprivacy.it"
            rel="noreferrer"
            target="_blank"
          >
            Garante per la protezione dei dati personali
          </a>
          .
        </p>
      </section>

      <section id="cancellazione-account">
        <h2>11. Cancellazione dell&apos;account</h2>
        <p>
          È possibile richiedere la cancellazione dell&apos;account e dei dati
          personali associati scrivendo al contatto indicato sopra
          dall&apos;email collegata all&apos;account. I dati che devono essere
          conservati per obblighi legali o per la tutela di diritti saranno
          isolati e conservati soltanto per il periodo necessario.
        </p>
      </section>

      <section>
        <h2>12. Minori</h2>
        <p>
          Watchly non è destinato a minori di 14 anni. I minori che possono
          utilizzare il servizio devono farlo con l&apos;autorizzazione e sotto
          la responsabilità di chi esercita la responsabilità genitoriale,
          quando richiesta dalla legge applicabile.
        </p>
      </section>

      <section>
        <h2>13. Modifiche</h2>
        <p>
          L&apos;informativa può essere aggiornata per riflettere modifiche
          normative o del servizio. La data dell&apos;ultimo aggiornamento è
          indicata all&apos;inizio della pagina; le modifiche sostanziali
          saranno comunicate con modalità adeguate.
        </p>
      </section>
    </article>
  );
}
