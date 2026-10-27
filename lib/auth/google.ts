export function disableGoogleAutoSelect(): void {
  if (typeof window === 'undefined') return;
  window.google?.accounts.id.disableAutoSelect();
}
