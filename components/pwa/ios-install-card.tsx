'use client';

import { Check, Share, Smartphone, SquarePlus, X } from 'lucide-react';
import { useCallback, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { isIOS, isStandalone } from '@/lib/pwa/register';

const INSTALL_STATE_EVENT = 'watchly:ios-install-state';
const sessionDismissals = new Set<string>();

function dismissalKey(userId: string): string {
  return `watchly:ios-install-dismissed:${userId}`;
}

function subscribeToInstallState(onStoreChange: () => void): () => void {
  const displayMode = window.matchMedia('(display-mode: standalone)');
  const notify = () => onStoreChange();

  window.addEventListener('storage', notify);
  window.addEventListener(INSTALL_STATE_EVENT, notify);
  displayMode.addEventListener('change', notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(INSTALL_STATE_EVENT, notify);
    displayMode.removeEventListener('change', notify);
  };
}

function getInstallState(userId: string): 'hidden' | 'visible' {
  if (!isIOS() || isStandalone()) return 'hidden';
  const key = dismissalKey(userId);
  if (sessionDismissals.has(key)) return 'hidden';

  try {
    return localStorage.getItem(key) ? 'hidden' : 'visible';
  } catch {
    return 'visible';
  }
}

export function IOSInstallCard({ userId }: { userId: string }) {
  const state = useSyncExternalStore(
    subscribeToInstallState,
    () => getInstallState(userId),
    () => 'hidden',
  );
  const dismiss = useCallback(() => {
    const key = dismissalKey(userId);
    sessionDismissals.add(key);
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // La chiusura resta valida per la sessione se lo storage non è disponibile.
    }
    window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
  }, [userId]);

  if (state === 'hidden') return null;

  return (
    <section
      className="ios-install-card"
      aria-labelledby="ios-install-title"
    >
      <div className="ios-install-heading">
        <span className="ios-install-app-icon" aria-hidden>
          <Smartphone size={23} />
        </span>
        <div>
          <p className="home-kicker">WATCHLY SUL TUO IPHONE</p>
          <h2 id="ios-install-title">Sempre a portata di mano</h2>
          <p>
            Aggiungi Watchly alla schermata Home per aprirla come un’app e
            abilitare le notifiche sulle prossime uscite.
          </p>
        </div>
        <button
          type="button"
          className="ios-install-close"
          aria-label="Non mostrare più questo suggerimento"
          onClick={dismiss}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <ol className="ios-install-steps">
        <li>
          <span className="ios-install-step-icon" aria-hidden>
            <Share size={18} />
          </span>
          <span>
            Tocca <strong>Condividi</strong> nella barra del browser.
          </span>
        </li>
        <li>
          <span className="ios-install-step-icon" aria-hidden>
            <SquarePlus size={18} />
          </span>
          <span>
            Seleziona <strong>Aggiungi alla schermata Home</strong>.
          </span>
        </li>
        <li>
          <span className="ios-install-step-icon" aria-hidden>
            <Check size={18} />
          </span>
          <span>
            Conferma toccando <strong>Aggiungi</strong>.
          </span>
        </li>
      </ol>

      <Button size="sm" className="ios-install-confirm" onClick={dismiss}>
        Ho capito
      </Button>
    </section>
  );
}
