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

interface BackendExternalId {
  source: CatalogSource;
  external_id: string;
}

interface BackendSeries {
  id: string;
  kind: SeriesKind;
  title: string;
  alternative_titles: unknown;
  poster_url: string | null;
  synopsis: string | null;
  format: string | null;
  year: number | null;
  external_ids: BackendExternalId[];
  followed: boolean;
}

interface BackendFollowingRead {
  series: BackendSeries;
  next_italy_date: string | null;
}

interface BackendFollowingList {
  items: BackendFollowingRead[];
}

interface BackendSearchResponse {
  results: BackendSeries[];
  provider_errors: Record<string, string>;
}

interface BackendAvailability {
  status: string;
  service_id: string | null;
  local_date: string | null;
  source_url: string | null;
}

interface BackendCalendarItem {
  episode_id: string;
  series: { id: string; title: string; kind: SeriesKind; poster_url: string | null };
  season_number: number | null;
  episode_number: number | null;
  title: string | null;
  local_date: string;
  date_kind: 'italy' | 'original';
  italy: BackendAvailability;
  watched: boolean;
}

interface BackendCalendarResponse {
  start: string;
  end: string;
  items: BackendCalendarItem[];
}

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

function mapSeries(item: BackendSeries): SeriesSummary {
  const external = item.external_ids[0];
  const alternativeTitles = Array.isArray(item.alternative_titles)
    ? item.alternative_titles.filter((t): t is string => typeof t === 'string' && t.length > 0)
    : [];
  return {
    id: item.id,
    title: item.title,
    alternativeTitles,
    kind: item.kind,
    source: external?.source ?? (item.kind === 'tv' ? 'tmdb' : 'anilist'),
    externalId: external?.external_id ?? '',
    format: item.format,
    year: item.year,
    posterUrl: item.poster_url,
    synopsis: item.synopsis,
    following: item.followed,
  };
}

export const httpApi: WatchlyApi = {
  login: (email, password) =>
    request<SessionUser>('/auth/login', { method: 'POST', json: { email, password } }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<SessionUser>('/me'),
  search: async (q, kind: SeriesKind | 'all', source: CatalogSource | 'all', signal) => {
    const response = await request<BackendSearchResponse>(
      `/catalog/search${qs({ q, kind: kind === 'all' ? undefined : kind, source: source === 'all' ? undefined : source })}`,
      { signal },
    );
    if (response.results.length === 0 && Object.keys(response.provider_errors).length > 0) {
      throw new ApiError(503, Object.values(response.provider_errors).join(' '));
    }
    return response.results.map(mapSeries);
  },
  getSeries: (id) => request<SeriesDetail>(`/series/${encodeURIComponent(id)}`),
  getEpisodes: (id) => request<EpisodeDto[]>(`/series/${encodeURIComponent(id)}/episodes`),
  following: async () => {
    const response = await request<BackendFollowingList>('/me/following');
    return response.items.map((row) => {
      const base = mapSeries(row.series);
      return {
        ...base,
        nextItalianAvailability: row.next_italy_date
          ? {
              country: 'IT',
              service: null,
              status: 'confirmed',
              localDate: row.next_italy_date,
              precision: 'date',
              sourceUrl: null,
              lastVerifiedAt: null,
            }
          : null,
      };
    });
  },
  follow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'PUT' }),
  unfollow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  calendar: async (from, to, mode) => {
    const response = await request<BackendCalendarResponse>(
      `/me/calendar${qs({ start: from, end: to, mode: mode === 'original' ? 'all' : 'italy' })}`,
    );
    return {
      from: response.start,
      to: response.end,
      mode,
      entries: response.items.map((item) => ({
        date: item.local_date,
        episodeId: item.episode_id,
        series: {
          id: item.series.id,
          title: item.series.title,
          kind: item.series.kind,
          posterUrl: item.series.poster_url,
        },
        episodeNumber: item.episode_number,
        seasonNumber: item.season_number,
        episodeTitle: item.title,
        watchedAt: item.watched ? `${item.local_date}T00:00:00+02:00` : null,
        availability:
          item.date_kind === 'original'
            ? {
                country: 'ORIGINAL',
                service: null,
                status: 'original' as const,
                localDate: item.local_date,
                precision: 'date' as const,
                sourceUrl: null,
                lastVerifiedAt: null,
              }
            : {
                country: 'IT',
                service: item.italy.service_id,
                status: item.italy.status as CalendarResponse['entries'][number]['availability']['status'],
                localDate: item.italy.local_date,
                precision: item.italy.local_date ? ('date' as const) : ('unknown' as const),
                sourceUrl: item.italy.source_url,
                lastVerifiedAt: null,
              },
      })),
      stale: false,
      lastSuccessfulSyncAt: null,
    };
  },
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
