'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import { Button, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, isMockApi } from '@/lib/api';
import { formatDateTime } from '@/lib/date/italy';
import { useSyncMutation } from '@/lib/hooks';
import { isIOS, isStandalone, pushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/pwa/register';

const PUSH_ID_KEY = 'watchly-push-id';
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

async function clearBrowserCaches() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  const registration = await navigator.serviceWorker?.getRegistration();
  registration?.active?.postMessage('clear-caches');
}

function capsSnapshot(): string {
  const ok = pushSupported();
  return `${ok ? 1 : 0}|${isIOS() && !isStandalone() ? 1 : 0}|${ok ? Notification.permission : 'unsupported'}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.getSettings() });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.me() });
  const sync = useSyncMutation();
  const [pushError, setPushError] = useState<string | null>(null);
  const [supported, needsInstall, initialPermission] = useSyncExternalStore(
    () => () => undefined,
    () => capsSnapshot(),
    () => 'ssr',
  ).split('|') as [string, string, string];
  const [permissionOverride, setPermission] = useState<NotificationPermission | null>(null);
  const permission = permissionOverride ?? (initialPermission as NotificationPermission | 'unsupported' | 'ssr');
  const isSupported = supported === '1';
  const togglePush = useMutation({
    mutationFn: async (enable: boolean) => {
      setPushError(null);
      if (enable) {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') throw new Error('Permesso notifiche negato. Puoi riattivarlo dalle impostazioni del browser.');
        if (!isMockApi) {
          if (!VAPID || VAPID === 'replace-me') throw new Error('Notifiche non configurate (chiave VAPID mancante).');
          const json = await subscribeToPush(VAPID);
          if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Sottoscrizione push non valida.');
          const { id } = await api.registerPush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
          localStorage.setItem(PUSH_ID_KEY, id);
        }
      } else {
        const id = localStorage.getItem(PUSH_ID_KEY);
        if (!isMockApi) await unsubscribeFromPush();
        if (id) await api.unregisterPush(id).catch(() => undefined);
        localStorage.removeItem(PUSH_ID_KEY);
      }
      return api.patchSettings({ notificationsEnabled: enable });
    },
    onSuccess: (data) => qc.setQueryData(['settings'], data),
    onError: (e) => setPushError(e instanceof Error ? e.message : 'Operazione non riuscita.'),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.logout();
      await clearBrowserCaches();
      localStorage.removeItem(PUSH_ID_KEY);
    },
    onSuccess: () => {
      qc.clear();
      router.replace('/login');
    },
  });

  const resetCache = useMutation({
    mutationFn: async () => {
      await clearBrowserCaches();
      qc.clear();
    },
  });

  if (settings.isPending) return <ListSkeleton rows={3} />;
  if (settings.isError) return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;
  const s = settings.data;
  const pushBlocked = !isSupported || needsInstall === '1' || permission === 'denied';

  return (
    <div className="space-y-6">
      <PageHeader title="Impostazioni" />

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold">Notifiche</h2>
        <p className="mb-3 text-sm text-muted">
          Una notifica alle 12:00 (Europe/Rome) nei giorni con episodi disponibili in Italia confermati, solo per le serie seguite.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={s.notificationsEnabled}
            disabled={pushBlocked || togglePush.isPending}
            onChange={(e) => togglePush.mutate(e.target.checked)}
            className="h-5 w-5"
          />
          Abilita notifiche
        </label>
        {!isSupported ? <p className="mt-2 text-sm text-warn">Questo browser non supporta le notifiche push. Le novità restano visibili nell&apos;app.</p> : null}
        {isSupported && needsInstall === '1' ? (
          <p className="mt-2 text-sm text-warn">Su iPhone installa prima Watchly: Safari → Condividi → Aggiungi alla schermata Home.</p>
        ) : null}
        {permission === 'denied' ? <p className="mt-2 text-sm text-warn">Permesso negato dal browser: riattivalo dalle impostazioni del sito.</p> : null}
        {pushError ? <p role="alert" className="mt-2 text-sm text-accent">{pushError}</p> : null}
        {isMockApi ? <p className="mt-2 text-xs text-muted">Modalità demo: nessuna sottoscrizione push reale.</p> : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold">Aggiornamento dati</h2>
        <p className="mb-3 text-sm text-muted">
          {s.lastSyncAt ? `Ultimo aggiornamento riuscito: ${formatDateTime(s.lastSyncAt)}` : 'Nessun aggiornamento riuscito.'}
          {s.lastSyncStatus === 'partial' || s.lastSyncStatus === 'failed' ? ' · L’ultimo tentativo non è andato a buon fine.' : ''}
        </p>
        <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending ? 'Aggiornamento…' : 'Aggiorna ora'}
        </Button>
        {sync.isError ? <div className="mt-3"><ErrorState error={sync.error} /></div> : null}
        {sync.data && sync.data.status !== 'ok' ? <p role="status" className="mt-2 text-sm text-warn">Aggiornamento {sync.data.status === 'partial' ? 'parziale' : 'non riuscito'}.</p> : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold">Fuso orario e lingua</h2>
        <p className="text-sm text-muted">Italiano · Europe/Rome (fisso per la programmazione italiana).</p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-1 font-semibold">Account</h2>
        <p className="mb-3 text-sm text-muted">Connesso come {me.data?.name ?? '…'}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" disabled={resetCache.isPending} onClick={() => resetCache.mutate()}>
            Svuota cache locale
          </Button>
          <Button variant="danger" disabled={logout.isPending} onClick={() => logout.mutate()}>
            Esci
          </Button>
        </div>
        {resetCache.isSuccess ? <p role="status" className="mt-2 text-sm text-muted">Cache locale svuotata.</p> : null}
      </section>
    </div>
  );
}
