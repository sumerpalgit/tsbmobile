import { useQuery } from '@tanstack/react-query';
import {
  fetchAiMessageCredits,
  fetchCombinedMatches,
  fetchMatchSettings,
  fetchMatchesByFeed,
  fetchPassedFeedMatches,
  fetchPassedSuggestedMatches,
  fetchSuggestedMatches,
} from '../api/myMatches';
import {
  AI_MESSAGE_CREDITS_QUERY_KEY,
  MATCH_SETTINGS_QUERY_KEY,
  MY_MATCHES_COMBINED_QUERY_KEY,
  MY_MATCHES_FEED_QUERY_KEY,
  MY_MATCHES_PASSED_FEED_QUERY_KEY,
  MY_MATCHES_PASSED_SUGGESTED_QUERY_KEY,
  MY_MATCHES_SUGGESTED_QUERY_KEY,
} from '../api/queryKeys';

/**
 * My Matches data hooks.
 *
 * Plain `useQuery` throughout, deliberately — the entire feature is unpaginated (no `page`,
 * `limit`, `offset` or `cursor` param exists in web's actions or either of its pages), so the
 * `useInfiniteQuery` shape used by `useNotifications`/`useMyActivity` would have nothing to
 * page through.
 *
 * `retry: false` on all of them: these endpoints have never been called from mobile before, and
 * the raw screens exist precisely to surface a 404 or a shape mismatch immediately. Three silent
 * retries would just delay the answer.
 */

const RAW_QUERY_OPTIONS = { retry: false } as const;

/**
 * One fetch, two tabs — the response carries both `matchmaking[]` ("Where I'm a Fit") and
 * `user_posts[]` ("From My Posts"). Web does the same (`page.tsx:121`), and callers pick the
 * array they need off the one cache entry.
 */
export function useCombinedMatches() {
  return useQuery({
    queryKey: MY_MATCHES_COMBINED_QUERY_KEY,
    queryFn: () => fetchCombinedMatches(),
    ...RAW_QUERY_OPTIONS,
  });
}

export function useSuggestedMatches() {
  return useQuery({
    queryKey: MY_MATCHES_SUGGESTED_QUERY_KEY,
    queryFn: fetchSuggestedMatches,
    ...RAW_QUERY_OPTIONS,
  });
}

export function usePassedSuggestedMatches() {
  return useQuery({
    queryKey: MY_MATCHES_PASSED_SUGGESTED_QUERY_KEY,
    queryFn: fetchPassedSuggestedMatches,
    ...RAW_QUERY_OPTIONS,
  });
}

/**
 * Kept as its own cache entry rather than derived from `useCombinedMatches`, because it is a
 * genuinely different request — `?include_passed=true` widens what the backend returns, so the
 * unflagged response cannot be filtered down to it.
 */
export function usePassedFeedMatches() {
  return useQuery({
    queryKey: MY_MATCHES_PASSED_FEED_QUERY_KEY,
    queryFn: fetchPassedFeedMatches,
    ...RAW_QUERY_OPTIONS,
  });
}

export function useMatchesByFeed(feedId: string) {
  return useQuery({
    queryKey: [...MY_MATCHES_FEED_QUERY_KEY, feedId],
    queryFn: () => fetchMatchesByFeed(feedId),
    enabled: Boolean(feedId),
    ...RAW_QUERY_OPTIONS,
  });
}

export function useMatchSettings() {
  return useQuery({
    queryKey: MATCH_SETTINGS_QUERY_KEY,
    queryFn: fetchMatchSettings,
    ...RAW_QUERY_OPTIONS,
  });
}

export function useAiMessageCredits() {
  return useQuery({
    queryKey: AI_MESSAGE_CREDITS_QUERY_KEY,
    queryFn: fetchAiMessageCredits,
    ...RAW_QUERY_OPTIONS,
  });
}
