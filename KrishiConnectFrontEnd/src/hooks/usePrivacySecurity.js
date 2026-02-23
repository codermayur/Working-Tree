/**
 * React Query hooks for Privacy & Security.
 * Requires QueryClientProvider to be mounted (e.g. in App.jsx).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  privacySecurityApi,
} from '../services/privacySecurity.service';

// Query keys – single source of truth for cache invalidation
export const privacyKeys = {
  all: ['privacy'],
  settings: () => [...privacyKeys.all, 'settings'],
  blocked: () => [...privacyKeys.all, 'blocked'],
};

/**
 * Fetch privacy settings (twoFactorEnabled, activityStatusEnabled).
 * @returns {import('@tanstack/react-query').UseQueryResult<{ twoFactorEnabled: boolean, activityStatusEnabled: boolean }, Error>}
 */
export function usePrivacySettings() {
  return useQuery({
    queryKey: privacyKeys.settings(),
    queryFn: () => privacySecurityApi.fetchPrivacySettings(),
    staleTime: 60 * 1000,
  });
}

/**
 * Mutation: PATCH privacy settings. Optimistic update + rollback on error.
 * @param {{ onSuccess?: (data) => void, onError?: (err: Error) => void }} [options]
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdatePrivacySettings(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => privacySecurityApi.updatePrivacySettings(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: privacyKeys.settings() });
      const previous = queryClient.getQueryData(privacyKeys.settings());
      queryClient.setQueryData(privacyKeys.settings(), (old) => ({
        ...old,
        ...payload,
      }));
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(privacyKeys.settings(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.settings() });
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}

/**
 * Fetch blocked users list.
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<{ id: string, name: string, avatar: string, blockedAt: string }>, Error>}
 */
export function useBlockedUsers() {
  return useQuery({
    queryKey: privacyKeys.blocked(),
    queryFn: () => privacySecurityApi.fetchBlockedUsers(),
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation: unblock user. Removes from list on success.
 * @param {{ onSuccess?: () => void, onError?: (err: Error) => void }} [options]
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUnblockUser(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => privacySecurityApi.unblockUser(userId),
    onSuccess: (_, userId) => {
      const idStr = userId != null ? String(userId) : '';
      queryClient.setQueryData(privacyKeys.blocked(), (old) =>
        Array.isArray(old) ? old.filter((u) => String(u.id ?? u._id) !== idStr) : []
      );
      queryClient.invalidateQueries({ queryKey: privacyKeys.blocked() });
      options.onSuccess?.();
    },
    onError: options.onError,
  });
}
