'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import { Card } from '@/components/ui/controls';
import { Button, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/feedback';
import { api, isMockApi } from '@/lib/api';
import { formatDateTime } from '@/lib/date/italy';
import { useSyncMutation } from '@/lib/hooks';
import {
  isIOS,
  isStandalone,
  pushSupported,
  showNotificationPreview,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pwa/register';

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
  const permission =
    permissionOverride ?? (initialPermission as NotificationPermission | 'unsupported' | 'ssr');
  const isSupported = supported === '1';
  const pushBlocked = !isSupported || needsInstall === '1' || permission === 'denied';

  const togglePush = useMutation({
    mutationFn: async (enable: boolean) => {
      setPushError(null);
      if (enable) {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          throw new Error(
            'Permesso notifiche negato. Puoi riattivarlo dalle impostazioni del browser.',
          );
        }
        if (!isMockApi) {
          if (!VAPID || VAPID === 'replace-me') {
            throw new Error('Notifiche non configurate (chiave VAPID mancante).');
          }
          const json = await subscribeToPush(VAPID);
          if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
            throw new Error('Sottoscrizione push non valida.');
          }
          const { id } = await api.registerPush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          });
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

  const previewPush = useMutation({
    mutationFn: showNotificationPreview,
    onMutate: () => setPushError(null),
    onError: (e) =>
      setPushError(e instanceof Error ? e.message : 'Impossibile mostrare la notifica di prova.'),
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
  if (settings.isError) {
    return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />;
  }

  const s = settings.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PREFERENZE"
        title="Impostazioni"
        subtitle="Lingua, notifiche e stato dei dati."
      />

      <Card>
        <h2 className="text-[16px] font-bold">Notifiche</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Una notifica alle 12:00 (Europe/Rome) nei giorni con episodi in uscita,
          solo per le serie seguite e in base alle date dei provider.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={s.notificationsEnabled}
              disabled={pushBlocked || togglePush.isPending}
              onChange={(e) => togglePush.mutate(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            Abilita notifiche
          </label>
          <Button
            variant="ghost"
            disabled={
              !s.notificationsEnabled ||
              pushBlocked ||
              permission !== 'granted' ||
              previewPush.isPending
            }
            onClick={() => previewPush.mutate()}
          >
            {previewPush.isPending ? 'Invio…' : 'Invia notifica di prova'}
          </Button>
        </div>
        {!isSupported ? (
          <p className="mt-3 text-sm text-warn">
            Questo browser non supporta le notifiche push. Le novità restano visibili nell&apos;app.
          </p>
        ) : null}
        {isSupported && needsInstall === '1' ? (
          <p className="mt-3 text-sm text-warn">
            Su iPhone installa prima Watchly: Safari → Condividi → Aggiungi alla schermata Home.
          </p>
        ) : null}
        {permission === 'denied' ? (
          <p className="mt-3 text-sm text-warn">
            Permesso negato dal browser: riattivalo dalle impostazioni del sito.
          </p>
        ) : null}
        {pushError ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {pushError}
          </p>
        ) : null}
        {previewPush.isSuccess ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Notifica di prova inviata da questo dispositivo, senza contattare il backend.
          </p>
        ) : null}
        {isMockApi ? <p className="mt-3 text-xs text-muted">Modalità demo: nessuna sottoscrizione push reale.</p> : null}
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Aggiornamento dati</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {s.lastSyncAt
            ? `Ultimo aggiornamento riuscito: ${formatDateTime(s.lastSyncAt)}`
            : 'Nessun aggiornamento riuscito.'}
          {s.lastSyncStatus === 'partial' || s.lastSyncStatus === 'failed'
            ? ' · L’ultimo tentativo non è andato a buon fine.'
            : ''}
        </p>
        <div className="mt-4">
          <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
            {sync.isPending ? 'Aggiornamento…' : 'Aggiorna ora'}
          </Button>
        </div>
        {sync.isError ? (
          <div className="mt-3">
            <ErrorState error={sync.error} />
          </div>
        ) : null}
        {sync.data?.status === 'queued' || sync.data?.status === 'running' ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Aggiornamento avviato. I nuovi dati saranno disponibili a breve.
          </p>
        ) : null}
        {sync.data?.status === 'partial' || sync.data?.status === 'failed' ? (
          <p role="status" className="mt-3 text-sm text-warn">
            Aggiornamento {sync.data.status === 'partial' ? 'parziale' : 'non riuscito'}.
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Fuso orario e lingua</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Italiano · Europe/Rome (fuso del calendario).</p>
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Account</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Connesso come {me.data?.name ?? '…'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" disabled={resetCache.isPending} onClick={() => resetCache.mutate()}>
            Svuota cache locale
          </Button>
          <Button variant="danger" disabled={logout.isPending} onClick={() => logout.mutate()}>
            Esci
          </Button>
        </div>
        {resetCache.isSuccess ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Cache locale svuotata.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
