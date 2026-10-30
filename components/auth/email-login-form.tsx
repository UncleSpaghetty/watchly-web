'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export function EmailLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    setPending(true);
    setError(null);

    try {
      await api.login(email, password);
      queryClient.clear();
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Accesso non riuscito. Riprova.');
      setPending(false);
    }
  }

  if (!expanded) {
    return (
      <p className="text-center text-sm text-muted">
        Preferisci usare le tue credenziali?{' '}
        <Button
          variant="link"
          className="h-auto min-h-0 font-semibold decoration-primary/50 hover:text-foreground"
          aria-controls="email-login-form"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          Accedi con email e password
        </Button>
      </p>
    );
  }

  return (
    <form id="email-login-form" className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nome@esempio.it"
          autoFocus
          required
          disabled={pending}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Inserisci la password"
          required
          disabled={pending}
        />
      </div>

      <Button className="w-full" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? 'Accesso in corso…' : 'Accedi'}
      </Button>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
