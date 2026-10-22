'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

export function OfflineBanner() {
  if (useOnline()) return null;
  return (
    <div role="status" className="mb-4 rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm">
      Sei offline: stai vedendo una copia locale dei dati, che potrebbe non essere aggiornata.
    </div>
  );
}
