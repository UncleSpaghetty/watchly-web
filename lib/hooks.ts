'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { api, type CalendarResponse, type EpisodeDto, type SeriesDetail, type SeriesSummary } from '@/lib/api';

type Snapshot = Array<[QueryKey, unknown]>;

export function useFollowMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ seriesId, follow }: { seriesId: string; follow: boolean }) =>
      follow ? api.follow(seriesId) : api.unfollow(seriesId),
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
      qc.setQueryData<SeriesDetail>(['series', seriesId], (old) => (old ? { ...old, following: follow } : old));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (_data, _error, { seriesId }) => {
      void qc.invalidateQueries({ queryKey: ['following'] });
      void qc.invalidateQueries({ queryKey: ['news'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      void qc.invalidateQueries({ queryKey: ['series', seriesId] });
    },
  });
}

export function useWatchedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ episodeId, watched }: { episodeId: string; watched: boolean }) =>
      api.setWatched(episodeId, watched),
    onMutate: async ({ episodeId, watched }) => {
      await qc.cancelQueries({ queryKey: ['calendar'] });
      await qc.cancelQueries({ queryKey: ['episodes'] });
      const snapshot: Snapshot = [
        ...qc.getQueriesData({ queryKey: ['calendar'] }),
        ...qc.getQueriesData({ queryKey: ['episodes'] }),
      ];
      const watchedAt = watched ? new Date().toISOString() : null;
      qc.setQueriesData<CalendarResponse>({ queryKey: ['calendar'] }, (old) =>
        old && {
          ...old,
          entries: old.entries.map((e) => (e.episodeId === episodeId ? { ...e, watchedAt } : e)),
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
    },
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
