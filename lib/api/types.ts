// Tipi del contratto FE ↔ BE. Da sostituire con i tipi generati dall'OpenAPI di watchly-be
// (openapi-typescript) quando il documento sarà disponibile.

export type SeriesKind = 'anime' | 'tv';
export type CatalogSource = 'kitsu' | 'anilist' | 'tmdb';
export type WatchStatus =
  | 'in_list'
  | 'planned'
  | 'watching'
  | 'paused'
  | 'completed'
  | 'dropped';

export interface WatchProvider {
  id: string;
  name: string;
  url: string;
  type: 'stream' | 'flatrate' | 'free' | 'ads' | 'buy' | 'rent';
  source: CatalogSource;
  logoUrl: string | null;
}

export const sourceLabels: Record<CatalogSource, string> = {
  kitsu: 'Kitsu',
  anilist: 'AniList',
  tmdb: 'TMDB',
};

export interface SeriesSummary {
  id: string;
  title: string;
  alternativeTitles: string[];
  kind: SeriesKind;
  source: CatalogSource;
  externalId: string;
  format: string | null;
  year: number | null;
  posterUrl: string | null;
  synopsis: string | null;
  genres: string[];
  averageRating: number | null;
  episodeRuntimeMinutes: number | null;
  watchProviders: WatchProvider[];
  following: boolean;
}

export interface SeriesDetail extends SeriesSummary {
  status: string | null;
  seasons: number | null;
  lastSyncAt: string | null;
  lastSyncStatus: 'ok' | 'partial' | 'failed' | null;
}

export interface EpisodeDto {
  id: string;
  seasonNumber: number | null;
  number: number | null;
  title: string | null;
  durationMinutes: number | null;
  /** Data civile `YYYY-MM-DD` pubblicata dal provider */
  airDate: string | null;
  airAt: string | null;
  source: CatalogSource;
  watchedAt: string | null;
}

export interface CalendarEntry {
  date: string;
  episodeId: string;
  series: {
    id: string;
    title: string;
    kind: SeriesKind;
    posterUrl: string | null;
  };
  episodeNumber: number | null;
  seasonNumber: number | null;
  episodeTitle: string | null;
  watchedAt: string | null;
  source: CatalogSource;
}

export interface CalendarResponse {
  from: string;
  to: string;
  entries: CalendarEntry[];
  /** true se i dati provengono da un refresh parziale o fallito */
  stale: boolean;
  lastSuccessfulSyncAt: string | null;
}

export interface FollowingItem extends SeriesSummary {
  nextAirDate: string | null;
  watchStatus: WatchStatus;
  favorite: boolean;
  airedEpisodes: number;
  watchedEpisodes: number;
  backlogEpisodes: number;
  nextUnwatchedEpisodeId: string | null;
  notificationsEnabled: boolean | null;
}

export interface UserSettings {
  displayName: string | null;
  timezone: string;
  locale: string;
  notificationsEnabled: boolean;
  notificationLocalTime: string;
  notificationQuietStart: string | null;
  notificationQuietEnd: string | null;
  notificationLeadDays: 0 | 1 | 3 | 7;
  notifyReleases: boolean;
  notifyScheduleChanges: boolean;
  notifyNewSeasons: boolean;
  notifyNews: boolean;
  weeklyDigest: boolean;
  preferredServices: string[];
  pushAvailable: boolean;
  pushSubscriptions: number;
  lastSyncAt: string | null;
  lastSyncStatus: 'ok' | 'partial' | 'failed' | null;
}

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
  url: string;
  category: 'series' | 'anime' | 'manga' | 'gaming' | 'events' | null;
  saved: boolean;
  readAt: string | null;
  /** Solo se l'associazione è certa */
  relatedSeries: Array<{ id: string; title: string; following: boolean }>;
}

export interface NewsPage {
  items: NewsItem[];
  configured: boolean;
}

export interface SearchFilters {
  kind: SeriesKind | 'all';
  source: CatalogSource | 'all';
  year?: number;
  format?: string;
  genre?: string;
  status?: string;
  sort?: 'relevance' | 'rating' | 'year' | 'title';
}

export interface NewsFilters {
  followed?: boolean;
  saved?: boolean;
  unread?: boolean;
  category?: NewsItem['category'];
  q?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  timezone: string;
  locale: string;
}

export type DashboardPeriodWeeks = 4 | 12 | 26 | 52;

export interface DashboardData {
  generatedAt: string;
  timezone: string;
  periodWeeks: DashboardPeriodWeeks;
  kpis: {
    followedSeries: number;
    watchedEpisodes: number;
    airedEpisodes: number;
    completionPercentage: number;
    backlogEpisodes: number;
    upcoming7Days: number;
    upcoming30Days: number;
    estimatedWatchMinutes: number;
    durationCoveragePercentage: number;
    averageProviderRating: number | null;
    ratedSeries: number;
    currentActivityStreak: number;
    longestActivityStreak: number;
  };
  activity: Array<{ periodStart: string; watchedCount: number }>;
  watchlistBreakdown: { anime: number; tv: number };
  genres: {
    basis: 'watched_episodes' | 'followed_series';
    items: Array<{ name: string; count: number }>;
  };
  seriesProgress: Array<{
    seriesId: string;
    title: string;
    posterUrl: string | null;
    kind: SeriesKind;
    watched: number;
    aired: number;
    percentage: number;
    backlog: number;
    averageRating: number | null;
  }>;
  topSeries: Array<{
    seriesId: string;
    title: string;
    posterUrl: string | null;
    watched: number;
    estimatedMinutes: number;
  }>;
}

export interface SyncResult {
  status: 'queued' | 'running' | 'ok' | 'partial' | 'failed';
  finishedAt: string | null;
  message: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface WatchlyApi {
  login(email: string, password: string): Promise<SessionUser>;
  loginWithGoogle(credential: string): Promise<SessionUser>;
  logout(): Promise<void>;
  deleteAccount(): Promise<void>;
  me(): Promise<SessionUser>;
  dashboard(weeks: DashboardPeriodWeeks): Promise<DashboardData>;
  search(
    q: string,
    filters: SearchFilters,
    signal?: AbortSignal,
  ): Promise<SeriesSummary[]>;
  getSeries(id: string): Promise<SeriesDetail>;
  getEpisodes(id: string): Promise<EpisodeDto[]>;
  following(): Promise<FollowingItem[]>;
  follow(seriesId: string): Promise<void>;
  unfollow(seriesId: string): Promise<void>;
  updateFollowing(
    seriesId: string,
    patch: Partial<
      Pick<FollowingItem, 'watchStatus' | 'favorite'> & {
        notificationsEnabled: boolean | null;
      }
    >,
  ): Promise<void>;
  calendar(from: string, to: string): Promise<CalendarResponse>;
  setWatched(episodeId: string, watched: boolean): Promise<void>;
  setSeriesWatched(
    seriesId: string,
    watched: boolean,
  ): Promise<{ updated: number; eligible: number; skippedFuture: number }>;
  sync(seriesId?: string): Promise<SyncResult>;
  getSettings(): Promise<UserSettings>;
  patchSettings(
    patch: Partial<
      Omit<UserSettings, 'lastSyncAt' | 'lastSyncStatus' | 'pushAvailable' | 'pushSubscriptions'>
    >,
  ): Promise<UserSettings>;
  news(filters?: NewsFilters): Promise<NewsPage>;
  updateNews(
    newsId: string,
    patch: { saved?: boolean; read?: boolean },
  ): Promise<void>;
  registerPush(sub: PushSubscriptionPayload): Promise<{ id: string }>;
  unregisterPush(id: string): Promise<void>;
}
