'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { api, isMockApi } from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';

export function GoogleLoginButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credential: string) => {
      if (pending) return;
      setPending(true);
      setError(null);
      try {
        await api.loginWithGoogle(credential);
        queryClient.clear();
        router.replace('/');
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Accesso con Google non riuscito.');
        setPending(false);
      }
    },
    [pending, queryClient, router],
  );

  useEffect(() => {
    const google = window.google;
    const container = buttonRef.current;
    if (!scriptReady || !GOOGLE_CLIENT_ID || !google || !container || isMockApi) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => void login(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(400, Math.floor(container.clientWidth)),
      locale: 'it',
    });
  }, [login, scriptReady]);

  if (isMockApi) {
    return (
      <div>
        <Button className="w-full" disabled={pending} onClick={() => void login('mock-google-credential')}>
          {pending ? 'Accesso…' : 'Continua con Google (demo)'}
        </Button>
        {error ? <p className="mt-3 text-sm text-accent" role="alert">{error}</p> : null}
      </div>
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-[14px] border border-warn/50 bg-warn/10 p-3 text-sm text-warn" role="alert">
        Accesso con Google non configurato.
      </p>
    );
  }

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client?hl=it"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError('Impossibile caricare Google. Controlla la connessione e riprova.')}
      />
      <div
        ref={buttonRef}
        className={`google-login-button min-h-11 w-full text-sm text-muted ${pending ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={pending}
      >
        {!scriptReady ? 'Caricamento accesso Google…' : null}
      </div>
      {pending ? <p className="mt-3 text-sm text-muted" role="status">Accesso in corso…</p> : null}
      {error ? <p className="mt-3 text-sm text-accent" role="alert">{error}</p> : null}
    </div>
  );
}
