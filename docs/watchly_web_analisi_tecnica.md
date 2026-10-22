# Watchly Web — Analisi tecnica frontend

**Versione:** 1.0 · **Repository:** `watchly-web` · **Target:** Vercel, web responsive e PWA iPhone.

## 1. Baseline e obiettivo

Il codice sorgente attuale è React Native + Expo Router, TypeScript e TanStack Query, con `expo-sqlite` e `expo-notifications`. Si migra a una **nuova applicazione web**, evitando di tentare una conversione automatica 1:1 di componenti React Native, UI e plugin Expo nativi. Portare funzioni pure (tipi, parsing, algoritmi data), riscrivere viste e accesso dati attraverso le API `watchly-be`.

### Mappatura codice

| Sorgente attuale | Destinazione nuova |
|---|---|
| `app/(tabs)/index.tsx` | `app/(app)/page.tsx`, componenti calendario |
| `app/(tabs)/cerca.tsx` | `app/(app)/search/page.tsx` |
| `app/serie.tsx` | `app/(app)/series/[id]/page.tsx` |
| `app/(tabs)/le-mie-serie.tsx` | `app/(app)/my-series/page.tsx` |
| `app/(tabs)/news.tsx` | `app/(app)/news/page.tsx`, nuova funzione |
| `app/(tabs)/impostazioni.tsx` | `app/(app)/settings/page.tsx` |
| `src/components/Page.tsx`, `constants/Colors.ts` | layout web e design token CSS |
| `src/shared/date/italy.ts` | modulo TypeScript riusabile con test (evitare offset DST errati) |
| `src/data/providers/*` | **backend** (`watchly-be`), mai chiamati direttamente dal browser per dati protetti |
| `src/data/db/schema.ts` | migrazioni DB backend, non eseguire schema SQLite in FE |
| `src/data/sync.ts`, `StartupSync.tsx` | job backend + API refresh + invalidazione TanStack Query |
| `src/shared/notifications/*` | service worker Web Push + API subscription + scheduler backend |

**Nota critica:** oggi il calendario seleziona `episodes.original_air_date`; la nuova versione deve consumare il campo normalizzato `availability` con semantica IT e provenienza, senza promuovere automaticamente original air dates.

## 2. Scelte tecnologiche

- **Next.js App Router**, TypeScript strict, React, Node LTS compatibile; versioni fissate al bootstrap con lockfile e controllo advisory.
- **Tailwind CSS** e libreria componenti accessibile (es. shadcn/ui / Radix), con palette scura ricavata dal progetto originale, responsive mobile-first.
- **TanStack Query** per dati remoti, cache, optimistic mutation e invalidazione; `fetch` o client HTTP tipizzato.
- **OpenAPI** generata dal backend; tipi FE generati (ad es. `openapi-typescript`), non DTO duplicati manualmente.
- **PWA** con `manifest.webmanifest`, icone, service worker versionato e caching prudente; selezione libreria SW dopo verifica compatibilità con la versione Next.js fissata. La PWA non garantisce background execution continua.
- **Web Push:** Service Worker `push`/`notificationclick`, Push API, VAPID pubblica, iscrizione tramite gesto utente; in iOS testare Home Screen installata. VAPID privata e invii rimangono sul BE.
- Auth: sessione sicura con cookie `HttpOnly; Secure; SameSite` tramite BFF/reverse proxy o contratti CORS/CSRF espliciti; decisione architetturale finale in parallelo al BE.

## 3. Schema moduli proposto

```text
watchly-web/
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx
    (app)/page.tsx
    (app)/search/page.tsx
    (app)/series/[id]/page.tsx
    (app)/my-series/page.tsx
    (app)/news/page.tsx
    (app)/settings/page.tsx
    api/               # solo BFF/proxy se scelto, niente business logic
  components/
    layout/ calendar/ series/ news/ feedback/ ui/
  features/
    calendar/ search/ following/ episodes/ news/ notifications/ settings/
  lib/
    api/              # client, openapi types, error mapping
    date/             # Europe/Rome, ISO days
    auth/             # session and guards
    pwa/              # subscriptions & offline notices
  public/
    icons/ manifest.webmanifest sw.js
  tests/
  .github/workflows/ci.yml
```

Le route sono indicative; evitare dipendenza diretta da Expo Router e `expo-symbols` nel bundle web. Sostituire con libreria SVG/icona web.

## 4. Contratti API FE ↔ BE

Base URL proposta: `https://api.<dominio-watchly>/api/v1`; dominio da configurare. Rispettare `Authorization` o cookie sessione deciso in modo univoco; tutti gli endpoint personali autorizzati server-side.

| Metodo e path | Scopo |
|---|---|
| `GET /catalog/search?q=&kind=&source=` | Ricerca anime/TV |
| `GET /series/{id}` | Scheda canonica, origini e metadati |
| `GET /series/{id}/episodes` | Episodi e disponibilità differenziate |
| `GET /me/following` | Lista seguiti |
| `PUT /me/following/{seriesId}` / `DELETE ...` | Follow idempotente |
| `GET /me/calendar?from=&to=&mode=italy` | Calendario personale, provenienza e stato |
| `PATCH /me/episodes/{id}` | Marcare visto/non visto |
| `POST /me/sync` | Richiesta refresh (con rate limit, 202/job ID se asincrono) |
| `GET /me/settings` / `PATCH /me/settings` | Preferenze |
| `GET /news` / `GET /news/{id}` | Feed e titoli collegati |
| `POST /me/push-subscriptions` / `DELETE /me/push-subscriptions/{id}` | Sottoscrizione/opt-out |
| `GET /health` | Health backend (non chiamato ciclicamente dal FE) |

Le forme esatte saranno versionate in un unico documento OpenAPI; endpoint illustrativi, non esistenti nel progetto ZIP.

### Esempio DTO calendario

```json
{
  "date": "2026-11-06",
  "episodeId": "uuid",
  "series": { "id": "uuid", "title": "Titolo", "kind": "anime" },
  "episodeNumber": 8,
  "seasonNumber": 1,
  "watchedAt": null,
  "availability": {
    "country": "IT", "service": "provider-id", "status": "confirmed",
    "localDate": "2026-11-06", "precision": "date",
    "sourceUrl": "https://example.org/source", "lastVerifiedAt": "2026-11-05T09:00:00Z"
  }
}
```

È **uno schema dimostrativo**, non una dichiarazione che un episodio reale esca in quella data.

## 5. Data fetching e cache

- TanStack Query con query keys stabili (`calendar`, range, filtro; `series`, ID; `following`, user; `news`, paging).
- `staleTime` concordato per fonte e contesto; evitare refresh ripetuti su ogni render, deduplicare richieste e usare `AbortSignal`.
- Aggiornamento manuale invalida tutte le viste correlate quando il job termina; caricare progress e fallimenti parziali.
- Visti e follow: mutation ottimistica con rollback in errore.
- Local cache browser per UI offline: caching ultimo calendario **solo per stesso utente**; rimuovere/cache namespace al logout. Non memorizzare token in `localStorage`.
- Le news possono essere SSR/ISR/cached secondo licenze; calendario personale e impostazioni sempre user-scoped e non condivisi da CDN.

## 6. Date e UI

Portare concetti `getRomeTodayIso`, `getRomeCalendarWeek/Month` dal codice nativo, con test su DST, lunedì, cambio anno e locale `it-IT`. Non trasformare `YYYY-MM-DD` in timestamp UTC applicando timezone implicite; considerare `date-only` un valore civile distinto dal timestamp di disponibilità.

Interfaccia: week mode default, month toggle, selezione giorno, badge uscita, elenco episodi, stato visto, skeleton/empty/error. Accessibilità con keyboard navigation, focus, contrasti, aria-label corretti.

## 7. Web Push + PWA (fase successiva ai flussi core)

1. HTTPS in produzione; manifest completo e icone Apple-friendly.
2. Service worker in scope corretto con handler `push` e `notificationclick`.
3. UI opt-in solo su click; su Safari iPhone richiedere installazione PWA in Home per Web Push e spiegare requisito.
4. Permesso → `PushManager.subscribe({userVisibleOnly:true, applicationServerKey: PUBLIC_VAPID})` → invio subscription all'API.
5. Server invia **una notifica per utente per data IT** alle 12 Europe/Rome; deduplica e rimozione subscription invalide.
6. Test su iPhone reale dopo installazione, PWA in background e finestra chiusa; nessuna promessa di recapito esatto al secondo (iOS e rete possono ritardare).
7. Fallback in-app e gestione opt-out/permesso negato.

Non riutilizzare `expo-notifications`; è un'altra piattaforma di push.

## 8. Sicurezza

- Non portare `EXPO_PUBLIC_TMDB_READ_TOKEN` nel codice client: il vecchio README specifica che veniva incluso nel bundle dell'app. Mantenere segreti esclusivamente nel backend.
- Validazione di query param e rendering React sicuro; sanificazione eventuali estratti HTML; whitelist URL esterni.
- Content Security Policy ragionata per immagini esterne e domini API; `next/image` con remotePatterns limitati oppure proxy immagini policy-compliant.
- CORS e CSRF definiti sullo schema auth; CORS non è controllo di accesso.
- Cookie `HttpOnly` e anti-CSRF su mutazioni se auth cookie-cross-origin; nessuna key segreta in variabili `NEXT_PUBLIC_*`.
- Non esporre contenuti cache sensibili tra utenti/logout.

## 9. Ambiente e configurazione

```dotenv
# Esempio .env.example — variabile NON segreta
NEXT_PUBLIC_API_BASE_URL=https://api.example.invalid/api/v1
NEXT_PUBLIC_APP_URL=https://watchly.example.invalid
NEXT_PUBLIC_VAPID_PUBLIC_KEY=replace-me
```

Se è adottato un BFF Next.js, preferire route relative `/api/*` e `API_INTERNAL_BASE_URL` (server-only); precisare l'integrazione in documento architetturale. Non fissare URL non confermati come se fossero domini reali.

## 10. Pipeline GitHub → Vercel

### Branch e quality gate

- `main` = produzione; branch feature → PR + preview Vercel.
- Check GitHub Actions su pull request/push: install deterministica, format/lint, typecheck, unit/integration test, build Next, audit security non bloccante o configurato per severità.
- E2E Playwright in CI su mock API e, successivamente, contro staging; accessibilità Lighthouse/axe sulle pagine critiche.
- Proteggere `main` con required checks; dipendenze aggiornate con Dependabot/Renovate.

### Workflow CI di riferimento (adeguare agli script effettivi)

```yaml
name: Watchly Web CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

Gli script andranno definiti in `package.json`; Node 22 qui è un target di bootstrap da verificare rispetto alla versione Next scelta. Usare SHAs pin per le action se richiesto dall'hardening.

### Deploy Vercel

1. Collegare `watchly-web` a Vercel con preset Next.js e root corretta.
2. Impostare variabili diverse per **Preview** e **Production**; creare dominio front e HTTPS.
3. Ogni PR produce deploy di anteprima; `main` genera produzione, idealmente dopo check richiesti.
4. Aggiungere domini di preview alla policy CORS del BE **solo in modo controllato**, oppure preferire BFF same-origin; evitare `Access-Control-Allow-Origin: *` con credenziali.
5. Test smoke post-deploy: login, catalog, calendar, follow, network errors; per PWA verificare service worker e manifest anche in deployment produttivo.
6. Rollback tramite deployment Vercel precedente; evitare che nuovo FE richieda migration BE non retrocompatibile. Definire protocollo compatibilità API.

Vercel documenta ambienti local/preview/production e variabili separate: https://vercel.com/docs/deployments/environments .

## 11. Test e definizione di done

- Unit: conversione date, parser DTO e logica di visibilità stati IT.
- Component: calendario settimana/mese, debounce search, filtri, empty state, permessi push.
- Integration: mock OpenAPI, mapping errori, idempotenza follow, optimistic watched.
- E2E: login → cerca → segui → calendario → visto → refresh → logout; news → scheda → segui.
- Manuale Safari iPhone: Add to Home Screen, offline UI, notifiche solo quando supportate, logout, viewport small, installazione update SW.
- Nessuna chiave API privata nel client o bundle compilato; controllo `npm run build` e output.

## 12. Ordine di migrazione

1. Bootstrap `watchly-web`, design token e layout responsive; client OpenAPI mock.
2. UI search/dettaglio + login + following; test integrazione `watchly-be`.
3. Calendario settimanale/mensile, visti e stati disponibilità IT.
4. Impostazioni, sync, gestione sessioni/errori; Vercel preview.
5. News e collegamento serie.
6. PWA/offline read-only, Web Push.
7. Hardening + GitHub CI + produzione Vercel.

## 13. Vincoli irrisolti

- Fonti affidabili date italiane e relativo contratto; mapping cross-provider titoli; scelta definitiva auth/sessione; dominio; versione concreta Next e libreria PWA; modalità di import SQLite dal dispositivo.
- Le API rappresentate non esistono nel sorgente mobile e dovranno essere implementate da `watchly-be`.
