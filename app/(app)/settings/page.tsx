"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Card, SelectField, TextField } from "@/components/ui/controls";
import {
  Button,
  ErrorState,
  ListSkeleton,
  PageHeader,
} from "@/components/ui/feedback";
import { api, isMockApi } from "@/lib/api";
import { disableGoogleAutoSelect } from "@/lib/auth/google";
import { formatDateTime } from "@/lib/date/italy";
import { useSyncMutation } from "@/lib/hooks";
import {
  isIOS,
  isStandalone,
  pushSupported,
  showNotificationPreview,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pwa/register";

const PUSH_ID_KEY = "watchly-push-id";
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

async function clearBrowserCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  const registration = await navigator.serviceWorker?.getRegistration();
  registration?.active?.postMessage("clear-caches");
}

function capsSnapshot(): string {
  const ok = pushSupported();
  return `${ok ? 1 : 0}|${isIOS() && !isStandalone() ? 1 : 0}|${ok ? Notification.permission : "unsupported"}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
  });
  const me = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const sync = useSyncMutation();
  const [pushError, setPushError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [supported, needsInstall, initialPermission] = useSyncExternalStore(
    () => () => undefined,
    () => capsSnapshot(),
    () => "ssr",
  ).split("|") as [string, string, string];
  const [permissionOverride, setPermission] =
    useState<NotificationPermission | null>(null);
  const permission =
    permissionOverride ??
    (initialPermission as NotificationPermission | "unsupported" | "ssr");
  const isSupported = supported === "1";
  const pushBlocked =
    !isSupported || needsInstall === "1" || permission === "denied";

  const togglePush = useMutation({
    mutationFn: async (enable: boolean) => {
      setPushError(null);
      if (enable) {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") {
          throw new Error(
            "Permesso notifiche negato. Puoi riattivarlo dalle impostazioni del browser.",
          );
        }
        if (!isMockApi) {
          if (!VAPID || VAPID === "replace-me") {
            throw new Error(
              "Notifiche non configurate (chiave VAPID mancante).",
            );
          }
          const json = await subscribeToPush(VAPID);
          if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
            throw new Error("Sottoscrizione push non valida.");
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
    onSuccess: (data) => qc.setQueryData(["settings"], data),
    onError: (e) =>
      setPushError(e instanceof Error ? e.message : "Operazione non riuscita."),
  });

  const previewPush = useMutation({
    mutationFn: showNotificationPreview,
    onMutate: () => setPushError(null),
    onError: (e) =>
      setPushError(
        e instanceof Error
          ? e.message
          : "Impossibile mostrare la notifica di prova.",
      ),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.logout();
      disableGoogleAutoSelect();
      await clearBrowserCaches();
      localStorage.removeItem(PUSH_ID_KEY);
    },
    onSuccess: () => {
      qc.clear();
      router.replace("/login");
    },
  });

  const resetCache = useMutation({
    mutationFn: async () => {
      await clearBrowserCaches();
      qc.clear();
    },
  });

  const updateSettings = useMutation({
    mutationFn: api.patchSettings,
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      setDeleteError(null);
      if (
        !window.confirm(
          "Eliminare definitivamente l’account, la watchlist e tutti i progressi? L’operazione non è reversibile.",
        )
      ) {
        throw new Error("Operazione annullata.");
      }
      await api.deleteAccount();
      disableGoogleAutoSelect();
      await clearBrowserCaches();
      localStorage.removeItem(PUSH_ID_KEY);
    },
    onSuccess: () => {
      qc.clear();
      router.replace("/login");
    },
    onError: (error) => {
      if (error instanceof Error && error.message !== "Operazione annullata.")
        setDeleteError(error.message);
    },
  });

  if (settings.isPending) return <ListSkeleton rows={3} />;
  if (settings.isError) {
    return (
      <ErrorState
        error={settings.error}
        onRetry={() => void settings.refetch()}
      />
    );
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
          Scegli quando ricevere gli avvisi. Le preferenze per singola serie hanno priorità.
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
              permission !== "granted" ||
              previewPush.isPending
            }
            onClick={() => previewPush.mutate()}
          >
            {previewPush.isPending ? "Invio…" : "Invia notifica di prova"}
          </Button>
        </div>
        {!isSupported ? (
          <p className="mt-3 text-sm text-warn">
            Questo browser non supporta le notifiche push. Le novità restano
            visibili nell&apos;app.
          </p>
        ) : null}
        {isSupported && needsInstall === "1" ? (
          <p className="mt-3 text-sm text-warn">
            Su iPhone installa prima Watchly: Safari → Condividi → Aggiungi alla
            schermata Home.
          </p>
        ) : null}
        {permission === "denied" ? (
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
            Notifica di prova inviata da questo dispositivo, senza contattare il
            backend.
          </p>
        ) : null}
        {isMockApi ? (
          <p className="mt-3 text-xs text-muted">
            Modalità demo: nessuna sottoscrizione push reale.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Orario
            <TextField
              type="time"
              value={s.notificationLocalTime}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({ notificationLocalTime: event.target.value })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Preavviso
            <SelectField
              value={s.notificationLeadDays}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  notificationLeadDays: Number(event.target.value) as 0 | 1 | 3 | 7,
                })
              }
              className="mt-2 w-full"
            >
              <option value="0">Giorno stesso</option>
              <option value="1">1 giorno prima</option>
              <option value="3">3 giorni prima</option>
              <option value="7">7 giorni prima</option>
            </SelectField>
          </label>
          <label className="text-sm font-semibold">
            Fuso orario
            <TextField
              value={s.timezone}
              disabled={updateSettings.isPending}
              onBlur={(event) => updateSettings.mutate({ timezone: event.target.value })}
              onChange={() => undefined}
              readOnly
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Ore silenziose da
            <TextField
              type="time"
              value={s.notificationQuietStart ?? ""}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({ notificationQuietStart: event.target.value || null })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Ore silenziose fino a
            <TextField
              type="time"
              value={s.notificationQuietEnd ?? ""}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({ notificationQuietEnd: event.target.value || null })
              }
              className="mt-2"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["notifyReleases", "Uscite episodi"],
            ["notifyScheduleChanges", "Cambi di programmazione"],
            ["notifyNewSeasons", "Nuove stagioni"],
            ["notifyNews", "News sui titoli seguiti"],
            ["weeklyDigest", "Riepilogo settimanale"],
          ] as const).map(([field, label]) => (
            <label key={field} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={s[field]}
                disabled={updateSettings.isPending}
                onChange={(event) => updateSettings.mutate({ [field]: event.target.checked })}
                className="h-5 w-5 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
        {updateSettings.isError ? (
          <div className="mt-3"><ErrorState error={updateSettings.error} /></div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Servizi preferiti</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          I servizi selezionati compaiono per primi nella sezione “Dove guardare”.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {["Netflix", "Crunchyroll", "Amazon Prime Video", "Disney Plus", "Apple TV Plus"].map((service) => {
            const selected = s.preferredServices.includes(service);
            return (
              <label key={service} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={updateSettings.isPending}
                  onChange={() =>
                    updateSettings.mutate({
                      preferredServices: selected
                        ? s.preferredServices.filter((item) => item !== service)
                        : [...s.preferredServices, service],
                    })
                  }
                  className="accent-primary"
                />
                {service}
              </label>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Aggiornamento dati</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {s.lastSyncAt
            ? `Ultimo aggiornamento riuscito: ${formatDateTime(s.lastSyncAt)}`
            : "Nessun aggiornamento riuscito."}
          {s.lastSyncStatus === "partial" || s.lastSyncStatus === "failed"
            ? " · L’ultimo tentativo non è andato a buon fine."
            : ""}
        </p>
        <div className="mt-4">
          <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
            {sync.isPending ? "Aggiornamento…" : "Aggiorna ora"}
          </Button>
        </div>
        {sync.isError ? (
          <div className="mt-3">
            <ErrorState error={sync.error} />
          </div>
        ) : null}
        {sync.data?.status === "queued" || sync.data?.status === "running" ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Aggiornamento avviato. I nuovi dati saranno disponibili a breve.
          </p>
        ) : null}
        {sync.data?.status === "partial" || sync.data?.status === "failed" ? (
          <p role="status" className="mt-3 text-sm text-warn">
            Aggiornamento{" "}
            {sync.data.status === "partial" ? "parziale" : "non riuscito"}.
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Profilo, fuso orario e lingua</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Nome visualizzato
            <TextField
              key={s.displayName ?? ""}
              defaultValue={s.displayName ?? ""}
              maxLength={100}
              disabled={updateSettings.isPending}
              onBlur={(event) =>
                updateSettings.mutate({ displayName: event.target.value.trim() || null })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Lingua
            <SelectField
              value={s.locale}
              disabled={updateSettings.isPending}
              onChange={(event) => updateSettings.mutate({ locale: event.target.value })}
              className="mt-2 w-full"
            >
              <option value="it-IT">Italiano</option>
              <option value="en-US">English</option>
            </SelectField>
          </label>
          <label className="text-sm font-semibold">
            Fuso orario
            <SelectField
              value={s.timezone}
              disabled={updateSettings.isPending}
              onChange={(event) => updateSettings.mutate({ timezone: event.target.value })}
              className="mt-2 w-full"
            >
              <option value="Europe/Rome">Europe/Rome</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="UTC">UTC</option>
            </SelectField>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Account</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Connesso come {me.data?.name ?? "…"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={resetCache.isPending}
            onClick={() => resetCache.mutate()}
          >
            Svuota cache locale
          </Button>
          <Button
            className="g_id_signout"
            variant="danger"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Esci
          </Button>
          <Button
            variant="danger"
            disabled={deleteAccount.isPending}
            onClick={() => deleteAccount.mutate()}
          >
            {deleteAccount.isPending ? "Eliminazione…" : "Elimina account"}
          </Button>
        </div>
        {logout.isError ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {logout.error instanceof Error
              ? logout.error.message
              : "Disconnessione non riuscita."}
          </p>
        ) : null}
        {resetCache.isSuccess ? (
          <p role="status" className="mt-3 text-sm text-muted">
            Cache locale svuotata.
          </p>
        ) : null}
        {deleteError ? <p role="alert" className="mt-3 text-sm text-accent">{deleteError}</p> : null}
      </Card>

      <Card>
        <h2 className="text-[16px] font-bold">Informazioni legali</h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            className="text-primary underline underline-offset-4"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="text-primary underline underline-offset-4"
            href="/terms"
          >
            Termini di servizio
          </Link>
          <Link
            className="text-primary underline underline-offset-4"
            href="/about"
          >
            Informazioni e crediti
          </Link>
        </div>
      </Card>
    </div>
  );
}
