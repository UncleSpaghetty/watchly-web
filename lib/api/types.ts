// Tipi del contratto FE ↔ BE. Da sostituire con i tipi generati dall'OpenAPI di watchly-be
// (openapi-typescript) quando il documento sarà disponibile.

export type SeriesKind = 'anime' | 'tv';
export type CatalogSource = 'kitsu' | 'anilist' | 'tmdb';

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
  /** Data civile `YYYY-MM-DD` pubblicata dal provider */
  airDate: string | null;
  source: CatalogSource;
  watchedAt: string | null;
}

export interface CalendarEntry {
  date: string;
  episodeId: string;
  series: { id: string; title: string; kind: SeriesKind; posterUrl: string | null };
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
}

export interface UserSettings {
  notificationsEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: 'ok' | 'partial' | 'failed' | null;
}

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
  /** Solo se l'associazione è certa */
  relatedSeries: Array<{ id: string; title: string; following: boolean }>;
}

export interface NewsPage {
  items: NewsItem[];
  configured: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
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
  logout(): Promise<void>;
  me(): Promise<SessionUser>;
  search(q: string, kind: SeriesKind | 'all', source: CatalogSource | 'all', signal?: AbortSignal): Promise<SeriesSummary[]>;
  getSeries(id: string): Promise<SeriesDetail>;
  getEpisodes(id: string): Promise<EpisodeDto[]>;
  following(): Promise<FollowingItem[]>;
  follow(seriesId: string): Promise<void>;
  unfollow(seriesId: string): Promise<void>;
  calendar(from: string, to: string): Promise<CalendarResponse>;
  setWatched(episodeId: string, watched: boolean): Promise<void>;
  sync(seriesId?: string): Promise<SyncResult>;
  getSettings(): Promise<UserSettings>;
  patchSettings(patch: Partial<Pick<UserSettings, 'notificationsEnabled'>>): Promise<UserSettings>;
  news(): Promise<NewsPage>;
  registerPush(sub: PushSubscriptionPayload): Promise<{ id: string }>;
  unregisterPush(id: string): Promise<void>;
}
