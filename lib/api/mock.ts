import { addDays, getRomeTodayIso } from '@/lib/date/italy';

import {
  ApiError,
  type Availability,
  type CalendarEntry,
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
  settings: Pick<UserSettings, 'notificationsEnabled' | 'calendarMode' | 'lastSyncAt' | 'lastSyncStatus'>;
  pushId: string | null;
}

const STORAGE_KEY = 'watchly-mock-state-v1';
const DEMO_USER = { id: 'demo', name: 'Demo' };

const defaultState = (): MockState => ({
  user: null,
  following: ['s1'],
  watched: {},
  settings: { notificationsEnabled: false, calendarMode: 'italy', lastSyncAt: null, lastSyncStatus: null },
  pushId: null,
});

let memory: MockState = defaultState();

function load(): MockState {
  if (typeof window === 'undefined') return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) memory = { ...defaultState(), ...(JSON.parse(raw) as Partial<MockState>) };
  } catch {
    memory = defaultState();
  }
  return memory;
}

function save(state: MockState) {
  memory = state;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function requireAuth(): MockState {
  const state = load();
  if (!state.user) throw new ApiError(401, 'Sessione scaduta o non autenticato.');
  return state;
}

type CatalogEntry = Omit<SeriesSummary, 'following'> & {
  status: string | null;
  seasons: number | null;
  /** offset in giorni da oggi del primo episodio originale, cadenza settimanale, numero episodi */
  schedule: { startOffset: number; count: number; italy: 'confirmed' | 'estimated' | 'none'; italyLagDays: number; service: string | null } | null;
};

const catalog: CatalogEntry[] = [
  { id: 's1', title: 'Cronache del Faro (demo)', alternativeTitles: ['Lighthouse Chronicles'], kind: 'anime', source: 'kitsu', externalId: 'k-1', format: 'TV', year: 2026, posterUrl: null, synopsis: 'Serie fittizia di dimostrazione con date italiane confermate.', status: 'In corso', seasons: 1, schedule: { startOffset: -14, count: 12, italy: 'confirmed', italyLagDays: 1, service: 'Piattaforma demo' } },
  { id: 's2', title: 'Orbita Lenta (demo)', alternativeTitles: [], kind: 'anime', source: 'anilist', externalId: 'a-2', format: 'TV', year: 2026, posterUrl: null, synopsis: 'Serie fittizia con sole date di prima trasmissione originale.', status: 'In corso', seasons: 1, schedule: { startOffset: -7, count: 10, italy: 'none', italyLagDays: 0, service: null } },
  { id: 's3', title: 'Distretto 9 Nord (demo)', alternativeTitles: ['District 9 North'], kind: 'tv', source: 'tmdb', externalId: 't-3', format: 'Serie TV', year: 2025, posterUrl: null, synopsis: 'Serie TV fittizia con date italiane stimate.', status: 'In corso', seasons: 2, schedule: { startOffset: -3, count: 8, italy: 'estimated', italyLagDays: 2, service: 'Piattaforma demo' } },
  { id: 's4', title: 'Il Cartografo (demo)', alternativeTitles: [], kind: 'tv', source: 'tmdb', externalId: 't-4', format: 'Serie TV', year: 2026, posterUrl: null, synopsis: 'Serie TV senza episodi noti: si può comunque seguire.', status: 'Annunciata', seasons: null, schedule: null },
  { id: 's5', title: 'Maree d\'Inverno (demo)', alternativeTitles: [], kind: 'anime', source: 'kitsu', externalId: 'k-5', format: 'TV', year: 2027, posterUrl: null, synopsis: 'Serie anime fittizia in arrivo.', status: 'In arrivo', seasons: 1, schedule: { startOffset: 10, count: 12, italy: 'estimated', italyLagDays: 3, service: null } },
];

const catalogById = new Map(catalog.map((c) => [c.id, c]));

function buildEpisodes(entry: CatalogEntry): EpisodeDto[] {
  if (!entry.schedule) return [];
  const today = getRomeTodayIso();
  const state = load();
  const { startOffset, count, italy, italyLagDays, service } = entry.schedule;
  return Array.from({ length: count }, (_, i) => {
    const original = addDays(today, startOffset + i * 7);
    const availability: Availability =
      italy === 'none'
        ? { country: 'IT', service: null, status: 'unknown', localDate: null, precision: 'unknown', sourceUrl: null, lastVerifiedAt: null }
        : {
            country: 'IT',
            service,
            status: italy,
            localDate: addDays(original, italyLagDays),
            precision: 'date',
            sourceUrl: italy === 'confirmed' ? 'https://example.org/fonte-demo' : null,
            lastVerifiedAt: italy === 'confirmed' ? `${today}T09:00:00Z` : null,
          };
    const id = `${entry.id}-e${i + 1}`;
    return { id, seasonNumber: 1, number: i + 1, title: `Episodio ${i + 1}`, originalAirDate: original, availability, watchedAt: state.watched[id] ?? null };
  });
}

function toSummary(entry: CatalogEntry, following: string[]): SeriesSummary {
  const { schedule, status, seasons, ...rest } = entry;
  void schedule; void status; void seasons;
  return { ...rest, following: following.includes(entry.id) };
}

function nextItalian(entry: CatalogEntry): Availability | null {
  const today = getRomeTodayIso();
  const next = buildEpisodes(entry).find(
    (e) => e.availability.status === 'confirmed' && e.availability.localDate && e.availability.localDate >= today,
  );
  return next?.availability ?? null;
}

const mockNews = (following: string[]): NewsItem[] => [
  { id: 'n1', source: 'Fonte demo', title: 'Annunciata la data della nuova stagione (notizia demo)', excerpt: 'Notizia fittizia usata per dimostrare il layout del feed.', publishedAt: new Date().toISOString(), imageUrl: null, url: 'https://example.org/news-1', relatedSeries: [{ id: 's1', title: catalogById.get('s1')!.title, following: following.includes('s1') }] },
  { id: 'n2', source: 'Fonte demo', title: 'Rumor senza titolo associato (notizia demo)', excerpt: null, publishedAt: new Date(Date.now() - 86_400_000).toISOString(), imageUrl: null, url: 'https://example.org/news-2', relatedSeries: [] },
];

export const mockApi: WatchlyApi = {
  async login(email, password) {
    await delay();
    if (!email || !password) throw new ApiError(401, 'Credenziali non valide.');
    save({ ...load(), user: email });
    return { ...DEMO_USER, name: email };
  },
  async logout() {
    await delay(50);
    save({ ...load(), user: null });
  },
  async me() {
    const s = requireAuth();
    return { ...DEMO_USER, name: s.user! };
  },
  async search(q, kind, source, signal) {
    await delay(250);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    requireAuth();
    const needle = q.trim().toLowerCase();
    const { following } = load();
    return catalog
      .filter((c) => (kind === 'all' || c.kind === kind) && (source === 'all' || c.source === source))
      .filter((c) => [c.title, ...c.alternativeTitles].some((t) => t.toLowerCase().includes(needle)))
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
      nextItalianAvailability: nextItalian(entry),
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
      return entry ? [{ ...toSummary(entry, s.following), nextItalianAvailability: nextItalian(entry) }] : [];
    });
  },
  async follow(id) {
    await delay(100);
    const s = requireAuth();
    if (!catalogById.has(id)) throw new ApiError(404, 'Serie non trovata.');
    if (!s.following.includes(id)) save({ ...s, following: [...s.following, id] });
  },
  async unfollow(id) {
    await delay(100);
    const s = requireAuth();
    save({ ...s, following: s.following.filter((f) => f !== id) });
  },
  async calendar(from, to, mode) {
    await delay();
    const s = requireAuth();
    const entries: CalendarEntry[] = [];
    for (const id of s.following) {
      const entry = catalogById.get(id);
      if (!entry) continue;
      for (const ep of buildEpisodes(entry)) {
        const availability: Availability =
          mode === 'original'
            ? { country: 'ORIGINAL', service: null, status: 'original', localDate: ep.originalAirDate, precision: 'date', sourceUrl: null, lastVerifiedAt: null }
            : ep.availability;
        const date = availability.localDate;
        if (!date || date < from || date > to) continue;
        if (availability.status === 'unknown' || availability.status === 'withdrawn') continue;
        entries.push({
          date,
          episodeId: ep.id,
          series: { id: entry.id, title: entry.title, kind: entry.kind, posterUrl: entry.posterUrl },
          episodeNumber: ep.number,
          seasonNumber: ep.seasonNumber,
          episodeTitle: ep.title,
          watchedAt: ep.watchedAt,
          availability,
        });
      }
    }
    entries.sort((a, b) => a.date.localeCompare(b.date) || a.series.title.localeCompare(b.series.title));
    return { from, to, mode, entries, stale: s.settings.lastSyncStatus === 'partial' || s.settings.lastSyncStatus === 'failed', lastSuccessfulSyncAt: s.settings.lastSyncAt };
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
    save({ ...s, settings: { ...s.settings, lastSyncAt: finishedAt, lastSyncStatus: 'ok' } });
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
