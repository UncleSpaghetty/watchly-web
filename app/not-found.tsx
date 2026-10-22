import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold">Pagina non trovata</h1>
      <Link href="/" className="text-primary underline">
        Torna al calendario
      </Link>
    </main>
  );
}
