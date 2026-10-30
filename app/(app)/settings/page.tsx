"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  Globe2,
  Layers3,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/ui/feedback";
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

function SettingToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="setting-toggle-control">
      <span className="setting-toggle-label">
        <span>{label}</span>
        <span className="setting-toggle-state">
          {checked ? "Attive" : "Disattive"}
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onCheckedChange={onChange}
      />
    </label>
  );
}

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
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Eliminazione dell’account non riuscita.",
      );
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
    <div className="settings-page">
      <PageHeader
        title="Impostazioni"
        subtitle="Personalizza la tua esperienza su Watchly."
      />

      <Card>
        <h2 className="settings-section-heading">
          <Bell size={20} aria-hidden /> Notifiche
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Scegli quando ricevere gli avvisi. Le preferenze per singola serie
          hanno priorità.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SettingToggle
            checked={s.notificationsEnabled}
            disabled={pushBlocked || togglePush.isPending}
            label="Abilita notifiche"
            onChange={(checked) => togglePush.mutate(checked)}
          />
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
            <Input
              type="time"
              value={s.notificationLocalTime}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  notificationLocalTime: event.target.value,
                })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Preavviso
            <Select
              items={{
                "0": "Giorno stesso",
                "1": "1 giorno prima",
                "3": "3 giorni prima",
                "7": "7 giorni prima",
              }}
              value={String(s.notificationLeadDays)}
              disabled={updateSettings.isPending}
              onValueChange={(value) =>
                updateSettings.mutate({
                  notificationLeadDays: Number(value) as 0 | 1 | 3 | 7,
                })
              }
            >
              <SelectTrigger className="mt-2" aria-label="Preavviso">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Giorno stesso</SelectItem>
                <SelectItem value="1">1 giorno prima</SelectItem>
                <SelectItem value="3">3 giorni prima</SelectItem>
                <SelectItem value="7">7 giorni prima</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Fuso orario
            <Input
              value={s.timezone}
              disabled={updateSettings.isPending}
              onBlur={(event) =>
                updateSettings.mutate({ timezone: event.target.value })
              }
              onChange={() => undefined}
              readOnly
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Ore silenziose da
            <Input
              type="time"
              value={s.notificationQuietStart ?? ""}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  notificationQuietStart: event.target.value || null,
                })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Ore silenziose fino a
            <Input
              type="time"
              value={s.notificationQuietEnd ?? ""}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  notificationQuietEnd: event.target.value || null,
                })
              }
              className="mt-2"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["notifyReleases", "Uscite episodi"],
              ["notifyScheduleChanges", "Cambi di programmazione"],
              ["notifyNewSeasons", "Nuove stagioni"],
              ["notifyNews", "News sui titoli seguiti"],
              ["weeklyDigest", "Riepilogo settimanale"],
            ] as const
          ).map(([field, label]) => (
            <SettingToggle
              key={field}
              checked={s[field]}
              disabled={updateSettings.isPending}
              label={label}
              onChange={(checked) =>
                updateSettings.mutate({ [field]: checked })
              }
            />
          ))}
        </div>
        {updateSettings.isError ? (
          <div className="mt-3">
            <ErrorState error={updateSettings.error} />
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="settings-section-heading">
          <Layers3 size={20} aria-hidden /> Piattaforme preferite
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          I servizi selezionati compaiono per primi nella sezione “Dove
          guardare”.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            "Netflix",
            "Crunchyroll",
            "Amazon Prime Video",
            "Disney Plus",
            "Apple TV Plus",
          ].map((service) => {
            const selected = s.preferredServices.includes(service);
            return (
              <Toggle
                key={service}
                variant="outline"
                className="settings-platform-toggle"
                pressed={selected}
                disabled={updateSettings.isPending}
                aria-label={`${selected ? "Rimuovi" : "Aggiungi"} ${service} dalle piattaforme preferite`}
                onPressedChange={() =>
                  updateSettings.mutate({
                    preferredServices: selected
                      ? s.preferredServices.filter((item) => item !== service)
                      : [...s.preferredServices, service],
                  })
                }
              >
                {selected ? (
                  <Check size={16} strokeWidth={2.5} aria-hidden />
                ) : (
                  <Plus size={16} aria-hidden />
                )}
                {service}
              </Toggle>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="settings-section-heading">
          <RefreshCw size={20} aria-hidden /> Aggiornamento dati
        </h2>
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
        <h2 className="settings-section-heading">
          <Globe2 size={20} aria-hidden /> Lingua e fuso orario
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Nome visualizzato
            <Input
              key={s.displayName ?? ""}
              defaultValue={s.displayName ?? ""}
              maxLength={100}
              disabled={updateSettings.isPending}
              onBlur={(event) =>
                updateSettings.mutate({
                  displayName: event.target.value.trim() || null,
                })
              }
              className="mt-2"
            />
          </label>
          <label className="text-sm font-semibold">
            Lingua
            <Select
              items={{ "it-IT": "Italiano", "en-US": "English" }}
              value={s.locale}
              disabled={updateSettings.isPending}
              onValueChange={(value) =>
                value && updateSettings.mutate({ locale: value })
              }
            >
              <SelectTrigger className="mt-2" aria-label="Lingua">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it-IT">Italiano</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Fuso orario
            <Select
              value={s.timezone}
              disabled={updateSettings.isPending}
              onValueChange={(value) =>
                value && updateSettings.mutate({ timezone: value })
              }
            >
              <SelectTrigger className="mt-2" aria-label="Fuso orario">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="settings-section-heading">
          <UserRound size={20} aria-hidden /> Account
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Connesso come {me.data?.name ?? "…"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={resetCache.isPending}
            onClick={() => resetCache.mutate()}
          >
            <RefreshCw
              size={16}
              aria-hidden
              className={resetCache.isPending ? "animate-spin" : ""}
            />
            Svuota cache locale
          </Button>
          <Button
            className="g_id_signout"
            variant="outline"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut size={16} aria-hidden />
            Esci
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  disabled={deleteAccount.isPending}
                />
              }
            >
              <Trash2 size={16} aria-hidden />
              {deleteAccount.isPending ? "Eliminazione…" : "Elimina account"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <div className="mb-4 flex size-11 items-center justify-center rounded-[14px] border border-destructive/30 bg-destructive/10 text-destructive">
                <Trash2 size={20} aria-hidden />
              </div>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare l’account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Verranno eliminati definitivamente il tuo account, la
                  watchlist e tutti i progressi. Questa operazione non può
                  essere annullata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteAccount.mutate()}>
                  <Trash2 size={16} aria-hidden />
                  Elimina definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
        {deleteError ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {deleteError}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="settings-section-heading">
          <ShieldCheck size={20} aria-hidden /> Informazioni legali
        </h2>
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
