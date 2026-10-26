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
`localStorage` e accetterà qualsiasi credenziale. Il contratto è in `lib/api/types.ts` e
`lib/api/http.ts` (sessione via cookie `HttpOnly`, `credentials: 'include'`).
Il login richiede email e password: `POST /auth/login` invia il JSON `{ email, password }`,
in accordo con il backend. In modalita demo usare un'email valida e una password non vuota.

## Script

`npm run lint` · `npm run typecheck` · `npm test -- --run` · `npm run build`

## Note

- Il calendario mostra esclusivamente le date pubblicate dai provider, insieme alla fonte.
- Nessun segreto nel client: solo variabili `NEXT_PUBLIC_*` non sensibili.
- Service worker (`public/sw.js`) attivo solo in produzione; non mette in cache le API. Web Push richiede VAPID pubblica e backend.
- Deploy: Vercel (preset Next.js), variabili separate per Preview/Production.
