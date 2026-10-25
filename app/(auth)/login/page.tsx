'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TextField } from '@/components/ui/controls';
import { Button } from '@/components/ui/feedback';
import { api, isMockApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api.login(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
      qc.clear();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accesso non riuscito.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-3xl font-bold text-primary">Watchly</h1>
      <p className="mb-6 text-muted">Accedi per vedere il tuo calendario.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Email
          <TextField name="email" type="email" required autoComplete="username" className="mt-1" />
        </label>
        <label className="block text-sm">
          Password
          <TextField name="password" type="password" required autoComplete="current-password" className="mt-1" />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Accesso…' : 'Accedi'}
        </Button>
      </form>
      {isMockApi ? (
        <p className="mt-6 text-xs text-muted">Modalità demo: backend simulato, qualsiasi credenziale è accettata.</p>
      ) : null}
    </main>
  );
}