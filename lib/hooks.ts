'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import {
  api,
  type CalendarResponse,
  type EpisodeDto,
  type SeriesDetail,
  type SeriesSummary,
  type FollowingItem,
  type WatchStatus,
  type NewsPage,
} from '@/lib/api';

type Snapshot = Array<[QueryKey, unknown]>;

export function useFollowMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      seriesId,
      follow,
    }: {
      seriesId: string;
      follow: boolean;
    }) => (follow ? api.follow(seriesId) : api.unfollow(seriesId)),
    onMutate: async ({ seriesId, follow }) => {
      await qc.cancelQueries({ queryKey: ['search'] });
      await qc.cancelQueries({ queryKey: ['series', seriesId] });
      const snapshot: Snapshot = [
        ...qc.getQueriesData({ queryKey: ['search'] }),
        ...qc.getQueriesData({ queryKey: ['series', seriesId] }),
      ];
      qc.setQueriesData<SeriesSummary[]>({ queryKey: ['search'] }, (old) =>
        old?.map((s) => (s.id === seriesId ? { ...s, following: follow } : s)),
      );
      qc.setQueryData<SeriesDetail>(['series', seriesId], (old) =>
        old ? { ...old, following: follow } : old,
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (_data, _error, { seriesId }) => {
      void qc.invalidateQueries({ queryKey: ['following'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['series', seriesId] });
    },
  });
}

export function useWatchedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      episodeId,
      watched,
    }: {
      episodeId: string;
      watched: boolean;
    }) => api.setWatched(episodeId, watched),
    onMutate: async ({ episodeId, watched }) => {
      await qc.cancelQueries({ queryKey: ['calendar'] });
      await qc.cancelQueries({ queryKey: ['episodes'] });
      const snapshot: Snapshot = [
        ...qc.getQueriesData({ queryKey: ['calendar'] }),
        ...qc.getQueriesData({ queryKey: ['episodes'] }),
      ];
      const watchedAt = watched ? new Date().toISOString() : null;
      qc.setQueriesData<CalendarResponse>(
        { queryKey: ['calendar'] },
        (old) =>
          old && {
            ...old,
            entries: old.entries.map((e) =>
              e.episodeId === episodeId ? { ...e, watchedAt } : e,
            ),
          },
      );
      qc.setQueriesData<EpisodeDto[]>({ queryKey: ['episodes'] }, (old) =>
        old?.map((e) => (e.id === episodeId ? { ...e, watchedAt } : e)),
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      void qc.invalidateQueries({ queryKey: ['episodes'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useFollowingUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      seriesId,
      patch,
    }: {
      seriesId: string;
      patch: {
        watchStatus?: WatchStatus;
        favorite?: boolean;
        notificationsEnabled?: boolean | null;
      };
    }) => api.updateFollowing(seriesId, patch),
    onMutate: async ({ seriesId, patch }) => {
      await qc.cancelQueries({ queryKey: ['following'] });
      const previous = qc.getQueryData<FollowingItem[]>(['following']);
      qc.setQueryData<FollowingItem[]>(['following'], (old) =>
        old?.map((item) =>
          item.id === seriesId
            ? {
                ...item,
                watchStatus: patch.watchStatus ?? item.watchStatus,
                favorite: patch.favorite ?? item.favorite,
                notificationsEnabled:
                  patch.notificationsEnabled === undefined
                    ? item.notificationsEnabled
                    : patch.notificationsEnabled,
              }
            : item,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) qc.setQueryData(['following'], context.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['following'] }),
  });
}

export function useSeriesWatchedMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (watched: boolean) => api.setSeriesWatched(seriesId, watched),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['episodes', seriesId] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      void qc.invalidateQueries({ queryKey: ['following'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useNewsStateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      newsId,
      patch,
    }: {
      newsId: string;
      patch: { saved?: boolean; read?: boolean };
    }) => api.updateNews(newsId, patch),
    onMutate: async ({ newsId, patch }) => {
      await qc.cancelQueries({ queryKey: ['news'] });
      const snapshots = qc.getQueriesData<NewsPage>({ queryKey: ['news'] });
      qc.setQueriesData<NewsPage>({ queryKey: ['news'] }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((item) =>
                item.id === newsId
                  ? {
                      ...item,
                      saved: patch.saved ?? item.saved,
                      readAt:
                        patch.read === undefined
                          ? item.readAt
                          : patch.read
                            ? new Date().toISOString()
                            : null,
                    }
                  : item,
              ),
            }
          : old,
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) =>
      context?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value)),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['news'] }),
  });
}

export function useSyncMutation(seriesId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.sync(seriesId),
    onSettled: () => {
      void qc.invalidateQueries();
    },
  });
}
