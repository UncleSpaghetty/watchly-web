# watchly-web

Frontend web (Next.js App Router, TypeScript, Tailwind, TanStack Query, PWA) di Watchly. Specifiche in [docs/](docs/).

## Sviluppo

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Con `NEXT_PUBLIC_API_MOCK=true` (default in `.env.example`) l'app usa un backend simulato nel browser
(dati **fittizi**, stato in `localStorage`; qualsiasi credenziale è accettata). Per usare `watchly-be`
imposta `NEXT_PUBLIC_API_MOCK=false` e `NEXT_PUBLIC_API_BASE_URL`; il contratto è in `lib/api/types.ts`
e `lib/api/http.ts` (sessione via cookie `HttpOnly`, `credentials: 'include'`).

## Script

`npm run lint` · `npm run typecheck` · `npm test -- --run` · `npm run build`

## Note

- Il calendario mostra `availability` con provenienza; le date originali non sono mai presentate come «Disponibile in Italia».
- Nessun segreto nel client: solo variabili `NEXT_PUBLIC_*` non sensibili.
- Service worker (`public/sw.js`) attivo solo in produzione; non mette in cache le API. Web Push richiede VAPID pubblica e backend.
- Deploy: Vercel (preset Next.js), variabili separate per Preview/Production.