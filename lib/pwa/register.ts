import { getRomeTodayIso } from '@/lib/date/italy';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
    // la PWA è un miglioramento progressivo: l'app funziona anche senza
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(publicKey: string): Promise<PushSubscriptionJSON> {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const sub =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  return sub.toJSON();
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  await sub?.unsubscribe();
}

/** Mostra una notifica di esempio sul dispositivo senza passare dal backend. */
export async function showNotificationPreview(): Promise<void> {
  if (!pushSupported() || Notification.permission !== 'granted') {
    throw new Error('Abilita prima le notifiche per inviare una prova.');
  }

  const date = getRomeTodayIso();
  const title = 'Watchly · uscite di oggi';
  const options: NotificationOptions = {
    body: '2 episodi in programma oggi: Solo Leveling, The Last of Us',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'watchly-preview',
    data: { url: `/calendar?date=${date}` },
  };
  const registration = await navigator.serviceWorker.getRegistration('/');

  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  // Fallback utile in sviluppo, dove il service worker non viene registrato.
  const notification = new Notification(title, options);
  notification.onclick = () => {
    window.focus();
    window.open(`/calendar?date=${date}`, '_self');
    notification.close();
  };
}
