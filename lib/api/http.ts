import {
  ApiError,
  type CatalogSource,
  type DashboardData,
  type DashboardPeriodWeeks,
  type EpisodeDto,
  type NewsPage,
  type NewsFilters,
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
  genres: string[];
  average_rating: number | null;
  episode_runtime_minutes: number | null;
  format: string | null;
  year: number | null;
  external_ids: BackendExternalId[];
  followed: boolean;
  watch_providers: Array<{
    id: string;
    name: string;
    url: string;
    type: 'stream' | 'flatrate' | 'free' | 'ads' | 'buy' | 'rent';
    source: CatalogSource;
    logo_url?: string;
  }>;
}

interface BackendFollowingRead {
  series: BackendSeries;
  next_air_date: string | null;
  watch_status: import('./types').WatchStatus;
  favorite: boolean;
  aired_episodes: number;
  watched_episodes: number;
  backlog_episodes: number;
  next_unwatched_episode_id: string | null;
  notifications_enabled: boolean | null;
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
  series: {
    id: string;
    title: string;
    kind: SeriesKind;
    poster_url: string | null;
  };
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
  duration_minutes: number | null;
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
  display_name: string | null;
  timezone: string;
  locale: string;
  notifications_enabled: boolean;
  notification_local_time: string;
  notification_quiet_start: string | null;
  notification_quiet_end: string | null;
  notification_lead_days: 0 | 1 | 3 | 7;
  notify_releases: boolean;
  notify_schedule_changes: boolean;
  notify_new_seasons: boolean;
  notify_news: boolean;
  weekly_digest: boolean;
  preferred_services: string[];
  push_available: boolean;
  push_subscriptions: number;
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
  created_at: string;
  timezone: string;
  locale: string;
}

interface BackendNewsItem {
  id: string;
  source: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  image_url: string | null;
  url: string;
  category: import('./types').NewsItem['category'];
  saved: boolean;
  read_at: string | null;
  series: Array<{ id: string; title: string; followed: boolean }>;
}

interface BackendNewsPage {
  items: BackendNewsItem[];
  next_cursor: string | null;
  configured: boolean;
}

interface BackendDashboard {
  generated_at: string;
  timezone: string;
  period_weeks: DashboardPeriodWeeks;
  kpis: {
    followed_series: number;
    watched_episodes: number;
    aired_episodes: number;
    completion_percentage: number;
    backlog_episodes: number;
    upcoming_7_days: number;
    upcoming_30_days: number;
    estimated_watch_minutes: number;
    duration_coverage_percentage: number;
    average_provider_rating: number | null;
    rated_series: number;
    current_activity_streak: number;
    longest_activity_streak: number;
  };
  activity: Array<{ period_start: string; watched_count: number }>;
  watchlist_breakdown: { anime: number; tv: number };
  genres: {
    basis: 'watched_episodes' | 'followed_series';
    items: Array<{ name: string; count: number }>;
  };
  series_progress: Array<{
    series_id: string;
    title: string;
    poster_url: string | null;
    kind: SeriesKind;
    watched: number;
    aired: number;
    percentage: number;
    backlog: number;
    average_rating: number | null;
  }>;
  top_series: Array<{
    series_id: string;
    title: string;
    poster_url: string | null;
    watched: number;
    estimated_minutes: number;
  }>;
}

export function resolveApiBaseUrl(
  configured: string | undefined,
  environment: string,
): string {
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
    throw new ApiError(
      0,
      'Impossibile contattare il server. Controlla la connessione.',
    );
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
    ? item.alternative_titles.filter(
        (t): t is string => typeof t === 'string' && t.length > 0,
      )
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
    genres: item.genres ?? [],
    averageRating: item.average_rating,
    episodeRuntimeMinutes: item.episode_runtime_minutes,
    watchProviders: (item.watch_providers ?? []).map((provider) => ({
      id: provider.id,
      name: provider.name,
      url: provider.url,
      type: provider.type,
      source: provider.source,
      logoUrl: provider.logo_url ?? null,
    })),
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
  const airDate =
    item.air_date ?? (item.air_at ? item.air_at.slice(0, 10) : null);
  return {
    id: item.id,
    seasonNumber: item.season_number,
    number: item.episode_number,
    title: item.title,
    durationMinutes: item.duration_minutes,
    airDate,
    airAt: item.air_at,
    source: item.source,
    watchedAt: item.watched ? new Date().toISOString() : null,
  };
}

function mapSettings(item: BackendUserSettings): UserSettings {
  return {
    displayName: item.display_name,
    timezone: item.timezone,
    locale: item.locale,
    notificationsEnabled: item.notifications_enabled,
    notificationLocalTime: item.notification_local_time,
    notificationQuietStart: item.notification_quiet_start,
    notificationQuietEnd: item.notification_quiet_end,
    notificationLeadDays: item.notification_lead_days,
    notifyReleases: item.notify_releases,
    notifyScheduleChanges: item.notify_schedule_changes,
    notifyNewSeasons: item.notify_new_seasons,
    notifyNews: item.notify_news,
    weeklyDigest: item.weekly_digest,
    preferredServices: item.preferred_services ?? [],
    pushAvailable: item.push_available,
    pushSubscriptions: item.push_subscriptions,
    lastSyncAt: item.last_successful_sync_at,
    lastSyncStatus: null,
  };
}

function mapSessionUser(item: BackendSessionUser): SessionUser {
  return {
    id: item.id,
    name: item.display_name || item.email,
    email: item.email,
    createdAt: item.created_at,
    timezone: item.timezone || 'Europe/Rome',
    locale: item.locale || 'it-IT',
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

function mapDashboard(item: BackendDashboard): DashboardData {
  return {
    generatedAt: item.generated_at,
    timezone: item.timezone,
    periodWeeks: item.period_weeks,
    kpis: {
      followedSeries: item.kpis.followed_series,
      watchedEpisodes: item.kpis.watched_episodes,
      airedEpisodes: item.kpis.aired_episodes,
      completionPercentage: item.kpis.completion_percentage,
      backlogEpisodes: item.kpis.backlog_episodes,
      upcoming7Days: item.kpis.upcoming_7_days,
      upcoming30Days: item.kpis.upcoming_30_days,
      estimatedWatchMinutes: item.kpis.estimated_watch_minutes,
      durationCoveragePercentage: item.kpis.duration_coverage_percentage,
      averageProviderRating: item.kpis.average_provider_rating,
      ratedSeries: item.kpis.rated_series,
      currentActivityStreak: item.kpis.current_activity_streak,
      longestActivityStreak: item.kpis.longest_activity_streak,
    },
    activity: item.activity.map((point) => ({
      periodStart: point.period_start,
      watchedCount: point.watched_count,
    })),
    watchlistBreakdown: item.watchlist_breakdown,
    genres: item.genres,
    seriesProgress: item.series_progress.map((series) => ({
      seriesId: series.series_id,
      title: series.title,
      posterUrl: series.poster_url,
      kind: series.kind,
      watched: series.watched,
      aired: series.aired,
      percentage: series.percentage,
      backlog: series.backlog,
      averageRating: series.average_rating,
    })),
    topSeries: item.top_series.map((series) => ({
      seriesId: series.series_id,
      title: series.title,
      posterUrl: series.poster_url,
      watched: series.watched,
      estimatedMinutes: series.estimated_minutes,
    })),
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
  loginWithGoogle: async (credential) =>
    mapSessionUser(
      await request<BackendSessionUser>('/auth/google', {
        method: 'POST',
        json: { credential },
      }),
    ),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  deleteAccount: () => request<void>('/me', { method: 'DELETE' }),
  me: async () => mapSessionUser(await request<BackendSessionUser>('/me')),
  dashboard: async (weeks) =>
    mapDashboard(
      await request<BackendDashboard>(`/me/dashboard?weeks=${weeks}`),
    ),
  search: async (
    q,
    filters,
    signal,
  ) => {
    const response = await request<BackendSearchResponse>(
      `/catalog/search${qs({
        q,
        kind: filters.kind === 'all' ? undefined : filters.kind,
        source: filters.source === 'all' ? undefined : filters.source,
        year: filters.year?.toString(),
        format: filters.format,
        genre: filters.genre,
        status: filters.status,
        sort: filters.sort === 'relevance' ? undefined : filters.sort,
      })}`,
      { signal },
    );
    if (
      response.results.length === 0 &&
      Object.keys(response.provider_errors).length > 0
    ) {
      throw new ApiError(
        503,
        Object.values(response.provider_errors).join(' '),
      );
    }
    return response.results.map(mapSeries);
  },
  getSeries: async (id) =>
    mapSeriesDetail(
      await request<BackendSeriesRead>(`/series/${encodeURIComponent(id)}`),
    ),
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
      watchStatus: row.watch_status,
      favorite: row.favorite,
      airedEpisodes: row.aired_episodes,
      watchedEpisodes: row.watched_episodes,
      backlogEpisodes: row.backlog_episodes,
      nextUnwatchedEpisodeId: row.next_unwatched_episode_id,
      notificationsEnabled: row.notifications_enabled,
    }));
  },
  follow: (id) =>
    request<void>(`/me/following/${encodeURIComponent(id)}`, { method: 'PUT' }),
  unfollow: (id) =>
    request<void>(`/me/following/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  updateFollowing: (id, patch) =>
    request<void>(`/me/following/${encodeURIComponent(id)}`, {
      method: 'PUT',
      json: {
        ...(patch.watchStatus === undefined
          ? {}
          : { watch_status: patch.watchStatus }),
        ...(patch.favorite === undefined ? {} : { favorite: patch.favorite }),
        ...(patch.notificationsEnabled === undefined
          ? {}
          : { notifications_enabled: patch.notificationsEnabled }),
      },
    }),
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
  setSeriesWatched: async (id, watched) => {
    const result = await request<{
      updated: number;
      eligible: number;
      skipped_future: number;
    }>(`/me/series/${encodeURIComponent(id)}/watched`, {
      method: watched ? 'PUT' : 'DELETE',
    });
    return {
      updated: result.updated,
      eligible: result.eligible,
      skippedFuture: result.skipped_future,
    };
  },
  sync: async (seriesId) =>
    mapSync(
      seriesId
        ? await request<BackendSyncRun>(
            `/series/${encodeURIComponent(seriesId)}/refresh`,
            { method: 'POST' },
          )
        : await request<BackendSyncRun>('/me/sync', { method: 'POST' }),
    ),
  getSettings: async () =>
    mapSettings(await request<BackendUserSettings>('/me/settings')),
  patchSettings: async (patch) => {
    const json = {
      ...(patch.displayName === undefined ? {} : { display_name: patch.displayName }),
      ...(patch.timezone === undefined ? {} : { timezone: patch.timezone }),
      ...(patch.locale === undefined ? {} : { locale: patch.locale }),
      ...(patch.notificationsEnabled === undefined
        ? {}
        : { notifications_enabled: patch.notificationsEnabled }),
      ...(patch.notificationLocalTime === undefined
        ? {}
        : { notification_local_time: patch.notificationLocalTime }),
      ...(patch.notificationQuietStart === undefined
        ? {}
        : { notification_quiet_start: patch.notificationQuietStart }),
      ...(patch.notificationQuietEnd === undefined
        ? {}
        : { notification_quiet_end: patch.notificationQuietEnd }),
      ...(patch.notificationLeadDays === undefined
        ? {}
        : { notification_lead_days: patch.notificationLeadDays }),
      ...(patch.notifyReleases === undefined
        ? {}
        : { notify_releases: patch.notifyReleases }),
      ...(patch.notifyScheduleChanges === undefined
        ? {}
        : { notify_schedule_changes: patch.notifyScheduleChanges }),
      ...(patch.notifyNewSeasons === undefined
        ? {}
        : { notify_new_seasons: patch.notifyNewSeasons }),
      ...(patch.notifyNews === undefined ? {} : { notify_news: patch.notifyNews }),
      ...(patch.weeklyDigest === undefined
        ? {}
        : { weekly_digest: patch.weeklyDigest }),
      ...(patch.preferredServices === undefined
        ? {}
        : { preferred_services: patch.preferredServices }),
    };
    return mapSettings(
      await request<BackendUserSettings>('/me/settings', {
        method: 'PATCH',
        json,
      }),
    );
  },
  news: async (filters: NewsFilters = {}) => {
    const response = await request<BackendNewsPage>(
      `/news${qs({
        followed: filters.followed ? 'true' : undefined,
        saved: filters.saved ? 'true' : undefined,
        unread: filters.unread ? 'true' : undefined,
        category: filters.category ?? undefined,
        q: filters.q,
      })}`,
    );
    return {
      configured: response.configured,
      items: response.items.map((item) => ({
        id: item.id,
        source: item.source,
        title: item.title,
        excerpt: item.excerpt,
        publishedAt: item.published_at,
        imageUrl: item.image_url,
        url: item.url,
        category: item.category,
        saved: item.saved,
        readAt: item.read_at,
        relatedSeries: item.series.map((series) => ({
          id: series.id,
          title: series.title,
          following: series.followed,
        })),
      })),
    } satisfies NewsPage;
  },
  updateNews: (id, patch) =>
    request<void>(`/me/news/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      json: patch,
    }),
  registerPush: (sub) =>
    request<{ id: string }>('/me/push-subscriptions', {
      method: 'POST',
      json: sub,
    }),
  unregisterPush: (id) =>
    request<void>(`/me/push-subscriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
