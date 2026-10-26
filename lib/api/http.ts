import {
  ApiError,
  type CatalogSource,
  type EpisodeDto,
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
  next_air_date: string | null;
}

interface BackendFollowingList {
  items: BackendFollowingRead[];
}

interface BackendSearchResponse {
  results: BackendSeries[];
  provider_errors: Record<string, string>;
}

interface BackendCalendarItem {
  episode_id: string;
  series: { id: string; title: string; kind: SeriesKind; poster_url: string | null };
  season_number: number | null;
  episode_number: number | null;
  title: string | null;
  air_date: string;
  source: CatalogSource;
  watched: boolean;
}

interface BackendCalendarResponse {
  start: string;
  end: string;
  items: BackendCalendarItem[];
}

interface BackendSeriesRead extends BackendSeries {
  original_title: string | null;
  status: string | null;
  start_date: string | null;
  last_synced_at: string | null;
  last_sync_status: string | null;
  stale: boolean;
}

interface BackendEpisodeRead {
  id: string;
  series_id: string;
  season_number: number | null;
  episode_number: number | null;
  title: string | null;
  air_at: string | null;
  air_date: string | null;
  source: CatalogSource;
  watched: boolean;
}

interface BackendEpisodeListResponse {
  episodes: BackendEpisodeRead[];
  last_synced_at: string | null;
  sync_status: string | null;
  stale: boolean;
}

interface BackendUserSettings {
  notifications_enabled: boolean;
  last_successful_sync_at: string | null;
}

interface BackendSyncRun {
  status: 'pending' | 'running' | 'succeeded' | 'partial' | 'failed';
  completed_at: string | null;
  error: string | null;
}

interface BackendSessionUser {
  id: string;
  email: string;
  display_name: string | null;
}

export function resolveApiBaseUrl(configured: string | undefined, environment: string): string {
  const value = configured?.trim();
  if (value) return value.replace(/\/$/, '');
  return environment === 'development' ? 'http://localhost:8000/api/v1' : '';
}

const BASE_URL = resolveApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NODE_ENV,
);

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

function mapSyncStatus(value: string | null): SeriesDetail['lastSyncStatus'] {
  if (!value) return null;
  if (value === 'ok') return 'ok';
  if (value === 'partial') return 'partial';
  if (value === 'failed' || value === 'error') return 'failed';
  return null;
}

function mapSeriesDetail(item: BackendSeriesRead): SeriesDetail {
  const base = mapSeries(item);
  return {
    ...base,
    status: item.status,
    seasons: null,
    lastSyncAt: item.last_synced_at,
    lastSyncStatus: mapSyncStatus(item.last_sync_status),
  };
}

function mapEpisode(item: BackendEpisodeRead): EpisodeDto {
  const airDate = item.air_date ?? (item.air_at ? item.air_at.slice(0, 10) : null);
  return {
    id: item.id,
    seasonNumber: item.season_number,
    number: item.episode_number,
    title: item.title,
    airDate,
    source: item.source,
    watchedAt: item.watched ? new Date().toISOString() : null,
  };
}

function mapSettings(item: BackendUserSettings): UserSettings {
  return {
    notificationsEnabled: item.notifications_enabled,
    lastSyncAt: item.last_successful_sync_at,
    lastSyncStatus: null,
  };
}

function mapSessionUser(item: BackendSessionUser): SessionUser {
  return {
    id: item.id,
    name: item.display_name || item.email,
  };
}

function mapSync(item: BackendSyncRun): SyncResult {
  const statuses: Record<BackendSyncRun['status'], SyncResult['status']> = {
    pending: 'queued',
    running: 'running',
    succeeded: 'ok',
    partial: 'partial',
    failed: 'failed',
  };
  return {
    status: statuses[item.status],
    finishedAt: item.completed_at,
    message: item.error,
  };
}

export const httpApi: WatchlyApi = {
  login: async (email, password) =>
    mapSessionUser(
      await request<BackendSessionUser>('/auth/login', {
        method: 'POST',
        json: { email, password },
      }),
    ),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: async () => mapSessionUser(await request<BackendSessionUser>('/me')),
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
  getSeries: async (id) =>
    mapSeriesDetail(await request<BackendSeriesRead>(`/series/${encodeURIComponent(id)}`)),
  getEpisodes: async (id) => {
    const response = await request<BackendEpisodeListResponse>(
      `/series/${encodeURIComponent(id)}/episodes`,
    );
    return response.episodes.map(mapEpisode);
  },
  following: async () => {
    const response = await request<BackendFollowingList>('/me/following');
    return response.items.map((row) => ({
      ...mapSeries(row.series),
      nextAirDate: row.next_air_date,
    }));
  },
  follow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'PUT' }),
  unfollow: (id) => request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  calendar: async (from, to) => {
    const response = await request<BackendCalendarResponse>(
      `/me/calendar${qs({ start: from, end: to })}`,
    );
    return {
      from: response.start,
      to: response.end,
      entries: response.items.map((item) => ({
        date: item.air_date,
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
        watchedAt: item.watched ? `${item.air_date}T00:00:00+02:00` : null,
        source: item.source,
      })),
      stale: false,
      lastSuccessfulSyncAt: null,
    };
  },
  setWatched: (id, watched) =>
    request<void>(`/me/episodes/${encodeURIComponent(id)}/watched`, {
      method: watched ? 'PUT' : 'DELETE',
    }),
  sync: async (seriesId) =>
    mapSync(
      seriesId
        ? await request<BackendSyncRun>(`/series/${encodeURIComponent(seriesId)}/refresh`, { method: 'POST' })
        : await request<BackendSyncRun>('/me/sync', { method: 'POST' }),
    ),
  getSettings: async () => mapSettings(await request<BackendUserSettings>('/me/settings')),
  patchSettings: async (patch) => {
    const json = {
      ...(patch.notificationsEnabled === undefined
        ? {}
        : { notifications_enabled: patch.notificationsEnabled }),
    };
    return mapSettings(
      await request<BackendUserSettings>('/me/settings', { method: 'PATCH', json }),
    );
  },
  news: () => request<NewsPage>('/news'),
  registerPush: (sub) => request<{ id: string }>('/me/push-subscriptions', { method: 'POST', json: sub }),
  unregisterPush: (id) =>
    request<void>(`/me/push-subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
