# watchly-web

Frontend web (Next.js App Router, TypeScript, Tailwind, TanStack Query, PWA) di Watchly. Specifiche in [docs/](docs/).

## Sviluppo

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Il default di `.env.example` usa `watchly-be` locale su `http://localhost:8000/api/v1`.
In sviluppo, lo stesso URL viene usato come fallback quando `NEXT_PUBLIC_API_BASE_URL` non è definita.
Per lavorare senza backend imposta `NEXT_PUBLIC_API_MOCK=true`: l'app userà dati **fittizi** in
`localStorage` e mostrerà un accesso Google simulato. Il contratto è in `lib/api/types.ts` e
`lib/api/http.ts` (sessione via cookie `HttpOnly`, `credentials: 'include'`).
La UI usa Google Identity Services e invia l'ID token a `POST /auth/google`; il backend lo scambia
con la normale sessione Watchly. Il client ID pubblico va configurato come
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` in fase di build e deve coincidere con `GOOGLE_CLIENT_ID` del backend.
Il login classico `POST /auth/login` resta disponibile accanto all'accesso Google per gli account
già abilitati.

Le pagine pubbliche `/about`, `/privacy` e `/terms` leggono i dati del titolare da
`LEGAL_CONTROLLER_NAME`, `LEGAL_CONTACT_EMAIL` e, facoltativamente, `LEGAL_CONTROLLER_ADDRESS`.
Questi valori devono essere presenti durante la build di produzione. La pagina `/about` può essere
usata come homepage pubblica nella configurazione della schermata consenso Google.

## Script

`npm run lint` · `npm run typecheck` · `npm test -- --run` · `npm run build`

## Note

- Il calendario mostra esclusivamente le date pubblicate dai provider, insieme alla fonte.
- Nessun segreto nel client: solo variabili `NEXT_PUBLIC_*` non sensibili.
- Il logout revoca la sessione Watchly lato server, pulisce cache/query locali e disabilita la selezione automatica Google; non revoca il consenso dell'account Google.
- Service worker (`public/sw.js`) attivo solo in produzione; non mette in cache le API. Web Push richiede VAPID pubblica e backend.
- Deploy: Vercel (preset Next.js), variabili separate per Preview/Production.
