import {
  ApiError,
  type CalendarResponse,
  type CatalogSource,
  type EpisodeDto,
  type FollowingItem,
  type NewsPage,
  type SeriesDetail,
  type SeriesKind,
  type SeriesSummary,
  type SessionUser,
  type SyncResult,
  type UserSettings,
  type WatchlyApi,
} from './types';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const method = rest.method ?? 'GET';
  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  if (json !== undefined) finalHeaders.set('Content-Type', 'application/json');
  if (method !== 'GET') finalHeaders.set('X-Requested-With', 'watchly-web');

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      method,
      headers: finalHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
      credentials: 'include',
    });
  } catch (error) {
    if (rest.signal?.aborted) throw error;
    throw new ApiError(0, 'Impossibile contattare il server. Controlla la connessione.');
  }

  if (!response.ok) {
    let message = `Errore del server (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: unknown };
      if (typeof body.message === 'string') message = body.message;
    } catch {
      // corpo non JSON: si usa il messaggio generico
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const qs = (params: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const httpApi: WatchlyApi = {
  login: (email, password) =>
    request<SessionUser>('/auth/login', { method: 'POST', json: { email, password } }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<SessionUser>('/me'),
  search: (q, kind: SeriesKind | 'all', source: CatalogSource | 'all', signal) =>
    request<SeriesSummary[]>(
      `/catalog/search${qs({ q, kind: kind === 'all' ? undefined : kind, source: source === 'all' ? undefined : source })}`,
      { signal },
    ),
  getSeries: (id) => request<SeriesDetail>(`/series/${encodeURIComponent(id)}`),
  getEpisodes: (id) => request<EpisodeDto[]>(`/series/${encodeURIComponent(id)}/episodes`),
  following: () => request<FollowingItem[]>('/me/following'),
  follow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'PUT' }),
  unfollow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  calendar: (from, to, mode) => request<CalendarResponse>(`/me/calendar${qs({ from, to, mode })}`),
  setWatched: (id, watched) =>
    request<void>(`/me/episodes/${encodeURIComponent(id)}`, { method: 'PATCH', json: { watched } }),
  sync: (seriesId) =>
    seriesId
      ? request<SyncResult>(`/series/${encodeURIComponent(seriesId)}/refresh`, { method: 'POST' })
      : request<SyncResult>('/me/sync', { method: 'POST' }),
  getSettings: () => request<UserSettings>('/me/settings'),
  patchSettings: (patch) => request<UserSettings>('/me/settings', { method: 'PATCH', json: patch }),
  news: () => request<NewsPage>('/news'),
  registerPush: (sub) => request<{ id: string }>('/me/push-subscriptions', { method: 'POST', json: sub }),
  unregisterPush: (id) =>
    request<void>(`/me/push-subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
