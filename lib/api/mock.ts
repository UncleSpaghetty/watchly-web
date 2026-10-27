import { addDays, getRomeTodayIso } from '@/lib/date/italy';

import {
  ApiError,
  type CalendarEntry,
  type DashboardData,
  type DashboardPeriodWeeks,
  type EpisodeDto,
  type NewsItem,
  type SeriesDetail,
  type SeriesSummary,
  type UserSettings,
  type WatchlyApi,
} from './types';

// Backend simulato per sviluppo/demo (NEXT_PUBLIC_API_MOCK=true). I titoli e le date sono FITTIZI.

interface MockState {
  user: string | null;
  following: string[];
  watched: Record<string, string>;
  settings: Pick<
    UserSettings,
    'notificationsEnabled' | 'lastSyncAt' | 'lastSyncStatus'
  >;
  pushId: string | null;
}

const STORAGE_KEY = 'watchly-mock-state-v1';
const DEMO_USER = {
  id: 'demo',
  name: 'Demo',
  email: 'utente.demo@watchly.local',
  createdAt: '2026-01-01T12:00:00Z',
  timezone: 'Europe/Rome',
  locale: 'it-IT',
};

const defaultState = (): MockState => ({
  user: null,
  following: ['s1'],
  watched: {
    's1-e1': new Date(Date.now() - 8 * 86_400_000).toISOString(),
    's1-e2': new Date(Date.now() - 2 * 86_400_000).toISOString(),
    's1-e3': new Date(Date.now() - 86_400_000).toISOString(),
  },
  settings: {
    notificationsEnabled: false,
    lastSyncAt: null,
    lastSyncStatus: null,
  },
  pushId: null,
});

let memory: MockState = defaultState();

function load(): MockState {
  if (typeof window === 'undefined') return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw)
      memory = {
        ...defaultState(),
        ...(JSON.parse(raw) as Partial<MockState>),
      };
  } catch {
    memory = defaultState();
  }
  return memory;
}

function save(state: MockState) {
  memory = state;
  if (typeof window !== 'undefined')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function requireAuth(): MockState {
  const state = load();
  if (!state.user)
    throw new ApiError(401, 'Sessione scaduta o non autenticato.');
  return state;
}

type CatalogEntry = Omit<SeriesSummary, 'following'> & {
  status: string | null;
  seasons: number | null;
  /** Offset del primo episodio, cadenza settimanale e numero di episodi. */
  schedule: { startOffset: number; count: number } | null;
};

const catalog: CatalogEntry[] = [
  {
    id: 's1',
    title: 'Cronache del Faro (demo)',
    alternativeTitles: ['Lighthouse Chronicles'],
    kind: 'anime',
    source: 'kitsu',
    externalId: 'k-1',
    format: 'TV',
    year: 2026,
    posterUrl: null,
    synopsis: 'Serie fittizia di dimostrazione con date fornite dal provider.',
    genres: ['Avventura', 'Drammatico'],
    averageRating: 84,
    episodeRuntimeMinutes: 24,
    status: 'In corso',
    seasons: 1,
    schedule: { startOffset: -14, count: 12 },
  },
  {
    id: 's2',
    title: 'Orbita Lenta (demo)',
    alternativeTitles: [],
    kind: 'anime',
    source: 'anilist',
    externalId: 'a-2',
    format: 'TV',
    year: 2026,
    posterUrl: null,
    synopsis: 'Serie fittizia con calendario episodi.',
    genres: ['Fantascienza', 'Drammatico'],
    averageRating: 78,
    episodeRuntimeMinutes: 23,
    status: 'In corso',
    seasons: 1,
    schedule: { startOffset: -7, count: 10 },
  },
  {
    id: 's3',
    title: 'Distretto 9 Nord (demo)',
    alternativeTitles: ['District 9 North'],
    kind: 'tv',
    source: 'tmdb',
    externalId: 't-3',
    format: 'Serie TV',
    year: 2025,
    posterUrl: null,
    synopsis: 'Serie TV fittizia con calendario episodi.',
    genres: ['Crime', 'Drammatico'],
    averageRating: 81,
    episodeRuntimeMinutes: 48,
    status: 'In corso',
    seasons: 2,
    schedule: { startOffset: -3, count: 8 },
  },
  {
    id: 's4',
    title: 'Il Cartografo (demo)',
    alternativeTitles: [],
    kind: 'tv',
    source: 'tmdb',
    externalId: 't-4',
    format: 'Serie TV',
    year: 2026,
    posterUrl: null,
    synopsis: 'Serie TV senza episodi noti: si può comunque seguire.',
    genres: ['Avventura'],
    averageRating: 74,
    episodeRuntimeMinutes: 52,
    status: 'Annunciata',
    seasons: null,
    schedule: null,
  },
  {
    id: 's5',
    title: "Maree d'Inverno (demo)",
    alternativeTitles: [],
    kind: 'anime',
    source: 'kitsu',
    externalId: 'k-5',
    format: 'TV',
    year: 2027,
    posterUrl: null,
    synopsis: 'Serie anime fittizia in arrivo.',
    genres: ['Fantasy'],
    averageRating: 80,
    episodeRuntimeMinutes: 24,
    status: 'In arrivo',
    seasons: 1,
    schedule: { startOffset: 10, count: 12 },
  },
];

const catalogById = new Map(catalog.map((c) => [c.id, c]));

function buildEpisodes(entry: CatalogEntry): EpisodeDto[] {
  if (!entry.schedule) return [];
  const today = getRomeTodayIso();
  const state = load();
  const { startOffset, count } = entry.schedule;
  return Array.from({ length: count }, (_, i) => {
    const airDate = addDays(today, startOffset + i * 7);
    const id = `${entry.id}-e${i + 1}`;
    return {
      id,
      seasonNumber: 1,
      number: i + 1,
      title: `Episodio ${i + 1}`,
      durationMinutes: entry.episodeRuntimeMinutes,
      airDate,
      source: entry.source,
      watchedAt: state.watched[id] ?? null,
    };
  });
}

function toSummary(entry: CatalogEntry, following: string[]): SeriesSummary {
  const { schedule, status, seasons, ...rest } = entry;
  void schedule;
  void status;
  void seasons;
  return { ...rest, following: following.includes(entry.id) };
}

function nextAirDate(entry: CatalogEntry): string | null {
  const today = getRomeTodayIso();
  return (
    buildEpisodes(entry).find(
      (episode) => episode.airDate && episode.airDate >= today,
    )?.airDate ?? null
  );
}

const mockNews = (following: string[]): NewsItem[] => [
  {
    id: 'n1',
    source: 'Fonte demo',
    title: 'Annunciata la data della nuova stagione (notizia demo)',
    excerpt: 'Notizia fittizia usata per dimostrare il layout del feed.',
    publishedAt: new Date().toISOString(),
    imageUrl: null,
    url: 'https://example.org/news-1',
    relatedSeries: [
      {
        id: 's1',
        title: catalogById.get('s1')!.title,
        following: following.includes('s1'),
      },
    ],
  },
  {
    id: 'n2',
    source: 'Fonte demo',
    title: 'Rumor senza titolo associato (notizia demo)',
    excerpt: null,
    publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
    imageUrl: null,
    url: 'https://example.org/news-2',
    relatedSeries: [],
  },
];

function startOfWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return addDays(iso, -((date.getUTCDay() + 6) % 7));
}

function mockDashboard(weeks: DashboardPeriodWeeks): DashboardData {
  const state = requireAuth();
  const today = getRomeTodayIso();
  const followed = state.following.flatMap((id) => {
    const entry = catalogById.get(id);
    return entry ? [entry] : [];
  });
  const allEpisodes = catalog.flatMap((series) =>
    buildEpisodes(series).map((episode) => ({ episode, series })),
  );
  const watched = allEpisodes.filter(({ episode }) => episode.watchedAt);
  const aired = followed.flatMap((series) =>
    buildEpisodes(series)
      .filter((episode) => episode.airDate && episode.airDate <= today)
      .map((episode) => ({ episode, series })),
  );
  const watchedCurrent = aired.filter(
    ({ episode }) => episode.watchedAt,
  ).length;
  const currentWeek = startOfWeek(today);
  const activity = Array.from({ length: weeks }, (_, index) => {
    const periodStart = addDays(currentWeek, (index - weeks + 1) * 7);
    const periodEnd = addDays(periodStart, 6);
    return {
      periodStart,
      watchedCount: watched.filter(({ episode }) => {
        const marked = episode.watchedAt?.slice(0, 10);
        return marked && marked >= periodStart && marked <= periodEnd;
      }).length,
    };
  });
  const genres = new Map<string, number>();
  const genreSource = watched.length
    ? watched.map(({ series }) => series)
    : followed;
  for (const series of genreSource) {
    for (const genre of series.genres)
      genres.set(genre, (genres.get(genre) ?? 0) + 1);
  }
  const ratings = followed.flatMap((series) =>
    series.averageRating === null ? [] : [series.averageRating],
  );
  const activeDates = new Set(
    watched.flatMap(({ episode }) =>
      episode.watchedAt ? [episode.watchedAt.slice(0, 10)] : [],
    ),
  );
  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  let currentActivityStreak = 0;
  while (activeDates.has(cursor)) {
    currentActivityStreak += 1;
    cursor = addDays(cursor, -1);
  }
  const upcoming = followed.flatMap((series) =>
    buildEpisodes(series).filter(
      (episode) =>
        episode.airDate &&
        episode.airDate >= today &&
        episode.airDate <= addDays(today, 29),
    ),
  );
  const estimatedWatchMinutes = watched.reduce(
    (total, { episode, series }) =>
      total + (episode.durationMinutes ?? series.episodeRuntimeMinutes ?? 0),
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    timezone: 'Europe/Rome',
    periodWeeks: weeks,
    kpis: {
      followedSeries: followed.length,
      watchedEpisodes: watched.length,
      airedEpisodes: aired.length,
      completionPercentage: aired.length
        ? Math.round((watchedCurrent * 100) / aired.length)
        : 0,
      backlogEpisodes: aired.length - watchedCurrent,
      upcoming7Days: upcoming.filter(
        (episode) => episode.airDate! <= addDays(today, 6),
      ).length,
      upcoming30Days: upcoming.length,
      estimatedWatchMinutes,
      durationCoveragePercentage: watched.length ? 100 : 0,
      averageProviderRating: ratings.length
        ? Math.round(
            (ratings.reduce((sum, rating) => sum + rating, 0) /
              ratings.length) *
              10,
          ) / 10
        : null,
      ratedSeries: ratings.length,
      currentActivityStreak,
      longestActivityStreak: currentActivityStreak,
    },
    activity,
    watchlistBreakdown: {
      anime: followed.filter((series) => series.kind === 'anime').length,
      tv: followed.filter((series) => series.kind === 'tv').length,
    },
    genres: {
      basis: watched.length ? 'watched_episodes' : 'followed_series',
      items: [...genres.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count })),
    },
    seriesProgress: followed
      .map((series) => {
        const seriesAired = aired.filter(
          (item) => item.series.id === series.id,
        );
        const seriesWatched = seriesAired.filter(
          ({ episode }) => episode.watchedAt,
        ).length;
        return {
          seriesId: series.id,
          title: series.title,
          posterUrl: series.posterUrl,
          kind: series.kind,
          watched: seriesWatched,
          aired: seriesAired.length,
          percentage: seriesAired.length
            ? Math.round((seriesWatched * 100) / seriesAired.length)
            : 0,
          backlog: seriesAired.length - seriesWatched,
          averageRating: series.averageRating,
        };
      })
      .sort((a, b) => b.backlog - a.backlog)
      .slice(0, 8),
    topSeries: followed
      .map((series) => {
        const items = watched.filter((item) => item.series.id === series.id);
        return {
          seriesId: series.id,
          title: series.title,
          posterUrl: series.posterUrl,
          watched: items.length,
          estimatedMinutes: items.reduce(
            (sum, { episode }) =>
              sum +
              (episode.durationMinutes ?? series.episodeRuntimeMinutes ?? 0),
            0,
          ),
        };
      })
      .filter((series) => series.watched > 0)
      .sort((a, b) => b.watched - a.watched)
      .slice(0, 5),
  };
}

export const mockApi: WatchlyApi = {
  async login(email, password) {
    await delay();
    if (!email || !password) throw new ApiError(401, 'Credenziali non valide.');
    save({ ...load(), user: email });
    return { ...DEMO_USER, name: email };
  },
  async loginWithGoogle(credential) {
    await delay();
    if (!credential) throw new ApiError(401, 'Credenziale Google non valida.');
    save({ ...load(), user: 'utente.demo@gmail.com' });
    return { ...DEMO_USER, name: 'Utente demo' };
  },
  async logout() {
    await delay(50);
    save({ ...load(), user: null });
  },
  async me() {
    const s = requireAuth();
    return { ...DEMO_USER, name: s.user! };
  },
  async dashboard(weeks) {
    await delay();
    return mockDashboard(weeks);
  },
  async search(q, kind, source, signal) {
    await delay(250);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    requireAuth();
    const needle = q.trim().toLowerCase();
    const { following } = load();
    return catalog
      .filter(
        (c) =>
          (kind === 'all' || c.kind === kind) &&
          (source === 'all' || c.source === source),
      )
      .filter((c) =>
        [c.title, ...c.alternativeTitles].some((t) =>
          t.toLowerCase().includes(needle),
        ),
      )
      .map((c) => toSummary(c, following));
  },
  async getSeries(id) {
    await delay();
    const s = requireAuth();
    const entry = catalogById.get(id);
    if (!entry) throw new ApiError(404, 'Serie non trovata.');
    const detail: SeriesDetail = {
      ...toSummary(entry, s.following),
      status: entry.status,
      seasons: entry.seasons,
      lastSyncAt: s.settings.lastSyncAt,
      lastSyncStatus: s.settings.lastSyncStatus,
    };
    return detail;
  },
  async getEpisodes(id) {
    await delay();
    requireAuth();
    const entry = catalogById.get(id);
    if (!entry) throw new ApiError(404, 'Serie non trovata.');
    return buildEpisodes(entry);
  },
  async following() {
    await delay();
    const s = requireAuth();
    return s.following.flatMap((id) => {
      const entry = catalogById.get(id);
      return entry
        ? [
            {
              ...toSummary(entry, s.following),
              nextAirDate: nextAirDate(entry),
            },
          ]
        : [];
    });
  },
  async follow(id) {
    await delay(100);
    const s = requireAuth();
    if (!catalogById.has(id)) throw new ApiError(404, 'Serie non trovata.');
    if (!s.following.includes(id))
      save({ ...s, following: [...s.following, id] });
  },
  async unfollow(id) {
    await delay(100);
    const s = requireAuth();
    save({ ...s, following: s.following.filter((f) => f !== id) });
  },
  async calendar(from, to) {
    await delay();
    const s = requireAuth();
    const entries: CalendarEntry[] = [];
    for (const id of s.following) {
      const entry = catalogById.get(id);
      if (!entry) continue;
      for (const ep of buildEpisodes(entry)) {
        const date = ep.airDate;
        if (!date || date < from || date > to) continue;
        entries.push({
          date,
          episodeId: ep.id,
          series: {
            id: entry.id,
            title: entry.title,
            kind: entry.kind,
            posterUrl: entry.posterUrl,
          },
          episodeNumber: ep.number,
          seasonNumber: ep.seasonNumber,
          episodeTitle: ep.title,
          watchedAt: ep.watchedAt,
          source: ep.source,
        });
      }
    }
    entries.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.series.title.localeCompare(b.series.title),
    );
    return {
      from,
      to,
      entries,
      stale:
        s.settings.lastSyncStatus === 'partial' ||
        s.settings.lastSyncStatus === 'failed',
      lastSuccessfulSyncAt: s.settings.lastSyncAt,
    };
  },
  async setWatched(episodeId, watched) {
    await delay(100);
    const s = requireAuth();
    const next = { ...s.watched };
    if (watched) next[episodeId] = new Date().toISOString();
    else delete next[episodeId];
    save({ ...s, watched: next });
  },
  async sync() {
    await delay(800);
    const s = requireAuth();
    const finishedAt = new Date().toISOString();
    save({
      ...s,
      settings: { ...s.settings, lastSyncAt: finishedAt, lastSyncStatus: 'ok' },
    });
    return { status: 'ok', finishedAt, message: null };
  },
  async getSettings() {
    await delay(50);
    return requireAuth().settings;
  },
  async patchSettings(patch) {
    await delay(100);
    const s = requireAuth();
    const settings = { ...s.settings, ...patch };
    save({ ...s, settings });
    return settings;
  },
  async news() {
    await delay();
    return { configured: true, items: mockNews(requireAuth().following) };
  },
  async registerPush() {
    await delay(100);
    const s = requireAuth();
    const id = s.pushId ?? crypto.randomUUID();
    save({ ...s, pushId: id });
    return { id };
  },
  async unregisterPush() {
    await delay(100);
    save({ ...requireAuth(), pushId: null });
  },
};
